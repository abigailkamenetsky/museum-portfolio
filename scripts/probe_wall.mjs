/**
 * Measure where Marble's walls actually are, by raycasting the live scene.
 *
 * Everything downstream (reprojecting the wall scans into a flat strip, then
 * turning strip coordinates into painting positions) rests on the wall being
 * close enough to a plane. This reports the real hit distance on a grid, so
 * that assumption is checked rather than believed.
 *
 *   node scripts/probe_wall.mjs [baseUrl]
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const [base = 'http://localhost:5173/'] = process.argv.slice(2)
const PORT = 9700 + Math.floor(Math.random() * 200)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--use-angle=metal',
  `--remote-debugging-port=${PORT}`, '--window-size=1200,800',
  '--user-data-dir=/tmp/cdp-probe-' + PORT, 'about:blank',
], { stdio: 'ignore' })

try {
  let targets
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      if (targets.find(t => t.type === 'page')) break
    } catch { /* not up yet */ }
  }
  const page = targets.find(t => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  }
  const send = (method, params = {}) =>
    new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })) })

  await send('Page.enable')
  await send('Page.navigate', { url: `${base}?environment=marble&mode=mesh&nopaint=1&cam=0,3,0,0,90` })
  await sleep(14000)

  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const t = window.__three
      if (!t) return { error: 'no window.__three' }
      const THREE = t.raycaster.constructor
      const rc = new THREE()
      rc.far = 40
      const out = []
      for (const side of [-1, 1]) {
        for (let z = 12; z >= -26; z -= 2) {
          for (const y of [1.5, 2.5, 3.5, 4.5]) {
            rc.set(new t.camera.position.constructor(0, y, z),
                   new t.camera.position.constructor(side, 0, 0))
            const hits = rc.intersectObjects(t.scene.children, true)
              .filter(h => h.object.visible && h.distance > 0.5)
            out.push({ side, z, y, x: hits.length ? +(hits[0].point.x).toFixed(3) : null })
          }
        }
      }
      return { out }
    })()`,
  })
  console.log(JSON.stringify(result.value))
} finally {
  chrome.kill()
}
