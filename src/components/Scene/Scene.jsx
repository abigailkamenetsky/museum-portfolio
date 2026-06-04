/**
 * Museum 3D Scene — cinematic pass.
 * Real PBR floor/wall + real artwork (non-blocking loads), HDRI image-based
 * lighting (manual RGBELoader, non-blocking), shadows, warm picture spots,
 * N8AO, contact shadows, controlled ACES tone mapping, aged-gold frames.
 * Safe loading throughout: solid-color fallbacks; nothing blocks the render.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useGLTF, useTexture } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, Vignette, HueSaturation, BrightnessContrast } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Suspense, useRef, useEffect, useMemo } from 'react'
import {
  MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, ExtrudeGeometry, ShapeGeometry, Shape, Path, Vector2,
  PlaneGeometry, BufferAttribute, TextureLoader, RepeatWrapping, SRGBColorSpace,
  EquirectangularReflectionMapping, Object3D, TorusGeometry, CylinderGeometry,
  SphereGeometry, ConeGeometry, BoxGeometry, Matrix4, DoubleSide, Box3,
  Vector3, Euler, MathUtils, ACESFilmicToneMapping, PCFSoftShadowMap, ClampToEdgeWrapping, CanvasTexture,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { makeLandscapeTexture } from './textures'
import { ARTWORKS, ART_BASE } from '../../data/artworks'

/* ── DIMENSIONS — long rectangular palace gallery (~2:1) ────── */
const W = 18, H = 13.5, D = 78
const CEIL = H
const WALL_T = 0.62                             // thick masonry wall → deep (~24in) window reveal
const WIN_Z = [27, 13.5, 0, -13.5, -27]         // window centres down each long wall

// tall arched window openings (the procedural Gothic window fills these fully)
const WIN_OPEN_W = 3.2, WIN_OPEN_H = 8.4, WIN_CY = 5.4
const FEAT_W = 4.4, FEAT_H = 10.4, FEAT_CY = 6.4
// BASE is '/' on root-domain hosts (Vercel/Netlify) and '/museum-portfolio/'
// on GitHub Pages — so every asset URL resolves correctly on any host.
const BASE = import.meta.env.BASE_URL
const TEX = BASE + 'assets/textures/'
const WALNUT = TEX + 'walnut/'   // real CC0 scanned dark walnut (Artaley3D)
const WALLP = TEX + 'wallpaper/'   // dark-green baroque damask (from GLB)
const CEILP = TEX + 'ceilingplaster/Plaster001_1K-JPG_'   // ceiling plaster PBR
const HDRI = BASE + 'assets/hdri/gallery.hdr'
const DENIM_TEX = TEX + 'denim/'           // real denim fabric (skirt)
const LEATHER_TEX = TEX + 'leather/'       // brown leather (boots)
const HAIR_ALPHA_URL = TEX + 'hair/alpha.png'   // hair-card strand alpha
const FRAME_URL = BASE + 'assets/models/frame_gold.glb'   // optimized ornate gold vintage frame
useGLTF.preload(FRAME_URL)
const STAINED_URL = BASE + 'assets/models/stained_glass.glb'   // gothic window with painted glass
useGLTF.preload(STAINED_URL)
// stained-glass model native size (from its bbox) → derived in-room size, so the
// arched wall opening and the model use ONE source of truth and line up.
const GLB_SG_W = 2.313, GLB_SG_H = 6.633
const FEAT_S = FEAT_H * 0.99 / GLB_SG_H        // scale that fills the opening height
const WIN_W = GLB_SG_W * FEAT_S                 // in-room window width (~3.59)
const FEAT_HOLE_W = WIN_W * 0.9                 // arched masonry hole hugs just inside the window frame
const FEAT_HOLE_H = FEAT_H * 0.99 * 0.965
const FEAT_SPRING = 0.6                          // where the pointed arch springs (fraction up)

/* ── helpers ──────────────────────────────────────────────── */
function configure(t, rep, srgb) {
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(rep, rep)
  if (srgb) t.colorSpace = SRGBColorSpace
  t.anisotropy = 8; t.needsUpdate = true
  return t
}
function planeUV2(w, h) {
  const g = new PlaneGeometry(w, h)
  g.setAttribute('uv2', new BufferAttribute(g.attributes.uv.array, 2))
  return g
}
function loadInto(loader, url, onok) {
  loader.load(url, t => { onok(t); console.log('[tex] ok', url) }, undefined,
    () => console.warn('[tex] FAILED (kept solid color):', url))
}

/* ── HDRI ENVIRONMENT (non-blocking IBL) ──────────────────── */
function Env() {
  const { scene, gl } = useThree()
  useEffect(() => {
    let active = true
    new RGBELoader().load(HDRI,
      tex => {
        if (!active) return
        tex.mapping = EquirectangularReflectionMapping
        scene.environment = tex
        if ('environmentIntensity' in scene) scene.environmentIntensity = 0.32
        console.log('[hdri] ok', HDRI)
      },
      undefined,
      () => console.warn('[hdri] FAILED (lights only):', HDRI))
    return () => { active = false }
  }, [scene, gl])
  return null
}

/* ── SOLID MATERIALS (work with or without maps) ──────────── */
function useMaterials() {
  return useMemo(() => ({
    // dark-green baroque damask wallpaper (textures loaded in Room).
    // Two materials so the damask motif keeps a consistent physical scale on
    // the short (front/back) and long (side) walls.
    wall: new MeshStandardMaterial({
      color: '#ffffff', roughness: 0.82, metalness: 0,
      emissive: '#0c1408', emissiveIntensity: 0.4,   // faint self-glow → wallpaper never crushes to pure black
      normalScale: new Vector2(1.0, 1.0), envMapIntensity: 0,   // ignore HDRI → no cool/blue cast
    }),
    wallSide: new MeshStandardMaterial({
      color: '#ffffff', roughness: 0.82, metalness: 0,
      emissive: '#0c1408', emissiveIntensity: 0.4,
      normalScale: new Vector2(1.0, 1.0), envMapIntensity: 0, side: DoubleSide,
    }),
    // pale plaster lining the window recess (jambs / head / sill reveal). NOT green
    // (green here read as a wallpaper outline); warm off-white plaster like the trim,
    // a touch darker so the splayed depth still reads in shadow.
    revealPlaster: new MeshStandardMaterial({ color: '#b9af97', roughness: 0.96, metalness: 0, envMapIntensity: 0, side: DoubleSide }),
    // pale museum stone sill (projects into the room, catches light, casts shadow)
    sillStone: new MeshStandardMaterial({ color: '#c9c2af', roughness: 0.82, metalness: 0, envMapIntensity: 0.08 }),
    // hazy distant sky layer seen far beyond the trees
    skyHaze: new MeshBasicMaterial({ color: '#c4cdd2' }),
    // espresso/smoked walnut — far less red, nearly black in shadow, polished oil luster
    floor: new MeshPhysicalMaterial({
      color: '#241710', roughness: 0.66, metalness: 0,
      clearcoat: 0.0, clearcoatRoughness: 0.8,
      normalScale: new Vector2(1.0, 1.0), envMapIntensity: 0.05, aoMapIntensity: 1.4,
      anisotropy: 0.2, anisotropyRotation: Math.PI / 2,   // barely-there luster, no mirror
    }),
    ceiling: new MeshStandardMaterial({ color: '#ddd5c6', roughness: 0.92, metalness: 0 }),
    trim: new MeshStandardMaterial({ color: '#e2dccd', roughness: 0.84, metalness: 0 }),
    // matte plaster for the carved centerpiece — same family as the coffers/trim
    centerpiece: new MeshStandardMaterial({ color: '#e6ddc9', roughness: 0.92, metalness: 0, side: DoubleSide }),
    // aged gold leaf: bronze undertone, metallic, not neon; crevices read dark
    gold: new MeshStandardMaterial({ color: '#8a6f28', roughness: 0.52, metalness: 0.9, envMapIntensity: 0.85 }),
    canvas: new MeshStandardMaterial({ color: '#15100a', roughness: 1 }),
    wood: new MeshStandardMaterial({ color: '#241408', roughness: 0.62 }),
    woodDark: new MeshStandardMaterial({ color: '#160c04', roughness: 0.62 }),
    coat: new MeshStandardMaterial({ color: '#161320', roughness: 0.82 }),
    skin: new MeshStandardMaterial({ color: '#b8946e', roughness: 0.82 }),
    fixture: new MeshStandardMaterial({ color: '#141210', roughness: 0.5, metalness: 0.6 }),
    lens: new MeshStandardMaterial({ color: '#fff3c0', emissive: '#fff3c0', emissiveIntensity: 4, roughness: 0.4 }),
    // tall museum windows
    // real glass: transparent, faintly reflective, NOT emissive / not white
    glass: new MeshStandardMaterial({ color: '#dfe7ec', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 0.05 }),
    sky: new MeshStandardMaterial({ color: '#9fb2c6', roughness: 1, metalness: 0 }),   // muted daylight behind glass
    // estate grounds seen through windows — dimmed so windows read as daylight,
    // not glowing light-cards (color multiplies the map down)
    scenery: new MeshBasicMaterial({ map: makeLandscapeTexture(), color: '#8d938c' }),
    trimWhite: new MeshStandardMaterial({ color: '#f2efe6', roughness: 0.7, metalness: 0 }),
    darkRoom: new MeshStandardMaterial({ color: '#0a0c08', roughness: 1 }),
  }), [])
}

/* ── ROOM ─────────────────────────────────────────────────── */
function Room({ m }) {
  const floorGeo = useMemo(() => planeUV2(W, D), [])
  const wallWide = useMemo(() => planeUV2(W, H), [])
  const wallSide = useMemo(() => planeUV2(D, H), [])
  useEffect(() => {
    const loader = new TextureLoader()
    const FR = 3   // floor tile repeats across the room
    // FLOOR: real scanned dark walnut PBR set (non-blocking)
    loadInto(loader, WALNUT + 'BaseColor.jpg', t => { configure(t, FR, true); m.floor.map = t; m.floor.color.set('#ffffff'); m.floor.needsUpdate = true })
    loadInto(loader, WALNUT + 'NormalGL.jpg', t => { configure(t, FR, false); m.floor.normalMap = t; m.floor.normalScale.set(1.0, 1.0); m.floor.needsUpdate = true })
    loadInto(loader, WALNUT + 'Roughness.jpg', t => { configure(t, FR, false); m.floor.roughnessMap = t; m.floor.roughness = 1; m.floor.needsUpdate = true })
    loadInto(loader, WALNUT + 'AO.jpg', t => { configure(t, FR, false); m.floor.aoMap = t; m.floor.needsUpdate = true })

    // WALLS: real plaster scan, tinted deep green
    // WALLS: dark-green baroque damask wallpaper. ~1.9 m motif → repeat tuned
    // per wall so front/back (W=34) and sides (D=64) match in scale.
    // front wall = single plane (0..1 UV). side/back walls = holed ExtrudeGeometry
    // whose cap UVs are in METRES, so the side texture tiles per metre (continuous).
    const wpFront = { x: Math.round(W / 1.9), y: Math.round(H / 1.9) }
    const perM = 1 / 1.9
    const loadWall = (file, srgb, assign) => loadInto(loader, WALLP + file, t => {
      const front = t, side = t.clone()
      configure(front, 1, 1, srgb); front.repeat.set(wpFront.x, wpFront.y)
      configure(side, 1, 1, srgb); side.repeat.set(perM, perM)
      assign(front, side)
    })
    loadWall('BaseColor.jpg', true, (f, s) => {
      m.wall.map = f; m.wallSide.map = s
      // warm-green tint so the wallpaper always reads green (never blue-grey when lit)
      m.wall.color.set('#7e9248'); m.wallSide.color.set('#7e9248')
      m.wall.needsUpdate = m.wallSide.needsUpdate = true
    })
    loadWall('Normal.png', false, (f, s) => { m.wall.normalMap = f; m.wallSide.normalMap = s; m.wall.needsUpdate = m.wallSide.needsUpdate = true })
    loadWall('MetalRough.jpg', false, (f, s) => {
      m.wall.roughnessMap = f; m.wallSide.roughnessMap = s
      m.wall.roughness = 1; m.wallSide.roughness = 1
      m.wall.needsUpdate = m.wallSide.needsUpdate = true
    })

    // CEILING: real plaster PBR on the broad surfaces (m.ceiling, big repeat)
    // and the ornament (m.trim, tighter repeat via cloned maps).
    const applyPlaster = (tx, repBig) => {
      const big = tx, small = tx.clone()
      configure(big, repBig, false); configure(small, repBig * 3, false)
      return { big, small }
    }
    loadInto(loader, CEILP + 'Color.jpg', t => {
      const { big, small } = applyPlaster(t, 5); big.colorSpace = SRGBColorSpace; small.colorSpace = SRGBColorSpace
      const cp = t.clone(); configure(cp, 3, 3, true)
      m.ceiling.map = big; m.ceiling.color.set('#efe7d6'); m.ceiling.needsUpdate = true
      m.trim.map = small; m.trim.color.set('#ece3d0'); m.trim.needsUpdate = true
      m.centerpiece.map = cp; m.centerpiece.color.set('#ece3d0'); m.centerpiece.needsUpdate = true
    })
    loadInto(loader, CEILP + 'NormalGL.jpg', t => {
      const { big, small } = applyPlaster(t, 5)
      m.ceiling.normalMap = big; m.ceiling.normalScale = new Vector2(1.2, 1.2); m.ceiling.needsUpdate = true
      m.trim.normalMap = small; m.trim.normalScale = new Vector2(1.0, 1.0); m.trim.needsUpdate = true
    })
    loadInto(loader, CEILP + 'Roughness.jpg', t => {
      const { big, small } = applyPlaster(t, 5)
      const cp = t.clone(); configure(cp, 3, 3, false)
      m.ceiling.roughnessMap = big; m.ceiling.roughness = 1; m.ceiling.needsUpdate = true
      m.trim.roughnessMap = small; m.trim.roughness = 1; m.trim.needsUpdate = true
      m.centerpiece.roughnessMap = cp; m.centerpiece.roughness = 1; m.centerpiece.needsUpdate = true
    })
  }, [m])
  return (
    <group>
      <mesh geometry={floorGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.floor} />
      {/* far + side walls = single continuous holed surfaces (no seam bands) */}
      <BackWall m={m} />
      <SideWall side={-1} m={m} />
      <SideWall side={1} m={m} />
      {/* entrance (front) wall = plain continuous plane */}
      <mesh geometry={wallWide} position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} material={m.wall} />
    </group>
  )
}

