/**
 * Procedural ORNAMENT maps — the one thing real PBR scans can't give us:
 * baroque ceiling plasterwork and carved frame relief.
 *
 * Pipeline: draw a grayscale HEIGHT field → bake a true normal map (Sobel)
 * + a displacement map (the height itself, for real geometric relief on
 * subdivided geometry) + an AO map (blurred height, recesses darkened).
 *
 * Walls, floor, and paintings use real downloaded assets (see Scene.jsx).
 */

import { CanvasTexture, RepeatWrapping, ClampToEdgeWrapping, SRGBColorSpace } from 'three'

export function prng(seed) {
  let s = (seed >>> 0) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff }
}

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

/* ── Height field → normal map (Sobel) ────────────────────── */
export function heightToNormal(src, strength = 3.0, wrap = ClampToEdgeWrapping) {
  const w = src.width, h = src.height
  const sd = src.getContext('2d').getImageData(0, 0, w, h).data
  const out = canvas(w, h)
  const od = out.getContext('2d').createImageData(w, h)
  const at = (x, y) => { x = (x + w) % w; y = (y + h) % h; return sd[(y * w + x) * 4] / 255 }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength
      let nx = dx, ny = dy, nz = 1
      const l = Math.hypot(nx, ny, nz) || 1
      const i = (y * w + x) * 4
      od.data[i] = (nx / l * 0.5 + 0.5) * 255
      od.data[i + 1] = (ny / l * 0.5 + 0.5) * 255
      od.data[i + 2] = (nz / l * 0.5 + 0.5) * 255
      od.data[i + 3] = 255
    }
  }
  out.getContext('2d').putImageData(od, 0, 0)
  const t = new CanvasTexture(out); t.wrapS = t.wrapT = wrap
  return t
}

function tex(cv, wrap = ClampToEdgeWrapping, srgb = false) {
  const t = new CanvasTexture(cv); t.wrapS = t.wrapT = wrap
  if (srgb) t.colorSpace = SRGBColorSpace
  return t
}

/* ════════════════════════════════════════════════════════════
 * AGED WALNUT FLOOR — full-floor composite built from the real scan.
 * Each plank samples a DIFFERENT random crop (flipped/offset) of the
 * scan, then gets its own tint + roughness, so no two boards match and
 * there is zero tiling repetition. Character (knots, mineral streaks,
 * scratch clusters, worn polish paths, seams, end-joints, discolouration)
 * is layered across the whole floor. Returns aligned map/normal/roughness.
 * `img` = loaded HTMLImageElement of the scan's Color map.
 * ════════════════════════════════════════════════════════════ */
