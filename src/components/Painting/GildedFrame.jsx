/*
 * Museum-quality carved gilt frame.
 *
 * 3-D technique: feDiffuseLighting + feSpecularLighting treat each ornament
 * group's alpha channel as a height map. Gaussian blur softens the alpha
 * edges into a slope, so directional light creates highlights on raised
 * surfaces and deep shadows in carved recesses — without any manual shading.
 *
 * Light source: azimuth 222°, elevation 36° (upper-left, standard gallery
 * overhead lighting) so highlights read top-left and shadows read bottom-right.
 *
 * Structure per rail (outer → inner):
 *   2 px outer bevel edge
 *   4 px flat plate
 *   10 px egg-and-dart band
 *   3 px ogee cove
 *   7 px running acanthus / leaf-and-tongue
 *   4 px beaded inner liner
 *   RAIL total = 38 px
 *
 * Corner ornament: large acanthus spray + C-scroll volutes + central rosette.
 * Side centres: smaller cartouche rosette + flanking acanthus.
 */

const RAIL = 38
const CW   = 204
const CH   = 264
const FW   = CW + RAIL * 2
const FH   = CH + RAIL * 2

/* Aged gold-leaf palette — 7 tones, all within the gold family */
const G = {
  bright:  '#f6e055',   // direct specular (brightest catch)
  light:   '#ddb030',   // raised surface, good light
  mid:     '#c49828',   // main body
  warm:    '#a88c22',   // warm shadow flank
  dark:    '#7c6c1a',   // deep shadow
  deep:    '#7a5812',   // carved recesses — dark gold, not black
  ground:  '#5e4010',   // deepest shadow — darkest gold, still warm
}

/* ── HELPERS ──────────────────────────────────────────────────────── */
const τ = Math.PI * 2

