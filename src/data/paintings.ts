/**
 * Placement registry for the Marble room.
 *
 * This file owns WHERE artwork hangs and WHICH exhibit it opens. It deliberately
 * holds no exhibit copy: that stays canonical in src/data/museum.js, and a
 * painting references it by wingId + piece. Duplicating the descriptions would
 * guarantee they drift.
 *
 * The legacy hall computed placement from its own geometry (wallX = side * 8.88),
 * which is why paintings floated through Marble's walls: Marble's are at x ~ +-4.4.
 */

export type Vec3 = readonly [number, number, number]

export type PaintingPlacement = {
  /** stable id, used by the placement editor and for React keys */
  readonly id: string
  /** resolves to the exhibit in museum.js */
  readonly wingId: string
  /** index into that wing's `pieces`, or null for single-piece wings */
  readonly piece: number | null
  readonly position: Vec3
  readonly rotation: Vec3
  /** metres of visible canvas; height follows from the artwork's aspect */
  readonly width: number
  readonly visible?: boolean
}

/** Marble hall: walls at x ~ +-4.4, floor y=0, runs z -39 .. +15. */
export const WALL_X = 4.12          // canvas sits just proud of the wall face
export const HANG_Y = 2.25          // centre height, a little above eye level
export const DEPTH_OFFSET = 0.05    // keeps the canvas off the wall, no z-fighting
export const Z_START = 11.0         // near the door end
export const Z_SPACING = 3.6        // along the hall; frames need more room than bare canvases

/**
 * Alternates walls so a visitor walking the centre meets them left, right,
 * left. Order follows the wing order in museum.js, so the narrative sequence
 * is preserved rather than scattered.
 */
export function layout(entries: ReadonlyArray<{ wingId: string; piece: number | null }>): PaintingPlacement[] {
  return entries.map((e, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const z = Z_START - Math.floor(i / 2) * Z_SPACING
    return {
      id: `${e.wingId}-${e.piece ?? 'solo'}`,
      wingId: e.wingId,
      piece: e.piece,
      position: [side * (WALL_X - DEPTH_OFFSET), HANG_Y, z] as Vec3,
      // face into the room: -x wall turns +90 degrees, +x wall turns -90
      rotation: [0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0] as Vec3,
      width: 1.05,
    }
  })
}
