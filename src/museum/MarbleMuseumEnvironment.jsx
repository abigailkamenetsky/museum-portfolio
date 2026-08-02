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
import { MeshBasicMaterial, MeshStandardMaterial, DoubleSide, Color } from 'three'
import { MARBLE_ASSETS, MUSEUM_DEBUG } from '../data/museumConfig'
import { MARBLE_CALIBRATION as CAL } from './MuseumCalibration'

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
      scene.add(spark)
    } catch (e) {
      console.error('[marble] SparkRenderer failed', e)
      report('error', e)
    }
    return () => { if (spark) scene.remove(spark) }
  }, [scene, gl])

  useEffect(() => {
    let alive = true
    let mesh
    report('downloading')
    try {
      mesh = new SplatMesh({
        url: MARBLE_ASSETS.full,
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
    new GLTFLoader().load(
      MARBLE_ASSETS.collider,
      (gltf) => {
        if (!alive) return
        const root = gltf.scene
        let tris = 0
        root.traverse((o) => {
          if (!o.isMesh) return
          tris += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3
          o.material = MUSEUM_DEBUG
            ? new MeshBasicMaterial({ color: new Color('#39ff88'), wireframe: true, transparent: true, opacity: 0.35 })
            : new MeshStandardMaterial({ visible: false })
          o.visible = MUSEUM_DEBUG
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

  const probe = useMemo(() => new MeshStandardMaterial({
    color: '#c0392b', roughness: 0.6, side: DoubleSide,
  }), [])

  return (
    <group
      ref={rootRef}
      name="museumWorldRoot"
      position={CAL.position}
      rotation={CAL.rotation}
      scale={CAL.scale}
    >
      {splat && <primitive object={splat} />}
      {collider && <primitive object={collider} />}

      {/* Phase 2 probe: proves an ordinary lit mesh renders IN FRONT of splats
          and still receives pointer events. The whole painting architecture
          depends on this being true. */}
      {MUSEUM_DEBUG && (
        <mesh
          position={[0, 0.8, 0]}
          material={probe}
          onClick={(e) => { e.stopPropagation(); console.log('[marble] PROBE CLICKED') }}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = '' }}
        >
          <planeGeometry args={[0.6, 0.45]} />
        </mesh>
      )}
    </group>
  )
}
