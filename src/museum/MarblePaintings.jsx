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

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  MeshBasicMaterial, MeshStandardMaterial, TextureLoader,
  SRGBColorSpace, DoubleSide, Color, Box3, Vector3, CanvasTexture,
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
      wingId: w.id, piece: i, title: p.title, artwork: p.artwork || null,
      art: p.art || null, aspect: p.artAspect || 1.25,
    }))
  }
  return [{
    wingId: w.id, piece: null, title: w.title, artwork: w.artwork || null,
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


/**
 * A gallery label, drawn to a canvas rather than laid out as 3D text.
 *
 * 40 paintings means 40 labels, and troika-style SDF text or 40 DOM overlays both
 * cost far more than a small texture that is generated once and never changes.
 *
 * Content follows a real museum card but inverted for the audience: the project
 * leads, because a recruiter reading this has ninety seconds and needs to know it
 * is HelpMynd before they need to know it is a Rembrandt.
 */
function makePlacard(title, artwork) {
  const W = 512, H = 224
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')

  g.fillStyle = '#151310'
  g.fillRect(0, 0, W, H)
  g.strokeStyle = '#6b5a33'
  g.lineWidth = 4
  g.strokeRect(6, 6, W - 12, H - 12)

  const serif = 'Georgia, "Times New Roman", serif'
  g.textAlign = 'center'

  g.fillStyle = '#f0e6cf'
  const t = (title || '').toUpperCase()
  // Shrink AND wrap. Shrinking alone still clipped: "LEADING IN THE
  // ENTREPRENEURIAL WORLD" is far too long for one line at any readable size.
  const MAXW = W - 70
  let size = 46
  let lines = [t]
  for (; size >= 22; size -= 2) {
    g.font = `600 ${size}px ${serif}`
    if (g.measureText(t).width <= MAXW) { lines = [t]; break }
    // try two lines, splitting at the word boundary nearest the middle
    const words = t.split(' ')
    let best = null
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(' ')
      const b = words.slice(k).join(' ')
      const wa = g.measureText(a).width, wb = g.measureText(b).width
      if (wa <= MAXW && wb <= MAXW) {
        const score = Math.abs(wa - wb)
        if (!best || score < best.score) best = { a, b, score }
      }
    }
    if (best) { lines = [best.a, best.b]; break }
  }
  g.font = `600 ${size}px ${serif}`
  const titleTop = artwork ? (lines.length > 1 ? 62 : 88) : (lines.length > 1 ? 96 : 122)
  lines.forEach((ln, i) => g.fillText(ln, W / 2, titleTop + i * (size + 6)))

  if (artwork) {
    g.strokeStyle = '#4a3f26'
    g.lineWidth = 2
    const ruleY = lines.length > 1 ? 128 : 112
    g.beginPath(); g.moveTo(W * 0.3, ruleY); g.lineTo(W * 0.7, ruleY); g.stroke()

    g.fillStyle = '#b9a97f'
    let s2 = 27
    g.font = `italic ${s2}px ${serif}`
    const parts = String(artwork).split(' - ')
    const artist = parts[0] || ''
    const work = parts.slice(1).join(' - ')
    while (g.measureText(work || artist).width > W - 60 && s2 > 15) {
      s2 -= 1
      g.font = `italic ${s2}px ${serif}`
    }
    const attrY = ruleY + 40
    g.fillText(artist, W / 2, attrY)
    if (work) g.fillText(work, W / 2, attrY + s2 + 8)
  }

  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

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

  const placardTex = useMemo(
    () => makePlacard(entry.title, entry.artwork),
    [entry.title, entry.artwork],
  )
  useEffect(() => () => placardTex.dispose(), [placardTex])
  const placardMat = useMemo(() => new MeshBasicMaterial({
    map: placardTex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false,
  }), [placardTex])

  // Encounter layer: the label and the glow both come up as you approach, so the
  // promenade stays uncluttered and the room does not read as 40 competing signs.
  const grp = useRef()
  const glowRef = useRef()
  const here = useMemo(() => new Vector3(), [])
  useFrame((state, dt) => {
    if (!grp.current) return
    grp.current.getWorldPosition(here)
    const d = state.camera.position.distanceTo(here)
    const want = d < NEAR_FULL ? 1 : d > NEAR_NONE ? 0 : (NEAR_NONE - d) / (NEAR_NONE - NEAR_FULL)
    const k = 1 - Math.exp(-6 * dt)
    placardMat.opacity += (want - placardMat.opacity) * k
    placardMat.visible = placardMat.opacity > 0.01
    if (glowRef.current) {
      const gm = glowRef.current.material
      gm.opacity += ((hover ? 0.30 : want * 0.16) - gm.opacity) * k
      gm.visible = gm.opacity > 0.01
    }
  })

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
    <group ref={grp} position={place.position} rotation={place.rotation}>
      {/* warm pool behind the frame, so a painting lifts off the wall as you near it */}
      <mesh ref={glowRef} position={[0, 0, -0.02]}>
        <planeGeometry args={[w * 1.5, h * 1.5]} />
        <meshBasicMaterial color="#ffcf8a" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
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
      {/* gallery label, below the frame, fading in on approach */}
      <mesh position={[0, -h / 2 - 0.20, 0.04]} material={placardMat}>
        <planeGeometry args={[0.42, 0.184]} />
      </mesh>
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

// metres: label and glow at full strength inside NEAR_FULL, gone past NEAR_NONE
const NEAR_FULL = 3.2
const NEAR_NONE = 6.5

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
