/**
 * Our own glazing over Marble's windows.
 *
 * The openings are measured, not guessed: scripts/find_windows.py finds them as
 * the only thing in the room that is both large and bright, then the box is
 * walked down to the sill and raycast. Five of the six are confirmed by two or
 * three independent camera stations, and the one at z 1.05 came out 2.813, 2.777
 * and 2.774m wide from three of them.
 *
 * Built rather than exported: the Blender hall carries only reveals (head, jambs
 * and sill) with no tracery or glazing at all, so there was nothing to lift.
 *
 * Behind ?windows=on until the shape is judged.
 */

import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  MeshBasicMaterial, MeshStandardMaterial, Shape, ShapeGeometry, ExtrudeGeometry,
  TextureLoader, RepeatWrapping, SRGBColorSpace, DoubleSide, Color,
} from 'three'
import WINDOWS from '../data/windows.json'

const VIEW = import.meta.env.BASE_URL + 'assets/scenery/forest.jpg'

export const WINDOWS_ON = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('windows') === 'on'

const OFF_WALL = 0.05
const BAR = 0.035          // glazing bar thickness

/** Outline of a round-headed window: square jambs, semicircular head. */
function outline(w, h) {
  const r = w / 2
  const straight = Math.max(0.2, h - r)
  const s = new Shape()
  s.moveTo(-r, -h / 2)
  s.lineTo(r, -h / 2)
  s.lineTo(r, -h / 2 + straight)
  s.absarc(0, -h / 2 + straight, r, 0, Math.PI, false)
  s.lineTo(-r, -h / 2)
  return s
}

export default function MarbleWindows() {
  const gl = useThree((s) => s.gl)

  // Unlit: this is daylight coming in, and the hall's ambient is far too dim to
  // light it convincingly. Same reasoning as the Bosch glazing.
  const glass = useMemo(() => new MeshBasicMaterial({
    color: '#ffffff', side: DoubleSide, toneMapped: false,
  }), [])
  const lead = useMemo(() => new MeshStandardMaterial({
    color: '#2a2318', roughness: 0.75, metalness: 0.1, envMapIntensity: 0.3,
  }), [])
  const stone = useMemo(() => new MeshStandardMaterial({
    color: '#7d6a4e', roughness: 0.8, envMapIntensity: 0.35,
    emissive: new Color('#0d0a05'),
  }), [])

  useEffect(() => {
    let alive = true
    new TextureLoader().load(VIEW, (t) => {
      if (!alive) return
      t.colorSpace = SRGBColorSpace
      t.wrapS = t.wrapT = RepeatWrapping
      t.anisotropy = 8
      gl.resetState(); gl.initTexture(t)
      glass.map = t; glass.needsUpdate = true
    }, undefined, () => {})
    return () => { alive = false }
  }, [gl, glass])

  const built = useMemo(() => WINDOWS.map((win) => {
    const w = win.w * 0.94, h = win.h * 0.96     // inside Marble's own reveal
    const shape = outline(w, h)
    const pane = new ShapeGeometry(shape)
    // ShapeGeometry writes UVs in the shape's own units, i.e. metres, so the
    // view tiled into repeating bands of trees. Remap them onto 0..1 across the
    // opening so one copy of the scenery fills the whole window.
    {
      const uv = pane.attributes.uv
      for (let k = 0; k < uv.count; k++) {
        uv.setXY(k, (uv.getX(k) + w / 2) / w, (uv.getY(k) + h / 2) / h)
      }
      uv.needsUpdate = true
    }
    // reveal: the same outline swept outward, so it frames the glazing
    const outer = outline(w + 0.26, h + 0.20)
    outer.holes.push(shape)
    const reveal = new ExtrudeGeometry(outer, {
      depth: 0.14, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1,
    })
    reveal.computeVertexNormals()
    return { win, w, h, pane, reveal }
  }), [])

  useEffect(() => () => built.forEach((b) => { b.pane.dispose(); b.reveal.dispose() }), [built])

  if (!WINDOWS_ON) return null

  return (
    <>
      {built.map(({ win, w, h, pane, reveal }, i) => {
        const cols = Math.max(2, Math.round(w / 0.62))
        const rows = Math.max(3, Math.round(h / 0.66))
        return (
          <group
            key={i}
            position={[win.x - win.side * OFF_WALL, win.y, win.z]}
            rotation={[0, win.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <mesh geometry={pane} material={glass} />
            {/* glazing bars */}
            {Array.from({ length: cols - 1 }, (_, k) => (
              <mesh key={`v${k}`} position={[-w / 2 + (w * (k + 1)) / cols, 0, 0.012]} material={lead}>
                <boxGeometry args={[BAR, h, 0.03]} />
              </mesh>
            ))}
            {Array.from({ length: rows - 1 }, (_, k) => (
              <mesh key={`h${k}`} position={[0, -h / 2 + (h * (k + 1)) / rows, 0.012]} material={lead}>
                <boxGeometry args={[w, BAR, 0.03]} />
              </mesh>
            ))}
            <mesh geometry={reveal} position={[0, 0, -0.02]} material={stone} />
          </group>
        )
      })}
    </>
  )
}