function pt(cx, cy, r, a) {  // point on circle
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/* ── FILTERS ──────────────────────────────────────────────────────── */
function Filters() {
  return (
    <>
      {/*
       * Main relief filter.
       * stdDeviation 2.8 → ~3 px wide bevel on edges (rounded carving).
       * surfaceScale 8   → significant apparent depth.
       * Composite arithmetic: result = src + 0.55*diffuse - 0.28
       * → bright highlights above base gold, deep shadows below.
       */}
      <filter id="gf-R" colorInterpolationFilters="sRGB"
        x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.8" result="h" />
        <feDiffuseLighting in="h" surfaceScale="8" diffuseConstant="1.1"
          lightingColor="white" result="diff">
          <feDistantLight azimuth="222" elevation="36" />
        </feDiffuseLighting>
        <feSpecularLighting in="h" surfaceScale="8" specularConstant="0.55"
          specularExponent="28" lightingColor="#f8e458" result="spec">
          <feDistantLight azimuth="222" elevation="36" />
        </feSpecularLighting>
        <feComposite in="diff"  in2="SourceAlpha" operator="in" result="dC" />
        <feComposite in="spec"  in2="SourceAlpha" operator="in" result="sC" />
        <feComposite in="SourceGraphic" in2="dC"
          operator="arithmetic" k1="0" k2="1" k3="0.55" k4="-0.28" result="dB" />
        <feBlend in="dB" in2="sC" mode="screen" />
      </filter>

      {/* Bead relief — tighter bevel for small round forms */}
      <filter id="gf-B" colorInterpolationFilters="sRGB"
        x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="h" />
        <feDiffuseLighting in="h" surfaceScale="6" diffuseConstant="1.0"
          lightingColor="white" result="diff">
          <feDistantLight azimuth="222" elevation="42" />
        </feDiffuseLighting>
        <feSpecularLighting in="h" surfaceScale="6" specularConstant="0.5"
          specularExponent="32" lightingColor="#f8e870" result="spec">
          <feDistantLight azimuth="222" elevation="42" />
        </feSpecularLighting>
        <feComposite in="diff" in2="SourceAlpha" operator="in" result="dC" />
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="sC" />
        <feComposite in="SourceGraphic" in2="dC"
          operator="arithmetic" k1="0" k2="1" k3="0.6" k4="-0.30" result="dB" />
        <feBlend in="dB" in2="sC" mode="screen" />
      </filter>

      {/* Egg relief — broader, shallower rounding for large egg forms */}
      <filter id="gf-E" colorInterpolationFilters="sRGB"
        x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="h" />
        <feDiffuseLighting in="h" surfaceScale="9" diffuseConstant="1.0"
          lightingColor="white" result="diff">
          <feDistantLight azimuth="222" elevation="32" />
        </feDiffuseLighting>
        <feSpecularLighting in="h" surfaceScale="9" specularConstant="0.4"
          specularExponent="22" lightingColor="#f8e458" result="spec">
          <feDistantLight azimuth="222" elevation="32" />
        </feSpecularLighting>
        <feComposite in="diff" in2="SourceAlpha" operator="in" result="dC" />
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="sC" />
        <feComposite in="SourceGraphic" in2="dC"
          operator="arithmetic" k1="0" k2="1" k3="0.5" k4="-0.25" result="dB" />
        <feBlend in="dB" in2="sC" mode="screen" />
      </filter>
    </>
  )
}

/* ── RAIL GRADIENTS ───────────────────────────────────────────────── */
function Gradients() {
  return (
    <>
      {/* Horizontal rail — top-lit. R/G kept ≤1.28 throughout so it reads gold not brown */}
      <linearGradient id="gf-rh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#dcc040" />
        <stop offset="18%"  stopColor="#c8a830" />
        <stop offset="45%"  stopColor="#b49028" />
        <stop offset="72%"  stopColor="#a07e22" />
        <stop offset="100%" stopColor="#8c7020" />
      </linearGradient>

      {/* Vertical rail — side-lit */}
      <linearGradient id="gf-rv" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#8c7020" />
        <stop offset="18%"  stopColor="#b09028" />
        <stop offset="50%"  stopColor="#c8a830" />
        <stop offset="82%"  stopColor="#b09028" />
        <stop offset="100%" stopColor="#8c7020" />
      </linearGradient>
    </>
  )
}

/* ── EGG-AND-DART BAND (tiled, horizontal) ────────────────────────── */
function EggAndDart({ x, y, w }) {
  const TILE = 26
  const count = Math.ceil(w / TILE) + 1
  const ey = y + RAIL * 0.45   // egg vertical centre within band
  const bh = RAIL * 0.55       // band height
  return (
    <g>
      {/* Band background trough */}
      <rect x={x} y={y} width={w} height={bh} fill={G.ground} />
      {/* Eggs */}
      {Array.from({ length: count }, (_, i) => {
        const ex = x + i * TILE + TILE * 0.38
        return (
          <g key={i} filter="url(#gf-E)">
            {/* Outer egg shell */}
            <ellipse cx={ex} cy={ey} rx="5.8" ry="7.0" fill={G.light} />
            {/* Highlight zone */}
            <ellipse cx={ex - 1.2} cy={ey - 2} rx="3.2" ry="4.0" fill={G.mid} opacity="0.6" />
          </g>
        )
      })}
      {/* Darts between eggs */}
      {Array.from({ length: count }, (_, i) => {
        const dx = x + i * TILE + TILE * 0.82
        return (
          <g key={i}>
            {/* Dark tongue shape */}
            <path
              d={`M${dx},${y} L${dx + 4},${y + bh * 0.85} L${dx - 4},${y + bh * 0.85} Z`}
              fill={G.deep}
            />
            {/* Slight central ridge on dart */}
            <path
              d={`M${dx},${y + 2} L${dx + 1.5},${y + bh * 0.7} L${dx - 1.5},${y + bh * 0.7} Z`}
              fill={G.dark} opacity="0.8"
            />
          </g>
        )
      })}
      {/* Top edge highlight */}
      <rect x={x} y={y} width={w} height="1.2" fill={G.bright} opacity="0.5" />
      {/* Bottom shadow */}
      <rect x={x} y={y + bh - 1.5} width={w} height="1.5" fill={G.ground} opacity="0.7" />
    </g>
  )
}

/* ── BEAD INNER LINER ─────────────────────────────────────────────── */
function BeadLiner({ x1, y1, x2, y2, horiz }) {
  const len   = horiz ? Math.abs(x2 - x1) : Math.abs(y2 - y1)
  const step  = 6.5
  const count = Math.floor(len / step)
  return (
    <g filter="url(#gf-B)">
      {Array.from({ length: count }, (_, i) => {
        const t  = (i + 0.5) / count
        const bx = horiz ? x1 + t * (x2 - x1) : x1
        const by = horiz ? y1 : y1 + t * (y2 - y1)
        return (
          <g key={i}>
            {/* Bead body */}
            <circle cx={bx} cy={by} r="2.4" fill={G.mid} />
            {/* Highlight on bead */}
            <circle cx={bx - 0.7} cy={by - 0.7} r="0.9" fill={G.bright} opacity="0.75" />
          </g>
        )
      })}
    </g>
  )
}

/* ── LEAF-AND-TONGUE BAND (running acanthus on inner rail zone) ────── */
function LeafTongueBand({ x, y, w }) {
  const TILE = 18
  const count = Math.ceil(w / TILE) + 1
  const bh = RAIL * 0.22
  return (
    <g filter="url(#gf-R)">
      {Array.from({ length: count }, (_, i) => {
        const lx = x + i * TILE
        const ly = y + bh * 0.5
        return (
          <g key={i}>
            {/* Leaf/tongue shape — ovate with pointed tip */}
            <path
              d={`M${lx + 9},${ly}
                  C${lx + 14},${ly - 5} ${lx + 16},${ly - bh * 0.9} ${lx + 9},${ly - bh}
                  C${lx + 2},${ly - bh * 0.9} ${lx + 4},${ly - 5} ${lx + 9},${ly} Z`}
              fill={G.mid}
            />
            {/* Central vein line */}
            <line x1={lx + 9} y1={ly} x2={lx + 9} y2={ly - bh * 0.85}
              stroke={G.deep} strokeWidth="0.8" />
          </g>
        )
      })}
    </g>
  )
}

/* ── CORNER ORNAMENT ──────────────────────────────────────────────── */
/*
 * Pivot = inner corner of frame opening. Local (0,0) = opening corner.
 * Ornament fills the negative-x / negative-y quadrant (the corner square)
 * and projects into both adjacent rails.
 *
 * Contents:
 *   • Two large acanthus lobes along each rail direction
 *   • Two C-scroll volutes flanking the diagonal
 *   • Central 8-petal rosette
 *   • Small berry/blossom details
 */
function CornerOrnament({ x, y, rotate }) {
  const r = RAIL
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>

      {/* ── LAYER 1: deep ground (grooves between leaves) ── */}
      <g>
        {/* Diagonal groove lines giving the appearance of undercutting */}
        <path d={`M-2,-2 C-6,-8 -14,-14 -20,-20 C-26,-26 -${r},-${r*0.85} -${r},-${r}`}
          stroke={G.ground} strokeWidth="2" fill="none" opacity="0.7" />
        <path d={`M-2,-6 C-5,-14 -10,-22 -${r*0.78},-${r}`}
          stroke={G.deep} strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d={`M-6,-2 C-14,-5 -22,-10 -${r},-${r*0.78}`}
          stroke={G.deep} strokeWidth="1.5" fill="none" opacity="0.6" />
      </g>

      {/* ── LAYER 2: main acanthus + scrollwork (carved relief) ── */}
      <g filter="url(#gf-R)">

        {/* === ACANTHUS ALONG HORIZONTAL RAIL (-x direction) === */}

        {/* Lobe 1 — large outer leaf, tip curls */}
        <path fill={G.warm}
          d={`M -3,-10
              C -7,-14 -14,-20 -22,-20
              C -30,-20 -34,-14 -30,-8
              C -26,-2 -18,-3 -12,-7
              C -7,-10 -3,-10 -3,-10 Z`}
        />
        {/* Lobe 1 upper sub-lobe */}
        <path fill={G.mid}
          d={`M -8,-14
              C -12,-18 -18,-22 -24,-20
              C -28,-18 -28,-12 -24,-9
              C -20,-6 -14,-8 -10,-12 Z`}
        />
        {/* Lobe 1 tip curl */}
        <path fill={G.light}
          d={`M -28,-16
              C -32,-20 -34,-18 -32,-14
              C -30,-10 -26,-11 -26,-14 Z`}
        />

        {/* Lobe 2 — inner leaf, closer to pivot */}
        <path fill={G.mid}
          d={`M -3,-6
              C -6,-10 -11,-14 -16,-13
              C -21,-12 -22,-7 -18,-4
              C -14,-1 -8,-3 -5,-6 Z`}
        />
        {/* Lobe 2 secondary lobe */}
        <path fill={G.light}
          d={`M -8,-11
              C -11,-15 -15,-16 -16,-12
              C -17,-8 -13,-6 -10,-8 Z`}
        />

        {/* === ACANTHUS ALONG VERTICAL RAIL (-y direction) === */}

        {/* Mirror of horizontal lobes, rotated 90° in local space */}
        <path fill={G.warm}
          d={`M -10,-3
              C -14,-7 -20,-14 -20,-22
              C -20,-30 -14,-34 -8,-30
              C -2,-26 -3,-18 -7,-12
              C -10,-7 -10,-3 -10,-3 Z`}
        />
        <path fill={G.mid}
          d={`M -14,-8
              C -18,-12 -22,-18 -20,-24
              C -18,-28 -12,-28 -9,-24
              C -6,-20 -8,-14 -12,-10 Z`}
        />
        <path fill={G.light}
          d={`M -16,-28
              C -20,-32 -18,-34 -14,-32
              C -10,-30 -11,-26 -14,-26 Z`}
        />
        <path fill={G.mid}
          d={`M -6,-3
              C -10,-6 -14,-11 -13,-16
              C -12,-21 -7,-22 -4,-18
              C -1,-14 -3,-8 -6,-5 Z`}
        />
        <path fill={G.light}
          d={`M -11,-8
              C -15,-11 -16,-15 -12,-16
              C -8,-17 -6,-13 -8,-10 Z`}
        />

        {/* === C-SCROLL VOLUTES === */}

        {/* Upper-left volute */}
        <path fill={G.mid}
          d={`M -4,-4
              C -6,-9 -10,-14 -16,-16
              C -22,-18 -26,-14 -24,-8
              C -22,-2 -16,-2 -12,-6
              C -8,-10 -10,-14 -14,-14
              C -17,-14 -18,-10 -16,-8 Z`}
        />

        {/* Lower volute / secondary scroll */}
        <path fill={G.warm}
          d={`M -4,-4
              C -8,-6 -14,-8 -18,-14
              C -22,-20 -18,-26 -12,-24
              C -6,-22 -6,-16 -10,-12
              C -14,-8 -18,-10 -18,-14 Z`}
        />

        {/* === CENTRAL ROSETTE === */}

        {/* Outer petal ring */}
        {Array.from({ length: 8 }, (_, i) => {
          const a  = (i / 8) * τ - Math.PI / 8
          const px = -18 + 7.2 * Math.cos(a)
          const py = -18 + 7.2 * Math.sin(a)
          return (
            <ellipse key={i}
              cx={px} cy={py}
              rx="3.8" ry="2.2"
              transform={`rotate(${(i / 8) * 360 - 22.5}, ${px}, ${py})`}
              fill={G.light}
            />
          )
        })}

        {/* Middle petal ring */}
        {Array.from({ length: 8 }, (_, i) => {
          const a  = (i / 8) * τ
          const px = -18 + 4.5 * Math.cos(a)
          const py = -18 + 4.5 * Math.sin(a)
          return (
            <ellipse key={i}
              cx={px} cy={py}
              rx="2.6" ry="1.6"
              transform={`rotate(${(i / 8) * 360}, ${px}, ${py})`}
              fill={G.bright}
            />
          )
        })}

        {/* Centre disk */}
        <circle cx="-18" cy="-18" r="2.8" fill={G.bright} />
        <circle cx="-18" cy="-18" r="1.4" fill={G.light} />

        {/* === SMALL BERRY / BLOSSOM ACCENTS === */}
        <circle cx="-8"  cy="-26" r="1.8" fill={G.light} />
        <circle cx="-26" cy="-8"  r="1.8" fill={G.light} />
        <circle cx="-8"  cy="-8"  r="1.4" fill={G.mid} />
        <circle cx="-30" cy="-18" r="1.5" fill={G.mid} />
        <circle cx="-18" cy="-30" r="1.5" fill={G.mid} />

      </g>

      {/* ── LAYER 3: tight inner-corner scrolls at the sight edge ── */}
      <g filter="url(#gf-R)">
        <path fill={G.mid}
          d={`M -2,-2
              C -4,-5 -3,-9 0,-8
              C 3,-7 4,-3 2,-1 Z`}
        />
        <path fill={G.mid}
          d={`M -2,-2
              C -5,-4 -9,-3 -8,0
              C -7,3 -3,4 -1,2 Z`}
        />
      </g>

    </g>
  )
}

