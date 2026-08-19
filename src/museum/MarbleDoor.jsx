/**
 * Our own pediment doorcase, built over Marble's.
 *
 * The door is the second of the three things Abby named. Unlike the candelabra
 * there is no asset for it, so it is built from primitives, but every dimension
 * is measured off Marble's own rather than invented: raycasting the doorcase,
 * the leaf and the entablature in the wall scan gave 3.11 x 4.89m overall, a
 * 1.22 x 3.31m leaf, and an entablature at y 3.77 that projects to x 4.16 while
 * the reveal sits back at 4.69. So this lands on Marble's door, not near it.
 *
 * Built as a group standing on the floor field, since the hall is a ramp and a
 * door at a fixed y would sink or float.
 */

import { useMemo } from 'react'
import { MeshStandardMaterial, Shape, ExtrudeGeometry, Color } from 'three'
import { floorHeightAt } from './floorField'

// measured centre of Marble's doorcase, on the right wall
const Z = 1.61
const X_FACE = 4.42          // between the recessed reveal (4.69) and the entablature (4.16)

const W = 3.11               // doorcase overall
const H = 4.89
const LEAF_W = 1.22
const LEAF_H = 3.31
const PIL_W = 0.56           // pilaster, ~19% of the case each side, as measured
const ENT_H = 0.52
const ENT_Y = 3.77
const PED_H = 0.78

export default function MarbleDoor() {
  const wood = useMemo(() => new MeshStandardMaterial({
    color: '#3b2415', roughness: 0.62, metalness: 0.05, envMapIntensity: 0.3,
  }), [])
  const stone = useMemo(() => new MeshStandardMaterial({
    color: '#6b5540', roughness: 0.78, metalness: 0.0, envMapIntensity: 0.3,
  }), [])
  const gilt = useMemo(() => new MeshStandardMaterial({
    color: '#9a7326', roughness: 0.44, metalness: 0.85,
    emissive: new Color('#241804'), envMapIntensity: 0.4,
  }), [])

  // triangular pediment, extruded so it has real depth and catches the light
  const pediment = useMemo(() => {
    const s = new Shape()
    s.moveTo(-W / 2, 0)
    s.lineTo(W / 2, 0)
    s.lineTo(0, PED_H)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: 0.30, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 })
    g.computeVertexNormals()
    return g
  }, [])

  const base = floorHeightAt(X_FACE, Z)
  const pilX = LEAF_W / 2 + PIL_W / 2 + 0.06

  return (
    <group position={[X_FACE, base, Z]} rotation={[0, -Math.PI / 2, 0]}>
      {/* dark reveal, so nothing of Marble's smeared door shows through ours */}
      <mesh position={[0, H / 2, -0.16]} material={wood}>
        <boxGeometry args={[W, H, 0.06]} />
      </mesh>

      {/* the leaf, with two recessed panels */}
      <mesh position={[0, LEAF_H / 2, -0.04]} material={wood}>
        <boxGeometry args={[LEAF_W, LEAF_H, 0.10]} />
      </mesh>
      {[0.72, 0.30].map((f, i) => (
        <mesh key={i} position={[0, LEAF_H * f, 0.03]} material={gilt}>
          <boxGeometry args={[LEAF_W * 0.62, LEAF_H * 0.26, 0.02]} />
        </mesh>
      ))}

      {/* pilasters either side */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * pilX, LEAF_H / 2 + 0.1, 0.02]} material={stone}>
          <boxGeometry args={[PIL_W, LEAF_H + 0.2, 0.22]} />
        </mesh>
      ))}

      {/* entablature across the top, projecting into the room as measured */}
      <mesh position={[0, ENT_Y - base, 0.10]} material={stone}>
        <boxGeometry args={[W, ENT_H, 0.34]} />
      </mesh>

      {/* pediment above it */}
      <mesh geometry={pediment} position={[0, ENT_Y - base + ENT_H / 2, -0.05]} material={stone} />
    </group>
  )
}
