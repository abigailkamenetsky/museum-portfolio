/**
 * Placement editor state.
 *
 * Kept outside the React tree and mutated in place, like the museum store, so
 * dragging a painting never re-renders the whole scene. A version counter drives
 * the overlay only.
 *
 * Overrides are keyed by painting id and merged over the computed layout, so the
 * generated positions stay as defaults and anything moved by hand wins.
 */
import { useSyncExternalStore } from 'react'

const state = {
  enabled: false,
  selected: null,          // painting id
  index: -1,               // position in the placement list, for next/prev
  grabbing: false,         // G held: pointer drags the painting, not the camera
  overrides: {},           // id -> { position:[x,y,z], width, rotationY }
}

/**
 * True while G is held with a painting selected. The camera's drag-to-look
 * stands down for exactly this window, so the same mouse drag moves the
 * painting instead. Flying the camera to each painting was worse: it framed
 * dark wall and there was no way to zoom back out.
 */
export function isGrabbing() {
  return state.grabbing && state.selected != null
}

/** Drag deltas in pixels -> world movement along the wall and in height. */
export function dragBy(id, base, dxPx, dyPx) {
  const cur = resolve(id, base)
  const p = cur.position
  const k = 0.006                       // metres per pixel, comfortable at arm's length
  const facingNegX = p[0] < 0
  state.overrides[id] = {
    position: [
      p[0],
      +(p[1] - dyPx * k).toFixed(3),                       // drag up -> painting up
      +(p[2] + dxPx * k * (facingNegX ? 1 : -1)).toFixed(3), // follow the pointer along the wall
    ],
    width: cur.width,
    height: cur.height,
    rotationY: cur.rotation?.[1] ?? 0,
  }
  editor.bump()
}

let version = 0
const listeners = new Set()

export const editor = {
  get: () => state,
  set(patch) { Object.assign(state, patch); version++; listeners.forEach((l) => l()) },
  bump() { version++; listeners.forEach((l) => l()) },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l) },
  snap: () => version,
}

export function useEditor() {
  useSyncExternalStore(editor.subscribe, editor.snap, editor.snap)
  return state
}

/** Current placement for an id: hand-tuned override if present, else the default. */
export function resolve(id, base) {
  const o = state.overrides[id]
  if (!o) return base
  return {
    ...base,
    position: o.position ?? base.position,
    width: o.width ?? base.width,
    // height is independent: Marble's frames are not the artwork's aspect, so
    // fitting one to the other requires setting both and cropping the image
    height: o.height ?? base.height,
    rotation: o.rotationY != null ? [0, o.rotationY, 0] : base.rotation,
  }
}

export function nudge(id, base, delta) {
  const cur = resolve(id, base)
  const p = cur.position
  state.overrides[id] = {
    position: [
      +(p[0] + (delta.x || 0)).toFixed(3),
      +(p[1] + (delta.y || 0)).toFixed(3),
      +(p[2] + (delta.z || 0)).toFixed(3),
    ],
    width: +Math.max(0.2, cur.width + (delta.w || 0)).toFixed(3),
    height: +Math.max(0.2, (cur.height ?? cur.width * 1.25) + (delta.h || 0)).toFixed(3),
    rotationY: +((cur.rotation?.[1] ?? 0) + (delta.ry || 0)).toFixed(4),
  }
  editor.bump()
}

/** Step to a painting by list index, wrapping at both ends. */
export function goTo(placements, i) {
  if (!placements.length) return
  const n = ((i % placements.length) + placements.length) % placements.length
  state.index = n
  state.selected = placements[n].id
  editor.bump()
}

export function reset(id) {
  delete state.overrides[id]
  editor.bump()
}

/** The whole registry as JSON, ready to paste into src/data/paintings.ts. */
export function exportJSON(entries, placements) {
  const rows = entries.map((e, i) => {
    const p = resolve(placements[i].id, placements[i])
    return {
      id: placements[i].id,
      wingId: e.wingId,
      piece: e.piece,
      position: p.position.map((v) => +v.toFixed(3)),
      rotation: p.rotation.map((v) => +v.toFixed(4)),
      width: +p.width.toFixed(3),
      height: +(p.height ?? p.width * 1.25).toFixed(3),
    }
  })
  return JSON.stringify(rows, null, 2)
}
