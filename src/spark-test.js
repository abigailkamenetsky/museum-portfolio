/**
 * Spark isolation test. Bare three.js, no R3F, no post-processing, no legacy
 * scene. Purpose is to answer one question: does Spark render THIS spz at all?
 *
 * Open /spark-test.html under `npm run dev`.
 *   ?splat=low|mobile|full   which variant
 *   ?aa=1                    force antialias on, to test Spark's warning
 *   ?pma=0                   premultipliedAlpha:false on SparkRenderer
 */

import * as THREE from 'three'
import { SparkRenderer, SplatMesh, constructAxes } from '@sparkjsdev/spark'

const q = new URLSearchParams(location.search)
const hud = document.getElementById('hud')
const lines = []
const log = (m) => { lines.push(m); hud.textContent = lines.join('\n'); console.log('[test]', m) }

const tier = q.get('splat') || 'low'
const url = `/museum/abby-museum-${tier === 'full' ? 'full' : tier === 'mobile' ? 'mobile' : 'low'}.spz`

const renderer = new THREE.WebGLRenderer({
  antialias: q.get('aa') === '1',      // Spark's docs recommend false
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.setSize(innerWidth, innerHeight)
document.body.appendChild(renderer.domElement)
log(`renderer ok  antialias=${q.get('aa') === '1'}`)

// Spark leans on GPU features a software rasteriser may not provide. If this
// page renders on a real GPU and not under SwiftShader, my headless
// screenshots have been incapable of verifying splats all along.
{
  const gl = renderer.getContext()
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  log(`WebGL2=${renderer.capabilities.isWebGL2}  GPU=${dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?'}`)
  for (const ext of ['EXT_color_buffer_float','OES_texture_float_linear','EXT_float_blend','WEBGL_color_buffer_float']) {
    log(`  ${gl.getExtension(ext) ? 'OK  ' : 'MISS'} ${ext}`)
  }
}

const scene = new THREE.Scene()
scene.background = new THREE.Color('#101014')
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 500)
camera.position.set(0, 0, 0.5)

const spark = new SparkRenderer({
  renderer,
  ...(q.get('pma') === '0' ? { premultipliedAlpha: false } : {}),
})
scene.add(spark)
log(`SparkRenderer added  pma=${q.get('pma') === '0' ? 'false' : 'default(true)'}`)

// a reference cube, so we can tell "nothing renders" from "splats don't render"
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.15, 0.15),
  new THREE.MeshBasicMaterial({ color: 0xff3355, wireframe: true }),
)
cube.position.set(0, 0, -0.6)
scene.add(cube)

// Procedural splats need no file and no download: if THESE render, Spark works
// and the problem is the SPZ or its async load. If they do not, Spark is not
// drawing at all in this setup.
try {
  const axes = new SplatMesh({ constructSplats: (packed) => constructAxes({ packedSplats: packed, scale: 0.3 }) })
  axes.frustumCulled = false
  axes.position.set(0, 0, -0.6)
  scene.add(axes)
  log('procedural axes splats added')
} catch (e) { log(`procedural THREW: ${e?.message || e}`) }

// count non-background pixels after some frames, so the page verifies itself
let frames = 0
function selfCheck() {
  const gl = renderer.getContext()
  const w = renderer.domElement.width, h = renderer.domElement.height
  const buf = new Uint8Array(w * h * 4)
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf)
  let lit = 0
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i] > 30 || buf[i+1] > 30 || buf[i+2] > 30) lit++
  }
  log(`SELFCHECK frames=${frames} litPixels=${lit} of ${w*h}`)
}

let splats = null
log(`loading ${url}`)
try {
  splats = new SplatMesh({
    url,
    onProgress: (e) => { if (e?.total) log(`  ${Math.round((e.loaded / e.total) * 100)}%`) },
    onLoad: (m) => {
      const n = m?.packedSplats?.numSplats ?? m?.numSplats ?? '?'
      log(`LOADED. numSplats=${n}`)
      // report the extent so we know where to point the camera
      const box = new THREE.Box3().setFromObject(m)
      if (isFinite(box.min.x)) {
        log(`bounds x ${box.min.x.toFixed(2)}..${box.max.x.toFixed(2)}`)
        log(`       y ${box.min.y.toFixed(2)}..${box.max.y.toFixed(2)}`)
        log(`       z ${box.min.z.toFixed(2)}..${box.max.z.toFixed(2)}`)
        const c = box.getCenter(new THREE.Vector3())
        camera.position.set(c.x, c.y, c.z)
        log(`camera moved to centre ${c.x.toFixed(2)},${c.y.toFixed(2)},${c.z.toFixed(2)}`)
      } else {
        log('bounds: EMPTY (mesh has no extent)')
      }
      // Do NOT block the main thread here: Spark's sort worker has to be able
      // to post its result back, which cannot happen inside a tight loop.
      setTimeout(selfCheck, 3000)
    },
  })
  scene.add(splats)
  log('SplatMesh added to scene')
} catch (e) {
  log(`SplatMesh THREW: ${e?.message || e}`)
}

let t = 0
renderer.setAnimationLoop(() => {
  t += 0.005
  camera.rotation.y = t                  // slow spin so we sweep the whole world
  cube.rotation.x = cube.rotation.y = t * 2
  renderer.render(scene, camera)
  frames++

})

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
