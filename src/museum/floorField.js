/**
 * Marble's floor as a sampled height field.
 *
 * The hall is a ramp, not a level room: it drops from about y +0.18 at the door
 * to y -1.75 near the far end. Two things were quietly wrong because of it.
 * Our parquet was laid as a flat plane, so it was buried near the door and poked
 * through the middle of the hall. And the player walks at a hardcoded y = 0, so
 * the character floated higher and higher, over a metre off the ground by the
 * time it reached the stained glass.
 *
 * Both now read the same field, measured by scripts/probe_floor.mjs.
 */

import FIELD from '../data/floorHeights.json'

const { x0, x1, nx, z0, z1, nz, grid } = FIELD

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/** Bilinear height at a world position. Clamps outside the measured area. */
export function floorHeightAt(x, z) {
  const fx = clamp(((x - x0) / (x1 - x0)) * (nx - 1), 0, nx - 1)
  const fz = clamp(((z - z0) / (z1 - z0)) * (nz - 1), 0, nz - 1)
  const i = Math.min(Math.floor(fx), nx - 2)
  const j = Math.min(Math.floor(fz), nz - 2)
  const tx = fx - i
  const tz = fz - j
  const a = grid[j][i], b = grid[j][i + 1]
  const c = grid[j + 1][i], d = grid[j + 1][i + 1]
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz
}

export const FLOOR_BOUNDS = { x0, x1, z0, z1 }

/**
 * A mesh that follows the field.
 *
 * Built vertex by vertex rather than by rotating a PlaneGeometry, because the UVs
 * then map directly: u along the hall, v across it, so the boards run lengthwise
 * with no texture rotation. Rotating the texture instead swaps which repeat value
 * applies to which axis, which is what stretched the first attempt's boards to
 * about ten metres each.
 */
export function buildFloorGeometry(BufferGeometry, Float32BufferAttribute, lift, res = 3) {
  const NX = (nx - 1) * res + 1
  const NZ = (nz - 1) * res + 1
  const pos = []
  const uv = []
  for (let j = 0; j < NZ; j++) {
    const z = z0 + ((z1 - z0) * j) / (NZ - 1)
    for (let i = 0; i < NX; i++) {
      const x = x0 + ((x1 - x0) * i) / (NX - 1)
      pos.push(x, floorHeightAt(x, z) + lift, z)
      uv.push(j / (NZ - 1), i / (NX - 1))   // u runs down the hall
    }
  }
  // Wind so the faces point UP. z decreases as j increases, so the intuitive
  // (a, c, b) order produces downward normals and FrontSide culls the whole
  // floor when you look at it from above, which is every moment of the game.
  const idx = []
  for (let j = 0; j < NZ - 1; j++) {
    for (let i = 0; i < NX - 1; i++) {
      const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1
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