/* ════════════════════════════════════════════════════════════
 * BAROQUE COFFERED CEILING — clean procedural geometry, instanced.
 * SMM design language: deep recessed coffers with NESTED stepped
 * frames, a varied carved rosette in each, ornamented beams, corner
 * cartouches, layered perimeter molding, and a monumental medallion.
 * Density comes from merged + instanced ornament (few draw calls).
 * ════════════════════════════════════════════════════════════ */
const C_MARGIN = 2.0, C_COLS = 5, C_ROWS = 25, C_RIB = 0.50, C_DROP = 0.85

const _dummy = new Object3D()
const mat4 = (x, y, z, ry = 0, s = 1) => {
  _dummy.position.set(x, y, z); _dummy.rotation.set(0, ry, 0); _dummy.scale.setScalar(s)
  _dummy.updateMatrix(); return _dummy.matrix.clone()
}

/* rectangular molding ring (beveled) */
function rectRing(ow, od, iw, id, depth) {
  const s = new Shape()
  s.moveTo(-ow / 2, -od / 2); s.lineTo(ow / 2, -od / 2); s.lineTo(ow / 2, od / 2); s.lineTo(-ow / 2, od / 2); s.lineTo(-ow / 2, -od / 2)
  const h = new Path()
  h.moveTo(-iw / 2, -id / 2); h.lineTo(iw / 2, -id / 2); h.lineTo(iw / 2, id / 2); h.lineTo(-iw / 2, id / 2); h.lineTo(-iw / 2, -id / 2)
  s.holes.push(h)
  return new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 1 })
}

/* nested stepped frames for one coffer (multi-layer depth) */
function cofferInsertGeo(oX, oZ) {
  const parts = []
  const steps = [
    [oX, oZ, oX - 0.20, oZ - 0.20, 0.11, 0.00],
    [oX - 0.36, oZ - 0.36, oX - 0.66, oZ - 0.66, 0.11, 0.18],
    [oX - 0.82, oZ - 0.82, oX - 1.10, oZ - 1.10, 0.11, 0.36],
  ]
  for (const [ow, od, iw, id, dep, z] of steps) { const g = rectRing(ow, od, iw, id, dep); g.translate(0, 0, z); parts.push(g) }
  const merged = mergeGeometries(parts, false); merged.rotateX(-Math.PI / 2); return merged
}

/* three varied rosettes (project downward toward the viewer) */
function rosetteFloral() {
  const p = [new CylinderGeometry(0.13, 0.16, 0.09, 16)]
  const ring = new TorusGeometry(0.30, 0.04, 8, 24); ring.rotateX(Math.PI / 2); p.push(ring)
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const pet = new SphereGeometry(0.075, 8, 8); pet.scale(1, 0.6, 1.7); pet.translate(Math.cos(a) * 0.21, -0.03, Math.sin(a) * 0.21); p.push(pet) }
  return mergeGeometries(p, false)
}
function rosetteAcanthus() {
  const p = [new CylinderGeometry(0.11, 0.14, 0.09, 14)]
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const pet = new ConeGeometry(0.07, 0.32, 8); pet.rotateX(-Math.PI / 2); pet.rotateY(-a); pet.translate(Math.cos(a) * 0.23, -0.04, Math.sin(a) * 0.23); p.push(pet) }
  return mergeGeometries(p, false)
}
function rosetteMedallion() {
  const p = [new CylinderGeometry(0.32, 0.34, 0.05, 28)]
  const d2 = new CylinderGeometry(0.22, 0.24, 0.06, 24); d2.translate(0, -0.05, 0); p.push(d2)
  const d3 = new CylinderGeometry(0.11, 0.13, 0.08, 18); d3.translate(0, -0.11, 0); p.push(d3)
  const tr = new TorusGeometry(0.28, 0.03, 8, 28); tr.rotateX(Math.PI / 2); tr.translate(0, -0.02, 0); p.push(tr)
  return mergeGeometries(p, false)
}
/* boss for beam intersections */
function beamBossGeo() {
  const p = [new CylinderGeometry(0.11, 0.13, 0.10, 14)]
  const t = new TorusGeometry(0.18, 0.03, 8, 18); t.rotateX(Math.PI / 2); p.push(t)
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const pet = new ConeGeometry(0.05, 0.16, 6); pet.rotateX(-Math.PI / 2); pet.rotateY(-a); pet.translate(Math.cos(a) * 0.16, -0.02, Math.sin(a) * 0.16); p.push(pet) }
  return mergeGeometries(p, false)
}

/* small reusable instanced-mesh wrapper driven by a matrices array */
/* tiny corner floret scattered into coffer corners */
function miniRosetteGeo() {
  const p = [new CylinderGeometry(0.05, 0.065, 0.045, 10)]
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4
    const pet = new SphereGeometry(0.038, 6, 6); pet.scale(1, 0.6, 1.5)
    pet.translate(Math.cos(a) * 0.085, -0.01, Math.sin(a) * 0.085); p.push(pet)
  }
  return mergeGeometries(p, false)
}

function miniRosetteGeo2() {
  const p = [new CylinderGeometry(0.04, 0.055, 0.05, 8)]
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2
    const pet = new ConeGeometry(0.045, 0.14, 6); pet.rotateX(-Math.PI / 2); pet.rotateY(-a)
    pet.translate(Math.cos(a) * 0.075, -0.01, Math.sin(a) * 0.075); p.push(pet)
  }
  return mergeGeometries(p, false)
}

function Instanced({ geo, mat, matrices }) {
  const ref = useRef()
  useEffect(() => {
    if (!ref.current) return
    matrices.forEach((mx, i) => ref.current.setMatrixAt(i, mx))
    ref.current.count = matrices.length
    ref.current.instanceMatrix.needsUpdate = true
  }, [matrices])
  return <instancedMesh ref={ref} args={[geo, mat, Math.max(1, matrices.length)]} frustumCulled={false} />
}

function CofferedCeiling({ m }) {
  const fW = W - 2 * C_MARGIN, fD = D - 2 * C_MARGIN
  const pX = fW / C_COLS, pZ = fD / C_ROWS
  const openX = pX - C_RIB, openZ = pZ - C_RIB
  const cCx = (C_COLS - 1) / 2, cCz = (C_ROWS - 1) / 2
  const isCenter = (c, r) => Math.abs(c - cCx) <= 1.5 && Math.abs(r - cCz) <= 1.5

  const cells = useMemo(() => {
    const arr = []
    for (let c = 0; c < C_COLS; c++) for (let r = 0; r < C_ROWS; r++) {
      if (isCenter(c, r)) continue
      arr.push([-fW / 2 + (c + 0.5) * pX, -fD / 2 + (r + 0.5) * pZ])
    }
    return arr
  }, [fW, fD, pX, pZ])

  // holed slab (rib lattice + recess walls)
  const slabGeo = useMemo(() => {
    const s = new Shape()
    s.moveTo(-fW / 2, -fD / 2); s.lineTo(fW / 2, -fD / 2); s.lineTo(fW / 2, fD / 2); s.lineTo(-fW / 2, fD / 2); s.lineTo(-fW / 2, -fD / 2)
    for (const [sx, sy] of cells) {
      const ox = openX / 2, oz = openZ / 2
      const h = new Path()
      h.moveTo(sx - ox, sy - oz); h.lineTo(sx + ox, sy - oz); h.lineTo(sx + ox, sy + oz); h.lineTo(sx - ox, sy + oz); h.lineTo(sx - ox, sy - oz)
      s.holes.push(h)
    }
    return new ExtrudeGeometry(s, { depth: C_DROP, bevelEnabled: false })
  }, [cells, fW, fD, openX, openZ])

  // layered perimeter molding (two stacked rings of different size/height)
  const border1 = useMemo(() => rectRing(fW + 1.1, fD + 1.1, fW + 0.2, fD + 0.2, 0.22), [fW, fD])
  const border2 = useMemo(() => rectRing(fW + 0.5, fD + 0.5, fW + 0.05, fD + 0.05, 0.16), [fW, fD])

  // geometries (built once)
  const insertGeo = useMemo(() => cofferInsertGeo(openX, openZ), [openX, openZ])
  const rosA = useMemo(rosetteFloral, []), rosB = useMemo(rosetteAcanthus, []), rosC = useMemo(rosetteMedallion, [])
  const bossGeo = useMemo(beamBossGeo, [])
  const miniGeo = useMemo(miniRosetteGeo, [])
  const miniGeo2 = useMemo(miniRosetteGeo2, [])

  // instance matrices
  const insertM = useMemo(() => cells.map(([sx, sy]) => mat4(sx, CEIL - C_DROP, -sy)), [cells])
  const rosM = useMemo(() => {
    const a = [], b = [], c = []
    cells.forEach(([sx, sy], i) => {
      const mx = mat4(sx, CEIL - 0.06, -sy, (i % 4) * Math.PI / 2)
      ;(i % 3 === 0 ? a : i % 3 === 1 ? b : c).push(mx)
    })
    return { a, b, c }
  }, [cells])
  const bossM = useMemo(() => {
    const arr = []
    for (let c = 1; c < C_COLS; c++) for (let r = 1; r < C_ROWS; r++) {
      if (isCenter(c - 0.5, r - 0.5) || isCenter(c, r)) continue
      arr.push(mat4(-fW / 2 + c * pX, CEIL - C_DROP - 0.02, -(-fD / 2 + r * pZ)))
    }
    return arr
  }, [fW, fD, pX, pZ])
  // four mini florets in the corners of every coffer
  const miniM = useMemo(() => {
    const a = [], b = []; const dx = openX * 0.30, dz = openZ * 0.30
    cells.forEach(([sx, sy], ci) => {
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) (ci % 2 ? b : a).push(mat4(sx + ox * dx, CEIL - 0.05, -(sy + oz * dz)))
    })
    return { a, b }
  }, [cells, openX, openZ])

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL, 0]} material={m.ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh geometry={slabGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, CEIL - C_DROP, 0]} material={m.ceiling} />
      <mesh geometry={border1} rotation={[-Math.PI / 2, 0, 0]} position={[0, CEIL - C_DROP - 0.22, 0]} material={m.trim} />
      <mesh geometry={border2} rotation={[-Math.PI / 2, 0, 0]} position={[0, CEIL - C_DROP - 0.40, 0]} material={m.trim} />

      <Instanced geo={insertGeo} mat={m.ceiling} matrices={insertM} />
      <Instanced geo={rosA} mat={m.trim} matrices={rosM.a} />
      <Instanced geo={rosB} mat={m.trim} matrices={rosM.b} />
      <Instanced geo={rosC} mat={m.trim} matrices={rosM.c} />
      <Instanced geo={bossGeo} mat={m.trim} matrices={bossM} />
      <Instanced geo={miniGeo} mat={m.trim} matrices={miniM.a} />
      <Instanced geo={miniGeo2} mat={m.trim} matrices={miniM.b} />

      <CornerCartouches fW={fW} fD={fD} m={m} />
      {/* real carved-relief centerpiece in the blank center; medallion shows while it loads */}
      <CenterpieceFrame m={m} />
      <Suspense fallback={<CeilingMedallion m={m} />}>
        <Centerpiece m={m} />
      </Suspense>
    </group>
  )
}

