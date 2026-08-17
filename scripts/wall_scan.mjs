/**
 * Photograph both hall walls face-on, from inside the running app.
 *
 * Detecting Marble's painted frames from the panorama or from a Blender ortho
 * render both failed on projection: the panorama needs a ray/plane solve against
 * a warped mesh, and Blender's copy is flipped and rotated relative to the app.
 * Shooting from the app removes the problem entirely, because the camera lives
 * in the same world space the paintings do, so pixel -> world is exact.
 *
 * Camera stays on the hall centreline at x=0 looking straight sideways, so every
 * ray hits the wall plane at a known distance and inverse projection is a
 * two-line solve (see frames_from_shots.py).
 *
 * One page load, then the camera is stepped via window.__cam, because reloading
 * costs 11s of mesh + splat load per station.
 *
 *   node scripts/wall_scan.mjs <baseUrl> <outDir>
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const [base = 'http://localhost:5173/', outDir = '/tmp/wallscan'] = process.argv.slice(2)

export const CAM_Y = 3.0        // frames sit low; 68deg vertical then covers 0.2..5.8m
export const CAM_X = 0          // hall centreline
export const FOV_Y = 68         // matches the Canvas camera
const W = 1600, H = 900
const Z_FROM = 13.0, Z_TO = -25.0, STEP = 4.0   // overlapping stations along the hall

const stations = []
for (let z = Z_FROM; z >= Z_TO; z -= STEP) {
  stations.push({ wall: 'L', yaw: 90, z })      // yaw +90 looks toward -x
  stations.push({ wall: 'R', yaw: -90, z })     // yaw -90 looks toward +x
}

mkdirSync(outDir, { recursive: true })

const PORT = 9500 + Math.floor(Math.random() * 200)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--use-angle=metal',
  `--remote-debugging-port=${PORT}`, `--window-size=${W},${H}`,
  '--user-data-dir=/tmp/cdp-scan-' + PORT, 'about:blank',
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
  if (!page) throw new Error('no page target')

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

  const url = `${base}?environment=marble&mode=mesh&nopaint=1&cam=${CAM_X},${CAM_Y},${Z_FROM},0,90`
  await send('Page.enable')
  await send('Page.navigate', { url })
  await sleep(13000)
  for (let i = 0; i < 2; i++) {
    for (const type of ['keyDown', 'keyUp'])
      await send('Input.dispatchKeyEvent', { type, key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 })
    await sleep(400)
  }
  for (const type of ['keyDown', 'keyUp'])
    await send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
  await sleep(1500)
  // strip every overlay: the editor panel and hint bar sit over wall we need.
  // Hide by ancestry rather than by selector, so the canvas's own wrappers stay.
  await send('Runtime.evaluate', {
    expression: `(() => {
      const c = document.querySelector('canvas'); if (!c) return 'no canvas'
      let n = 0
      document.querySelectorAll('body *').forEach((el) => {
        if (el === c || el.contains(c)) return
        el.style.display = 'none'; n++
      })
      return 'hid ' + n
    })()`,
  })
  await sleep(500)

  // Record the size the renderer actually used, not the window size: headless
  // chrome takes ~143px off innerHeight, so the canvas is 1600x757 and its
  // aspect is 2.11, not 1.78. Assuming the window size put every frame ~0.6m
  // out along the hall.
  const { result: meta } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => { const t = window.__three
      return { w: t.size.width, h: t.size.height, fov: t.camera.fov, aspect: t.camera.aspect } })()`,
  })
  const view = meta.value
  console.log('  canvas', view)

  const manifest = []
  for (const s of stations) {
    await send('Runtime.evaluate', {
      expression: `window.__cam = [${CAM_X}, ${CAM_Y}, ${s.z}, 0, ${s.yaw}]`,
    })
    await sleep(700)
    const name = `${s.wall}_z${String(s.z).replace('.', 'p').replace('-', 'm')}.png`
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`${outDir}/${name}`, Buffer.from(data, 'base64'))
    manifest.push({ file: name, ...s, camX: CAM_X, camY: CAM_Y, ...view })
    console.log('  shot', name)
  }
  writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2))
  console.log(`${manifest.length} stations -> ${outDir}`)
} finally {
  chrome.kill()
}
