/**
 * Our own pediment doorcase, built over Marble's on the near end wall.
 *
 * Every dimension is measured off Marble's own: raycasting the case, leaf and
 * entablature gives 2.96 x 4.91m overall and a 1.71 x 3.44m leaf whose foot
 * lands at y 0.12, centred at x 0.485. It sits at z 16.42 rather than the 16.96
 * the rays returned, because that reading is the recessed reveal INSIDE the
 * opening, and building there left our door behind Marble's pilasters.
 *
 * The first version was flat boxes and flat gilt rectangles and read as
 * cardboard. Joinery is a sequence of steps at different depths and the shadow
 * lines between them are what sells it, which is exactly what rescued the
 * picture frames. So the case is stepped, the panels are recessed behind their
 * own mouldings, and the wood carries the walnut map.
 */

import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  MeshStandardMaterial, Shape, Path, ExtrudeGeometry, Color,
  TextureLoader, RepeatWrapping, SRGBColorSpace,
} from 'three'
import { floorHeightAt } from './floorField'

const WALNUT = import.meta.env.BASE_URL + 'assets/textures/floor/walnut_color.jpg'

const Z = 16.42
const X_C = 0.485
const W = 2.96
const LEAF_W = 1.71
const LEAF_H = 3.44
const PIL_W = 0.52
const ENT_H = 0.52
const ENT_Y = 3.95
const PED_H = 0.80

/** A mitred rectangular ring, extruded. The same trick the picture frames use. */
function ring(ow, oh, iw, ih, depth, bevel) {
  const s = new Shape()
  s.moveTo(-ow / 2, -oh / 2); s.lineTo(ow / 2, -oh / 2)
  s.lineTo(ow / 2, oh / 2); s.lineTo(-ow / 2, oh / 2); s.closePath()
  const h = new Path()
  h.moveTo(-iw / 2, -ih / 2); h.lineTo(-iw / 2, ih / 2)
  h.lineTo(iw / 2, ih / 2); h.lineTo(iw / 2, -ih / 2); h.closePath()
  s.holes.push(h)
  const g = new ExtrudeGeometry(s, {
    depth: Math.max(0.004, depth - bevel), bevelEnabled: true,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1,
  })
  g.computeVertexNormals()
  return g
}

export default function MarbleDoor() {
  const gl = useThree((s) => s.gl)

  const wood = useMemo(() => new MeshStandardMaterial({
    color: '#d8b184', roughness: 0.58, metalness: 0.04, envMapIntensity: 0.45,
  }), [])
  const stone = useMemo(() => new MeshStandardMaterial({
    color: '#7d6444', roughness: 0.72, envMapIntensity: 0.45, metalness: 0.02,
  }), [])
  const gilt = useMemo(() => new MeshStandardMaterial({
    color: '#8a6420', roughness: 0.45, metalness: 0.8,
    emissive: new Color('#1d1304'), envMapIntensity: 0.4,
  }), [])

  useEffect(() => {
    let alive = true
    new TextureLoader().load(WALNUT, (t) => {
      if (!alive) return
      t.wrapS = t.wrapT = RepeatWrapping
      t.colorSpace = SRGBColorSpace
      t.repeat.set(1.4, 2.6)
      t.anisotropy = 8
      gl.resetState(); gl.initTexture(t)
      wood.map = t; wood.needsUpdate = true
    }, undefined, () => {})
    return () => { alive = false }
  }, [gl, wood])

  const panelRing = useMemo(
    () => ring(LEAF_W * 0.66, LEAF_H * 0.30, LEAF_W * 0.50, LEAF_H * 0.22, 0.045, 0.012), [])
  const caseRing = useMemo(
    () => ring(W, LEAF_H + 0.34, LEAF_W + 0.10, LEAF_H + 0.06, 0.20, 0.022), [])
  const pediment = useMemo(() => {
    const s = new Shape()
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(0, PED_H); s.closePath()
    const g = new ExtrudeGeometry(s, {
      depth: 0.26, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2,
    })
    g.computeVertexNormals()
    return g
  }, [])
  useEffect(() => () => [panelRing, caseRing, pediment].forEach((g) => g.dispose()),
    [panelRing, caseRing, pediment])

  const base = floorHeightAt(X_C, Z)

  return (
    <group position={[X_C, base, Z]} rotation={[0, Math.PI, 0]}>
      {/* the leaf, walnut, set back inside the case */}
      <mesh position={[0, LEAF_H / 2 + 0.1, -0.10]} material={wood}>
        <boxGeometry args={[LEAF_W, LEAF_H, 0.10]} />
      </mesh>
      {[0.70, 0.30].map((f, i) => (
        <group key={i} position={[0, LEAF_H * f + 0.1, -0.04]}>
          <mesh geometry={panelRing} material={gilt} />
          <mesh position={[0, 0, -0.03]} material={wood}>
            <boxGeometry args={[LEAF_W * 0.52, LEAF_H * 0.23, 0.03]} />
          </mesh>
        </group>
      ))}

      {/* stepped case: architrave ring, then pilasters standing proud of it */}
      <mesh geometry={caseRing} position={[0, LEAF_H / 2 + 0.24, 0.0]} material={stone} />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (LEAF_W / 2 + PIL_W / 2 + 0.06), LEAF_H / 2 + 0.14, 0.12]}
          material={stone}
        >
          <boxGeometry args={[PIL_W, LEAF_H + 0.22, 0.16]} />
        </mesh>
      ))}

      {/* entablature in two steps, so the upper course casts into the lower */}
      <mesh position={[0, ENT_Y - base, 0.06]} material={stone}>
        <boxGeometry args={[W, ENT_H * 0.55, 0.22]} />
      </mesh>
      <mesh position={[0, ENT_Y - base + ENT_H * 0.42, 0.16]} material={stone}>
        <boxGeometry args={[W + 0.10, ENT_H * 0.34, 0.32]} />
      </mesh>

      <mesh geometry={pediment} position={[0, ENT_Y - base + ENT_H * 0.58, 0.02]} material={stone} />
    </group>
  )
}