/* Ceiling centerpiece — the real ceiling_wall_carving_034 relief panel.
 * Model: ~1.989 sq panel, carving depth along Z (a vertical "wall" carving).
 * rotateX(+90deg) lays it flat with the relief facing DOWN into the room;
 * scaled to fill the blank center, skinned in ivory plaster to match the ceiling.
 * Knobs if needed: CP_FLIP (relief facing wrong way), CP_SIZE (footprint metres). */
const CP_FLIP = 0          // set to Math.PI if the relief faces up instead of down
const CP_PANEL = 1.989     // the model's square footprint (metres, from its bbox)
const CP_URL = BASE + 'assets/models/centerpiece.glb'
// the central recessed bay (3x3 coffer block, centred)
const bayW = () => 3 * ((W - 2 * C_MARGIN) / C_COLS)
const bayD = () => 3 * ((D - 2 * C_MARGIN) / C_ROWS)

function Centerpiece({ m }) {
  const { scene } = useGLTF(CP_URL)
  const node = useMemo(() => {
    const root = scene.clone(true)
    root.traverse(o => { if (o.isMesh) { o.material = m.centerpiece; o.frustumCulled = false } })
    return root
  }, [scene, m])
  // inset inside the molding frame; rotateX(90) maps panel X->worldX, Y->worldZ, Z(depth)->worldY
  const sx = (bayW() - 1.4) / CP_PANEL
  const sz = (bayD() - 1.4) / CP_PANEL
  const sDepth = 0.55 / 0.057        // deeper relief, readable from the floor
  return (
    <group position={[0, CEIL - C_DROP + 0.02, 0]} rotation={[Math.PI / 2 + CP_FLIP, 0, 0]} scale={[sx, sz, sDepth]}>
      <primitive object={node} />
    </group>
  )
}
useGLTF.preload(CP_URL)

/* Recessed architectural frame that integrates the centerpiece into the ceiling:
 * a recessed bay panel + layered molding rings + egg-and-dart / bead courses
 * + acanthus corner ornaments around the central block. */
function rectPerim(halfW, halfD, spacing, y) {
  const arr = []
  const edgeX = z => { const n = Math.max(1, Math.round(2 * halfW / spacing)); const st = 2 * halfW / n; for (let i = 0; i < n; i++) arr.push(mat4(-halfW + (i + 0.5) * st, y, z)) }
  const edgeZ = x => { const n = Math.max(1, Math.round(2 * halfD / spacing)); const st = 2 * halfD / n; for (let i = 0; i < n; i++) arr.push(mat4(x, y, -halfD + (i + 0.5) * st)) }
  edgeX(-halfD); edgeX(halfD); edgeZ(-halfW); edgeZ(halfW)
  return arr
}
function CenterpieceFrame({ m }) {
  const bW = bayW(), bD = bayD()
  const yTop = CEIL - C_DROP
  // recessed back panel (so the bay reads as inset, not flush)
  const recess = useMemo(() => rectRing(bW + 0.2, bD + 0.2, bW - 2.6, bD - 2.6, 0.5), [bW, bD])
  // three stacked molding rings stepping down and out
  const r1 = useMemo(() => rectRing(bW + 0.4, bD + 0.4, bW - 0.4, bD - 0.4, 0.16), [bW, bD])
  const r2 = useMemo(() => rectRing(bW + 1.1, bD + 1.1, bW + 0.3, bD + 0.3, 0.22), [bW, bD])
  const r3 = useMemo(() => rectRing(bW + 1.8, bD + 1.8, bW + 1.0, bD + 1.0, 0.18), [bW, bD])
  const eggGeo = useMemo(() => { const g = new SphereGeometry(0.12, 10, 8); g.scale(0.7, 1, 1.3); return g }, [])
  const beadGeo = useMemo(() => new SphereGeometry(0.07, 8, 8), [])
  const eggM = useMemo(() => rectPerim((bW + 0.7) / 2, (bD + 0.7) / 2, 0.34, yTop - 0.18), [bW, bD])
  const beadM = useMemo(() => rectPerim((bW + 1.45) / 2, (bD + 1.45) / 2, 0.2, yTop - 0.40), [bW, bD])
  const cornerGeo = useMemo(rosetteAcanthus, [])
  const cx = (bW + 1.45) / 2, cz = (bD + 1.45) / 2
  return (
    <group>
      <mesh geometry={recess} rotation={[-Math.PI / 2, 0, 0]} position={[0, yTop + 0.5, 0]} material={m.ceiling} />
      <mesh geometry={r1} rotation={[-Math.PI / 2, 0, 0]} position={[0, yTop + 0.02, 0]} material={m.trim} />
      <mesh geometry={r2} rotation={[-Math.PI / 2, 0, 0]} position={[0, yTop - 0.18, 0]} material={m.trim} />
      <mesh geometry={r3} rotation={[-Math.PI / 2, 0, 0]} position={[0, yTop - 0.38, 0]} material={m.trim} />
      <Instanced geo={eggGeo} mat={m.trim} matrices={eggM} />
      <Instanced geo={beadGeo} mat={m.trim} matrices={beadM} />
      {[[cx, cz], [-cx, cz], [cx, -cz], [-cx, -cz]].map(([x, z], i) => (
        <mesh key={i} geometry={cornerGeo} position={[x, yTop - 0.12, z]} scale={1.6} material={m.trim} />
      ))}
    </group>
  )
}

/* sculpted corner clusters — scroll + acanthus + boss */
function CornerCartouches({ fW, fD, m }) {
  const geo = useMemo(() => {
    const p = []
    const scroll1 = new TorusGeometry(0.42, 0.06, 8, 20, Math.PI * 1.4); scroll1.rotateX(Math.PI / 2); p.push(scroll1)
    const scroll2 = new TorusGeometry(0.24, 0.05, 8, 18, Math.PI * 1.5); scroll2.rotateX(Math.PI / 2); scroll2.translate(0.3, -0.04, 0.3); p.push(scroll2)
    const boss = new SphereGeometry(0.12, 12, 12); boss.translate(0.15, -0.05, 0.15); p.push(boss)
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 4 + i * 0.4; const pet = new ConeGeometry(0.06, 0.34, 7); pet.rotateX(-Math.PI / 2); pet.rotateY(-a); pet.translate(Math.cos(a) * 0.3, -0.03, Math.sin(a) * 0.3); p.push(pet) }
    return mergeGeometries(p, false)
  }, [])
  const corners = [
    [-fW / 2 + 0.3, fD / 2 - 0.3, 0],
    [fW / 2 - 0.3, fD / 2 - 0.3, -Math.PI / 2],
    [fW / 2 - 0.3, -fD / 2 + 0.3, Math.PI],
    [-fW / 2 + 0.3, -fD / 2 + 0.3, Math.PI / 2],
  ]
  return (
    <group>
      {corners.map(([sx, sy, ry], i) => (
        <mesh key={i} geometry={geo} material={m.trim} position={[sx, CEIL - C_DROP - 0.1, -sy]} rotation={[0, ry, 0]} />
      ))}
    </group>
  )
}

/* monumental central medallion — multiple relief layers */
function CeilingMedallion({ m }) {
  const rings = useMemo(() => (
    [[2.1, 0.10], [1.7, 0.07], [1.3, 0.06], [0.9, 0.05], [0.5, 0.04]].map(([r, t]) => {
      const g = new TorusGeometry(r, t, 12, 64); g.rotateX(Math.PI / 2); return g
    })
  ), [])
  // acanthus ring (radiating petals)
  const acanthus = useMemo(() => {
    const p = []
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const pet = new ConeGeometry(0.11, 0.5, 8); pet.rotateX(-Math.PI / 2); pet.rotateY(-a); pet.translate(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5); p.push(pet) }
    return mergeGeometries(p, false)
  }, [])
  // scroll bosses around the second ring
  const scrolls = useMemo(() => {
    const p = []
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const s = new SphereGeometry(0.13, 10, 10); s.translate(Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05); p.push(s) }
    return mergeGeometries(p, false)
  }, [])
  return (
    <group position={[0, CEIL - 0.06, 0]}>
      {rings.map((g, i) => <mesh key={i} geometry={g} position={[0, -0.02 - i * 0.025, 0]} material={m.trim} />)}
      <mesh geometry={acanthus} position={[0, -0.05, 0]} material={m.trim} />
      <mesh geometry={scrolls} position={[0, -0.08, 0]} material={m.trim} />
      <mesh position={[0, -0.10, 0]} material={m.trim}><cylinderGeometry args={[0.34, 0.42, 0.12, 28]} /></mesh>
      <mesh position={[0, -0.22, 0]} material={m.trim}><sphereGeometry args={[0.28, 20, 20]} /></mesh>
    </group>
  )
}

/* ── BAROQUE CORNICE + BASEBOARD ──────────────────────────────
 * Massive multi-layer cornice at the wall/ceiling line: stacked
 * profile courses + instanced dentils, egg-and-dart, and bead-and-reel
 * running the full perimeter. Projects strongly and casts shadow. */
function Trim({ m }) {
  // one wall's stacked profile (origin at top of wall, projects +z into room)
  const Cornice = ({ len, pos, rotY }) => (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, -0.07, 0.08]} material={m.trim} castShadow><boxGeometry args={[len, 0.14, 0.18]} /></mesh>
      <mesh position={[0, -0.22, 0.24]} material={m.trim} castShadow><boxGeometry args={[len, 0.18, 0.48]} /></mesh>
      <mesh position={[0, -0.36, 0.30]} material={m.trim} castShadow><boxGeometry args={[len, 0.11, 0.34]} /></mesh>
      <mesh position={[0, -0.50, 0.24]} material={m.trim} castShadow><boxGeometry args={[len, 0.14, 0.30]} /></mesh>
      <mesh position={[0, -0.63, 0.16]} material={m.trim} castShadow><boxGeometry args={[len, 0.11, 0.20]} /></mesh>
      <mesh position={[0, -0.75, 0.10]} material={m.trim} castShadow><boxGeometry args={[len, 0.13, 0.14]} /></mesh>
    </group>
  )

  const dentilGeo = useMemo(() => new BoxGeometry(0.08, 0.13, 0.18), [])
  const eggGeo = useMemo(() => { const g = new SphereGeometry(0.10, 10, 8); g.scale(0.7, 1, 1.3); return g }, [])
  const beadGeo = useMemo(() => new SphereGeometry(0.055, 8, 8), [])

  const perim = (spacing, yy, proj) => {
    const arr = []
    const run = (len, axis, fixed, rotY) => {
      const n = Math.max(1, Math.floor(len / spacing)); const step = len / n
      for (let i = 0; i < n; i++) { const t = -len / 2 + (i + 0.5) * step; arr.push(mat4(axis === 'x' ? t : fixed, yy, axis === 'x' ? fixed : t, rotY)) }
    }
    run(W, 'x', -D / 2 + WALL_T + proj, 0); run(W, 'x', D / 2 - proj, Math.PI)   // back wall = interior face (+WALL_T)
    run(D, 'z', -W / 2 + proj, Math.PI / 2); run(D, 'z', W / 2 - proj, -Math.PI / 2)
    return arr
  }
  const dentilM = useMemo(() => perim(0.17, H - 0.36, 0.30), [])
  const eggM = useMemo(() => perim(0.27, H - 0.50, 0.26), [])
  const beadM = useMemo(() => perim(0.14, H - 0.63, 0.16), [])

  const base = (len, pos, rotY = 0) => <mesh position={pos} rotation={[0, rotY, 0]} material={m.trim}><boxGeometry args={[len, 0.20, 0.12]} /></mesh>

  return (
    <group>
      <Cornice len={W} pos={[0, H - 0.06, -D / 2 + WALL_T]} rotY={0} />
      <Cornice len={W} pos={[0, H - 0.06, D / 2]} rotY={Math.PI} />
      <Cornice len={D} pos={[-W / 2, H - 0.06, 0]} rotY={Math.PI / 2} />
      <Cornice len={D} pos={[W / 2, H - 0.06, 0]} rotY={-Math.PI / 2} />
      <Instanced geo={dentilGeo} mat={m.trim} matrices={dentilM} />
      <Instanced geo={eggGeo} mat={m.trim} matrices={eggM} />
      <Instanced geo={beadGeo} mat={m.trim} matrices={beadM} />
      {base(W, [0, 0.10, -D / 2 + WALL_T + 0.07])}{base(W, [0, 0.10, D / 2 - 0.07])}
      {base(D, [-W / 2 + 0.07, 0.10, 0], Math.PI / 2)}{base(D, [W / 2 - 0.07, 0.10, 0], Math.PI / 2)}
    </group>
  )
}

