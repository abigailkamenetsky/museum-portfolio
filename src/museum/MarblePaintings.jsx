/**
 * Abby's paintings, rendered as our own geometry over the Marble room.
 *
 * These are content, not architecture: each is an independent, replaceable
 * object that opens the exhibit already written in src/data/museum.js. They
 * also render sharp, because they are real textures on real quads rather than
 * photogrammetry, which is the same reason her statues read crisply.
 *
 * Interaction deliberately lives on an invisible quad slightly larger than the
 * canvas, so clicks are forgiving and the splat can never steal them.
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  MeshBasicMaterial, MeshStandardMaterial, TextureLoader,
  SRGBColorSpace, DoubleSide, Color, Box3, Vector3,
} from 'three'
import { WINGS } from '../data/museum'
import { ART_BASE } from '../data/artworks'
import { layout, DEPTH_OFFSET, SLOT_COUNT } from '../data/paintings'
import { museum } from '../museum/store'
import { editor, useEditor, resolve } from './paintingEditorStore'
import { MUSEUM_EDITOR_ENABLED } from '../data/museumConfig'

/** Flatten the wings into one ordered list of hangable pieces. */
const ENTRIES = WINGS.flatMap((w) => {
  const pcs = w.exhibit?.pieces
  if (pcs && pcs.length) {
    return pcs.map((p, i) => ({
      wingId: w.id, piece: i, title: p.title,
      art: p.art || null, aspect: p.artAspect || 1.25,
    }))
  }
  return [{
    wingId: w.id, piece: null, title: w.title,
    art: w.art || null, aspect: w.artAspect || 1.25,
  }]
})

const PLACED = layout(ENTRIES.map((e) => ({ wingId: e.wingId, piece: e.piece, aspect: e.aspect })))

if (ENTRIES.length > SLOT_COUNT) {
  console.warn(
    `[paintings] ${ENTRIES.length} artworks but only ${SLOT_COUNT} measured frames; ` +
    `${ENTRIES.length - SLOT_COUNT} are unhung: ` +
    ENTRIES.slice(SLOT_COUNT).map((e) => e.title).join(', '),
  )
}

/**
 * The same carved Baroque frame the legacy hall hangs, reused here.
 *
 * An extruded moulding profile was the first attempt and it read as plain: real
 * relief needs actual carving, and this GLB already has it, with baked normal
 * and roughness maps that give gold-leaf wear no procedural profile matches.
 * One geometry and one material are shared by every painting, so 29 frames cost
 * one buffer.
 *
 * The loader is a copy of the legacy hall's rather than an import, because
 * Scene.jsx imports this file and pulling it the other way would form a cycle.
 */
const FRAME_URL = import.meta.env.BASE_URL + 'assets/models/frame_gold.glb'

/** Aperture of the carved asset as a fraction of its outer size, measured from it. */
const AP_W = 0.66
const AP_H = 0.70

function useGoldFrame() {
  const { scene } = useGLTF(FRAME_URL)
  return useMemo(() => {
    let g, mt
    scene.traverse((o) => { if (o.isMesh && !g) { g = o.geometry; mt = o.material } })
    if (!g) return null
    const geo = g.clone()
    geo.rotateZ(Math.PI / 2)          // the asset ships landscape
    geo.center()
    geo.computeBoundingBox()
    const bb = geo.boundingBox
    const nw = bb.max.x - bb.min.x
    const nh = bb.max.y - bb.min.y
    const nd = Math.max(0.02, bb.max.z - bb.min.z)

    // The baked baseColor is a dark bronze, so any tint over it reads brown.
    // Drop the albedo and use a literal gold, keeping the normal and roughness
    // maps so the carved relief and leaf wear survive.
    const mat = mt.clone()
    mat.map = null
    if (mat.metalnessMap) mat.metalnessMap = null
    // The legacy hall renders through tone mapping, which rolls off its bright
    // '#ffcf40'. The Marble room uses NoToneMapping, where that same value clips
    // to flat cartoon yellow, so the gold here is darker and rougher on purpose.
    mat.color.set('#b0801f')
    mat.metalness = 0.95
    mat.roughness = 0.5
    mat.envMapIntensity = 0.7
    if (mat.emissive) { mat.emissive.set('#000000'); mat.emissiveIntensity = 0 }
    mat.needsUpdate = true
    return { geo, mat, nw, nh, nd }
  }, [scene])
}
useGLTF.preload(FRAME_URL)

