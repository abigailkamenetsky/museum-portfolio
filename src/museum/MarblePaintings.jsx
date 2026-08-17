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
import { useGLTF } from '@react-three/drei'
import { WINGS } from '../data/museum'
import { ART_BASE } from '../data/artworks'
import { layout, DEPTH_OFFSET } from '../data/paintings'
import { museum } from '../museum/store'

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

const PLACED = layout(ENTRIES.map((e) => ({ wingId: e.wingId, piece: e.piece })))

const FRAME_URL = import.meta.env.BASE_URL + 'assets/models/frame_gold.glb'
useGLTF.preload(FRAME_URL)

/**
 * Marble paints its frames into the texture, so there is nothing to align to:
 * detecting them from the panorama merged neighbours into 4m blobs. Giving each
 * painting its OWN carved frame makes it a self-contained object that reads as
 * hung art rather than a decal, and removes the dependency entirely.
 */
function GoldFrame({ w, h }) {
  const { scene } = useGLTF(FRAME_URL)
  const inst = useMemo(() => {
    const c = scene.clone(true)
    const box = new Box3().setFromObject(c)
    const size = new Vector3(); box.getSize(size)
    // the asset is landscape; fit its opening to this canvas
    c.scale.set((w * 1.19) / (size.x || 1), (h * 1.19) / (size.y || 1), 0.06 / (size.z || 1))
    c.traverse((o) => {
      if (!o.isMesh) return
      const m = o.material.clone()
      m.map = null                       // baked albedo is dark bronze; tint reads brown
      if (m.metalnessMap) m.metalnessMap = null
      m.color = new Color('#c9a24a')     // aged gold
      m.metalness = 1.0
      m.roughness = 0.45
      m.envMapIntensity = 0.9
      o.material = m
    })
    return c
  }, [scene, w, h])
  return <primitive object={inst} />
}

function Painting({ entry, place }) {
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
  const h = w * (entry.aspect || 1.25)

  const open = (e) => {
    e.stopPropagation()
    const mu = museum.get()
    if (mu.menu || mu.card) return
    museum.set({ card: entry.wingId, cardPiece: entry.piece })
  }

  return (
    <group position={place.position} rotation={place.rotation}>
      {/* thin dark ground behind the canvas, hidden by the frame rebate */}
      <mesh position={[0, 0, -0.012]} material={backMat}>
        <planeGeometry args={[w + 0.04, h + 0.04]} />
      </mesh>
      <Suspense fallback={null}><GoldFrame w={w} h={h} /></Suspense>
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
        <planeGeometry args={[w + 0.3, h + 0.3]} />
        <meshBasicMaterial transparent opacity={hover ? 0.08 : 0} color={new Color('#ffe9b0')} depthWrite={false} />
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
