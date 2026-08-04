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

import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { SplatMesh, SparkRenderer } from '@sparkjsdev/spark'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshBasicMaterial, MeshStandardMaterial, DoubleSide, Color, SRGBColorSpace } from 'three'
import { MARBLE_ASSETS, MUSEUM_DEBUG } from '../data/museumConfig'
import { MARBLE_CALIBRATION as CAL } from './MuseumCalibration'

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