/* ── ORNATE GOLD FRAME (real carved GLB + procedural Baroque crest/apron) ──────
 * The base is the optimized ornate_gold_vintage_frame.glb (symmetric carved gold
 * border). We share ONE geometry across every painting (clones reuse the buffer),
 * rotate it to portrait, keep its baked gold-leaf maps (tinted to aged antique
 * gold), and bolt on a procedural crest, apron, and corner nodes so each frame
 * reads as a sculptural Baroque object that breaks the rectangular boundary. */

// load once → return the shared portrait geometry + aged-gold material (with maps)
function useGoldFrame() {
  const { scene } = useGLTF(FRAME_URL)
  return useMemo(() => {
    let g, mt
    scene.traverse(o => { if (o.isMesh && !g) { g = o.geometry; mt = o.material } })
    const geo = g.clone()
    geo.rotateZ(Math.PI / 2)            // landscape asset → portrait
    geo.center()
    geo.computeBoundingBox()
    const bb = geo.boundingBox
    const nw = bb.max.x - bb.min.x, nh = bb.max.y - bb.min.y, nd = Math.max(0.02, bb.max.z - bb.min.z)
    // keep the baked baseColor/normal/roughness maps (gives real gold-leaf wear),
    // but tint to warm antique gold and calm the metalness so it isn't cartoon-bright
    const mat = mt.clone()
    // the GLB's baked baseColor is a dark bronze → any tint reads brown. Drop the
    // albedo map and use a LITERAL gold color, but KEEP the normal + roughness maps
    // so the rustic scratches / relief / wear remain.
    mat.map = null
    if (mat.metalnessMap) mat.metalnessMap = null
    mat.color.set('#ffcf40')           // literal gold
    mat.metalness = 1.0
    mat.roughness = 0.42               // roughnessMap still multiplies for variation
    mat.envMapIntensity = 1.1          // catch gold reflections so metal reads as gold
    if (mat.emissive) { mat.emissive.set('#4a3608'); mat.emissiveIntensity = 0.08 }   // faint warm glow (low, so distant ornament doesn't glow as dots)
    if (mat.emissive) mat.emissiveIntensity = 0
    mat.needsUpdate = true
    return { geo, mat, nw, nh, nd }
  }, [scene])
}

// procedural Baroque crest (aged gold) — central shell, acanthus explosion,
// radiating scrolls, floral crown. `big` scales the drama by frame class.
const _crestCache = {}
function buildCrest(w, big) {
  const parts = []
  const add = (geo, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
    geo.scale(scl[0], scl[1], scl[2]); geo.rotateX(rot[0]); geo.rotateY(rot[1]); geo.rotateZ(rot[2]); geo.translate(pos[0], pos[1], pos[2])
    parts.push(geo.toNonIndexed())
  }
  add(new SphereGeometry(w * 0.13, 16, 10, 0, Math.PI), [0, 0, 0.06], [-Math.PI / 2, 0, 0], [1.5, 0.65, 1])      // central shell
  for (let i = -3; i <= 3; i++) add(leafGeo(w * (0.16 + 0.10 * big) * (1 - Math.abs(i) * 0.08), w * 0.07), [i * w * 0.055, w * 0.02, 0.05], [Math.PI * 0.5, 0, i * 0.30])  // acanthus explosion
  for (const s of [-1, 1]) add(scrollGeo(w * 0.14, 0.04, Math.PI * 1.4), [s * w * 0.17, w * 0.05, 0.06], [0, 0, s > 0 ? -0.6 : Math.PI + 0.6])  // radiating C-scrolls
  for (const s of [-1, 1]) add(scrollGeo(w * 0.08, 0.03, Math.PI * 1.4), [s * w * 0.30, w * 0.02, 0.05], [0, 0, s > 0 ? -0.3 : Math.PI + 0.3])  // secondary scrolls
  add(rosetteMerge(w * (0.12 + 0.05 * big)), [0, w * (0.18 + 0.10 * big), 0.07])     // floral crown
  for (let i = -1; i <= 1; i++) add(leafGeo(w * 0.10, w * 0.05), [i * w * 0.08, w * (0.10 + 0.06 * big), 0.05], [Math.PI * 0.5, 0, i * 0.5])  // crown leaves
  return mergeGeometries(parts, false)
}
function crest(w, big) { const k = w.toFixed(2) + '_' + big.toFixed(2); if (!_crestCache[k]) _crestCache[k] = buildCrest(w, big); return _crestCache[k] }

// a corner node: layered leaves + a curled scroll (heavier than the side rails)
const _cornerCache = {}
function buildCorner(w) {
  const parts = []
  const add = (geo, pos = [0, 0, 0], rot = [0, 0, 0]) => { geo.rotateX(rot[0]); geo.rotateY(rot[1]); geo.rotateZ(rot[2]); geo.translate(pos[0], pos[1], pos[2]); parts.push(geo.toNonIndexed()) }
  add(scrollGeo(w * 0.10, 0.035, Math.PI * 1.6), [0, 0, 0.05], [0, 0, -0.5])
  for (let i = 0; i < 3; i++) add(leafGeo(w * 0.11, w * 0.05), [w * 0.02 * i, w * 0.02 * i, 0.04], [Math.PI * 0.5, 0, 0.5 + i * 0.4])
  add(rosetteMerge(w * 0.06), [0, 0, 0.06])
  return mergeGeometries(parts, false)
}
function corner(w) { const k = w.toFixed(2); if (!_cornerCache[k]) _cornerCache[k] = buildCorner(w); return _cornerCache[k] }

function Painting({ position, rotation = [0, 0, 0], maxW, maxH, art, cls = 1, frame, m }) {
  // frame outer fills the wall slot; painting sits inside a dark mat
  const big = cls === 2 ? 1 : cls === 1 ? 0.55 : 0.15     // crest drama by class
  const outerScale = cls === 2 ? 1.06 : cls === 1 ? 1.0 : 0.92
  const outerW = maxW * outerScale, outerH = maxH * outerScale
  const ar = art.aspect
  // art plane is LOCKED to the aperture (never overflows the frame); the texture is
  // cropped to "cover" the plane (object-fit: cover) so it fills with no distortion.
  const apW = outerW * 0.66, apH = outerH * 0.70
  const pw = apW, ph = apH
  const planeAR = pw / ph, imgAR = 1 / ar          // width/height of plane vs image
  let rx = 1, ry = 1, ox = 0, oy = 0
  if (imgAR > planeAR) { rx = planeAR / imgAR; ox = (1 - rx) / 2 }   // image wider → crop sides
  else { ry = imgAR / planeAR; oy = (1 - ry) / 2 }                   // image taller → crop top/bottom

  const sx = outerW / frame.nw, sy = outerH / frame.nh, sz = 0.18 / frame.nd   // shallower depth → less edge-on gold
  const crestW = outerW
  const crestGeo = useMemo(() => crest(crestW, big), [crestW, big])

  const artMat = useMemo(() => new MeshStandardMaterial({ color: '#15100a', roughness: 0.85 }), [])
  useEffect(() => {
    new TextureLoader().load(ART_BASE + art.file,
      t => { t.colorSpace = SRGBColorSpace; t.anisotropy = 8; t.repeat.set(rx, ry); t.offset.set(ox, oy); artMat.map = t; artMat.color.set('#ffffff'); artMat.needsUpdate = true },
      undefined, () => console.warn('[art] FAILED (kept dark):', art.file))
  }, [art, artMat, rx, ry, ox, oy])

  const FZ = 0.13   // frame front-relief origin off the wall
  return (
    <group position={position} rotation={rotation}>
      {/* soft drop shadow on the wall behind the frame */}
      <mesh position={[0, -0.08, -0.02]}>
        <planeGeometry args={[outerW + 0.4, outerH + 0.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      {/* thin dark liner directly behind the art (only a sliver ever shows) */}
      <mesh position={[0, 0, FZ - 0.04]} material={m.woodDark}><boxGeometry args={[pw + 0.04, ph + 0.04, 0.04]} /></mesh>
      {/* the artwork — fills the aperture, edges tuck under the gold rim */}
      <mesh position={[0, 0, FZ - 0.01]} material={artMat}><planeGeometry args={[pw, ph]} /></mesh>
      {/* carved gold frame (shared GLB geometry, scaled to this opening) */}
      <mesh geometry={frame.geo} material={frame.mat} position={[0, 0, FZ]} scale={[sx, sy, sz]} castShadow receiveShadow />
      {/* crest above + apron below ONLY on the front-facing back-wall masterpieces.
          On the side walls these project toward the room and, seen edge-on from
          down the hall, read as floating gold dashes — so side paintings rely on
          the GLB frame's own ornament. */}
      {cls === 2 && <>
        <mesh geometry={crestGeo} material={frame.mat} position={[0, outerH / 2 - 0.04, FZ + 0.03]} castShadow />
        <mesh geometry={crestGeo} material={frame.mat} position={[0, -outerH / 2 + 0.04, FZ + 0.03]} rotation={[0, 0, Math.PI]} scale={[1, 0.7, 1]} castShadow />
      </>}
    </group>
  )
}

/* ── WALL PICTURE LIGHT (warm pool, no shadow for perf) ───── */
function PictureLight({ pos, target, rotY = 0, m }) {
  const lRef = useRef(); const tRef = useRef()
  useEffect(() => { if (lRef.current && tRef.current) { lRef.current.target = tRef.current; tRef.current.updateMatrixWorld() } })
  return (
    <>
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh position={[0, -0.05, 0.16]} rotation={[0.7, 0, 0]} material={m.fixture}><cylinderGeometry args={[0.05, 0.07, 0.16, 12]} /></mesh>
        <mesh position={[0, -0.11, 0.18]} material={m.lens}><sphereGeometry args={[0.025, 8, 8]} /></mesh>
      </group>
      <spotLight ref={lRef} position={pos} intensity={95} angle={0.4} penumbra={0.7} color="#f6df88" decay={1.4} distance={34} />
      <object3D ref={tRef} position={target} />
    </>
  )
}

/* ── FURNISHINGS ──────────────────────────────────────────── */
function Door({ m }) {
  // tall pedimented doorway, raised proportionally with the grand ceiling
  return (
    <group position={[0, 0, D / 2 - 0.04]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 3.2, -0.02]} material={m.trim} castShadow><boxGeometry args={[2.9, 6.4, 0.22]} /></mesh>
      <mesh position={[0, 3.0, 0.06]} material={m.wood} castShadow><boxGeometry args={[2.3, 5.9, 0.10]} /></mesh>
      <mesh position={[0, 6.5, 0.04]} material={m.trim} castShadow><boxGeometry args={[3.4, 0.34, 0.38]} /></mesh>
    </group>
  )
}

/* helper: a holed wall as ONE extruded surface (continuous wallpaper UVs).
 * Shape is built in (u = along-wall, v = height) metres; holes are rectangles. */
function holedWallGeo(uLen, holes) {
  const s = new Shape()
  s.moveTo(-uLen / 2, 0); s.lineTo(uLen / 2, 0); s.lineTo(uLen / 2, H); s.lineTo(-uLen / 2, H); s.lineTo(-uLen / 2, 0)
  for (const [u, w, y0, y1] of holes) {
    const p = new Path()
    p.moveTo(u - w / 2, y0); p.lineTo(u + w / 2, y0); p.lineTo(u + w / 2, y1); p.lineTo(u - w / 2, y1); p.lineTo(u - w / 2, y0)
    s.holes.push(p)
  }
  return new ExtrudeGeometry(s, { depth: WALL_T, bevelEnabled: false })
}

/* a long side wall: ONE continuous holed surface (no banding), real openings */
function SideWall({ side, m }) {
  const y0 = WIN_CY - WIN_OPEN_H / 2, y1 = WIN_CY + WIN_OPEN_H / 2
  const geo = useMemo(() => holedWallGeo(D, WIN_Z.map(z => [z, WIN_OPEN_W, y0, y1])), [])
  // shape(u,v) plane → rotate so u→world Z, v→world Y, extrude→world ±X
  return (
    <mesh geometry={geo} position={[side * (W / 2), 0, 0]} rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow material={m.wallSide} />
  )
}

/* pointed-arch (gothic) hole as a Path — straight jambs, two-arc head, point on top */
function archedHolePath(cx, cy, w, h, spring) {
  const w2 = w / 2, yb = cy - h / 2, yt = cy + h / 2, ys = yb + spring * h
  const p = new Path()
  p.moveTo(cx - w2, yb); p.lineTo(cx + w2, yb); p.lineTo(cx + w2, ys)
  p.quadraticCurveTo(cx + w2, yt, cx, yt)
  p.quadraticCurveTo(cx - w2, yt, cx - w2, ys)
  p.lineTo(cx - w2, yb)
  return p
}

/* far wall: ONE continuous holed surface; the feature opening is a GOTHIC ARCH so
 * the masonry hugs the pointed stained-glass window (no rectangular plaster border) */
function BackWall({ m }) {
  const geo = useMemo(() => {
    const s = new Shape()
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0)
    s.holes.push(archedHolePath(0, FEAT_CY, FEAT_HOLE_W, FEAT_HOLE_H, FEAT_SPRING))
    return new ExtrudeGeometry(s, { depth: WALL_T, bevelEnabled: false })
  }, [])
  return (
    <mesh geometry={geo} position={[0, 0, -D / 2]} rotation={[0, 0, 0]} receiveShadow material={m.wallSide} />
  )
}

