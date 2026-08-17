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
  overrides: {},           // id -> { position:[x,y,z], width, rotationY }
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
    rotationY: +((cur.rotation?.[1] ?? 0) + (delta.ry || 0)).toFixed(4),
  }
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
    }
  })
  return JSON.stringify(rows, null, 2)
}
