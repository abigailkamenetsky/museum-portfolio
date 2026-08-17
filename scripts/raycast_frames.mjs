/**
 * Turn image-space frame boxes into world-space painting slots.
 *
 * Marble's walls are not planes: a raycast probe found the surface between
 * |x| 2.97 and 4.47 on the left wall alone, because pilasters project and window
 * reveals recess. Solving pixel rays against an assumed plane would therefore
 * misplace paintings by up to half a metre, which is exactly the "not inside the
 * frames" problem. So each box corner is cast against the real mesh instead and
 * the hit point is used directly.
 *
 * Reads <dir>/read_boxes.json  ({file, boxes:[[x0,y0,x1,y1]]}) against
 *       <dir>/manifest.json    (the camera used for each shot)
 * Writes src/data/frameSlots.json
 *
 *   node scripts/raycast_frames.mjs /tmp/wallscan
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const [dir = '/tmp/wallscan', base = 'http://localhost:5173/'] = process.argv.slice(2)
const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'))
const read = JSON.parse(readFileSync(`${dir}/read_boxes.json`, 'utf8'))

const jobs = []
for (const r of read) {
  const cam = manifest.find((m) => m.file === r.file)
  if (!cam) throw new Error(`no camera for ${r.file}`)
  for (const [x0, y0, x1, y1] of r.boxes) jobs.push({ cam, box: [x0, y0, x1, y1], file: r.file })
}

const PORT = 9800 + Math.floor(Math.random() * 190)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--use-angle=metal',
  `--remote-debugging-port=${PORT}`, '--window-size=1600,900',
  '--user-data-dir=/tmp/cdp-ray-' + PORT, 'about:blank',
], { stdio: 'ignore' })

try {
  let targets
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      if (targets.find((t) => t.type === 'page')) break
    } catch { /* not up yet */ }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
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
    awaitPromise: false,
    expression: `(() => {
      const t = window.__three
      if (!t) return { error: 'no window.__three' }
      const V3 = t.camera.position.constructor
      const RC = t.raycaster.constructor
      const rc = new RC(); rc.far = 60
      const jobs = ${JSON.stringify(jobs)}
      const DEG = Math.PI / 180
      const cam3 = t.camera

      // Aim the real camera, then let three build the ray from its own
      // projection matrix. Hand-rolling fov/aspect is what put the first pass
      // 0.6m out: the canvas is 1600x757, not the 1600x900 window.
      function aim(cam) {
        cam3.position.set(cam.camX, cam.camY, cam.z)
        cam3.rotation.order = 'YXZ'
        cam3.rotation.set(0, cam.yaw * DEG, 0)
        cam3.updateMatrixWorld(true)
        cam3.updateProjectionMatrix()
      }

      function hit(cam, px, py) {
        rc.setFromCamera({ x: (2 * px) / cam.w - 1, y: 1 - (2 * py) / cam.h }, cam3)
        const hs = rc.intersectObjects(t.scene.children, true)
          .filter(h => h.object.visible && h.distance > 0.5)
        return hs.length ? hs[0].point : null
      }

      const out = []
      for (const j of jobs) {
        aim(j.cam)
        const [x0, y0, x1, y1] = j.box
        const cs = [[x0,y0],[x1,y0],[x0,y1],[x1,y1],[(x0+x1)/2,(y0+y1)/2]]
          .map(([px,py]) => hit(j.cam, px, py))
        if (cs.some(c => !c)) { out.push({ file: j.file, box: j.box, miss: true }); continue }
        const [tl, tr, bl, br, mid] = cs
        out.push({
          file: j.file, box: j.box,
          x: +mid.x.toFixed(3), y: +mid.y.toFixed(3), z: +mid.z.toFixed(3),
          // width runs along the hall (z), height is vertical (y)
          w: +(((Math.abs(tr.z - tl.z)) + (Math.abs(br.z - bl.z))) / 2).toFixed(3),
          h: +(((Math.abs(bl.y - tl.y)) + (Math.abs(br.y - tr.y))) / 2).toFixed(3),
          spread: +(Math.max(tl.x,tr.x,bl.x,br.x) - Math.min(tl.x,tr.x,bl.x,br.x)).toFixed(3),
        })
      }
      return { out }
    })()`,
  })

  if (result.value?.error) throw new Error(result.value.error)
  const hits = result.value.out
  writeFileSync(`${dir}/raycast.json`, JSON.stringify(hits, null, 2))
  for (const h of hits) {
    console.log(h.miss
      ? `  MISS ${h.file} ${h.box}`
      : `  ${h.file.padEnd(12)} x${h.x} y${h.y} z${h.z}  ${h.w}x${h.h}m  depthSpread ${h.spread}`)
  }
} finally {
  chrome.kill()
}
