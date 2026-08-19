/**
 * Our own damask wall, built over Marble's at the two ends of the hall.
 *
 * Those ends are where Marble's reconstruction gives out (detail 8-30 against
 * 40-100 in the middle), and unlike the middle they cannot be rescued by hanging
 * more sharp art, because there is not enough clean wall between the windows.
 *
 * An earlier attempt patched only the bare spots the free-wall detector found,
 * and there were four of them in twelve stations, so it was abandoned. This does
 * the opposite: it resurfaces the whole wall band between dado and cornice and
 * lets our own paintings sit in front, the same way the parquet resurfaced the
 * whole floor rather than patching it.
 *
 * The surface follows a measured field (scripts/probe_walls.mjs) because
 * Marble's walls bow by up to half a metre, so a flat panel would sink into them
 * at one end and float at the other.
 *
 * Behind ?ends=rebuilt so it can be judged against the untouched room.
 */

import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  RepeatWrapping, SRGBColorSpace, TextureLoader, MeshStandardMaterial,
  BufferGeometry, Float32BufferAttribute, DoubleSide,
} from 'three'
import FIELD from '../data/wallField.json'

const DAMASK = import.meta.env.BASE_URL + 'assets/textures/jacquard_green_v3.jpg'

export const REBUILD_ENDS = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('ends') === 'rebuilt'

// Only the two ends. The middle already reads well and does not want covering.
const ZONES = [
  { z0: 15.0, z1: 4.0 },
  { z0: -16.0, z1: -40.0 },
]
const Y_LO = 1.15         // above the dado
const Y_HI = 5.25         // below the cornice
const INSET = 0.06        // stand proud of Marble's wall face
const MOTIF = 1.9         // damask repeat, metres

const { z0: FZ0, z1: FZ1, nz, y0: FY0, y1: FY1, ny } = FIELD

function wallX(side, y, z) {
  const g = side < 0 ? FIELD.left : FIELD.right
  const fz = Math.min(nz - 1, Math.max(0, ((z - FZ0) / (FZ1 - FZ0)) * (nz - 1)))
  const fy = Math.min(ny - 1, Math.max(0, ((y - FY0) / (FY1 - FY0)) * (ny - 1)))
  const j = Math.min(Math.floor(fz), nz - 2), k = Math.min(Math.floor(fy), ny - 2)
  const tz = fz - j, ty = fy - k
  const a = g[j][k], b = g[j][k + 1], c = g[j + 1][k], d = g[j + 1][k + 1]
  return (a * (1 - ty) + b * ty) * (1 - tz) + (c * (1 - ty) + d * ty) * tz
}

function buildPanel(side, zA, zB) {
  const NZ = Math.max(2, Math.round(Math.abs(zA - zB) / 0.5) + 1)
  const NY = 14
  const pos = [], uv = []
  for (let j = 0; j < NZ; j++) {
    const z = zA + ((zB - zA) * j) / (NZ - 1)
    for (let k = 0; k < NY; k++) {
      const y = Y_LO + ((Y_HI - Y_LO) * k) / (NY - 1)
      pos.push(wallX(side, y, z) - side * INSET, y, z)
      uv.push(z / MOTIF, y / MOTIF)      // world-scaled, so the motif never stretches
    }
  }
  const idx = []
  for (let j = 0; j < NZ - 1; j++) {
    for (let k = 0; k < NY - 1; k++) {
      const a = j * NY + k, b = a + 1, c = a + NY, d = c + 1
      idx.push(a, b, c, b, d, c)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export default function MarbleWalls() {
  const gl = useThree((s) => s.gl)

  const geos = useMemo(() => {
    const out = []
    for (const side of [-1, 1]) {
      for (const zone of ZONES) out.push(buildPanel(side, zone.z0, zone.z1))
    }
    return out
  }, [])
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos])

  const mat = useMemo(() => new MeshStandardMaterial({
    color: '#5d6b52', roughness: 0.92, metalness: 0, side: DoubleSide,
  }), [])

  useEffect(() => {
    let alive = true
    new TextureLoader().load(DAMASK, (t) => {
      if (!alive) return
      t.wrapS = t.wrapT = RepeatWrapping
      t.colorSpace = SRGBColorSpace
      t.anisotropy = gl.capabilities.getMaxAnisotropy()
      gl.resetState()
      gl.initTexture(t)
      mat.map = t
      mat.needsUpdate = true
    }, undefined, () => console.warn('[walls] damask failed'))
    return () => { alive = false }
  }, [gl, mat])

  if (!REBUILD_ENDS) return null
  return <>{geos.map((g, i) => <mesh key={i} geometry={g} material={mat} />)}</>
}