/* ── SIDE CENTRE ORNAMENT ─────────────────────────────────────────── */
function SideCentre({ cx, cy, orient }) {
  const s = orient === 'h' ? 1 : -1
  return (
    <g transform={`translate(${cx},${cy}) ${orient === 'v' ? 'rotate(90)' : ''}`}
      filter="url(#gf-R)">

      {/* Left acanthus lobe */}
      <path fill={G.mid}
        d={`M -2,0
            C -5,-4 -10,-8 -14,-7
            C -18,-6 -18,-1 -14,2
            C -10,5 -5,3 -2,0 Z`}
      />
      <path fill={G.light}
        d={`M -6,-4
            C -9,-8 -13,-9 -13,-6
            C -13,-3 -9,-2 -7,-4 Z`}
      />

      {/* Right acanthus lobe (mirror) */}
      <path fill={G.mid}
        d={`M 2,0
            C 5,-4 10,-8 14,-7
            C 18,-6 18,-1 14,2
            C 10,5 5,3 2,0 Z`}
      />
      <path fill={G.light}
        d={`M 6,-4
            C 9,-8 13,-9 13,-6
            C 13,-3 9,-2 7,-4 Z`}
      />

      {/* Central cartouche rosette */}
      {Array.from({ length: 6 }, (_, i) => {
        const a  = (i / 6) * τ
        const px = 4.5 * Math.cos(a)
        const py = 4.5 * Math.sin(a)
        return (
          <ellipse key={i}
            cx={px} cy={py}
            rx="2.8" ry="1.8"
            transform={`rotate(${(i / 6) * 360}, ${px}, ${py})`}
            fill={G.light}
          />
        )
      })}
      <circle cx="0" cy="0" r="2.2" fill={G.bright} />

    </g>
  )
}

