/**
 * Measure Marble's floor as a height field.
 *
 * The floor is not flat. It slopes from about y +0.10 at the door end down to
 * y -1.5 by z -30, which broke two things at once: a flat parquet plane laid at
 * y=0.02 was buried near the door and poked through past z -4, and the player
 * walks at a hardcoded y=0, so by the far end the character floats over a metre
 * above the ground.
 *
 * One height field fixes both. Rays are cast straight down and the LOWEST
 * up-facing hit wins, so benches, statues and rugs are ignored.
 *
 *   node scripts/probe_floor.mjs > src/data/floorHeights.json
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const base = process.argv[2] || 'http://localhost:5173/'
const PORT = 9750 + Math.floor(Math.random() * 200)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--no-sandbox', '--use-angle=metal',
  `--remote-debugging-port=${PORT}`, '--window-size=1200,800',
  '--user-data-dir=/tmp/cdp-pf-' + PORT, 'about:blank',
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
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  }
  const send = (method, params = {}) =>
    new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })

  await send('Page.enable')
  await send('Page.navigate', { url: `${base}?environment=marble&mode=mesh&nopaint=1&cam=0,3,10,0,0` })
  await sleep(15000)

  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const t = window.__three
      const V = t.camera.position.constructor
      const rc = new (t.raycaster.constructor)(); rc.far = 40
      // our own parquet must not be measured as if it were Marble's floor
      let ours = null
      t.scene.traverse(o => {
        if (o.isMesh && o.geometry?.type === 'PlaneGeometry'
            && o.geometry.parameters.width > 8 && Math.abs(o.rotation.x + Math.PI/2) < 0.01) ours = o
      })
      if (ours) ours.visible = false

      const X0 = -4.6, X1 = 4.6, NX = 21
      const Z0 = 16.5, Z1 = -43.5, NZ = 81
      const grid = []
      for (let j = 0; j < NZ; j++) {
        const z = Z0 + (Z1 - Z0) * j / (NZ - 1)
        const row = []
        for (let i = 0; i < NX; i++) {
          const x = X0 + (X1 - X0) * i / (NX - 1)
          rc.set(new V(x, 8, z), new V(0, -1, 0))
          // Record the whole column, not one number. The LOWEST hit is the
          // floor slab; anything standing measurably above it in the same cell
          // is an object resting on the floor (bench, plinth, rug, step), and
          // paving over those is exactly what buried them.
          const hs = rc.intersectObjects(t.scene.children, true)
            .filter(h => h.object.visible && h.object !== ours
                    && h.point.y > -3.5 && h.point.y < 2.5)
            .map(h => h.point.y)
          row.push(hs.length ? [+Math.min(...hs).toFixed(3), +Math.max(...hs).toFixed(3)] : null)
        }
        grid.push(row)
      }
      if (ours) ours.visible = true
      return { x0: X0, x1: X1, nx: NX, z0: Z0, z1: Z1, nz: NZ, grid }
    })()`,
  })

  const d = result.value
  // Benches, rugs and statue plinths are topmost too, so reject anything well
  // above its row's median and refill it from neighbours.
  // split into a floor field and an occupancy mask
  d.occ = []
  for (let j = 0; j < d.nz; j++) {
    const los = d.grid[j].filter(v => v !== null).map(v => v[0]).sort((a, b) => a - b)
    const med = los.length ? los[Math.floor(los.length / 2)] : null
    const occRow = []
    for (let i = 0; i < d.nx; i++) {
      const cell = d.grid[j][i]
      if (cell === null) { occRow.push(0); d.grid[j][i] = null; continue }
      const [lo, hi] = cell
      // a lone ray that punched through a hole in the mesh reads far too low
      const floor = (med !== null && lo < med - 0.6) ? med : lo
      occRow.push(hi - floor)          // raw clearance; thresholded below
      d.grid[j][i] = floor
    }
    d.occ.push(occRow)
  }
  // fill gaps from neighbours so the mesh has no holes
  const flat = d.grid.flat().filter(v => v !== null)
  const med = flat.slice().sort((a, b) => a - b)[Math.floor(flat.length / 2)]
  for (let j = 0; j < d.nz; j++) {
    for (let i = 0; i < d.nx; i++) {
      if (d.grid[j][i] !== null) continue
      const near = []
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const v = d.grid[j + dj]?.[i + di]
        if (v !== null && v !== undefined) near.push(v)
      }
      d.grid[j][i] = near.length ? +(near.reduce((a, b) => a + b, 0) / near.length).toFixed(3) : med
    }
  }
  console.log(JSON.stringify(d))
    // Photogrammetry shells are noisy, so a small clearance is not an object.
  // Pick the cut from the distribution rather than by eye.
  const clear = d.occ.flat().slice().sort((a, b) => a - b)
  const q = (p) => clear[Math.floor(clear.length * p)]
  console.error(`clearance percentiles  p50 ${q(0.5).toFixed(2)}  p75 ${q(0.75).toFixed(2)}  p90 ${q(0.9).toFixed(2)}  p95 ${q(0.95).toFixed(2)}  max ${clear[clear.length-1].toFixed(2)}`)
  const CUT = 0.22          // taller than mesh noise, shorter than a bench seat
  d.occ = d.occ.map(r => r.map(v => (v > CUT ? 1 : 0)))
  // grow by one cell so the parquet keeps clear of an object's base
  const grown = d.occ.map(r => r.slice())
  for (let j = 0; j < d.nz; j++) for (let i = 0; i < d.nx; i++) {
    if (!d.occ[j][i]) continue
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (grown[j + dj]?.[i + di] !== undefined) grown[j + dj][i + di] = 1
    }
  }
  d.occ = grown
  const occN = d.occ.flat().filter(Boolean).length
  console.error(`grid ${d.nx} x ${d.nz}, y ${Math.min(...d.grid.flat()).toFixed(2)} .. ${Math.max(...d.grid.flat()).toFixed(2)}`)
  console.error(`occupied cells (something standing on the floor): ${occN} of ${d.nx * d.nz} (${(100*occN/(d.nx*d.nz)).toFixed(1)}%)`)
} finally {
  chrome.kill()
}
