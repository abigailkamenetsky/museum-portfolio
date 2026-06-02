/*
 * Baroque gilded frame — SVG scrollwork on a dark substrate.
 *
 * Architecture: near-black base rects for all rails, then gold
 * scroll ornaments drawn as thick stroked paths layered on top.
 * Each scroll uses a dark backing stroke + gold surface stroke so
 * the carved channel appears between adjacent scrolls automatically.
 *
 * Reference: the flowing C-scroll / S-scroll baroque style with
 * spiral termini, multiple overlapping elements per corner, and
 * large side flourishes.
 */

const RAIL = 34
const CW   = 204
const CH   = 264
const FW   = CW + RAIL * 2
const FH   = CH + RAIL * 2

/* ── GOLD PALETTE — warm antique gold, clearly gilded, not brass ──── */
const G_LIGHT  = '#edd060'   // raised highlight (warm bright gold)
const G_MID    = '#c8a030'   // main scroll surface (medium antique gold)
const G_DARK   = '#8a6418'   // shadow underside of scroll
const G_DEEP   = '#1e0c02'   // carved channel — stays very dark for contrast
const G_EDGE   = '#d4a830'   // thin hairline on dark base

export default function GildedFrame({ children }) {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      filter: 'drop-shadow(0 14px 40px rgba(0,0,0,0.82)) drop-shadow(0 4px 10px rgba(0,0,0,0.55))',
    }}>
      <svg
        width={FW} height={FH}
        viewBox={`0 0 ${FW} ${FH}`}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="gf-s" x="-20%" y="-20%" width="150%" height="160%">
            <feDropShadow dx="0.6" dy="1.2" stdDeviation="0.9"
              floodColor="#100600" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* ── DARK BASE RAILS ──────────────────────────────────────── */}
        <rect x={0}       y={0}       width={FW}   height={RAIL}  fill={G_DEEP} />
        <rect x={0}       y={FH-RAIL} width={FW}   height={RAIL}  fill={G_DEEP} />
        <rect x={0}       y={RAIL}    width={RAIL}  height={CH}    fill={G_DEEP} />
        <rect x={FW-RAIL} y={RAIL}    width={RAIL}  height={CH}    fill={G_DEEP} />

        {/* Thin gold hairline on outer and inner edges */}
        <rect x={0} y={0} width={FW} height={1} fill={G_EDGE} opacity="0.7" />
        <rect x={0} y={FH-1} width={FW} height={1} fill={G_EDGE} opacity="0.7" />
        <rect x={0} y={0} width={1} height={FH} fill={G_EDGE} opacity="0.7" />
        <rect x={FW-1} y={0} width={1} height={FH} fill={G_EDGE} opacity="0.7" />

        <rect x={RAIL} y={RAIL} width={CW} height={1} fill={G_EDGE} opacity="0.55" />
        <rect x={RAIL} y={FH-RAIL-1} width={CW} height={1} fill={G_EDGE} opacity="0.55" />
        <rect x={RAIL} y={RAIL} width={1} height={CH} fill={G_EDGE} opacity="0.55" />
        <rect x={FW-RAIL-1} y={RAIL} width={1} height={CH} fill={G_EDGE} opacity="0.55" />

        {/* ── CORNER ORNAMENTS ─────────────────────────────────────── */}
        <CornerOrnament x={RAIL}       y={RAIL}       rotate={0}   />
        <CornerOrnament x={FW - RAIL}  y={RAIL}       rotate={90}  />
        <CornerOrnament x={FW - RAIL}  y={FH - RAIL}  rotate={180} />
        <CornerOrnament x={RAIL}       y={FH - RAIL}  rotate={270} />

        {/* ── SIDE CENTRE FLOURISHES ───────────────────────────────── */}
        {/* Top */}
        <SideFlourish cx={FW / 2} cy={RAIL / 2} orient="h" />
        {/* Bottom */}
        <SideFlourish cx={FW / 2} cy={FH - RAIL / 2} orient="h" flip />
        {/* Left */}
        <SideFlourish cx={RAIL / 2} cy={FH / 2} orient="v" />
        {/* Right */}
        <SideFlourish cx={FW - RAIL / 2} cy={FH / 2} orient="v" flip />

        {/* ── BEADED INNER LINER ───────────────────────────────────── */}
        <BeadRow x1={RAIL+4} y1={RAIL-4}  x2={FW-RAIL-4} y2={RAIL-4}   horiz />
        <BeadRow x1={RAIL+4} y1={FH-RAIL+4} x2={FW-RAIL-4} y2={FH-RAIL+4} horiz />
        <BeadRow x1={RAIL-4} y1={RAIL+4}  x2={RAIL-4}    y2={FH-RAIL-4} />
        <BeadRow x1={FW-RAIL+4} y1={RAIL+4} x2={FW-RAIL+4} y2={FH-RAIL-4} />
      </svg>

      {/* Canvas */}
      <div style={{ margin: RAIL, width: CW, height: CH, position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

/* ── CORNER ORNAMENT ─────────────────────────────────────────────── */
/*
 * Four overlapping C-scrolls + S-scroll + spiral termini.
 * pivot = inner corner point (where frame opening meets rail).
 * rotate 0/90/180/270 to place at each corner.
 * The ornament extends into BOTH adjacent rails (negative x and y).
 */
function CornerOrnament({ x, y, rotate }) {
  const S = (path, col, w) => (
    <path d={path} stroke={col} strokeWidth={w} fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
  )
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`} filter="url(#gf-s)">

      {/* ── SCROLL 1: main primary C-scroll (upper-left diagonal) ── */}
      {/* Dark backing — creates carved channel illusion */}
      {S('M-6,-2 C-10,-6 -18,-18 -24,-20 C-30,-22 -34,-16 -32,-10 C-30,-4 -24,-2 -18,-4 C-12,-6 -10,-12 -14,-16 C-18,-20 -24,-18 -23,-14 C-22,-10 -18,-10 -16,-13',
         G_DEEP, 9)}
      {/* Gold surface */}
      {S('M-6,-2 C-10,-6 -18,-18 -24,-20 C-30,-22 -34,-16 -32,-10 C-30,-4 -24,-2 -18,-4 C-12,-6 -10,-12 -14,-16 C-18,-20 -24,-18 -23,-14 C-22,-10 -18,-10 -16,-13',
         G_MID, 5.5)}
      {/* Highlight on raised ridge */}
      {S('M-6,-2 C-10,-6 -18,-18 -24,-20 C-30,-22 -34,-16 -32,-10',
         G_LIGHT, 1.8)}
      {/* Spiral terminus at scroll end */}
      {S('M-16,-13 C-14,-16 -12,-16 -12,-13 C-12,-10 -14,-9 -16,-10 C-17,-11 -17,-13 -15.5,-13.5',
         G_DEEP, 6)}
      {S('M-16,-13 C-14,-16 -12,-16 -12,-13 C-12,-10 -14,-9 -16,-10 C-17,-11 -17,-13 -15.5,-13.5',
         G_MID, 3.5)}

      {/* ── SCROLL 2: secondary scroll from main — goes along top rail ── */}
      {S('M-24,-20 C-26,-26 -22,-30 -16,-28 C-10,-26 -8,-20 -12,-16',
         G_DEEP, 8)}
      {S('M-24,-20 C-26,-26 -22,-30 -16,-28 C-10,-26 -8,-20 -12,-16',
         G_MID, 5)}
      {/* Spiral at end of scroll 2 */}
      {S('M-12,-16 C-10,-14 -8,-14 -8,-16 C-8,-18 -10,-19 -12,-18 C-13,-17 -12,-16 -11,-16.5',
         G_DEEP, 5.5)}
      {S('M-12,-16 C-10,-14 -8,-14 -8,-16 C-8,-18 -10,-19 -12,-18',
         G_MID, 3)}

      {/* ── SCROLL 3: along left rail ── */}
      {S('M-6,-2 C-10,2 -14,6 -10,10 C-6,14 -2,12 -2,8 C-2,4 -6,2 -8,4 C-10,6 -8,9 -6,8',
         G_DEEP, 8)}
      {S('M-6,-2 C-10,2 -14,6 -10,10 C-6,14 -2,12 -2,8 C-2,4 -6,2 -8,4 C-10,6 -8,9 -6,8',
         G_MID, 5)}
      {S('M-6,-2 C-10,2 -14,6 -10,10',
         G_LIGHT, 1.6)}
      {/* Spiral at end of scroll 3 */}
      {S('M-6,8 C-4,10 -2,10 -2,8 C-2,6 -4,5.5 -5.5,6.5 C-6.5,7 -6,8 -5,7.5',
         G_DEEP, 5.5)}
      {S('M-6,8 C-4,10 -2,10 -2,8 C-2,6 -4,5.5 -5.5,6.5',
         G_MID, 3)}

      {/* ── SCROLL 4: extending S-curve along top rail ── */}
      {S('M-6,-2 C-6,-8 -4,-12 0,-12 C4,-12 6,-8 4,-4',
         G_DEEP, 7)}
      {S('M-6,-2 C-6,-8 -4,-12 0,-12 C4,-12 6,-8 4,-4',
         G_DARK, 4.5)}
      {/* Leaf/petal at end */}
      {S('M4,-4 C6,-2 8,-2 8,-4 C8,-6 6,-7 4,-6',
         G_DEEP, 5)}
      {S('M4,-4 C6,-2 8,-2 8,-4 C8,-6 6,-7 4,-6',
         G_MID, 3)}

      {/* ── ACANTHUS LEAF BODY — fills inner corner ── */}
      <path
        d="M-4,-4 C-8,-8 -14,-8 -12,-4 C-10,0 -6,0 -4,-4"
        fill={G_DARK} stroke={G_DEEP} strokeWidth="0.5" />
      <path
        d="M-4,-4 C-2,-8 2,-8 2,-4 C2,0 -2,0 -4,-4"
        fill={G_DARK} stroke={G_DEEP} strokeWidth="0.5" />
      {/* Centre vein */}
      <path d="M-4,-4 C-4,-9 -3,-12 -2,-10"
        stroke={G_LIGHT} strokeWidth="0.7" fill="none" opacity="0.7" />

      {/* ── SMALL DETAIL DOTS at spiral centres ── */}
      <circle cx="-14" cy="-14.5" r="1.4" fill={G_LIGHT} />
      <circle cx="-10" cy="-17"   r="1.1" fill={G_LIGHT} />
      <circle cx="-5"  cy="7.5"   r="1.1" fill={G_LIGHT} />
    </g>
  )
}

/* ── SIDE FLOURISH ───────────────────────────────────────────────── */
/* A smaller S-scroll arrangement centered on the long rail midpoints */
function SideFlourish({ cx, cy, orient, flip }) {
  const sign = flip ? -1 : 1
  const S = (path, col, w) => (
    <path d={path} stroke={col} strokeWidth={w} fill="none"
      strokeLinecap="round" />
  )
  const r = orient === 'h' ? 0 : 90
  return (
    <g transform={`translate(${cx},${cy}) rotate(${r}) scale(1,${sign})`} filter="url(#gf-s)">
      {/* Left S-scroll */}
      {S('M-2,0 C-6,-2 -10,-6 -8,-10 C-6,-14 -2,-12 -2,-8 C-2,-4 -5,-2 -7,-4',
         G_DEEP, 7)}
      {S('M-2,0 C-6,-2 -10,-6 -8,-10 C-6,-14 -2,-12 -2,-8 C-2,-4 -5,-2 -7,-4',
         G_MID, 4.5)}
      {S('M-2,0 C-6,-2 -10,-6 -8,-10', G_LIGHT, 1.5)}
      {/* Left spiral */}
      {S('M-7,-4 C-9,-2 -9,0 -7,0 C-5,0 -4,-2 -5,-3.5', G_DEEP, 5)}
      {S('M-7,-4 C-9,-2 -9,0 -7,0 C-5,0 -4,-2 -5,-3.5', G_MID, 3)}

      {/* Right S-scroll (mirror) */}
      {S('M2,0 C6,-2 10,-6 8,-10 C6,-14 2,-12 2,-8 C2,-4 5,-2 7,-4',
         G_DEEP, 7)}
      {S('M2,0 C6,-2 10,-6 8,-10 C6,-14 2,-12 2,-8 C2,-4 5,-2 7,-4',
         G_MID, 4.5)}
      {S('M2,0 C6,-2 10,-6 8,-10', G_LIGHT, 1.5)}
      {/* Right spiral */}
      {S('M7,-4 C9,-2 9,0 7,0 C5,0 4,-2 5,-3.5', G_DEEP, 5)}
      {S('M7,-4 C9,-2 9,0 7,0 C5,0 4,-2 5,-3.5', G_MID, 3)}

      {/* Central rosette */}
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={0} cy={-5} rx={1.8} ry={3.5}
          fill={G_DARK} transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={3.2} fill={G_DARK} />
      <circle cx={0} cy={0} r={1.8} fill={G_MID} />
      <circle cx={0} cy={0} r={0.8} fill={G_LIGHT} />
    </g>
  )
}

/* ── BEAD ROW ────────────────────────────────────────────────────── */
function BeadRow({ x1, y1, x2, y2, horiz }) {
  const len = horiz ? Math.abs(x2 - x1) : Math.abs(y2 - y1)
  const count = Math.floor(len / 7)
  return (
    <>
      {[...Array(count)].map((_, i) => {
        const t = (i + 0.5) / count
        const bx = horiz ? x1 + t * (x2 - x1) : x1
        const by = horiz ? y1 : y1 + t * (y2 - y1)
        return (
          <g key={i}>
            <circle cx={bx} cy={by} r={2} fill={G_DARK} />
            <circle cx={bx - 0.5} cy={by - 0.5} r={0.8} fill={G_LIGHT} opacity="0.7" />
          </g>
        )
      })}
    </>
  )
}
