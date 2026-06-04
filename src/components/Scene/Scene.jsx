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
  Vector3, Euler, MathUtils, ACESFilmicToneMapping, PCFSoftShadowMap,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { makeLandscapeTexture } from './textures'
import { ARTWORKS, ART_BASE } from '../../data/artworks'

/* ── DIMENSIONS — long rectangular palace gallery (~2:1) ────── */
const W = 18, H = 13.5, D = 78
const CEIL = H
const WALL_T = 0.5                              // wall thickness → real opening depth
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
        if ('environmentIntensity' in scene) scene.environmentIntensity = 0.35
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
      normalScale: new Vector2(1.0, 1.0), envMapIntensity: 0.04,
    }),
    wallSide: new MeshStandardMaterial({
      color: '#ffffff', roughness: 0.82, metalness: 0,
      normalScale: new Vector2(1.0, 1.0), envMapIntensity: 0.04, side: DoubleSide,
    }),
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
    glass: new MeshStandardMaterial({ color: '#aebccb', roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.28, envMapIntensity: 0.12 }),
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
    loadWall('BaseColor.jpg', true, (f, s) => { m.wall.map = f; m.wallSide.map = s; m.wall.needsUpdate = m.wallSide.needsUpdate = true })
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
    run(W, 'x', -D / 2 + proj, 0); run(W, 'x', D / 2 - proj, Math.PI)
    run(D, 'z', -W / 2 + proj, Math.PI / 2); run(D, 'z', W / 2 - proj, -Math.PI / 2)
    return arr
  }
  const dentilM = useMemo(() => perim(0.17, H - 0.36, 0.30), [])
  const eggM = useMemo(() => perim(0.27, H - 0.50, 0.26), [])
  const beadM = useMemo(() => perim(0.14, H - 0.63, 0.16), [])

  const base = (len, pos, rotY = 0) => <mesh position={pos} rotation={[0, rotY, 0]} material={m.trim}><boxGeometry args={[len, 0.20, 0.12]} /></mesh>

  return (
    <group>
      <Cornice len={W} pos={[0, H - 0.06, -D / 2]} rotY={0} />
      <Cornice len={W} pos={[0, H - 0.06, D / 2]} rotY={Math.PI} />
      <Cornice len={D} pos={[-W / 2, H - 0.06, 0]} rotY={Math.PI / 2} />
      <Cornice len={D} pos={[W / 2, H - 0.06, 0]} rotY={-Math.PI / 2} />
      <Instanced geo={dentilGeo} mat={m.trim} matrices={dentilM} />
      <Instanced geo={eggGeo} mat={m.trim} matrices={eggM} />
      <Instanced geo={beadGeo} mat={m.trim} matrices={beadM} />
      {base(W, [0, 0.10, -D / 2 + 0.07])}{base(W, [0, 0.10, D / 2 - 0.07])}
      {base(D, [-W / 2 + 0.07, 0.10, 0], Math.PI / 2)}{base(D, [W / 2 - 0.07, 0.10, 0], Math.PI / 2)}
    </group>
  )
}

