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
import {
  MeshBasicMaterial, MeshStandardMaterial, TextureLoader,
  SRGBColorSpace, DoubleSide, Color, Box3, Vector3,
  Shape, Path, ExtrudeGeometry,
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
 * Visible width of the gold moulding, in metres.
 *
 * Proportional to the picture so a small panel does not wear a frame meant for a
 * two-metre landscape, clamped at both ends so nothing looks like a pinstripe or
 * swallows the artwork.
 */
function frameBand(w, h) {
  return Math.min(0.11, Math.max(0.05, Math.min(w, h) * 0.085))
}

/** One mitred rectangular ring, extruded. Corners mitre themselves. */
function ring(outerW, outerH, innerW, innerH, depth, bevel) {
  const ow = Math.max(0.04, outerW - 2 * bevel), oh = Math.max(0.04, outerH - 2 * bevel)
  const iw = Math.max(0.02, innerW + 2 * bevel), ih = Math.max(0.02, innerH + 2 * bevel)

  const shape = new Shape()
  shape.moveTo(-ow / 2, -oh / 2)
  shape.lineTo(ow / 2, -oh / 2)
  shape.lineTo(ow / 2, oh / 2)
  shape.lineTo(-ow / 2, oh / 2)
  shape.closePath()

  const hole = new Path()
  hole.moveTo(-iw / 2, -ih / 2)
  hole.lineTo(-iw / 2, ih / 2)
  hole.lineTo(iw / 2, ih / 2)
  hole.lineTo(iw / 2, -ih / 2)
  hole.closePath()
  shape.holes.push(hole)

  const geo = new ExtrudeGeometry(shape, {
    depth: Math.max(0.004, depth - bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 1,
  })
  geo.computeVertexNormals()
  return geo
}

/**
 * A frame profile, not a flat slab.
 *
 * The first attempt was a single ring with a small chamfer, and it read as
 * painted card: one broad face at one angle takes one flat value of light, so
 * there is nothing to tell the eye it is carved. Real moulding is a sequence of
 * steps at different heights, and the shadow lines between them are what sells
 * it. So this builds three: a raised outer lip, a recessed cove, and a small
 * raised lip at the opening.
 */
function frameProfile(w, h, band) {
  const lip = band * 0.34         // outer lip
  const cove = band * 0.42        // recessed middle, throws the shadow line
  const oW = w, oH = h
  const aW = w - 2 * lip, aH = h - 2 * lip
  const bW = aW - 2 * cove, bH = aH - 2 * cove
  const cW = w - 2 * band, cH = h - 2 * band
  return [
    ring(oW, oH, aW, aH, 0.062, 0.011),   // outer lip, stands proudest
    ring(aW, aH, bW, bH, 0.030, 0.009),   // cove, set back so the lip casts into it
    ring(bW, bH, cW, cH, 0.052, 0.007),   // inner lip framing the canvas
  ]
}

/**
 * Water-gilt gold.
 *
 * Fully metallic reads as a black mirror in a dim room with little to reflect,
 * the same trap the Blender bake fell into, so this keeps real diffuse and leans
 * on the gallery HDRI for the sheen. The faint emissive keeps the shadowed
 * inner faces from crushing to black under the hall's low ambient.
 */
const GOLD = new MeshStandardMaterial({
  color: '#9a6f21',
  metalness: 0.8,
  roughness: 0.26,
  emissive: new Color('#241804'),
  emissiveIntensity: 1,
})

function Painting({ entry, place: base }) {
  const ed = useEditor()
  const gl = useThree((s) => s.gl)
  const place = MUSEUM_EDITOR_ENABLED ? resolve(base.id, base) : base
  const selected = MUSEUM_EDITOR_ENABLED && ed.selected === base.id
  const [tex, setTex] = useState(null)
  const [hover, setHover] = useState(false)

  const w = place.width
  const h = place.height ?? w * (entry.aspect || 1.25)
  // The slot is the OUTER edge of Marble's painted frame, so our moulding takes
  // that band and the canvas drops into the opening it leaves.
  const band = frameBand(w, h)
  const cw = Math.max(0.2, w - 2 * band)
  const ch = Math.max(0.2, h - 2 * band)

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

  const frameGeos = useMemo(() => frameProfile(w, h, band), [w, h, band])
  useEffect(() => () => frameGeos.forEach((g) => g.dispose()), [frameGeos])

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
      <mesh position={[0, 0, -0.012]} material={backMat}>
        <planeGeometry args={[w + 0.02, h + 0.02]} />
      </mesh>
      {tex && (
        <mesh material={canvasMat}>
          <planeGeometry args={[cw, ch]} />
        </mesh>
      )}
      {/* gold moulding, sitting in the band Marble's painted frame occupies */}
      {frameGeos.map((g, i) => (
        <mesh key={i} geometry={g} material={GOLD} castShadow />
      ))}
      {/* narrow dark rebate so the canvas edge reads as sitting inside the frame */}
      <mesh position={[0, 0, -0.004]} material={backMat}>
        <planeGeometry args={[cw + 0.018, ch + 0.018]} />
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

export default function MarblePaintings() {
  if (HIDE_PAINTINGS) return <FrameMarkers />
  return (
    <>
      <FrameMarkers />
      {ENTRIES.map((entry, i) => (
        PLACED[i].visible === false ? null : (
          <Suspense key={PLACED[i].id} fallback={null}>
            <Painting entry={entry} place={PLACED[i]} />
          </Suspense>
        )
      ))}
    </>
  )
}

export { ENTRIES, PLACED }