export function buildAgedFloorMaps(img) {
  const S = 2048
  const aC = canvas(S, S), hC = canvas(S, S), rC = canvas(S, S), oC = canvas(S, S)
  const a = aC.getContext('2d'), h = hC.getContext('2d'), r = rC.getContext('2d'), o = oC.getContext('2d')
  const rng = prng(20260603)
  const cl = v => Math.max(0, Math.min(255, v | 0))
  const gray = v => { const c = cl(v); return `rgb(${c},${c},${c})` }
  const iw = img.width, ih = img.height

  a.fillStyle = '#160c05'; a.fillRect(0, 0, S, S)   // albedo
  h.fillStyle = '#808080'; h.fillRect(0, 0, S, S)   // height (mid = flat)
  r.fillStyle = '#888888'; r.fillRect(0, 0, S, S)   // roughness
  o.fillStyle = '#ffffff'; o.fillRect(0, 0, S, S)   // AO (white = open)

  // ── WIDE MANOR PLANKS — each a unique crop, with cupping + clustered character ──
  let x = 0
  const planks = []
  while (x < S) {
    let pw = Math.floor(110 + rng() * 80); if (x + pw > S) pw = S - x
    planks.push([x, pw]); x += pw
  }
  for (const [px, pw] of planks) {
    // unique wood crop (random region, scale, flip)
    const sw = Math.min(iw - 2, Math.floor(pw * (0.7 + rng() * 0.9)))
    const sx = Math.floor(rng() * (iw - sw - 1))
    const flip = rng() < 0.5
    a.save(); a.beginPath(); a.rect(px, 0, pw, S); a.clip()
    if (flip) { a.translate(px + pw, 0); a.scale(-1, 1); a.drawImage(img, sx, 0, sw, ih, 0, 0, pw, S) }
    else a.drawImage(img, sx, 0, sw, ih, px, 0, pw, S)
    a.restore()

    // per-plank tint (warm/cool, light/dark)
    const lum = 0.70 + rng() * 0.58, warm = rng() * 0.26 - 0.08
    a.globalCompositeOperation = 'multiply'
    a.fillStyle = `rgb(${cl(255 * lum * (1 + warm))},${cl(255 * lum)},${cl(255 * lum * (1 - warm * 0.9))})`
    a.fillRect(px, 0, pw, S); a.globalCompositeOperation = 'source-over'

    // per-plank roughness (polished vs matte)
    r.fillStyle = gray(255 * (0.34 + rng() * 0.30)); r.fillRect(px, 0, pw, S)

    // HEIGHT: per-plank base offset + cupping gradient across the width
    const base = 128 + (rng() * 36 - 18)
    const cup = 14 + rng() * 26
    const concave = rng() < 0.5
    const g = h.createLinearGradient(px, 0, px + pw, 0)
    if (concave) { g.addColorStop(0, gray(base + cup)); g.addColorStop(0.5, gray(base - cup)); g.addColorStop(1, gray(base + cup)) }
    else { g.addColorStop(0, gray(base - cup)); g.addColorStop(0.5, gray(base + cup)); g.addColorStop(1, gray(base - cup)) }
    h.fillStyle = g; h.fillRect(px, 0, pw, S)

    // SEAM at right edge: deep groove in height, dark in albedo + AO, rough
    const sxr = px + pw
    h.fillStyle = gray(40); h.fillRect(sxr - 2, 0, 3, S)
    a.fillStyle = 'rgba(0,0,0,0.6)'; a.fillRect(sxr - 2, 0, 2.5, S)
    a.fillStyle = 'rgba(0,0,0,0.22)'; a.fillRect(sxr - 5, 0, 3, S)
    o.fillStyle = 'rgba(0,0,0,0.55)'; o.fillRect(sxr - 4, 0, 5, S)
    r.fillStyle = 'rgba(34,34,34,1)'; r.fillRect(sxr - 2, 0, 2, S)

    // END-JOINTS (cross seams) — grooves
    const joints = 1 + (rng() * 2 | 0)
    for (let j = 0; j < joints; j++) {
      const jy = Math.floor(rng() * S)
      h.fillStyle = gray(46); h.fillRect(px, jy, pw, 2)
      a.fillStyle = 'rgba(0,0,0,0.5)'; a.fillRect(px, jy, pw, 2)
      o.fillStyle = 'rgba(0,0,0,0.4)'; o.fillRect(px, jy - 1, pw, 3)
    }

    // CLUSTERED KNOTS — most planks few, some planks many
    const knotN = rng() < 0.32 ? (4 + (rng() * 6 | 0)) : (rng() < 0.5 ? 1 : 0)
    for (let kk = 0; kk < knotN; kk++) {
      const kx = px + 6 + rng() * (pw - 12), ky = rng() * S, kr = 3 + rng() * 17
      const gr = a.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.4)
      gr.addColorStop(0, 'rgba(2,1,0,0.97)'); gr.addColorStop(0.45, 'rgba(12,6,2,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      a.fillStyle = gr; a.beginPath(); a.ellipse(kx, ky, kr * (0.5 + rng()), kr * 1.7, rng() * 3, 0, 7); a.fill()
      // knot dips in height + AO
      const gh = h.createRadialGradient(kx, ky, 0, kx, ky, kr * 1.6)
      gh.addColorStop(0, gray(70)); gh.addColorStop(1, gray(base)); h.fillStyle = gh
      h.beginPath(); h.ellipse(kx, ky, kr, kr * 1.5, 0, 0, 7); h.fill()
      o.fillStyle = 'rgba(0,0,0,0.35)'; o.beginPath(); o.ellipse(kx, ky, kr * 1.4, kr * 2, 0, 0, 7); o.fill()
    }

    // TINY NAIL HOLES near plank ends (some planks)
    if (rng() < 0.4) {
      for (const ny of [10 + rng() * 30, S - 10 - rng() * 30]) {
        const nx = px + 8 + rng() * (pw - 16)
        a.fillStyle = 'rgba(0,0,0,0.6)'; a.beginPath(); a.arc(nx, ny, 1.6, 0, 7); a.fill()
        h.fillStyle = gray(90); h.beginPath(); h.arc(nx, ny, 1.6, 0, 7); h.fill()
      }
    }
  }

  // ── MINERAL STREAKS (along grain) ──
  for (let i = 0; i < 160; i++) {
    a.strokeStyle = `rgba(0,0,0,${0.05 + rng() * 0.18})`; a.lineWidth = 0.5 + rng() * 1.5
    let mx = rng() * S, my = rng() * S; a.beginPath(); a.moveTo(mx, my)
    for (let k = 0; k < 6; k++) { my += 20 + rng() * 70; a.lineTo(mx + (rng() - 0.5) * 8, my) }
    a.stroke()
  }
  // ── SCRATCH CLUSTERS ──
  for (let c2 = 0; c2 < 38; c2++) {
    const cxp = rng() * S, cyp = rng() * S, n = 3 + (rng() * 6 | 0)
    for (let s = 0; s < n; s++) {
      const lite = rng() < 0.5
      a.strokeStyle = lite ? `rgba(220,200,170,${0.04 + rng() * 0.06})` : `rgba(0,0,0,${0.05 + rng() * 0.08})`
      a.lineWidth = 0.5; const ang = rng() * 0.7 - 0.35, len = 10 + rng() * 44
      const ox = cxp + (rng() - 0.5) * 55, oy = cyp + (rng() - 0.5) * 55
      a.beginPath(); a.moveTo(ox, oy); a.lineTo(ox + Math.cos(ang) * len, oy + Math.sin(ang) * len); a.stroke()
    }
  }
  // ── WORN POLISH PATHS (lighter albedo + smoother roughness) ──
  for (let i = 0; i < 10; i++) {
    const wx = S * (0.28 + rng() * 0.44), wy = S * rng(), wr = 130 + rng() * 300
    const g = a.createRadialGradient(wx, wy, 0, wx, wy, wr)
    g.addColorStop(0, 'rgba(120,95,60,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    a.fillStyle = g; a.beginPath(); a.ellipse(wx, wy, wr * 0.65, wr, 0, 0, 7); a.fill()
    const gr = r.createRadialGradient(wx, wy, 0, wx, wy, wr)
    gr.addColorStop(0, 'rgba(60,60,60,0.6)'); gr.addColorStop(1, 'rgba(128,128,128,0)')
    r.fillStyle = gr; r.beginPath(); r.ellipse(wx, wy, wr * 0.65, wr, 0, 0, 7); r.fill()
  }
  // ── DISCOLOURATION ──
  for (let i = 0; i < 46; i++) {
    const dx = rng() * S, dy = rng() * S, dr = 40 + rng() * 130, dark = rng() < 0.5
    const g = a.createRadialGradient(dx, dy, 0, dx, dy, dr)
    g.addColorStop(0, dark ? 'rgba(0,0,0,0.10)' : 'rgba(95,72,46,0.09)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    a.fillStyle = g; a.beginPath(); a.arc(dx, dy, dr, 0, 7); a.fill()
  }

  // espresso tone + edge vignette
  a.globalCompositeOperation = 'multiply'; a.fillStyle = '#5e4530'; a.fillRect(0, 0, S, S)
  a.globalCompositeOperation = 'source-over'
  const v = a.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.78)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.22)')
  a.fillStyle = v; a.fillRect(0, 0, S, S)

  return {
    map: tex(aC, ClampToEdgeWrapping, true),
    normal: heightToNormal(hC, 2.6),     // strong, from real height field (seams/cupping/knots)
    roughnessMap: tex(rC, ClampToEdgeWrapping),
    aoMap: tex(oC, ClampToEdgeWrapping),
  }
}