/* ── MAIN COMPONENT ───────────────────────────────────────────────── */
export default function GildedFrame({ children }) {
  const EAD_Y  = 2           // y start of egg-and-dart within top rail
  const LEAF_Y = EAD_Y + RAIL * 0.54 + 3   // y start of leaf-tongue band
  const BEAD_Y = RAIL - 5    // y centre of bead liner (near inner edge)

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      filter: 'drop-shadow(0 18px 52px rgba(0,0,0,0.90)) drop-shadow(0 5px 14px rgba(0,0,0,0.62))',
    }}>
      <svg
        width={FW} height={FH}
        viewBox={`0 0 ${FW} ${FH}`}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <Filters />
          <Gradients />
        </defs>

        {/* ══ RAIL BACKGROUNDS ══════════════════════════════════════ */}
        <rect x={0}       y={0}       width={FW}   height={RAIL}  fill="url(#gf-rh)" />
        <rect x={0}       y={FH-RAIL} width={FW}   height={RAIL}  fill="url(#gf-rh)" />
        <rect x={0}       y={RAIL}    width={RAIL}  height={CH}    fill="url(#gf-rv)" />
        <rect x={FW-RAIL} y={RAIL}    width={RAIL}  height={CH}    fill="url(#gf-rv)" />

        {/* ══ OUTER EDGE BEVEL ════════════════════════════════════= */}
        {/* Top/left bright edge — faces light source */}
        <rect x={0} y={0} width={FW} height={2}   fill={G.bright} opacity="0.75" />
        <rect x={0} y={0} width={2}  height={FH}  fill={G.bright} opacity="0.55" />
        {/* Bottom/right dark edge — faces away from light */}
        <rect x={0}    y={FH-2} width={FW} height={2} fill={G.ground} opacity="0.8" />
        <rect x={FW-2} y={0}    width={2}  height={FH} fill={G.deep}  opacity="0.7" />

        {/* Outer step — thin flat plate after bevel */}
        <rect x={2} y={2} width={FW-4} height={2}   fill={G.light} opacity="0.4" />
        <rect x={2} y={2} width={2}    height={FH-4} fill={G.light} opacity="0.3" />

        {/* ══ EGG-AND-DART ════════════════════════════════════════= */}
        {/* Top rail */}
        <EggAndDart x={RAIL} y={EAD_Y} w={CW} />
        {/* Bottom rail */}
        <EggAndDart x={RAIL} y={FH - EAD_Y - RAIL * 0.55} w={CW} />
        {/* Left rail — rotated */}
        <g transform={`translate(0,${RAIL}) rotate(-90) translate(${-CH},0)`}>
          <EggAndDart x={0} y={EAD_Y} w={CH} />
        </g>
        {/* Right rail — rotated */}
        <g transform={`translate(${FW},${FH-RAIL}) rotate(90) translate(${-CH},0)`}>
          <EggAndDart x={0} y={EAD_Y} w={CH} />
        </g>

        {/* ══ LEAF-AND-TONGUE BAND ════════════════════════════════= */}
        <LeafTongueBand x={RAIL} y={LEAF_Y} w={CW} />
        <g transform={`translate(${FW - RAIL * 0.78},${FH-LEAF_Y-RAIL*0.22}) rotate(180)`}>
          <LeafTongueBand x={0} y={0} w={CW} />
        </g>
        {/* Left/right rails omitted for left+right — corner ornaments dominate there */}

        {/* ══ BEADED INNER LINER ══════════════════════════════════= */}
        {/* Top */}
        <BeadLiner x1={RAIL+4} y1={BEAD_Y} x2={FW-RAIL-4} y2={BEAD_Y} horiz />
        {/* Bottom */}
        <BeadLiner x1={RAIL+4} y1={FH-BEAD_Y} x2={FW-RAIL-4} y2={FH-BEAD_Y} horiz />
        {/* Left */}
        <BeadLiner x1={BEAD_Y} y1={RAIL+4} x2={BEAD_Y} y2={FH-RAIL-4} />
        {/* Right */}
        <BeadLiner x1={FW-BEAD_Y} y1={RAIL+4} x2={FW-BEAD_Y} y2={FH-RAIL-4} />

        {/* Inner sight edge — hairline at opening */}
        <rect x={RAIL}   y={RAIL}   width={CW} height={1} fill={G.deep}  opacity="0.8" />
        <rect x={RAIL}   y={FH-RAIL-1} width={CW} height={1} fill={G.bright} opacity="0.5" />
        <rect x={RAIL}   y={RAIL}   width={1} height={CH} fill={G.deep}  opacity="0.8" />
        <rect x={FW-RAIL-1} y={RAIL} width={1} height={CH} fill={G.bright} opacity="0.4" />

        {/* ══ CORNER ORNAMENTS ════════════════════════════════════= */}
        <CornerOrnament x={RAIL}      y={RAIL}      rotate={0}   />
        <CornerOrnament x={FW-RAIL}   y={RAIL}      rotate={90}  />
        <CornerOrnament x={FW-RAIL}   y={FH-RAIL}   rotate={180} />
        <CornerOrnament x={RAIL}      y={FH-RAIL}   rotate={270} />

        {/* ══ SIDE CENTRE ORNAMENTS ═══════════════════════════════= */}
        <SideCentre cx={FW/2} cy={RAIL/2}    orient="h" />
        <SideCentre cx={FW/2} cy={FH-RAIL/2} orient="h" />
        <SideCentre cx={RAIL/2}    cy={FH/2} orient="v" />
        <SideCentre cx={FW-RAIL/2} cy={FH/2} orient="v" />

        {/* ══ INNER SHADOW (sight edge) ═══════════════════════════= */}
        {/* Subtle dark shadow inside the opening edge */}
        <rect x={RAIL+1} y={RAIL+1} width={CW-2} height={4}
          fill={G.ground} opacity="0.35" />
        <rect x={RAIL+1} y={RAIL+1} width={4} height={CH-2}
          fill={G.ground} opacity="0.25" />

      </svg>

      {/* Canvas */}
      <div style={{ margin: RAIL, width: CW, height: CH, position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