const FOREST_URL = BASE + 'assets/scenery/forest.jpg'   // real forest (equirect slice)

/* ════════════════════════════════════════════════════════════
 * PROCEDURAL BAROQUE WINDOW SURROUND — built as ONE merged geometry of
 * layered carved parts (moldings, pilasters, arch bands, crown + cartouche,
 * C/S-scrolls, acanthus leaves, rosettes, beadwork, egg-and-dart, sill,
 * apron, corner clusters). Cached per opening size and reused across all
 * windows so it stays a couple of draw calls. Local +Z faces the room.
 * ════════════════════════════════════════════════════════════ */
function rectArchRing(ow, oh, iw, ih, depth, spring = 0.6) {
  const o = new Shape()
  o.moveTo(-ow / 2, -oh / 2); o.lineTo(ow / 2, -oh / 2); o.lineTo(ow / 2, oh / 2); o.lineTo(-ow / 2, oh / 2); o.lineTo(-ow / 2, -oh / 2)
  o.holes.push(pointedArch(iw, ih, spring))
  return new ExtrudeGeometry(o, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 1 })
}
function archBand(ow, oh, iw, ih, depth, spring = 0.6) {
  const o = pointedArch(ow, oh, spring); o.holes.push(pointedArch(iw, ih, spring))
  return new ExtrudeGeometry(o, { depth, bevelEnabled: false })
}
function leafGeo(len, wid) { const g = new ConeGeometry(wid * 0.5, len, 6); g.translate(0, len / 2, 0); return g }
function scrollGeo(r, tube, arc) { return new TorusGeometry(r, tube, 6, 18, arc) }
function rosetteMerge(d) {
  const p = [new CylinderGeometry(d * 0.2, d * 0.22, 0.08, 12).rotateX(Math.PI / 2)]
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const s = new SphereGeometry(d * 0.16, 6, 6); s.scale(1, 0.55, 1.6); s.translate(Math.cos(a) * d * 0.34, Math.sin(a) * d * 0.34, 0.03); p.push(s) }
  return mergeGeometries(p.map(g => g.toNonIndexed()), false)
}

const _frameCache = {}
function buildBaroqueFrame(w, h) {
  const tw = Math.min(0.34, w * 0.105)             // slimmer surround → detail carries it, not bulk
  const iw = w - 2 * tw, ih = h - 2 * tw            // arched glass opening
  const parts = []
  const add = (geo, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
    geo.scale(scl[0], scl[1], scl[2]); geo.rotateX(rot[0]); geo.rotateY(rot[1]); geo.rotateZ(rot[2]); geo.translate(pos[0], pos[1], pos[2])
    parts.push(geo.toNonIndexed())
  }
  const A2 = ih / 2, sy = -A2 + 0.6 * ih            // arch spring (local y)
  // ── moldings: backing fills the wall opening + hugs the arched glass ──
  add(rectArchRing(w, h, iw * 0.97, ih * 0.97, 0.05))                          // backing plate (fills corners)
  add(rectArchRing(w + 0.5, h + 0.46, iw + 0.07, ih + 0.07, 0.09), [0, 0, 0.05]) // main body — slim
  add(archBand(iw + 0.12, ih + 0.12, iw, ih, 0.12), [0, 0, 0.07])              // inner bead molding (arched)
  add(rectArchRing(w + 0.84, h + 0.78, w + 0.46, h + 0.42, 0.06), [0, 0, 0.15]) // outer molding — slim
  // ── slim side pilasters with capital/base + carved bits ──
  const pw = w * 0.115, ph = h * 0.82
  for (const s of [-1, 1]) {
    const px = s * (w / 2 + 0.10)
    add(new BoxGeometry(pw, ph, 0.10), [px, -h * 0.03, 0.06])
    add(new BoxGeometry(0.04, ph, 0.14), [px - pw / 2 + 0.02, -h * 0.03, 0.13])   // raised inner edge
    add(new BoxGeometry(0.04, ph, 0.14), [px + pw / 2 - 0.02, -h * 0.03, 0.13])   // raised outer edge
    add(new BoxGeometry(pw + 0.12, 0.13, 0.16), [px, ph / 2 - h * 0.03, 0.14])   // capital
    add(new BoxGeometry(pw + 0.14, 0.13, 0.16), [px, -ph / 2 - h * 0.03, 0.14])  // base
    // flush recessed panel line on the pilaster (no projecting nubs)
    add(new BoxGeometry(pw * 0.5, ph * 0.9, 0.03), [px, -h * 0.03, 0.12])
  }
  // ── arch bands over the top (egg-and-dart approximated by ovoids on an arc) ──
  add(archBand(iw + 0.6, ih + 0.6, iw + 0.30, ih + 0.30, 0.16), [0, 0, 0.2])
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.12 + 0.76 * i / 12); const r = (iw / 2) + 0.18; const x = Math.cos(a) * r; const y = sy + Math.sin(a) * r * 0.95; const egg = new SphereGeometry(w * 0.02, 8, 6); egg.scale(0.8, 1, 1.2); add(egg, [x, y, 0.22]) }
  // ── upper crown + central cartouche + flanking C-scrolls + acanthus ──
  const cy = A2 + h * 0.13
  add(new SphereGeometry(1, 12, 10), [0, cy, 0.22], [0, 0, 0], [w * 0.12, h * 0.06, 0.14])  // cartouche shield
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(new SphereGeometry(w * 0.01, 6, 6), [Math.cos(a) * w * 0.15, cy + Math.sin(a) * h * 0.07, 0.25]) }
  for (const s of [-1, 1]) add(scrollGeo(w * 0.13, 0.045, Math.PI * 1.3), [s * w * 0.24, cy, 0.24], [0, 0, s > 0 ? -0.5 : Math.PI + 0.5])
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(leafGeo(h * 0.09, w * 0.06), [s * (w * 0.1 + i * w * 0.09), cy - h * 0.02, 0.2], [Math.PI * 0.5, 0, s * (0.5 + i * 0.35)])
  add(rosetteMerge(w * 0.12), [0, cy + h * 0.07, 0.25])                          // floral crest
  add(new SphereGeometry(w * 0.1, 12, 6, 0, Math.PI), [0, cy - h * 0.04, 0.2], [Math.PI / 2, 0, 0], [1, 0.5, 1])  // shell
  // ── projecting stone sill + brackets (clean blocks, no spikes) ──
  const sillW = (w + 1.0) * 0.95
  add(new BoxGeometry(sillW, h * 0.05, 0.3), [0, -h / 2 - 0.08, 0.2])
  for (const s of [-1, 1]) add(new BoxGeometry(0.12, 0.26, 0.2), [s * sillW * 0.4, -h / 2 - 0.24, 0.16])
  // ── lower apron: clean panel + central shell + flanking C-scrolls ──
  const apronW = (w + 1.0) * 0.75, ay = -h / 2 - h * 0.12
  add(new BoxGeometry(apronW, h * 0.13, 0.08), [0, ay, 0.04])
  add(new SphereGeometry(w * 0.1, 14, 8, 0, Math.PI), [0, ay, 0.14], [-Math.PI / 2, 0, 0], [1, 0.5, 1])
  for (const s of [-1, 1]) add(scrollGeo(w * 0.1, 0.04, Math.PI * 1.4), [s * apronW * 0.3, ay, 0.14], [0, 0, s > 0 ? Math.PI : 0])
  return mergeGeometries(parts, false)
}
function baroqueFrame(w, h) { const k = w.toFixed(2) + 'x' + h.toFixed(2); if (!_frameCache[k]) _frameCache[k] = buildBaroqueFrame(w, h); return _frameCache[k] }

// pointed-arch outline (centred at origin): rect lower + two-arc gothic head
function pointedArch(w, h, spring = 0.6) {
  const W2 = w / 2, H2 = h / 2, sy = -H2 + spring * h
  const s = new Shape()
  s.moveTo(-W2, -H2); s.lineTo(W2, -H2); s.lineTo(W2, sy)
  s.quadraticCurveTo(W2, H2, 0, H2)
  s.quadraticCurveTo(-W2, H2, -W2, sy)
  s.lineTo(-W2, -H2)
  return s
}

/* ── WINDOW SYSTEM — procedural Gothic window that FILLS the opening ──────
 * Carved trim (rect slab with a pointed-arch hole) embedded in the wall, with
 * arched glass filling the opening, sash/transom divisions in the straight
 * part, Y-tracery + oculus in the arch, side colonnettes, hood mould + finial.
 * w,h = the wall opening (rectangular). Local +Z faces the room. */
function MuseumWindow({ w, h, m }) {
  // ── layered exterior scenery (aerial perspective: near darker, far hazier) ──
  const forest = useTexture(FOREST_URL)
  const mkScenery = (rep, voff, color) => {
    const t = forest.clone(); t.needsUpdate = true
    t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(rep[0], rep[1]); t.offset.set(seedRef, voff)
    return new MeshBasicMaterial({ map: t, color })
  }
  const seedRef = useMemo(() => Math.random() * 0.75, [])
  const treelineMat = useMemo(() => mkScenery([0.2, 0.56], 0.42, '#d8d8ce'), [forest, seedRef])    // full backdrop: trees + soft sky (crop raised → less ground)
  const nearMat = useMemo(() => mkScenery([0.13, 0.3], 0.34, '#c2c6b6'), [forest, seedRef])         // nearer foliage (trees, not dirt)

  const RECESS = WALL_T                            // reveal depth = full wall thickness (~24in)
  const tw = Math.min(0.34, w * 0.105)             // trim width — MUST match buildBaroqueFrame so glass fills the hole
  const iw = w - 2 * tw, ih = h - 2 * tw           // arched opening (glass)
  const spring = 0.6
  const H2 = ih / 2, W2 = iw / 2, sy = -H2 + spring * ih   // arch spring line
  const mull = 0.055

  // glass fills the frame hole exactly (frame inner hole = iw+0.10 → glass slightly larger so no edge gap)
  const glassGeo = useMemo(() => new ShapeGeometry(pointedArch(iw + 0.10, ih + 0.10, spring)), [iw, ih])
  const frameGeo = useMemo(() => baroqueFrame(w, h), [w, h])   // cached + reused across windows

  // depths (local +Z faces the room). Keep the glazing + scenery just behind the
  // frame so the view fills the opening with no parallax gap at the edges.
  const frameZ = -0.05                             // surround proud of the wall face, covering the opening edge
  const glassZ = -0.16                             // glazing right behind the frame opening
  const mullZ = glassZ + 0.03
  const jambT = 0.14                               // plaster reveal thickness shown

  const cols = 3, vx = [-W2 + iw / cols, -W2 + 2 * iw / cols]   // two vertical mullions
  const straightH = sy + H2                                     // straight (sash) region height
  const transoms = [-H2 + straightH * 0.33, -H2 + straightH * 0.66, sy]   // sash rails + spring transom
  const arcR = (H2 - sy) * 0.30
  return (
    <group>
      {/* ── EXTERIOR GROUNDS just behind the glazing — a forest backdrop that
          FULLY fills the opening (covers the arch top), with a nearer foliage
          band low for a touch of depth. No separate sky plane (it read as a
          white blob); the backdrop's own soft sky shows at the top. */}
      <mesh position={[0, 0, glassZ - 0.22]} material={treelineMat}><planeGeometry args={[w * 1.5, h * 1.4]} /></mesh>
      <mesh position={[0, -h * 0.22, glassZ - 0.12]} material={nearMat}><planeGeometry args={[w * 1.5, h * 0.72]} /></mesh>

      {/* ── DEEP PLASTER REVEAL lining the opening (jambs / head / sill bed) ──
          turns the cut hole into a real architectural recess that catches shadow */}
      {[-1, 1].map(s => (
        <mesh key={'jamb' + s} position={[s * (w / 2 + 0.01), -h * 0.02, -RECESS / 2]} receiveShadow material={m.revealPlaster}>
          <boxGeometry args={[jambT, h + 0.26, RECESS]} />
        </mesh>
      ))}
      <mesh position={[0, h / 2 + 0.02, -RECESS / 2]} receiveShadow material={m.revealPlaster}><boxGeometry args={[w + 0.12, jambT, RECESS]} /></mesh>
      <mesh position={[0, -h / 2 - 0.02, -RECESS / 2]} receiveShadow material={m.revealPlaster}><boxGeometry args={[w + 0.12, jambT, RECESS]} /></mesh>

      {/* ── SUBSTANTIAL STONE SILL — projects into the room, casts a real shadow ── */}
      <mesh position={[0, -h / 2 - 0.05, (0.22 - RECESS) / 2]} castShadow receiveShadow material={m.sillStone}>
        <boxGeometry args={[w + 0.7, 0.17, RECESS + 0.22]} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.155, 0.205]} castShadow material={m.sillStone}>
        <boxGeometry args={[w + 0.7, 0.07, 0.1]} />
      </mesh>

      {/* ── GLAZING — single near-clear pane (you can see the grounds clearly) ── */}
      <mesh geometry={glassGeo} position={[0, 0, glassZ]} material={m.glass} />
      {/* mullions: 2 verticals up to the spring, sash transoms, central mullion into
          the arch, two Y-tracery bars, and an oculus — all inside the glass */}
      {vx.map((x, i) => <mesh key={'v' + i} position={[x, (-H2 + sy) / 2, mullZ]} material={m.trimWhite}><boxGeometry args={[mull, straightH, 0.05]} /></mesh>)}
      {transoms.map((y, i) => <mesh key={'t' + i} position={[0, y, mullZ]} material={m.trimWhite}><boxGeometry args={[iw - 0.04, mull, 0.05]} /></mesh>)}
      <mesh position={[0, (sy + H2) / 2, mullZ]} material={m.trimWhite}><boxGeometry args={[mull, H2 - sy, 0.05]} /></mesh>
      <mesh position={[-W2 * 0.34, sy + (H2 - sy) * 0.45, mullZ]} rotation={[0, 0, 0.5]} material={m.trimWhite}><boxGeometry args={[mull, (H2 - sy) * 0.9, 0.05]} /></mesh>
      <mesh position={[W2 * 0.34, sy + (H2 - sy) * 0.45, mullZ]} rotation={[0, 0, -0.5]} material={m.trimWhite}><boxGeometry args={[mull, (H2 - sy) * 0.9, 0.05]} /></mesh>
      <mesh position={[0, sy + (H2 - sy) * 0.5, mullZ]} material={m.trimWhite}><torusGeometry args={[arcR, mull * 0.7, 8, 20]} /></mesh>
      {/* the carved Baroque surround — recessed INTO the opening, overlapping the reveal */}
      <mesh geometry={frameGeo} position={[0, 0, frameZ]} material={m.trim} castShadow receiveShadow />
    </group>
  )
}