/* ════════════════════════════════════════════════════════════
 * CEILING — baroque plaster height field → normal/disp/ao/color
 * ════════════════════════════════════════════════════════════ */
export function makeCeilingMaps() {
  const S = 1024
  const ht = canvas(S, S)
  const h = ht.getContext('2d')
  // base plane height = mid gray
  h.fillStyle = '#6e6e6e'; h.fillRect(0, 0, S, S)
  h.lineJoin = 'round'; h.lineCap = 'round'

  const cx = S / 2, cy = S / 2
  const RAISE = '#d8d8d8'        // raised plaster
  const HIGH  = '#f4f4f4'        // tallest details
  const GROOVE = '#3a3a3a'       // recessed channels

  const fillRect = (x, y, w, hh, c) => { h.fillStyle = c; h.fillRect(x, y, w, hh) }
  const ellipse  = (x, y, rx, ry, rot, c) => { h.save(); h.fillStyle = c; h.beginPath(); h.ellipse(x, y, rx, ry, rot, 0, 7); h.fill(); h.restore() }
  const ringStroke = (x, y, r, lw, c) => { h.strokeStyle = c; h.lineWidth = lw; h.beginPath(); h.arc(x, y, r, 0, 7); h.stroke() }

  // 1. Outer border band
  const m1 = 36
  fillRect(m1, m1, S - 2 * m1, 26, RAISE)
  fillRect(m1, S - m1 - 26, S - 2 * m1, 26, RAISE)
  fillRect(m1, m1, 26, S - 2 * m1, RAISE)
  fillRect(S - m1 - 26, m1, 26, S - 2 * m1, RAISE)
  // egg-and-dart on top & bottom border
  const eggRow = (yc) => {
    for (let x = m1 + 30; x < S - m1 - 20; x += 30) {
      ellipse(x, yc, 9, 6, 0, HIGH)
      h.fillStyle = HIGH; h.beginPath(); h.moveTo(x + 15, yc - 7); h.lineTo(x + 18, yc + 7); h.lineTo(x + 12, yc + 7); h.closePath(); h.fill()
    }
  }
  eggRow(m1 + 13); eggRow(S - m1 - 13)

  // 2. Inner panel border + bead row
  const m2 = 150
  ;[[m2, m2, S - 2 * m2, 16], [m2, S - m2 - 16, S - 2 * m2, 16], [m2, m2, 16, S - 2 * m2], [S - m2 - 16, m2, 16, S - 2 * m2]]
    .forEach(([x, y, w, hh]) => fillRect(x, y, w, hh, RAISE))
  const beads = (horiz, fixed) => {
    for (let p = m2 + 20; p < S - m2 - 12; p += 15) {
      const x = horiz ? p : fixed, y = horiz ? fixed : p
      ellipse(x, y, 5, 5, 0, HIGH)
    }
  }
  beads(true, m2 + 28); beads(true, S - m2 - 28); beads(false, m2 + 28); beads(false, S - m2 - 28)

  // 3. Corner scroll cartouches
  const corner = (ox, oy, sx, sy) => {
    h.save(); h.translate(ox, oy); h.scale(sx, sy)
    ringStroke(0, 0, 44, 14, RAISE)
    ringStroke(0, 0, 26, 10, RAISE)
    ellipse(0, 0, 11, 11, 0, HIGH)
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.5
      ellipse(Math.cos(a) * 70, Math.sin(a) * 70, 26, 10, a, RAISE)
    }
    h.restore()
  }
  const cc = m2 + 84
  corner(cc, cc, 1, 1); corner(S - cc, cc, -1, 1); corner(cc, S - cc, 1, -1); corner(S - cc, S - cc, -1, -1)

  // 4. Swags at border midpoints
  const swag = (xc, yc) => {
    h.strokeStyle = RAISE; h.lineWidth = 16; h.beginPath()
    h.ellipse(xc, yc, 190, 22, 0, 0.25, Math.PI - 0.25); h.stroke()
    for (let i = -3; i <= 3; i++) ellipse(xc + i * 52, yc + 14 - Math.abs(i) * 3, 9, 15, 0, HIGH)
  }
  swag(cx, m2 + 44); swag(cx, S - m2 - 44)

  // 5. CENTRAL MEDALLION
  ringStroke(cx, cy, 300, 20, RAISE)
  ringStroke(cx, cy, 274, 9, HIGH)
  // radiating acanthus
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2
    ellipse(cx + Math.cos(a) * 230, cy + Math.sin(a) * 230, 15, 40, a + Math.PI / 2, RAISE)
  }
  ringStroke(cx, cy, 190, 16, RAISE)
  // rosette petal rings
  const petals = (r, n, prx, pry, c) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, prx, pry, a + Math.PI / 2, c) } }
  petals(150, 20, 17, 42, HIGH)
  petals(96, 14, 14, 34, RAISE)
  petals(50, 10, 12, 26, HIGH)
  ellipse(cx, cy, 40, 40, 0, HIGH)
  ellipse(cx, cy, 20, 20, 0, '#ffffff')
  // grooves for crisp separation
  ringStroke(cx, cy, 300, 3, GROOVE)
  ringStroke(cx, cy, 190, 3, GROOVE)

  // round everything into smooth plaster relief
  h.filter = 'blur(2.5px)'; h.drawImage(ht, 0, 0); h.filter = 'none'

  // ── Derive maps ──
  const normal = heightToNormal(ht, 2.4)
  const disp   = tex(ht)                       // displacement (grayscale height)

  // albedo: flat warm cream, faint AO darkening in recesses
  const col = canvas(S, S); const c = col.getContext('2d')
  c.fillStyle = '#e8e1d2'; c.fillRect(0, 0, S, S)
  c.globalAlpha = 0.30; c.drawImage(ht, 0, 0)   // height tint → recesses slightly darker
  c.globalAlpha = 1
  const color = tex(col, ClampToEdgeWrapping, true)

  // ao: blurred height (recesses dark)
  const aoC = canvas(S, S); const ac = aoC.getContext('2d')
  ac.filter = 'blur(4px)'; ac.drawImage(ht, 0, 0); ac.filter = 'none'
  const ao = tex(aoC)

  return { color, normal, disp, ao }
}

