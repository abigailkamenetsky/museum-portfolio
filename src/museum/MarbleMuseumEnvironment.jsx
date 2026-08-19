/**
 * Marble splat environment, Phase 2 proof of concept.
 *
 * Everything that belongs to the Marble world hangs off ONE group
 * (`museumWorldRoot`) carrying the calibration transform, so the splat, the
 * collider and any placement helpers stay locked together. Coordinate fixes go
 * here and nowhere else.
 *
 * The splat is loaded with `raycastable: false` on purpose: painting clicks
 * must hit our own interaction meshes, never a cloud of splats.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SplatMesh, SparkRenderer } from '@sparkjsdev/spark'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshBasicMaterial, MeshStandardMaterial, DoubleSide, Color, SRGBColorSpace, Box3, Vector3, Matrix4, Quaternion, Euler } from 'three'
import { MARBLE_ASSETS, MUSEUM_DEBUG } from '../data/museumConfig'
import { MARBLE_CALIBRATION as CAL } from './MuseumCalibration'
import { floorHeightAt } from './floorField'

const SHOW_COLLIDER = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('collider')

// ?mode=mesh|splat|both  — mesh is real geometry (walkable everywhere, never
// smears); splat is photoreal near its capture point and blurs away from it.
const MODE = typeof window !== 'undefined'
  ? (new URLSearchParams(window.location.search).get('mode') || 'mesh') : 'mesh'

// ?wscale=1 isolates whether the calibration scale interferes with Spark's
// screen-space splat sizing. Diagnostic only.
const SCALE_OVERRIDE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('wscale')
  ? Number(new URLSearchParams(window.location.search).get('wscale')) : null

// Marble's mesh ships Draco-compressed, so the loader needs a decoder. Served
// from public/draco rather than a CDN, to keep the museum self-hosted.
function makeGltfLoader() {
  const draco = new DRACOLoader()
  draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  return loader
}

/**
 * Our own statues, placed over Marble's.
 *
 * Marble's statuary reconstructed as melted, half-human forms, and it cannot be
 * cut out: the mesh is unwelded triangle soup (598k fragments of <=6 faces), so
 * there is no object to select and every position filter also catches the floor
 * and walls. Covering them with real geometry is non-destructive and renders
 * sharp, unlike the surrounding photogrammetry.
 *
 * Positions are in WORLD space, i.e. outside museumWorldRoot, so they are not
 * affected by the Marble calibration transform.
 */
const OUR_STATUES = [
  // Positions are MEASURED, not chosen: histogramming upright free-standing
  // faces located Marble's statue clusters at raw (x -0.05..0.3, y -4) and
  // (x -0.8, y -6..-7). Through the museumWorldRoot transform (scale 4,
  // rotation.x = PI, position.y 2.4) those land at these world positions.
  // The two that stood mid-hall at z -16 are gone. Abby's objection to figures
  // in the middle of the room was not only about Marble's melted ones: anything
  // standing in the walkway reads the same way. Statuary belongs against the
  // wall, so only the two wall-side pieces remain.
  { url: 'statue2.glb', pos: [-3.2, 0, -24.0], rotY: 1.2, height: 2.4 },
  { url: 'statue1.glb', pos: [-3.2, 0, -28.0], rotY: 1.2, height: 2.4 },
]