function Painting({ entry, place: base, frame }) {
  const ed = useEditor()
  const gl = useThree((s) => s.gl)
  const place = MUSEUM_EDITOR_ENABLED ? resolve(base.id, base) : base
  const selected = MUSEUM_EDITOR_ENABLED && ed.selected === base.id
  const [tex, setTex] = useState(null)
  const [hover, setHover] = useState(false)

  // The slot is the OUTER edge of Marble's painted frame, so the carved frame
  // takes the whole slot and the canvas fills the aperture it leaves.
  const w = place.width
  const h = place.height ?? w * (entry.aspect || 1.25)
  const cw = Math.max(0.12, w * AP_W)
  const ch = Math.max(0.12, h * AP_H)

  useEffect(() => {
    if (!entry.art) return
    let alive = true
    new TextureLoader().load(
      ART_BASE + entry.art,
      (t) => {
        if (!alive) return
        t.colorSpace = SRGBColorSpace
        t.anisotropy = 8

        // Marble's frames are not the artwork's proportions. Rather than stretch
        // the image or leave gaps, crop it to fill: scale the texture on its
        // short axis and re-centre, which is 'cover' from the original spec.
        // Done before upload so nothing needs needsUpdate afterwards.
        const imgAspect = (t.image?.height || 1) / (t.image?.width || 1)
        const quadAspect = ch / cw
        if (imgAspect > quadAspect) {
          const r = quadAspect / imgAspect
          t.repeat.set(1, r); t.offset.set(0, (1 - r) / 2)
        } else {
          const r = imgAspect / quadAspect
          t.repeat.set(r, 1); t.offset.set((1 - r) / 2, 0)
        }

        // Upload NOW, with three's cached GL state re-synced first.
        //
        // Spark calls gl.pixelStorei(UNPACK_FLIP_Y_WEBGL, ...) straight on the
        // raw context, while three's WebGLState.pixelStorei caches the value and
        // skips the real call when it believes nothing changed. Once Spark has
        // desynced that cache, every texture three uploads afterwards lands with
        // the wrong flip, which is why paintings hung upside down, and why it was
        // a different set of paintings on each load: it depended purely on which
        // images finished decoding after Spark first touched the state.
        //
        // resetState makes the next pixelStorei actually execute; initTexture
        // then uploads at this controlled moment rather than at some random
        // later frame.
        gl.resetState()
        gl.initTexture(t)

        setTex(t)
      },
      undefined,
      () => console.warn('[painting] failed', entry.art),
    )
    return () => { alive = false }
  }, [entry.art, gl, cw, ch])

  const canvasMat = useMemo(() => new MeshBasicMaterial({
    color: '#ffffff', toneMapped: false, side: DoubleSide,
  }), [])
  // dark backing, slightly larger, so Marble's painted-on frame interiors
  // never show around the edge of our canvas
  const backMat = useMemo(() => new MeshStandardMaterial({
    color: '#0d0c0a', roughness: 0.9, side: DoubleSide,
  }), [])

  useEffect(() => {
    if (tex) { canvasMat.map = tex; canvasMat.needsUpdate = true }
  }, [tex, canvasMat])

  const open = (e) => {
    e.stopPropagation()
    // in the editor a click selects rather than opening the exhibit
    if (MUSEUM_EDITOR_ENABLED) { editor.set({ selected: base.id }); return }
    const mu = museum.get()
    if (mu.menu || mu.card) return
    museum.set({ card: entry.wingId, cardPiece: entry.piece })
  }

  return (
    <group position={place.position} rotation={place.rotation}>
      {/* thin dark ground behind the canvas, hidden by the frame rebate */}
      <mesh position={[0, 0, 0.02]} material={backMat}>
        <planeGeometry args={[cw * 1.08, ch * 1.08]} />
      </mesh>
      {tex && (
        <mesh position={[0, 0, 0.028]} material={canvasMat}>
          <planeGeometry args={[cw * 1.02, ch * 1.02]} />
        </mesh>
      )}
      {/* carved gold frame, shared geometry scaled to this slot */}
      {frame && (
        <mesh
          geometry={frame.geo}
          material={frame.mat}
          position={[0, 0, 0.055]}
          scale={[w / frame.nw, h / frame.nh, 0.11 / frame.nd]}
          castShadow
        />
      )}
      {/* invisible, padded click target */}
      <mesh
        position={[0, 0, 0.03]}
        onClick={open}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
      >
        <planeGeometry args={[w + 0.2, h + 0.2]} />
        <meshBasicMaterial
          transparent
          opacity={selected ? 0.3 : hover ? 0.08 : 0}
          color={new Color(selected ? '#8fdc9a' : '#ffe9b0')}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// Debug: magenta quads at the detected frame slots. Each slot's x comes from a
// raycast against the real wall, so the marker should sit flat on the gilt with
// no floating and no sinking. ?slots=1 shows them without the rest of the editor.
import SLOTS from '../data/frameSlots.json'

const SHOW_SLOTS = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('slots')

function FrameMarkers() {
  // opt-in only: these sit exactly where the paintings do, so leaving them on
  // in dev just tints every canvas magenta
  if (!SHOW_SLOTS) return null
  return (
    <>
      {SLOTS.map((s, i) => (
        <mesh
          key={i}
          position={[s.x - s.side * DEPTH_OFFSET, s.y, s.z]}
          rotation={[0, s.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[s.w, s.h]} />
          <meshBasicMaterial color="#ff00c8" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  )
}

// ?nopaint clears our canvases so a wall-scan screenshot sees only Marble's
// painted frames. Without it our own quads occlude the very thing being detected.
const HIDE_PAINTINGS = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('nopaint')

function Hang() {
  // one carved frame loaded once, shared by every painting
  const frame = useGoldFrame()
  return (
    <>
      {ENTRIES.map((entry, i) => (
        PLACED[i].visible === false ? null : (
          <Painting key={PLACED[i].id} entry={entry} place={PLACED[i]} frame={frame} />
        )
      ))}
    </>
  )
}

export default function MarblePaintings() {
  if (HIDE_PAINTINGS) return <FrameMarkers />
  return (
    <>
      <FrameMarkers />
      <Suspense fallback={null}><Hang /></Suspense>
    </>
  )
}

export { ENTRIES, PLACED }