/* ── FRAME + REAL PAINTING + soft wall drop-shadow ────────── */
function makeFrameGeo(fw, fh, cw, ch) {
  const s = new Shape([new Vector2(-fw / 2, -fh / 2), new Vector2(fw / 2, -fh / 2), new Vector2(fw / 2, fh / 2), new Vector2(-fw / 2, fh / 2)])
  const hl = new Path([new Vector2(-cw / 2, -ch / 2), new Vector2(cw / 2, -ch / 2), new Vector2(cw / 2, ch / 2), new Vector2(-cw / 2, ch / 2)])
  s.holes.push(hl)
  return new ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.07, bevelSegments: 5 })
}
function Painting({ position, rotation = [0, 0, 0], maxW, maxH, art, m }) {
  const ar = art.aspect
  let pw = maxW, ph = maxW * ar
  if (ph > maxH) { ph = maxH; pw = maxH / ar }
  const fw = pw + 0.36, fh = ph + 0.36
  const geo = useMemo(() => makeFrameGeo(fw, fh, pw + 0.06, ph + 0.06), [fw, fh, pw, ph])
  const artMat = useMemo(() => new MeshStandardMaterial({ color: '#15100a', roughness: 0.85 }), [])
  useEffect(() => {
    new TextureLoader().load(ART_BASE + art.file,
      t => { t.colorSpace = SRGBColorSpace; t.anisotropy = 8; artMat.map = t; artMat.color.set('#ffffff'); artMat.needsUpdate = true; console.log('[art] ok', art.file) },
      undefined, () => console.warn('[art] FAILED (kept dark):', art.file))
  }, [art, artMat])
  return (
    <group position={position} rotation={rotation}>
      {/* soft drop shadow behind frame */}
      <mesh position={[0, -0.06, -0.02]}>
        <planeGeometry args={[fw + 0.24, fh + 0.24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh geometry={geo} material={m.gold} castShadow />
      {/* darker inner crevice */}
      <mesh position={[0, 0, 0.05]} material={m.woodDark}><boxGeometry args={[pw + 0.10, ph + 0.10, 0.02]} /></mesh>
      <mesh position={[0, 0, 0.155]} material={artMat}><planeGeometry args={[pw, ph]} /></mesh>
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

/* far wall: ONE continuous holed surface with the central feature opening */
function BackWall({ m }) {
  const y0 = FEAT_CY - FEAT_H / 2, y1 = FEAT_CY + FEAT_H / 2
  const geo = useMemo(() => holedWallGeo(W, [[0, FEAT_W, y0, y1]]), [])
  return (
    <mesh geometry={geo} position={[0, 0, -D / 2]} rotation={[0, 0, 0]} receiveShadow material={m.wallSide} />
  )
}

/* Ornate gothic frame asset used purely as a CARVED SURROUND: scaled larger
 * than the window and placed just behind it so its ornament peeks around the
 * whole perimeter (crest above the arch, apron below the sill, sides alongside).
 * Its own opening is hidden behind the window — it does NOT define the glass. */
const GOTHIC_FRAME = BASE + 'assets/models/gothic_frame_lo.glb'
const FOREST_URL = BASE + 'assets/scenery/forest.jpg'   // real forest (equirect slice)
const FRAME_OW = 1.239, FRAME_OH = 2.001    // measured outer bbox of the asset
function FrameSurround({ w, h, m }) {
  const { scene } = useGLTF(GOTHIC_FRAME)
  const node = useMemo(() => {
    const root = scene.clone(true)
    const stone = new MeshStandardMaterial({ color: '#e4dece', roughness: 0.86, metalness: 0, side: DoubleSide })
    root.traverse(o => { if (o.isMesh) { o.material = stone; o.frustumCulled = false } })
    root.position.set(0, 0, 0)
    return root
  }, [scene])
  const sx = (w + 1.6) / FRAME_OW            // outer a bit wider than the window
  const sy = (h + 2.4) / FRAME_OH            // taller → crest above, apron below
  const sz = Math.min(sx, sy) * 0.7
  return (
    <group position={[0, 0, -0.12]} scale={[sx, sy, sz]}><primitive object={node} /></group>
  )
}

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
  // real forest backdrop: a unique vertical slice of the equirectangular image
  const forest = useTexture(FOREST_URL)
  const sceneryMat = useMemo(() => {
    const t = forest.clone(); t.needsUpdate = true
    t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(0.18, 0.55); t.offset.set(Math.random() * 0.75, 0.42)   // higher crop: trees + sky, no dirt
    return new MeshBasicMaterial({ map: t, color: '#bcbcbc' })   // slight dim so sky doesn't blow
  }, [forest])
  const tw = Math.min(0.42, w * 0.12)              // trim width
  const iw = w - 2 * tw, ih = h - 2 * tw           // arched opening (glass)
  const spring = 0.6
  const H2 = ih / 2, W2 = iw / 2, sy = -H2 + spring * ih   // arch spring line
  const mull = 0.055

  const glassGeo = useMemo(() => new ShapeGeometry(pointedArch(iw * 0.99, ih * 0.99, spring)), [iw, ih])
  const trimGeo = useMemo(() => {
    const o = new Shape()
    o.moveTo(-w / 2, -h / 2); o.lineTo(w / 2, -h / 2); o.lineTo(w / 2, h / 2); o.lineTo(-w / 2, h / 2); o.lineTo(-w / 2, -h / 2)
    o.holes.push(pointedArch(iw, ih, spring))
    return new ExtrudeGeometry(o, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.07, bevelSegments: 2 })
  }, [w, h, iw, ih])
  const innerGeo = useMemo(() => {           // recessed reveal band for depth
    const o = new Shape(); const a = 0.13
    o.moveTo(-(iw / 2 + a), -(ih / 2 + a)); o.lineTo((iw / 2 + a), -(ih / 2 + a)); o.lineTo((iw / 2 + a), (ih / 2 + a)); o.lineTo(-(iw / 2 + a), (ih / 2 + a)); o.lineTo(-(iw / 2 + a), -(ih / 2 + a))
    o.holes.push(pointedArch(iw - 0.04, ih - 0.04, spring))
    return new ExtrudeGeometry(o, { depth: 0.16, bevelEnabled: false })
  }, [iw, ih])

  const cols = 3, vx = [-W2 + iw / cols, -W2 + 2 * iw / cols]   // two vertical mullions
  const straightH = sy + H2                                     // straight (sash) region height
  const transoms = [-H2 + straightH * 0.33, -H2 + straightH * 0.66, sy]   // sash rails + spring transom
  const arcR = (H2 - sy) * 0.30
  return (
    <group>
      {/* ornate gothic carved surround wrapping the window perimeter */}
      <FrameSurround w={w} h={h} m={m} />
      {/* real forest just behind the glass — sized to the opening (no leak) */}
      <mesh position={[0, 0, -WALL_T - 0.35]} material={sceneryMat}><planeGeometry args={[w * 1.25, h * 1.15]} /></mesh>
      {/* arched glass filling the opening */}
      <mesh geometry={glassGeo} position={[0, 0, -0.30]} material={m.glass} />
      {/* mullions: 2 verticals up to the spring, sash transoms, central mullion into
          the arch, two Y-tracery bars, and an oculus — all inside the glass */}
      {vx.map((x, i) => <mesh key={'v' + i} position={[x, (-H2 + sy) / 2, -0.26]} material={m.trimWhite}><boxGeometry args={[mull, straightH, 0.05]} /></mesh>)}
      {transoms.map((y, i) => <mesh key={'t' + i} position={[0, y, -0.26]} material={m.trimWhite}><boxGeometry args={[iw - 0.04, mull, 0.05]} /></mesh>)}
      <mesh position={[0, (sy + H2) / 2, -0.26]} material={m.trimWhite}><boxGeometry args={[mull, H2 - sy, 0.05]} /></mesh>
      <mesh position={[-W2 * 0.34, sy + (H2 - sy) * 0.45, -0.26]} rotation={[0, 0, 0.5]} material={m.trimWhite}><boxGeometry args={[mull, (H2 - sy) * 0.9, 0.05]} /></mesh>
      <mesh position={[W2 * 0.34, sy + (H2 - sy) * 0.45, -0.26]} rotation={[0, 0, -0.5]} material={m.trimWhite}><boxGeometry args={[mull, (H2 - sy) * 0.9, 0.05]} /></mesh>
      <mesh position={[0, sy + (H2 - sy) * 0.5, -0.26]} material={m.trimWhite}><torusGeometry args={[arcR, mull * 0.7, 8, 20]} /></mesh>
      {/* recessed reveal + carved stone surround at the room face */}
      <mesh geometry={innerGeo} position={[0, 0, -0.18]} material={m.trim} />
      <mesh geometry={trimGeo} position={[0, 0, -0.02]} material={m.trim} castShadow />
      {/* side colonnettes (slim shafts on the jambs) */}
      {[-1, 1].map(s => <mesh key={'c' + s} position={[s * (iw / 2 + tw * 0.5), 0, 0.06]} material={m.trim}><cylinderGeometry args={[tw * 0.32, tw * 0.32, h * 0.96, 10]} /></mesh>)}
      {/* hood mould over the arch + apex finial */}
      <mesh position={[0, H2 + tw * 0.4, 0.04]} material={m.trim}><torusGeometry args={[W2 + tw * 0.4, 0.06, 8, 22, Math.PI]} /></mesh>
      <mesh position={[0, h / 2 + 0.02, 0.08]} material={m.trim}><coneGeometry args={[0.13, 0.46, 8]} /></mesh>
      {/* projecting sill */}
      <mesh position={[0, -h / 2 + 0.04, 0.18]} material={m.trim}><boxGeometry args={[w + 0.4, 0.16, 0.42]} /></mesh>
    </group>
  )
}

/* far-wall monumental Gothic window */
function GothicFeature({ m }) {
  return (
    <group position={[0, FEAT_CY, -D / 2 + 0.04]}>
      <MuseumWindow w={FEAT_W} h={FEAT_H} m={m} />
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

/* ── CHARACTER + CAMERA (lower, wider, cinematic) ─────────── */
const _fwd = new Vector3(), _off = new Vector3(), _ct = new Vector3()
const _sc = new Vector3(0, 3.4, 11)
function Character({ m }) {
  const g = useRef(); const keys = useRef({}); const vel = useRef({ fwd: 0, rot: 0 })
  const pitch = useRef(0)   // look up/down offset (radians-ish)
  useEffect(() => {
    const dn = e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault(); keys.current[e.key] = true }
    const up = e => { keys.current[e.key] = false }
    // drag vertically to look up/down (also Q/E keys)
    let dragging = false, lastY = 0
    const pdn = e => { dragging = true; lastY = e.clientY }
    const pmv = e => { if (!dragging) return; pitch.current = MathUtils.clamp(pitch.current + (lastY - e.clientY) * 0.004, -0.5, 1.8); lastY = e.clientY }
    const pup = () => { dragging = false }
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    window.addEventListener('pointerdown', pdn); window.addEventListener('pointermove', pmv); window.addEventListener('pointerup', pup)
    return () => {
      window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up)
      window.removeEventListener('pointerdown', pdn); window.removeEventListener('pointermove', pmv); window.removeEventListener('pointerup', pup)
    }
  }, [])
  useFrame(({ camera }) => {
    if (!g.current) return
    const ch = g.current, k = keys.current, v = vel.current
    if (k['ArrowLeft'] || k['a'] || k['A']) v.rot += 0.0032
    if (k['ArrowRight'] || k['d'] || k['D']) v.rot -= 0.0032
    v.rot = MathUtils.clamp(v.rot * 0.8, -0.034, 0.034); ch.rotation.y += v.rot
    const up = k['ArrowUp'] || k['w'] || k['W'], dn = k['ArrowDown'] || k['s'] || k['S']
    if (up) v.fwd += 0.006; else if (dn) v.fwd -= 0.006; else v.fwd *= 0.82
    v.fwd = MathUtils.clamp(v.fwd, -0.075, 0.075)
    // look up/down: Q / E (hold), or drag the mouse vertically
    if (k['q'] || k['Q']) pitch.current = MathUtils.clamp(pitch.current + 0.025, -0.5, 1.8)
    if (k['e'] || k['E']) pitch.current = MathUtils.clamp(pitch.current - 0.025, -0.5, 1.8)
    _fwd.set(-Math.sin(ch.rotation.y), 0, -Math.cos(ch.rotation.y))
    ch.position.addScaledVector(_fwd, v.fwd)
    ch.position.x = MathUtils.clamp(ch.position.x, -W / 2 + 0.5, W / 2 - 0.5)
    ch.position.z = MathUtils.clamp(ch.position.z, -D / 2 + 0.5, D / 2 - 0.5)
    ch.position.y = 0
    // camera lifts a little when looking up, so the view tilts toward the ceiling
    _off.set(0, 2.4 + pitch.current * 1.2, 9.6).applyEuler(new Euler(0, ch.rotation.y, 0)).add(ch.position)
    _off.x = MathUtils.clamp(_off.x, -W / 2 + 0.5, W / 2 - 0.5)
    _off.z = MathUtils.clamp(_off.z, -D / 2 + 0.5, D / 2 - 0.5)
    _off.y = MathUtils.clamp(_off.y, 1.0, CEIL - 0.5)
    _sc.lerp(_off, 0.07); camera.position.copy(_sc)
    // raise the look target with pitch → look up at the ceiling
    _ct.set(ch.position.x, ch.position.y + 2.2 + pitch.current * 5.5, ch.position.z)
    camera.lookAt(_ct)
  })
  return (
    <group ref={g} position={[0, 0, 3]}>
      <mesh position={[0, 1.78, 0]} castShadow material={m.skin}><sphereGeometry args={[0.17, 16, 16]} /></mesh>
      <mesh position={[0, 1.24, 0]} castShadow material={m.coat}><capsuleGeometry args={[0.15, 0.42, 4, 8]} /></mesh>
      <mesh position={[0, 0.78, 0]} castShadow material={m.coat}><cylinderGeometry args={[0.16, 0.24, 0.56, 12]} /></mesh>
      <mesh position={[-0.10, 0.42, 0.05]} castShadow material={m.coat}><capsuleGeometry args={[0.075, 0.5, 4, 6]} /></mesh>
      <mesh position={[0.10, 0.42, -0.05]} castShadow material={m.coat}><capsuleGeometry args={[0.075, 0.5, 4, 6]} /></mesh>
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

/* ── GALLERY ──────────────────────────────────────────────── */
function Gallery() {
  const m = useMaterials()
  const hd = D / 2, hw = W / 2, PY = 3.6
  const A = ARTWORKS
  const pick = i => A[((i % A.length) + A.length) % A.length]

  // procession gallery: central Gothic feature window flanked by paintings on
  // the far wall; Gothic windows on BOTH long walls with paintings between them
  // (WINDOW / PAINTING / WINDOW ... rhythm).
  const back = [-6, 6]                                  // flank the feature window
  const art = [34, 20.25, 6.75, -6.75, -20.25, -34]     // between the window bays

  let k = 0
  const items = []
  back.forEach((x, i) => items.push({ key: 'b' + i, pos: [x, PY, -hd + 0.12], rot: [0, 0, 0], mw: 2.6, mh: 3.6, art: pick(k++) }))
  art.forEach((z, i) => items.push({ key: 'la' + i, pos: [-hw + 0.12, PY, z], rot: [0, Math.PI / 2, 0], mw: 2.4, mh: 3.4, art: pick(k++) }))
  art.forEach((z, i) => items.push({ key: 'ra' + i, pos: [hw - 0.12, PY, z], rot: [0, -Math.PI / 2, 0], mw: 2.4, mh: 3.4, art: pick(k++) }))

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
      <Character m={m} />

      {items.map(it => <Painting key={it.key} position={it.pos} rotation={it.rot} maxW={it.mw} maxH={it.mh} art={it.art} m={m} />)}
      {/* curated warm wall-wash spots (kept few for performance) */}
      {[
        { pos: [-6, H - 1.4, -hd + 1.0], tgt: [-6, PY, -hd + 0.1], ry: 0 },
        { pos: [6, H - 1.4, -hd + 1.0], tgt: [6, PY, -hd + 0.1], ry: 0 },
        { pos: [-hw + 1.0, H - 1.4, 18], tgt: [-hw + 0.1, PY, 18], ry: Math.PI / 2 },
        { pos: [hw - 1.0, H - 1.4, 22], tgt: [hw - 0.1, PY, 22], ry: -Math.PI / 2 },
        { pos: [hw - 1.0, H - 1.4, -6], tgt: [hw - 0.1, PY, -6], ry: -Math.PI / 2 },
        { pos: [hw - 1.0, H - 1.4, -26], tgt: [hw - 0.1, PY, -26], ry: -Math.PI / 2 },
      ].map((l, i) => <PictureLight key={'L' + i} pos={l.pos} target={l.tgt} rotY={l.ry} m={m} />)}

      <ContactShadows position={[0, 0.012, 0]} scale={Math.max(W, D) * 0.6} resolution={1024} far={6} blur={2.4} opacity={0.55} color="#000000" />
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.8, 12], fov: 68 }}
      gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.92, antialias: true, powerPreference: 'high-performance' }}
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
      <ambientLight intensity={0.5} color="#f0d884" />
      <hemisphereLight intensity={0.66} color="#f1ead8" groundColor="#1a130c" />
      {/* soft grazing fill on the centerpiece bay to reveal carving depth
          (distance-limited so it does not wash the rest of the ceiling) */}
      <pointLight position={[-4, CEIL - 2.4, 0]} intensity={7} distance={11} decay={2} color="#f3e0a8" />
      <pointLight position={[4, CEIL - 2.4, 0]} intensity={7} distance={11} decay={2} color="#f3e0a8" />
      {/* warm keys only at the hall ENDS, dropped well below the ceiling so
          they never burn hotspots onto the ceiling near the centerpiece */}
      {[-26, 26].map((z, i) => (
        <pointLight key={i} position={[0, CEIL - 4.5, z]} intensity={26} distance={48} color="#f6dd84" />
      ))}

      <Gallery />
      <Logger />

      <EffectComposer>
        {/* AO at junctions — half-res + modest radius to stay cheap */}
        <N8AO halfRes aoRadius={1.1} intensity={2.3} />
        {/* bloom only on the lamp lenses */}
        <Bloom intensity={0.08} luminanceThreshold={1.1} luminanceSmoothing={0.2} mipmapBlur />
        {/* cinematic grade: lower brightness, more contrast, desaturate slightly */}
        <HueSaturation saturation={-0.10} />
        <BrightnessContrast brightness={-0.03} contrast={0.12} />
        <Vignette offset={0.24} darkness={0.5} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </Canvas>
  )
}