/* ════════════════════════════════════════════════════════════
 * FRAME — tileable carved-gold ornament (acanthus + bead)
 * ════════════════════════════════════════════════════════════ */
export function makeFrameOrnamentMaps() {
  const S = 256
  const ht = canvas(S, S)
  const h = ht.getContext('2d')
  h.fillStyle = '#707070'; h.fillRect(0, 0, S, S)
  h.lineJoin = h.lineCap = 'round'
  // running acanthus leaves down the strip with carved grooves between
  for (let i = 0; i < S; i += 30) {
    h.fillStyle = '#e6e6e6'
    h.beginPath(); h.ellipse(i + 15, S / 2, 11, S * 0.34, 0, 0, 7); h.fill()
    // leaf vein (raised)
    h.fillStyle = '#fafafa'; h.fillRect(i + 13.5, S * 0.2, 3, S * 0.6)
    // groove between leaves
    h.fillStyle = '#3c3c3c'; h.fillRect(i + 28, 0, 4, S)
    // bead rows at the two edges
    h.fillStyle = '#f2f2f2'
    h.beginPath(); h.arc(i + 15, 20, 6, 0, 7); h.fill()
    h.beginPath(); h.arc(i + 15, S - 20, 6, 0, 7); h.fill()
  }
  h.filter = 'blur(1.6px)'; h.drawImage(ht, 0, 0); h.filter = 'none'

  const normal = heightToNormal(ht, 2.0, RepeatWrapping)
  normal.repeat.set(10, 1)
  return { normal }
}
