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
import {
  MeshBasicMaterial, MeshStandardMaterial, TextureLoader,
  SRGBColorSpace, DoubleSide, Color, Box3, Vector3,
} from 'three'
import { WINGS } from '../data/museum'
import { ART_BASE } from '../data/artworks'
import { layout, DEPTH_OFFSET } from '../data/paintings'
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

function Painting({ entry, place: base }) {
  const ed = useEditor()
  const place = MUSEUM_EDITOR_ENABLED ? resolve(base.id, base) : base
  const selected = MUSEUM_EDITOR_ENABLED && ed.selected === base.id
  const [tex, setTex] = useState(null)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (!entry.art) return
    let alive = true
    new TextureLoader().load(
      ART_BASE + entry.art,
      (t) => { if (!alive) return; t.colorSpace = SRGBColorSpace; t.anisotropy = 8; setTex(t) },
      undefined,
      () => console.warn('[painting] failed', entry.art),
    )
    return () => { alive = false }
  }, [entry.art])

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

  const w = place.width
  const h = place.height ?? w * (entry.aspect || 1.25)

  // Marble's frames are not the artwork's proportions. Rather than stretch the
  // image or leave gaps, crop it to fill: scale the texture on its short axis
  // and re-centre, which is 'cover' from the original spec.
  useEffect(() => {
    if (!tex) return
    const imgAspect = (tex.image?.height || 1) / (tex.image?.width || 1)
    const quadAspect = h / w
    if (imgAspect > quadAspect) {
      const r = quadAspect / imgAspect
      tex.repeat.set(1, r); tex.offset.set(0, (1 - r) / 2)
    } else {
      const r = imgAspect / quadAspect
      tex.repeat.set(r, 1); tex.offset.set((1 - r) / 2, 0)
    }
    tex.needsUpdate = true
  }, [tex, w, h])

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
          <planeGeometry args={[w, h]} />
        </mesh>
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

export default function MarblePaintings() {
  return (
    <>
      {ENTRIES.map((entry, i) => (
        <Suspense key={PLACED[i].id} fallback={null}>
          <Painting entry={entry} place={PLACED[i]} />
        </Suspense>
      ))}
    </>
  )
}

export { ENTRIES, PLACED }