/* far-wall monumental window — the downloaded gothic painted-glass model, set into
 * the masonry opening with a plaster reveal and backlit so the stained glass glows. */
function GothicFeature({ m }) {
  const { scene } = useGLTF(STAINED_URL)
  const inst = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => {
      if (!o.isMesh) return
      o.castShadow = false; o.receiveShadow = false
      const mat = o.material
      if (!mat) return
      // the painted-glass panes: make them glow like they're backlit by daylight
      if (mat.emissiveMap || /colou?r|glass|paint|stain/i.test(o.name) || /colou?r|glass|paint|stain/i.test(mat.name || '')) {
        if (mat.emissive) mat.emissiveIntensity = 2.4
        mat.transparent = true; mat.opacity = 0.97; mat.envMapIntensity = 0.2
        mat.needsUpdate = true
      }
    })
    const box = new Box3().setFromObject(c)
    const size = new Vector3(); box.getSize(size)
    const ctr = new Vector3(); box.getCenter(ctr)
    return { c, size, ctr }
  }, [scene])

  const RECESS = WALL_T
  const S = (FEAT_H * 0.99) / inst.size.y          // fill the opening height (matches the arch hole)
  const winZ = -0.24                                // fully behind the wall face → arched masonry masks the outer frame
  return (
    <group position={[0, FEAT_CY, -D / 2 + WALL_T]}>
      {/* the arched masonry hole (BackWall) hugs the window, so no plaster reveal is
          needed. A low projecting stone sill at the base only. */}
      <mesh position={[0, -FEAT_H / 2 + 0.2, (0.24 - RECESS) / 2]} castShadow receiveShadow material={m.sillStone}>
        <boxGeometry args={[FEAT_HOLE_W + 0.5, 0.2, RECESS + 0.24]} />
      </mesh>

      {/* backlight behind the glass so the painted panes read as daylight-lit */}
      <mesh position={[0, 0, -(RECESS + 0.25)]}><planeGeometry args={[FEAT_W * 1.3, FEAT_H * 1.1]} /><meshBasicMaterial color="#f3ead2" /></mesh>
      <pointLight position={[0, 1.5, -(RECESS + 0.6)]} intensity={26} distance={14} decay={2} color="#fff3d6" />
      <pointLight position={[0, 0.5, 1.6]} intensity={6} distance={9} decay={2} color="#ffe9c2" />

      {/* the gothic painted-glass window itself, scaled to fill the opening */}
      <primitive object={inst.c} position={[-inst.ctr.x * S, -inst.ctr.y * S, winZ]} scale={S} />
    </group>
  )
}

/* side windows built into BOTH long walls (real openings; frame = surround) */
function SideGothicWindows({ m, side }) {
  const x = side * (W / 2)
  const ry = side < 0 ? Math.PI / 2 : -Math.PI / 2   // local +Z faces the room
  return (
    <group>
      {WIN_Z.map((z, i) => (
        <group key={i} position={[x, WIN_CY, z]} rotation={[0, ry, 0]}>
          <MuseumWindow w={WIN_OPEN_W} h={WIN_OPEN_H} m={m} />
        </group>
      ))}
    </group>
  )
}
function Bench({ m }) {
  return (
    <group position={[0, 0, 2]}>
      <mesh position={[0, 0.62, 0]} material={m.wood} castShadow><boxGeometry args={[3.0, 0.16, 0.9]} /></mesh>
      {[[-1.4, 0.36], [1.4, 0.36], [-1.4, -0.36], [1.4, -0.36]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.28, z]} material={m.woodDark} castShadow><boxGeometry args={[0.16, 0.58, 0.16]} /></mesh>
      ))}
    </group>
  )
}

/* ── THIRD-PERSON PLAYER — slim BLACK HUMAN SILHOUETTE with a procedural walk
 *    (swinging arms/legs, bending knees, torso bob) + idle breathing. Pointer-lock
 *    mouse look (both axes), camera-relative movement, smooth accel/decel, body
 *    turns to face travel direction. ── */
const WALK_SPEED = 4.4, RUN_SPEED = 7.6, ACCEL = 11, MOUSE_SENS = 0.0027
const CAM_DIST = 6.2, CAM_HEIGHT = 2.4, HEAD_Y = 1.7
const _v1 = new Vector3(), _v2 = new Vector3(), _v3 = new Vector3(), _v4 = new Vector3()
const _v5 = new Vector3(), _v6 = new Vector3()

// merge many small spheres into ONE geometry (dense curls at ~1 draw call)
function mergeSpheres(list) {
  return mergeGeometries(list.map(c => {
    const g = new SphereGeometry(c.r, 8, 7); g.translate(c.p[0], c.p[1], c.p[2]); return g
  }), false)
}