function OurStatue({ url, pos, rotY, height }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}assets/models/${url}`)
  const inst = useMemo(() => {
    const c = scene.clone(true)
    const box = new Box3().setFromObject(c)
    const size = new Vector3(); box.getSize(size)
    const s = height / (size.y || 1)
    c.scale.setScalar(s)
    // re-seat on the floor after scaling
    const b2 = new Box3().setFromObject(c)
    c.position.y -= b2.min.y
    c.traverse((o) => {
      if (!o.isMesh) return
      o.material = new MeshStandardMaterial({
        color: '#e8e4da', roughness: 0.62, metalness: 0, envMapIntensity: 0.3,
      })
    })
    return c
  }, [scene, height])
  // the hall is a ramp, so y=0 left these floating a metre up at the far end
  const seated = [pos[0], floorHeightAt(pos[0], pos[2]), pos[2]]
  return <primitive object={inst} position={seated} rotation={[0, rotY, 0]} />
}

/**
 * Delete the melted figures Marble invented in the middle of the hall.
 *
 * Three earlier attempts at this destroyed the room, because they filtered
 * triangles by position in a band the floor and walls also occupy, and took
 * 17,499 floor faces and 19,368 wall faces with them. Two things make it safe
 * now. The figures were located by raycast rather than guessed at (one cluster,
 * x 0.2..0.6, z -22..-19.5, standing 1.4m off the floor), so the box can be
 * tight and nowhere near a wall. And we now lay our own parquet over this whole
 * stretch, so removing Marble's floor inside the box leaves no hole to see.
 *
 * Done at load on the loaded geometry, not by editing the asset, so it is a
 * one-line revert rather than another round of mesh surgery.
 */
const CUT_BOXES = [
  { x0: -1.0, x1: 1.8, y0: -1.8, y1: 1.2, z0: -25.6, z1: -17.5 },
]

function stripRegions(root) {
  const v = new Vector3()
  let removed = 0
  root.updateMatrixWorld(true)
  // This runs before the mesh is parented to museumWorldRoot, so matrixWorld
  // carries none of the calibration. Apply it explicitly or the box is compared
  // against unflipped, unscaled coordinates and matches nothing.
  const cal = new Matrix4().compose(
    new Vector3(...CAL.position),
    new Quaternion().setFromEuler(new Euler(...CAL.rotation)),
    new Vector3(CAL.scale, CAL.scale, CAL.scale),
  )
  const toWorld = new Matrix4()
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return
    const g = o.geometry
    toWorld.multiplyMatrices(cal, o.matrixWorld)
    const pos = g.attributes.position
    const idx = g.index
    const n = idx ? idx.count : pos.count
    const keep = []
    for (let i = 0; i < n; i += 3) {
      const a = idx ? idx.getX(i) : i
      const b = idx ? idx.getX(i + 1) : i + 1
      const c = idx ? idx.getX(i + 2) : i + 2
      // centroid in world space: the mesh sits under a flipped, scaled root
      let cx = 0, cy = 0, cz = 0
      for (const k of [a, b, c]) {
        v.fromBufferAttribute(pos, k).applyMatrix4(toWorld)
        cx += v.x; cy += v.y; cz += v.z
      }
      cx /= 3; cy /= 3; cz /= 3
      const inside = CUT_BOXES.some((q) =>
        cx > q.x0 && cx < q.x1 && cy > q.y0 && cy < q.y1 && cz > q.z0 && cz < q.z1)
      if (inside) { removed++; continue }
      keep.push(a, b, c)
    }
    if (keep.length !== n) g.setIndex(keep)
  })
  return removed
}

export default function MarbleMuseumEnvironment({ onStatus }) {
  const { scene, gl } = useThree()
  const rootRef = useRef()
  const [splat, setSplat] = useState(null)
  const [collider, setCollider] = useState(null)
  const [phase, setPhase] = useState('init')

  const report = (p, extra) => { setPhase(p); onStatus?.(p, extra) }

  // Spark needs exactly one renderer in the scene, regardless of splat count.
  useEffect(() => {
    let spark
    try {
      spark = new SparkRenderer({ renderer: gl })
      // SparkRenderer is a THREE.Mesh that does its accumulate/sort work during
      // the render graph. If three frustum-culls it, that work never runs and
      // nothing draws.
      spark.frustumCulled = false
      scene.add(spark)
      console.log('[marble] SparkRenderer mounted')
    } catch (e) {
      console.error('[marble] SparkRenderer failed', e)
      report('error', e)
    }
    return () => { if (spark) scene.remove(spark) }
  }, [scene, gl])

  const [hall, setHall] = useState(null)
  useEffect(() => {
    if (MODE === 'splat') return
    let alive = true
    makeGltfLoader().load(MARBLE_ASSETS.mesh, (gltf) => {
      if (!alive) return
      let tris = 0
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return
        tris += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3
        // photogrammetry texture is already lit; do not relight it
        const map = o.material?.map
        if (map) map.colorSpace = SRGBColorSpace
        o.material = new MeshBasicMaterial({ map, side: DoubleSide })
      })
      console.log('[marble] mesh loaded,', Math.round(tris), 'triangles')
      const cut = stripRegions(gltf.scene)
      if (cut) console.log('[marble] removed', cut, 'triangles of mid-room figures')
      setHall(gltf.scene)
    }, undefined, (e) => console.warn('[marble] mesh failed', e))
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (MODE === 'mesh') return
    let alive = true
    let mesh
    report('downloading')
    try {
      // ?splat=low|mobile|full lets us compare tiers without a rebuild, and
      // is the seam the device-tier logic will plug into later.
      const tier = new URLSearchParams(window.location.search).get('splat')
      const url = tier === 'low' ? MARBLE_ASSETS.low
                : tier === 'mobile' ? MARBLE_ASSETS.mobile
                : MARBLE_ASSETS.full
      console.log('[marble] splat url', url)
      mesh = new SplatMesh({
        url,
        raycastable: false,
        onProgress: (e) => {
          if (!alive || !e?.total) return
          report('downloading', Math.round((e.loaded / e.total) * 100))
        },
        onLoad: () => {
          if (!alive) return
          console.log('[marble] splat loaded')
          report('ready')
        },
      })
      mesh.frustumCulled = false
      setSplat(mesh)
    } catch (e) {
      console.error('[marble] SplatMesh failed', e)
      report('error', e)
    }
    return () => {
      alive = false
      try { mesh?.dispose?.() } catch { /* disposal is best-effort */ }
    }
  }, [])

  // Collider is loaded separately from the visible splat: invisible in normal
  // use, wireframe in debug, and it is what movement will collide against.
  useEffect(() => {
    let alive = true
    makeGltfLoader().load(
      MARBLE_ASSETS.collider,
      (gltf) => {
        if (!alive) return
        const root = gltf.scene
        let tris = 0
        root.traverse((o) => {
          if (!o.isMesh) return
          tris += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3
          // wireframe is opt-in via ?collider=1: showing it by default in dev
          // made every screenshot unreadable
          o.material = SHOW_COLLIDER
            ? new MeshBasicMaterial({ color: new Color('#39ff88'), wireframe: true, transparent: true, opacity: 0.35 })
            : new MeshStandardMaterial({ visible: false })
          o.visible = SHOW_COLLIDER
          o.raycast = o.raycast   // kept raycastable: placement + movement need it
        })
        console.log('[marble] collider loaded,', Math.round(tris), 'triangles')
        setCollider(root)
      },
      undefined,
      (e) => { console.warn('[marble] collider failed', e) },
    )
    return () => { alive = false }
  }, [])

  return (
    <group
      ref={rootRef}
      name="museumWorldRoot"
      position={SCALE_OVERRIDE ? [0, 0, 0] : CAL.position}
      rotation={CAL.rotation}
      scale={SCALE_OVERRIDE ?? CAL.scale}
    >
      {hall && <primitive object={hall} />}
      {splat && <primitive object={splat} />}
      {collider && <primitive object={collider} />}

    </group>
  )
}

export function MarbleStatues() {
  return (
    <>
      {OUR_STATUES.map((st, i) => (
        <Suspense key={i} fallback={null}><OurStatue {...st} /></Suspense>
      ))}
    </>
  )
}
