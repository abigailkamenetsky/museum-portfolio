/**
 * Our own candelabra, placed over Marble's wall sconces.
 *
 * Marble reconstructs them as warm smears, and they are one of the things Abby
 * named as bothering her most. They are also the easiest of that list to fix,
 * because the asset already exists from the Blender hall and a lit sconce is
 * trivial to find in the wall scans: small, very bright, strongly warm, against
 * dark green wall. Nothing else in the room is both that bright and that small.
 *
 * Positions are measured (scripts/find_sconces.py then raycast), then merged
 * across overlapping stations. Highlights on the window glazing pass the
 * brightness test too, so they are rejected by depth: a sconce sits on the wall
 * face, a glazing highlight sits back in the reveal.
 *
 * No point lights. 28 of them would cost more than the room can spare, and
 * Marble's texture is already lit, so the flames are emissive instead.
 */

import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Vector3, MeshStandardMaterial, Color } from 'three'
import SCONCES from '../data/sconces.json'

// The real fitting from the Blender hall (back plate, boss, two arms, two
// candles, two pans, two flames), exported out of hall_source.blend rather than
// the downloaded candelabra.glb that was standing in for it.
const URL = import.meta.env.BASE_URL + 'assets/models/sconce_og.glb'
const HEIGHT = 1.08          // the asset's own height, measured on export
const OFF_WALL = 0.16        // clear of the wall face

// Off by default. Abby's verdict: wrong look (the brass scroll does not match
// Marble's own candelabra) and wrong placement (spacing runs 0.0m to 3.3m apart,
// including a duplicate, so the detector is finding flames unevenly rather than
// finding Marble's actual fittings).
export const SCONCES_ON = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('sconces') === 'on'

export default function MarbleSconces() {
  if (!SCONCES_ON) return null
  const { scene } = useGLTF(URL)

  const proto = useMemo(() => {
    const c = scene.clone(true)
    const box = new Box3().setFromObject(c)
    const size = new Vector3()
    box.getSize(size)
    c.scale.setScalar(HEIGHT / (size.y || 1))
    const b2 = new Box3().setFromObject(c)
    c.position.y -= (b2.min.y + b2.max.y) / 2      // centre on the mount point
    // KEEP the asset's own materials. It ships baseColor, metallicRoughness,
    // normal and occlusion maps, and the first version threw all four away for a
    // flat brass MeshStandardMaterial, which is why the sconces read as a plain
    // scroll instead of the carved fitting from the Blender hall. Only the
    // envMap response is calmed, because fully reflective metal reads as a black
    // mirror in a room this dim.
    c.traverse((o) => {
      if (!o.isMesh || !o.material) return
      o.material = o.material.clone()
      o.material.envMapIntensity = 0.35
      if (o.material.emissive) o.material.emissive.set('#2a1b05')
      o.material.needsUpdate = true
    })
    return c
  }, [scene])

  return (
    <>
      {SCONCES.map((s, i) => (
        <group
          key={i}
          position={[s.x - s.side * OFF_WALL, s.y, s.z]}
          rotation={[0, s.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <primitive object={proto.clone(true)} />
          {/* the flame itself, unlit so it reads as a light source */}
          <mesh position={[0, HEIGHT * 0.46, 0.02]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#ffca72" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

useGLTF.preload(URL)