function Character() {
  const root = useRef()       // carries world position
  const modelRef = useRef()   // inner figure, rotates to face travel direction
  const body = useRef()       // torso+arms+head group (for the walk bob)
  const thighL = useRef(), thighR = useRef(), shinL = useRef(), shinR = useRef()
  const armL = useRef(), armR = useRef()
  const hairRefs = useRef([])   // per-section hair groups (each sways individually)
  const keys = useRef({})
  const st = useRef({ yaw: 0, pitch: 0.12, vel: new Vector3(), face: 0, phase: 0, t: 0 })
  const mat = useMemo(() => ({
    skin: new MeshStandardMaterial({ color: '#c8996f', roughness: 0.72, metalness: 0 }),
    hair: new MeshStandardMaterial({ color: '#211008', roughness: 0.85, metalness: 0 }),   // dark brunette
    shirt: new MeshStandardMaterial({ color: '#1b2750', roughness: 0.62, metalness: 0.06 }), // dark-blue Y2K tee
    denim: new MeshStandardMaterial({ color: '#3f5f86', roughness: 0.9, metalness: 0 }),     // denim skirt
    denimDark: new MeshStandardMaterial({ color: '#324d6c', roughness: 0.92, metalness: 0 }), // pocket contrast
    boot: new MeshStandardMaterial({ color: '#171311', roughness: 0.42, metalness: 0.18 }),  // knee-high boots
    sock: new MeshStandardMaterial({ color: '#ece6d6', roughness: 0.9, metalness: 0 }),       // sock peek
    belt: new MeshStandardMaterial({ color: '#5e1622', roughness: 0.5, metalness: 0.08 }),   // deep maroon / cherry belt
    bow: new MeshStandardMaterial({ color: '#9e2230', roughness: 0.45, metalness: 0.08 }),   // cherry maroon hair bow (brighter so it reads on dark hair)
    gold: new MeshStandardMaterial({ color: '#d9b13b', roughness: 0.3, metalness: 1 }),        // dainty necklace
    eyeBlue: new MeshStandardMaterial({ color: '#1c46a0', roughness: 0.4, metalness: 0.1 }),   // evil eye
    eyeWhite: new MeshStandardMaterial({ color: '#eef2f7', roughness: 0.5, metalness: 0 }),
    eyePupil: new MeshStandardMaterial({ color: '#0a1c3a', roughness: 0.4, metalness: 0 }),
  }), [])
  // INDIVIDUAL curls made of little torus RINGS. Raised hairline (no sideburns),
  // a gathered "half-up" cluster at the back crown, and baby-hair wisps in front.
  const rnd = n => (Math.random() - 0.5) * n
  const curlTorus = (x, y, z, r) => {
    const g = new TorusGeometry(r, r * 0.42, 6, 9)
    g.rotateX(Math.random() * Math.PI); g.rotateY(Math.random() * Math.PI)
    g.translate(x, y, z); return g
  }
  const hairCapGeo = useMemo(() => {
    const geos = []
    for (let layer = 0; layer < 3; layer++) {
      const rr = 0.144 + layer * 0.012, count = 80 - layer * 16
      for (let i = 0; i < count; i++) {
        const u = Math.random(), v = Math.random()
        const theta = u * Math.PI * 2, phi = Math.acos(2 * v - 1)
        const x = Math.sin(phi) * Math.cos(theta), y = Math.cos(phi), z = Math.sin(phi) * Math.sin(theta)
        if (y < -0.55) continue                             // cap extends down the back/sides (fills the nape, no gap)
        if (z > 0.13 && y < 0.4) continue                   // open the whole front (face + throat) so the choker shows; keeps the forehead hairline
        if (y > 0.7 && Math.random() < 0.6) continue        // thin the very top → flat crown, no poofy mullet
        geos.push(curlTorus(x * rr * 1.02, 1.63 + y * rr * 0.9 + 0.01, z * rr * 0.88 - 0.012, 0.026 + Math.random() * 0.014))
      }
    }
    // just a couple of subtle baby hairs at the temples
    for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1; geos.push(curlTorus(s * (0.115 + Math.random() * 0.025), 1.64 + rnd(0.04), 0.06 + rnd(0.02), 0.011 + Math.random() * 0.007)) }
    // BACK FILL: a dense band of curls over the occiput that bridges the crown to the
    // falling length, so the back of the head is one smooth rounded curve (no gap)
    for (let i = 0; i < 50; i++) {
      const a = (Math.random() - 0.5) * 2.0, yy = 0.25 - Math.random() * 0.85
      const r = 0.152
      geos.push(curlTorus(Math.sin(a) * r * 0.95 + rnd(0.02), 1.63 + yy * r * 0.92, -Math.abs(Math.cos(a)) * r * 0.92 - 0.025, 0.027 + Math.random() * 0.015))
    }
    return mergeGeometries(geos, false)
  }, [])
  // ALL-DOWN length split into SECTIONS around the back+sides; each section is a
  // bundle of individual ringlet coils and gets its OWN sway phase → curls appear
  // to move independently. Tons of coils = full voluminous head.
  const SECTIONS = 10
  const hairSectionGeos = useMemo(() => {
    const out = []
    for (let sec = 0; sec < SECTIONS; sec++) {
      const geos = []
      const center = (-1 + 2 * sec / (SECTIONS - 1)) * 2.55   // wider: reaches around to drape over the shoulders
      const strandsN = 11
      for (let q = 0; q < strandsN; q++) {
        const ang = center + (q - (strandsN - 1) / 2) * 0.075
        const back = Math.max(0, Math.cos(ang))           // 1 at the back, 0 at the sides
        const ox = Math.sin(ang) * 0.16, oz = -Math.cos(ang) * 0.13 - 0.03 - back * 0.03   // gentle back volume (rounded, not bulging)
        const segs = 8 + Math.floor(Math.random() * 3)   // ~3/4 torso length
        const coilR = 0.03 + Math.random() * 0.016
        const tilt = (Math.random() < 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.35)
        const step = 0.05
        for (let i = 0; i < segs; i++) {
          const sp = 1 + i * 0.07                          // fans OUTWARD horizontally as it falls
          const g = new TorusGeometry(coilR * (1 + i * 0.05), 0.013, 6, 9)   // curls fatten toward the bottom → volume on the lower half
          g.rotateX(Math.PI / 2); g.rotateZ(tilt)
          g.translate(ox * sp + rnd(0.015), -0.02 - i * step, oz * sp + rnd(0.015))
          geos.push(g)
        }
      }
      out.push(mergeGeometries(geos, false))
    }
    return out
  }, [])

  // tiny gold "COACH" label for the boots (canvas → texture)
  const coachMat = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64
    const ctx = c.getContext('2d'); ctx.clearRect(0, 0, 256, 64)
    ctx.fillStyle = '#e8c34a'; ctx.font = 'bold 38px Georgia, "Times New Roman", serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COACH', 128, 34)
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 8
    return new MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, toneMapped: false })
  }, [])
  // load fabric textures: skirt denim + brown leather boots (hair stays pure curls)
  useEffect(() => {
    const L = new TextureLoader()
    L.load(DENIM_TEX + 'diff.jpg', t => { t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(3, 2); t.anisotropy = 8; mat.denim.map = t; mat.denim.color.set('#ffffff'); mat.denim.needsUpdate = true; mat.denimDark.map = t; mat.denimDark.color.set('#b9c2cf'); mat.denimDark.needsUpdate = true })
    L.load(DENIM_TEX + 'disp.jpg', t => { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(3, 2); mat.denim.bumpMap = t; mat.denim.bumpScale = 0.02; mat.denim.needsUpdate = true })
    L.load(LEATHER_TEX + 'diff.jpg', t => { t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 8; mat.boot.map = t; mat.boot.bumpMap = t; mat.boot.bumpScale = 0.015; mat.boot.color.set('#ffffff'); mat.boot.roughness = 0.55; mat.boot.metalness = 0.05; mat.boot.needsUpdate = true })
  }, [mat])

  useEffect(() => {
    const dn = e => { keys.current[e.code] = true; if (e.code.startsWith('Arrow')) e.preventDefault() }
    const up = e => { keys.current[e.code] = false }
    const canvas = document.querySelector('canvas')
    const onClick = () => { if (canvas && document.pointerLockElement !== canvas) canvas.requestPointerLock && canvas.requestPointerLock() }
    const onMove = e => {
      if (document.pointerLockElement == null) return
      const s = st.current
      s.yaw -= e.movementX * MOUSE_SENS
      s.pitch = MathUtils.clamp(s.pitch - e.movementY * MOUSE_SENS, -0.9, 1.0)
    }
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    canvas && canvas.addEventListener('click', onClick)
    document.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up)
      canvas && canvas.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  useFrame(({ camera }, delta) => {
    if (!root.current) return
    const s = st.current, k = keys.current, d = Math.min(delta, 0.05)
    // camera-relative input
    const fwd = (k['KeyW'] || k['ArrowUp'] ? 1 : 0) - (k['KeyS'] || k['ArrowDown'] ? 1 : 0)
    const strafe = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)
    const run = k['ShiftLeft'] || k['ShiftRight']
    const sin = Math.sin(s.yaw), cos = Math.cos(s.yaw)
    const moveDir = _v3.set(0, 0, 0)
      .addScaledVector(_v1.set(sin, 0, cos), fwd)        // forward (look dir, horizontal)
      .addScaledVector(_v2.set(cos, 0, -sin), strafe)    // right
    const moving = moveDir.lengthSq() > 1e-4
    if (moving) moveDir.normalize()
    const desired = _v4.copy(moveDir).multiplyScalar(moving ? (run ? RUN_SPEED : WALK_SPEED) : 0)
    s.vel.lerp(desired, Math.min(1, ACCEL * d))

    const ch = root.current
    ch.position.addScaledVector(s.vel, d)
    ch.position.x = MathUtils.clamp(ch.position.x, -W / 2 + 0.7, W / 2 - 0.7)
    ch.position.z = MathUtils.clamp(ch.position.z, -D / 2 + 0.7, D / 2 - 0.7)
    ch.position.y = 0

    // body faces travel direction (smooth shortest-arc)
    const spd = s.vel.length()
    if (spd > 0.3) {
      const target = Math.atan2(s.vel.x, s.vel.z)
      let diff = target - s.face; diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      s.face += diff * Math.min(1, 9 * d)
    }
    if (modelRef.current) modelRef.current.rotation.y = s.face

    // ── procedural locomotion ──
    s.t += d
    const walkAmt = MathUtils.clamp(spd / 1.6, 0, 1)          // 0 idle → 1 full stride
    s.phase += d * (4.2 + spd * 1.5)                          // cadence rises with speed
    const A = 0.55 * walkAmt
    const ease = (ref, tgt) => { if (ref.current) ref.current.rotation.x += (tgt - ref.current.rotation.x) * Math.min(1, 12 * d) }
    ease(thighL, Math.sin(s.phase) * A)
    ease(thighR, Math.sin(s.phase + Math.PI) * A)
    ease(shinL, Math.max(0, -Math.sin(s.phase - 0.5)) * 1.0 * walkAmt)
    ease(shinR, Math.max(0, -Math.sin(s.phase + Math.PI - 0.5)) * 1.0 * walkAmt)
    const idleSway = (1 - walkAmt) * Math.sin(s.t * 1.5) * 0.05
    ease(armL, Math.sin(s.phase + Math.PI) * A * 0.85 + idleSway)
    ease(armR, Math.sin(s.phase) * A * 0.85 - idleSway)
    if (body.current) {
      const bob = walkAmt > 0.05 ? Math.abs(Math.sin(s.phase)) * 0.05 * walkAmt : Math.sin(s.t * 1.6) * 0.012
      body.current.position.y += (bob - body.current.position.y) * Math.min(1, 10 * d)
    }
    // each hair section sways with its own phase offset → curls move independently
    for (let i = 0; i < hairRefs.current.length; i++) {
      const g = hairRefs.current[i]; if (!g) continue
      const off = i * 0.8
      const sx = (walkAmt > 0.05 ? Math.sin(s.phase + off) * 0.13 * walkAmt : 0) + Math.sin(s.t * 1.1 + off) * 0.02
      const sz = (walkAmt > 0.05 ? Math.cos(s.phase * 0.7 + off) * 0.05 * walkAmt : 0) + Math.sin(s.t * 0.9 + off) * 0.012
      g.rotation.x += (sx - g.rotation.x) * Math.min(1, 6 * d)
      g.rotation.z += (sz - g.rotation.z) * Math.min(1, 6 * d)
    }

    // third-person orbit camera
    const cp = Math.cos(s.pitch), sp = Math.sin(s.pitch)
    const target = _v5.set(ch.position.x, HEAD_Y, ch.position.z)
    const cam = _v6.set(
      target.x - sin * CAM_DIST * cp,
      target.y + CAM_HEIGHT - sp * CAM_DIST,
      target.z - cos * CAM_DIST * cp,
    )
    cam.x = MathUtils.clamp(cam.x, -W / 2 + 0.4, W / 2 - 0.4)
    cam.z = MathUtils.clamp(cam.z, -D / 2 + 0.4, D / 2 - 0.4)
    cam.y = MathUtils.clamp(cam.y, 0.9, CEIL - 0.4)
    camera.position.lerp(cam, Math.min(1, 9 * d))
    camera.lookAt(target.x, target.y, target.z)
  })

  // stylized figure (faces +Z): brunette curls, Y2K tee, denim skirt, knee-high boots
  return (
    <group ref={root} position={[0, 0, 8]}>
      <group ref={modelRef} position={[0, 0.07, 0]}>{/* lift so the heeled boots rest on the floor (no clipping) */}
        {/* torso + head + hair + arms + skirt (bobs as one during the walk) */}
        <group ref={body}>
          {/* denim mini — ROUND so it fully encloses the hips (no skin poke-through) */}
          <mesh position={[0, 0.9, 0]} castShadow material={mat.denim}><cylinderGeometry args={[0.142, 0.166, 0.26, 24, 1, true]} /></mesh>
          {/* two front patch pockets */}
          {[-1, 1].map(s => <mesh key={'pk' + s} position={[s * 0.06, 0.88, 0.138]} castShadow material={mat.denimDark}><boxGeometry args={[0.06, 0.075, 0.012]} /></mesh>)}
          {/* maroon belt + gold buckle at the waist */}
          <mesh position={[0, 1.02, 0]} castShadow material={mat.belt}><cylinderGeometry args={[0.13, 0.134, 0.05, 24]} /></mesh>
          <mesh position={[0, 1.02, 0.128]} castShadow material={mat.gold}><boxGeometry args={[0.05, 0.042, 0.02]} /></mesh>
          {/* hourglass tee: chest → THIN waist → smoothly flares to the hips  ) . (  */}
          <mesh position={[0, 1.40, 0]} castShadow material={mat.shirt}><cylinderGeometry args={[0.1, 0.084, 0.1, 18]} /></mesh>
          <mesh position={[0, 1.30, 0]} castShadow material={mat.shirt}><cylinderGeometry args={[0.084, 0.066, 0.12, 18]} /></mesh>
          <mesh position={[0, 1.19, 0]} castShadow material={mat.shirt}><cylinderGeometry args={[0.066, 0.072, 0.1, 18]} /></mesh>
          <mesh position={[0, 1.07, 0]} castShadow material={mat.shirt}><cylinderGeometry args={[0.072, 0.105, 0.14, 18]} /></mesh>
          {/* hips (skin, under belt/skirt) + subtle clothed butt curve */}
          <mesh position={[0, 0.96, 0]} castShadow material={mat.skin}><cylinderGeometry args={[0.105, 0.12, 0.14, 18]} /></mesh>
          <mesh position={[-0.05, 0.86, -0.075]} scale={[1, 0.8, 1]} castShadow material={mat.denim}><sphereGeometry args={[0.058, 12, 10]} /></mesh>
          <mesh position={[0.05, 0.86, -0.075]} scale={[1, 0.8, 1]} castShadow material={mat.denim}><sphereGeometry args={[0.058, 12, 10]} /></mesh>
          {/* neck + head */}
          <mesh position={[0, 1.5, 0]} castShadow material={mat.skin}><cylinderGeometry args={[0.05, 0.06, 0.1, 10]} /></mesh>
          {/* head + smooth scalp cap (so curls never reveal bald gaps) + front face */}
          <mesh position={[0, 1.62, 0]} castShadow material={mat.skin}><sphereGeometry args={[0.135, 18, 16]} /></mesh>
          {/* rounded hair-colored scalp (fully covers cranium → no bald gaps) + occiput bulge */}
          <mesh position={[0, 1.64, -0.02]} castShadow material={mat.hair}><sphereGeometry args={[0.153, 20, 18]} /></mesh>
          <mesh position={[0, 1.6, -0.055]} castShadow material={mat.hair}><sphereGeometry args={[0.135, 18, 16]} /></mesh>
          {/* front face */}
          <mesh position={[0, 1.6, 0.08]} castShadow material={mat.skin}><sphereGeometry args={[0.118, 16, 14]} /></mesh>
          {/* ears + gold medium hoop earrings */}
          <mesh position={[-0.132, 1.605, 0.025]} rotation={[0, -0.35, 0]} scale={[0.45, 1, 0.85]} castShadow material={mat.skin}><sphereGeometry args={[0.04, 10, 10]} /></mesh>
          <mesh position={[0.132, 1.605, 0.025]} rotation={[0, 0.35, 0]} scale={[0.45, 1, 0.85]} castShadow material={mat.skin}><sphereGeometry args={[0.04, 10, 10]} /></mesh>
          <mesh position={[-0.138, 1.566, 0.022]} rotation={[0, Math.PI / 2, 0]} castShadow material={mat.gold}><torusGeometry args={[0.026, 0.004, 6, 20]} /></mesh>
          <mesh position={[0.138, 1.566, 0.022]} rotation={[0, Math.PI / 2, 0]} castShadow material={mat.gold}><torusGeometry args={[0.026, 0.004, 6, 20]} /></mesh>
          {/* dainty gold choker that HUGS the neck + evil-eye pendant resting on the chest */}
          <mesh position={[0, 1.47, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat.gold}><torusGeometry args={[0.056, 0.005, 6, 28]} /></mesh>
          <mesh position={[0, 1.435, 0.06]} rotation={[0.5, 0, 0]} castShadow material={mat.gold}><cylinderGeometry args={[0.004, 0.004, 0.07, 6]} /></mesh>
          <group position={[0, 1.4, 0.088]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow material={mat.gold}><cylinderGeometry args={[0.027, 0.027, 0.007, 18]} /></mesh>
            <mesh position={[0, 0.002, 0]} material={mat.eyeBlue}><cylinderGeometry args={[0.022, 0.022, 0.008, 18]} /></mesh>
            <mesh position={[0, 0.005, 0]} material={mat.eyeWhite}><cylinderGeometry args={[0.013, 0.013, 0.008, 16]} /></mesh>
            <mesh position={[0, 0.008, 0]} material={mat.eyePupil}><cylinderGeometry args={[0.006, 0.006, 0.008, 12]} /></mesh>
          </group>
          {/* dense curly cap (merged) */}
          <mesh geometry={hairCapGeo} castShadow material={mat.hair} />
          {/* all-down ringlet sections (curl volume + hair cards), each sways on its own */}
          {hairSectionGeos.map((geo, i) => (
            <group key={'hs' + i} ref={el => (hairRefs.current[i] = el)} position={[0, 1.6, -0.05]}>
              <mesh geometry={geo} castShadow material={mat.hair} />
            </group>
          ))}
          {/* cherry-maroon ribbon bow ON TOP of the back curls (proud so it's visible) */}
          <group position={[0, 1.59, -0.205]} rotation={[0.2, 0, 0]}>
            {/* two triangular loops, apex meeting at the centre */}
            <mesh position={[-0.08, 0.01, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.32]} castShadow material={mat.bow}><coneGeometry args={[0.065, 0.17, 4]} /></mesh>
            <mesh position={[0.08, 0.01, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.32]} castShadow material={mat.bow}><coneGeometry args={[0.065, 0.17, 4]} /></mesh>
            {/* centre knot */}
            <mesh scale={[1, 1, 0.6]} castShadow material={mat.bow}><boxGeometry args={[0.045, 0.055, 0.05]} /></mesh>
            {/* ribbon tails */}
            <mesh position={[-0.035, -0.11, 0]} rotation={[0, 0, 0.22]} scale={[1, 1, 0.32]} castShadow material={mat.bow}><coneGeometry args={[0.04, 0.16, 4]} /></mesh>
            <mesh position={[0.035, -0.11, 0]} rotation={[0, 0, -0.22]} scale={[1, 1, 0.32]} castShadow material={mat.bow}><coneGeometry args={[0.04, 0.16, 4]} /></mesh>
          </group>
          {/* shoulders pivot; short sleeve cap + bare arm */}
          <group ref={armL} position={[-0.17, 1.43, 0]}>
            <mesh position={[0, -0.05, 0]} castShadow material={mat.shirt}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
            <mesh position={[0, -0.27, 0]} castShadow material={mat.skin}><capsuleGeometry args={[0.04, 0.42, 5, 10]} /></mesh>
          </group>
          <group ref={armR} position={[0.17, 1.43, 0]}>
            <mesh position={[0, -0.05, 0]} castShadow material={mat.shirt}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
            <mesh position={[0, -0.27, 0]} castShadow material={mat.skin}><capsuleGeometry args={[0.04, 0.42, 5, 10]} /></mesh>
          </group>
        </group>
        {/* legs: bare upper leg below the skirt → sock peek → knee-high boot */}
        <group ref={thighL} position={[-0.1, 0.94, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow material={mat.skin}><capsuleGeometry args={[0.062, 0.34, 6, 12]} /></mesh>
          <group ref={shinL} position={[0, -0.48, 0]}>
            {/* small bare bit at the knee + thin sock cuff at the boot top */}
            <mesh position={[0, -0.03, 0]} castShadow material={mat.skin}><capsuleGeometry args={[0.048, 0.05, 5, 10]} /></mesh>
            <mesh position={[0, -0.072, 0]} castShadow material={mat.sock}><cylinderGeometry args={[0.06, 0.06, 0.035, 14]} /></mesh>
            {/* tall slim knee-high riding-boot shaft (tapered) */}
            <mesh position={[0, -0.27, 0]} castShadow material={mat.boot}><cylinderGeometry args={[0.058, 0.046, 0.38, 16]} /></mesh>
            {/* instep + pointed toe + small block heel */}
            <mesh position={[0, -0.45, 0.0]} castShadow material={mat.boot}><boxGeometry args={[0.052, 0.06, 0.1]} /></mesh>
            <mesh position={[0, -0.47, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat.boot}><coneGeometry args={[0.04, 0.13, 12]} /></mesh>
            <mesh position={[0, -0.495, -0.05]} castShadow material={mat.boot}><boxGeometry args={[0.05, 0.07, 0.06]} /></mesh>
            {/* gold COACH label at the TOP of the shaft, outer side */}
            <mesh material={coachMat} position={[-0.061, -0.12, 0.0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.085, 0.022]} /></mesh>
          </group>
        </group>
        <group ref={thighR} position={[0.1, 0.94, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow material={mat.skin}><capsuleGeometry args={[0.062, 0.34, 6, 12]} /></mesh>
          <group ref={shinR} position={[0, -0.48, 0]}>
            <mesh position={[0, -0.03, 0]} castShadow material={mat.skin}><capsuleGeometry args={[0.048, 0.05, 5, 10]} /></mesh>
            <mesh position={[0, -0.072, 0]} castShadow material={mat.sock}><cylinderGeometry args={[0.06, 0.06, 0.035, 14]} /></mesh>
            <mesh position={[0, -0.27, 0]} castShadow material={mat.boot}><cylinderGeometry args={[0.058, 0.046, 0.38, 16]} /></mesh>
            <mesh position={[0, -0.45, 0.0]} castShadow material={mat.boot}><boxGeometry args={[0.052, 0.06, 0.1]} /></mesh>
            <mesh position={[0, -0.47, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat.boot}><coneGeometry args={[0.04, 0.13, 12]} /></mesh>
            <mesh position={[0, -0.495, -0.05]} castShadow material={mat.boot}><boxGeometry args={[0.05, 0.07, 0.06]} /></mesh>
            {/* gold COACH label at the TOP of the shaft, outer side */}
            <mesh material={coachMat} position={[0.061, -0.12, 0.0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.085, 0.022]} /></mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

/* ── DEBUG LOGGER ─────────────────────────────────────────── */
function Logger() {
  const { scene, camera, gl } = useThree()
  useEffect(() => {
    console.log('[Scene] render loop started')
    console.log('[Scene] camera position', camera.position.toArray())
    console.log('[Scene] scene object count', scene.children.length)
    console.log('[Scene] renderer', gl.getContext() ? 'WebGL context OK' : 'NO CONTEXT')
  }, [scene, camera, gl])
  return null
}

/* loads the shared gold-frame geometry ONCE and renders every painting with it */
function Paintings({ items, m }) {
  const frame = useGoldFrame()
  return items.map(it => (
    <Painting key={it.key} position={it.pos} rotation={it.rot} maxW={it.mw} maxH={it.mh} art={it.art} cls={it.cls} frame={frame} m={m} />
  ))
}

/* ── GALLERY ──────────────────────────────────────────────── */
function Gallery() {
  const m = useMaterials()
  const hd = D / 2, hw = W / 2, PY = 3.6
  const A = ARTWORKS
  const pick = i => A[((i % A.length) + A.length) % A.length]

  // procession gallery: central Gothic feature window flanked by paintings on
  // the far wall; Gothic windows on BOTH long walls with paintings between them
  // (WINDOW / PAINTING / WINDOW ... rhythm).
  const art = [34, 20.25, 6.75, -6.75, -20.25, -34]     // between the window bays

  // No paintings on the centre-window wall. Side paintings get the crested
  // "masterpiece" frame SPORADICALLY (≈38% each), so the row varies for realism.
  // Built once (useMemo) so the random assignment is stable across re-renders.
  const items = useMemo(() => {
    let k = 0
    const out = []
    const sideCls = () => (Math.random() < 0.38 ? 2 : 0)   // crested vs plain ornate
    const push = (key, x, z, ry) => {
      const cls = sideCls()
      const mw = cls === 2 ? 2.6 : 2.5, mh = cls === 2 ? 3.7 : 3.5
      out.push({ key, pos: [x, PY, z], rot: [0, ry, 0], mw, mh, art: pick(k++), cls })
    }
    art.forEach((z, i) => push('la' + i, -hw + 0.12, z, Math.PI / 2))
    art.forEach((z, i) => push('ra' + i, hw - 0.12, z, -Math.PI / 2))
    return out
  }, [])

  return (
    <group>
      <Env />
      <Room m={m} />
      <CofferedCeiling m={m} />
      <Trim m={m} />
      <Door m={m} />
      <Suspense fallback={null}><GothicFeature m={m} /></Suspense>
      <Suspense fallback={null}><SideGothicWindows m={m} side={-1} /></Suspense>
      <Suspense fallback={null}><SideGothicWindows m={m} side={1} /></Suspense>
      <Bench m={m} />
      <Suspense fallback={null}><Character /></Suspense>

      <Suspense fallback={null}><Paintings items={items} m={m} /></Suspense>
      {/* curated warm wall-wash spots (kept few for performance) */}
      {[
        { pos: [-hw + 1.0, H - 1.4, 18], tgt: [-hw + 0.1, PY, 18], ry: Math.PI / 2 },
        { pos: [hw - 1.0, H - 1.4, 22], tgt: [hw - 0.1, PY, 22], ry: -Math.PI / 2 },
        { pos: [hw - 1.0, H - 1.4, -6], tgt: [hw - 0.1, PY, -6], ry: -Math.PI / 2 },
        { pos: [hw - 1.0, H - 1.4, -26], tgt: [hw - 0.1, PY, -26], ry: -Math.PI / 2 },
      ].map((l, i) => <PictureLight key={'L' + i} pos={l.pos} target={l.tgt} rotY={l.ry} m={m} />)}

      {/* ContactShadows removed: its finite plane boundary drew a line across the
          longer floor as you moved. Contact darkening now comes from N8AO (covers
          the whole floor uniformly, no boundary/seam). */}
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.8, 12], fov: 68 }}
      gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.98, antialias: true, powerPreference: 'high-performance' }}
      onCreated={() => console.log('[Scene] Canvas created, renderer ready')}
      style={{ width: '100vw', height: '100vh', display: 'block' }}
    >
      <color attach="background" args={['#090806']} />

      {/* Grounding is handled by ContactShadows + N8AO (no shadow-map streak).
          Picture spots create the hierarchy; HDRI + soft fills give bounce. */}
      {/* brighter, balanced fill — daylight via hemisphere + a directional from
          the window wall. Walls keep their green material; only light increases. */}
      {/* RESET: no directional daylight at all — pure soft museum ambient.
          Room lit by ambient + hemisphere + ceiling keys + picture spots. */}
      {/* GRAND OVERCAST SKYLIGHT — bright diffuse daylight, no beams/patches.
          Strong warm-neutral ambient lifts the whole room (walls stay dark green
          via their material; ambient just makes them readable). */}
      <ambientLight intensity={0.95} color="#ede6d6" />
      <hemisphereLight intensity={0.55} color="#e8ecf2" groundColor="#1c160d" />
      {/* soft grazing fill on the centerpiece bay to reveal carving depth */}
      <pointLight position={[-4, CEIL - 2.4, 0]} intensity={8} distance={12} decay={2} color="#f3e0a8" />
      <pointLight position={[4, CEIL - 2.4, 0]} intensity={8} distance={12} decay={2} color="#f3e0a8" />
      {/* CEILING WASH — the ceiling is the brightest architectural element.
          A row of soft warm fills just below the ceiling along the whole hall
          so coffers/carving read from anywhere; light points up into the plaster. */}
      {[-28, -14, 0, 14, 28].map((z, i) => (
        <pointLight key={'cw' + i} position={[0, CEIL - 1.6, z]} intensity={9} distance={16} decay={2} color="#f7e6b0" />
      ))}
      {/* warm keys at the hall ends — fill the room volume */}
      {[-26, 26].map((z, i) => (
        <pointLight key={i} position={[0, CEIL - 4.0, z]} intensity={20} distance={48} color="#f6dd84" />
      ))}
      {/* soft cool OVERCAST DAYLIGHT fills high near the window walls — large,
          gentle, set high so they wash the upper walls + ceiling, not the floor;
          point lights = smooth round gradients, never rectangles/beams */}
      {[-16, 16].flatMap(z => [-1, 1].map(s => (
        <pointLight key={'dl' + s + z} position={[s * (W / 2 - 1.0), 8.6, z]} intensity={4.0} distance={19} decay={2} color="#dde4ee" />
      )))}

      <Gallery />
      <Logger />

      <EffectComposer>
        {/* AO at junctions — half-res + modest radius to stay cheap */}
        <N8AO halfRes aoRadius={1.1} intensity={1.35} />
        {/* bloom only on the lamp lenses */}
        <Bloom intensity={0.08} luminanceThreshold={1.1} luminanceSmoothing={0.2} mipmapBlur />
        {/* airy daylight grade: lifted shadows, compressed contrast, slight desat */}
        <HueSaturation saturation={-0.08} />
        <BrightnessContrast brightness={0.04} contrast={0.02} />
        <Vignette offset={0.3} darkness={0.28} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </Canvas>
  )
}
