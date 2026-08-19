/**
 * Placement registry for the Marble room.
 *
 * This file owns WHERE artwork hangs and WHICH exhibit it opens. It deliberately
 * holds no exhibit copy: that stays canonical in src/data/museum.js, and a
 * painting references it by wingId + piece. Duplicating the descriptions would
 * guarantee they drift.
 *
 * Positions are no longer invented. frameSlots.json holds the frames Marble
 * actually painted into the walls, measured by photographing both walls from
 * inside the app and raycasting the detected boxes against the real mesh
 * (scripts/wall_scan.mjs -> raycast_frames.mjs -> merge_slots.py). Inventing a
 * grid is what put paintings through walls and overlapping each other: the
 * legacy hall computed wallX = side * 8.88, and Marble's walls are near +-4.1
 * and bow by up to half a metre.
 */

import SPREAD_SLOTS from './frameSlots.json'
import CONCENTRATED_SLOTS from './frameSlotsConcentrated.json'

/**
 * `?hang=concentrated` pulls all 40 into the sharp band (z +6 .. -17) instead of
 * spreading them the length of the hall.
 *
 * Marble's reconstruction only holds up over that stretch: the detail survey
 * scores the door end 8-30 and the far end 18-28, against 40-100 in the middle.
 * The spread hang puts 18 of the 40 on soft wall. The concentrated one is a
 * three-tier salon wall, which is what the Mauritshuis actually does, at the cost
 * of leaving the hall's two ends as architecture rather than gallery.
 *
 * Both ship so they can be compared from identical cameras before choosing.
 */
const HANG = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('hang')
  : null

const SLOTS = HANG === 'concentrated' ? CONCENTRATED_SLOTS : SPREAD_SLOTS

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
  /** metres of visible canvas, taken from the frame it fills */
  readonly width: number
  readonly height: number
  readonly visible?: boolean
}

type Slot = {
  side: number
  x: number
  y: number
  z: number
  w: number
  h: number
  seen: number
  spread: number
}

export const DEPTH_OFFSET = 0.05    // keeps the canvas off the wall, no z-fighting

/**
 * Encounter order: a visitor enters near z = +12 and walks toward -z, so
 * descending z is the order the frames are met. Within one bay the upper
 * picture reads first, hence descending y as the tie-break.
 */
const ORDERED: Slot[] = [...(SLOTS as Slot[])].sort((a, b) => (b.z - a.z) || (b.y - a.y))

/** How many real frames the walls actually offer. */
export const SLOT_COUNT = ORDERED.length

export function layout(
  entries: ReadonlyArray<{ wingId: string; piece: number | null; aspect?: number }>,
): PaintingPlacement[] {
  return entries.map((e, i) => {
    const slot = ORDERED[i]
    const id = `${e.wingId}-${e.piece ?? 'solo'}`
    if (!slot) {
      // More artwork than Marble painted frames. Hiding it silently would read
      // as "everything is hung", so it stays in the registry, flagged.
      return {
        id, wingId: e.wingId, piece: e.piece,
        position: [0, -100, 0] as Vec3,
        rotation: [0, 0, 0] as Vec3,
        width: 1, height: 1, visible: false,
      }
    }
    return {
      id,
      wingId: e.wingId,
      piece: e.piece,
      // pulled off the wall along its own normal, which differs per slot
      // because pilasters project and window reveals recess
      position: [slot.x - slot.side * DEPTH_OFFSET, slot.y, slot.z] as Vec3,
      // face into the room: -x wall turns +90 degrees, +x wall turns -90
      rotation: [0, slot.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0] as Vec3,
      width: slot.w,
      height: slot.h,
    }
  })
}
