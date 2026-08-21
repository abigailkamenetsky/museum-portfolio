import { useSyncExternalStore } from 'react'

// Shared state between the 3D scene (Scene.jsx) and the DOM guide UI (Guide.jsx).
// Mutated in place; a version counter drives React re-renders via useSyncExternalStore.
const state = {
  phase: 'enter',      // 'enter' → 'welcome' → 'explore'
  menu: null,          // null | 'home' | <categoryId>  (which guide screen is open)
  visitCat: null,      // category id awaiting "Guide Me / Teleport" choice
  card: null,          // category id whose exhibit card is open
  focus: null,         // painting the player is looking at: { wingId, piece, title }
  cardPiece: null,     // piece index to open when a card is launched via E
  guide: null,         // active "Guide Me" target: { id, pos:[x,z], title }
  teleport: null,      // command consumed by the scene: { x, z, yaw, title }
  titleCard: null,     // wing title shown briefly after a teleport
  fade: 0,             // black overlay opacity 0..1 (teleport transitions)
  trackAt: null,       // index into TRACKS whose Spotify embed is open (music.js)
  toneOn: false,       // the CC0 Chopin bed is looping
  musicOpen: false,    // the dock's track list is dropped down
}

// High-frequency mobile movement input from the on-screen joystick.
// Mutated in place and read every frame in Scene; kept OFF the version counter
// on purpose so dragging the stick never triggers React re-renders.
export const touchInput = { x: 0, z: 0 }   // x: strafe (-1 left … +1 right), z: forward (+1 push up … -1 pull down)

let version = 0
const listeners = new Set()

export const museum = {
  get: () => state,
  set(patch) { Object.assign(state, patch); version++; listeners.forEach(l => l()) },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l) },
  snap: () => version,
}

export function useMuseum() {
  useSyncExternalStore(museum.subscribe, museum.snap, museum.snap)
  return state
}

// open/close helpers
export const openGuide = () => museum.set({ menu: 'home', visitCat: null, card: null })
export const closeGuide = () => museum.set({ menu: null, visitCat: null, musicOpen: false })
