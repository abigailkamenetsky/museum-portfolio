/**
 * Abby's Bosch stained glass, hung over Marble's window at the end of the hall.
 *
 * The permanent split puts windows on Marble's side of the line, and this is the
 * one place Abby asked to override it: Marble's own glazing came out as an
 * indistinct bright smear, and she wanted the Garden of Earthly Delights reading
 * as leaded glass at the end of the walk.
 *
 * The opening was measured the same way the picture frames were: shoot the end
 * wall from inside the app, read the glazing's pixel bounds, raycast the corners
 * against the real mesh. So this sits exactly on Marble's window rather than
 * near it, and it stays correct even though the far end of the mesh droops (the
 * sill really does land below the walkable floor plane there).
 */

import { useEffect, useMemo, useState } from 'react'
import { MeshBasicMaterial, TextureLoader, SRGBColorSpace, DoubleSide } from 'three'
import { useThree } from '@react-three/fiber'

const TEX = import.meta.env.BASE_URL + 'assets/textures/stainedglass_bosch_glazing.jpg'

/**
 * Raycast-measured corners of Marble's glazing, in world space.
 * TL (-0.173, 3.797, -40.757)  TR (1.375, 3.800, -40.869)
 * BL (-0.172, -1.394, -40.749) BR (1.375, -1.447, -40.866)
 */
export const GLASS = {
  position: [0.60, 1.19, -40.78],   // centre, pulled just proud of the wall
  width: 1.55,
  height: 5.22,
}

export default function MarbleStainedGlass() {
  const gl = useThree((s) => s.gl)
  const [tex, setTex] = useState(null)

  // Unlit and untonemapped so it reads backlit rather than as a picture of
  // glass. The hall's ambient is far too dim to light it convincingly.
  const mat = useMemo(() => new MeshBasicMaterial({
    color: '#ffffff', side: DoubleSide, toneMapped: false,
  }), [])

  useEffect(() => {
    let alive = true
    new TextureLoader().load(
      TEX,
      (t) => {
        if (!alive) return
        t.colorSpace = SRGBColorSpace
        t.anisotropy = 8

        // Marble's window is a tall lancet (1:3.4) and the artwork is 1:2, so
        // crop to fill rather than stretch the figures.
        const imgAspect = (t.image?.height || 1) / (t.image?.width || 1)
        const quadAspect = GLASS.height / GLASS.width
        if (imgAspect > quadAspect) {
          const r = quadAspect / imgAspect
          t.repeat.set(1, r); t.offset.set(0, (1 - r) / 2)
        } else {
          const r = imgAspect / quadAspect
          t.repeat.set(r, 1); t.offset.set((1 - r) / 2, 0)
        }

        // Same desynced-unpack-flag guard the paintings need; see MarblePaintings.
        gl.resetState()
        gl.initTexture(t)

        mat.map = t
        mat.needsUpdate = true
        setTex(t)
      },
      undefined,
      () => console.warn('[stainedglass] failed to load', TEX),
    )
    return () => { alive = false }
  }, [gl, mat])

  if (!tex) return null
  return (
    <group position={GLASS.position}>
      {/* 3% over the measured opening, so no sliver of Marble's own bright
          glazing shows around the edge */}
      <mesh material={mat}>
        <planeGeometry args={[GLASS.width * 1.03, GLASS.height * 1.03]} />
      </mesh>
      {/* warm spill into the room, as if daylight were coming through */}
      <pointLight position={[0, 0.6, 1.6]} color="#ffd9a0" intensity={5} distance={14} decay={2} />
    </group>
  )
}
