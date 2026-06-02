/*
 * Baroque gilded frame — drawn entirely in SVG.
 * Corner ornaments are acanthus C-scrolls with lobes and rosettes.
 * Rail faces show a carved profile gradient (bright edge → deep channel → bright edge).
 * Children render as the painting canvas inside the opening.
 */

const RAIL = 32        // frame rail width in px
const CW   = 204       // canvas (painting) width
const CH   = 264       // canvas (painting) height
const FW   = CW + RAIL * 2   // total frame width  = 268
const FH   = CH + RAIL * 2   // total frame height = 328

export default function GildedFrame({ children }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block',
      filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.78)) drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>

      {/* SVG frame drawn on top — pointer-events none so canvas is clickable */}
      <svg
        width={FW} height={FH}
        viewBox={`0 0 ${FW} ${FH}`}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ── GOLD GRADIENTS ─────────────────────────────────────── */}
          {/* Top rail: bright→channel→bright (top→bottom) */}
          <linearGradient id="gf-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"    stopColor="#e8c84a" />
            <stop offset="12%"   stopColor="#c8a030" />
            <stop offset="30%"   stopColor="#7a5012" />
            <stop offset="50%"   stopColor="#3c1e05" />
            <stop offset="70%"   stopColor="#7a5012" />
            <stop offset="88%"   stopColor="#c8a030" />
            <stop offset="100%"  stopColor="#e0be40" />
          </linearGradient>
          {/* Bottom rail: reversed */}
          <linearGradient id="gf-bot" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"    stopColor="#e8c84a" />
            <stop offset="12%"   stopColor="#c8a030" />
            <stop offset="30%"   stopColor="#7a5012" />
            <stop offset="50%"   stopColor="#3c1e05" />
            <stop offset="70%"   stopColor="#7a5012" />
            <stop offset="88%"   stopColor="#c8a030" />
            <stop offset="100%"  stopColor="#e0be40" />
          </linearGradient>
          {/* Left rail: bright→channel→bright (left→right) */}
          <linearGradient id="gf-lft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"    stopColor="#e8c84a" />
            <stop offset="12%"   stopColor="#c8a030" />
            <stop offset="30%"   stopColor="#7a5012" />
            <stop offset="50%"   stopColor="#3c1e05" />
            <stop offset="70%"   stopColor="#7a5012" />
            <stop offset="88%"   stopColor="#c8a030" />
            <stop offset="100%"  stopColor="#e0be40" />
          </linearGradient>
          {/* Right rail: reversed */}
          <linearGradient id="gf-rgt" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%"    stopColor="#e8c84a" />
            <stop offset="12%"   stopColor="#c8a030" />
            <stop offset="30%"   stopColor="#7a5012" />
            <stop offset="50%"   stopColor="#3c1e05" />
            <stop offset="70%"   stopColor="#7a5012" />
            <stop offset="88%"   stopColor="#c8a030" />
            <stop offset="100%"  stopColor="#e0be40" />
          </linearGradient>

          {/* Corner block: diagonal gradient — top-left bright, bottom-right dark */}
          <linearGradient id="gf-cnr-tl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#e8c84a" />
            <stop offset="45%"  stopColor="#9a7820" />
            <stop offset="100%" stopColor="#3c1e05" />
          </linearGradient>
          <linearGradient id="gf-cnr-tr" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e8c84a" />
            <stop offset="45%"  stopColor="#9a7820" />
            <stop offset="100%" stopColor="#3c1e05" />
          </linearGradient>
          <linearGradient id="gf-cnr-bl" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%"   stopColor="#e8c84a" />
            <stop offset="45%"  stopColor="#9a7820" />
            <stop offset="100%" stopColor="#3c1e05" />
          </linearGradient>
          <linearGradient id="gf-cnr-br" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#e8c84a" />
            <stop offset="45%"  stopColor="#9a7820" />
            <stop offset="100%" stopColor="#3c1e05" />
          </linearGradient>

          {/* Carved ornament shadow */}
          <filter id="gf-relief" x="-15%" y="-15%" width="140%" height="140%">
            <feDropShadow dx="0.8" dy="1.6" stdDeviation="1"
              floodColor="#1a0800" floodOpacity="0.72" />
          </filter>

          {/* Inner beaded edge pattern: 8px repeat of small gold dots */}
          <pattern id="gf-bead-h" x="0" y="0" width="8" height={RAIL}
            patternUnits="userSpaceOnUse">
            <circle cx="4" cy={RAIL - 5} r="2.2" fill="#c8a030" />
            <circle cx="3.2" cy={RAIL - 5.8} r="0.9" fill="#e8d060" />
          </pattern>
          <pattern id="gf-bead-v" x="0" y="0" width={RAIL} height="8"
            patternUnits="userSpaceOnUse">
            <circle cx={RAIL - 5} cy="4" r="2.2" fill="#c8a030" />
            <circle cx={RAIL - 5.8} cy="3.2" r="0.9" fill="#e8d060" />
          </pattern>
        </defs>

        {/* ── RAILS ──────────────────────────────────────────────── */}
        {/* Top rail */}
        <rect x={RAIL} y={0} width={CW} height={RAIL} fill="url(#gf-top)" />
        {/* Bottom rail */}
        <rect x={RAIL} y={CH + RAIL} width={CW} height={RAIL} fill="url(#gf-bot)" />
        {/* Left rail */}
        <rect x={0} y={RAIL} width={RAIL} height={CH} fill="url(#gf-lft)" />
        {/* Right rail */}
        <rect x={CW + RAIL} y={RAIL} width={RAIL} height={CH} fill="url(#gf-rgt)" />

        {/* ── CORNER BLOCKS ──────────────────────────────────────── */}
        <rect x={0}        y={0}        width={RAIL} height={RAIL} fill="url(#gf-cnr-tl)" />
        <rect x={CW+RAIL}  y={0}        width={RAIL} height={RAIL} fill="url(#gf-cnr-tr)" />
        <rect x={0}        y={CH+RAIL}  width={RAIL} height={RAIL} fill="url(#gf-cnr-bl)" />
        <rect x={CW+RAIL}  y={CH+RAIL}  width={RAIL} height={RAIL} fill="url(#gf-cnr-br)" />

        {/* ── INNER BEADED EDGE ──────────────────────────────────── */}
        {/* Bead row along inner edge of top + bottom rails */}
        <rect x={RAIL} y={0} width={CW} height={RAIL} fill="url(#gf-bead-h)" />
        <rect x={RAIL} y={CH+RAIL} width={CW} height={RAIL} fill="url(#gf-bead-h)" />
        {/* Bead row along inner edge of left + right rails */}
        <rect x={0} y={RAIL} width={RAIL} height={CH} fill="url(#gf-bead-v)" />
        <rect x={CW+RAIL} y={RAIL} width={RAIL} height={CH} fill="url(#gf-bead-v)" />

        {/* ── RAIL SURFACE GRAIN LINES ───────────────────────────── */}
        {/* Faint diagonal lines suggesting wood grain under the gold */}
        {[...Array(14)].map((_, i) => (
          <line key={`tg${i}`}
            x1={RAIL + i * 16} y1={0}
            x2={RAIL + i * 16 + RAIL} y2={RAIL}
            stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        ))}

        {/* ── CORNER ORNAMENTS ───────────────────────────────────── */}
        {/* Each corner: a baroque acanthus C-scroll with lobes and a rosette */}

        {/* TOP-LEFT CORNER (pivot = RAIL, RAIL) */}
        <CornerOrnament x={RAIL} y={RAIL} rotate={0} />
        {/* TOP-RIGHT CORNER */}
        <CornerOrnament x={CW + RAIL} y={RAIL} rotate={90} />
        {/* BOTTOM-RIGHT CORNER */}
        <CornerOrnament x={CW + RAIL} y={CH + RAIL} rotate={180} />
        {/* BOTTOM-LEFT CORNER */}
        <CornerOrnament x={RAIL} y={CH + RAIL} rotate={270} />

        {/* ── CENTER ORNAMENTS on long rails ─────────────────────── */}
        {/* Top center */}
        <RailRosette cx={FW / 2} cy={RAIL / 2} />
        {/* Bottom center */}
        <RailRosette cx={FW / 2} cy={CH + RAIL + RAIL / 2} />
        {/* Left center */}
        <RailRosette cx={RAIL / 2} cy={FH / 2} />
        {/* Right center */}
        <RailRosette cx={CW + RAIL + RAIL / 2} cy={FH / 2} />

        {/* ── OUTER FRAME EDGE LINES ─────────────────────────────── */}
        {/* Bright outer lip */}
        <rect x={0} y={0} width={FW} height={1}
          fill="rgba(255,235,110,0.5)" />
        <rect x={0} y={0} width={1} height={FH}
          fill="rgba(255,235,110,0.5)" />
        {/* Dark outer shadow edge */}
        <rect x={0} y={FH - 1} width={FW} height={1}
          fill="rgba(0,0,0,0.6)" />
        <rect x={FW - 1} y={0} width={1} height={FH}
          fill="rgba(0,0,0,0.6)" />

        {/* ── INNER FRAME EDGE (opening edge) ────────────────────── */}
        <rect x={RAIL - 1} y={RAIL - 1}
          width={CW + 2} height={1} fill="rgba(0,0,0,0.55)" />
        <rect x={RAIL - 1} y={RAIL - 1}
          width={1} height={CH + 2} fill="rgba(0,0,0,0.55)" />
        <rect x={RAIL - 1} y={RAIL + CH}
          width={CW + 2} height={1} fill="rgba(255,220,80,0.3)" />
        <rect x={RAIL + CW} y={RAIL - 1}
          width={1} height={CH + 2} fill="rgba(255,220,80,0.3)" />
      </svg>

      {/* Canvas — the painting area, sits inside the frame opening */}
      <div style={{
        margin: RAIL,
        width: CW,
        height: CH,
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </div>
    </div>
  )
}

/* ── CORNER ORNAMENT ────────────────────────────────────────────── */
/*
 * Baroque acanthus C-scroll centered at the inner corner (0,0).
 * The scroll emerges from the corner and curls outward along both rails.
 * rotate = 0 (top-left) | 90 (top-right) | 180 (bot-right) | 270 (bot-left)
 */
function CornerOrnament({ x, y, rotate }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}
      filter="url(#gf-relief)">
      {/* Main C-scroll arc: from along top rail to along left rail */}
      <path
        d="M-18,-4 C-18,-14 -26,-22 -22,-26 C-18,-30 -10,-28 -8,-22 C-6,-16 -10,-10 -16,-10 C-20,-10 -22,-14 -20,-18 C-18,-22 -14,-22 -12,-18 C-10,-14 -12,-12 -14,-14"
        fill="none" stroke="#c9a030" strokeWidth="8" strokeLinecap="round" />
      {/* Channel carved into the scroll */}
      <path
        d="M-18,-4 C-18,-14 -26,-22 -22,-26 C-18,-30 -10,-28 -8,-22 C-6,-16 -10,-10 -16,-10 C-20,-10 -22,-14 -20,-18 C-18,-22 -14,-22 -12,-18"
        fill="none" stroke="#3a1e05" strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
      {/* Highlight on raised scroll surface */}
      <path
        d="M-18,-4 C-18,-14 -26,-22 -22,-26"
        fill="none" stroke="rgba(255,228,100,0.52)" strokeWidth="2" strokeLinecap="round" />

      {/* Acanthus lobe 1 — going along top rail (negative x direction) */}
      <path
        d="M-18,-4 C-22,-2 -28,0 -28,6 C-28,10 -24,12 -20,10 C-16,8 -16,4 -18,-4"
        fill="#c8a030" />
      <path
        d="M-18,-4 C-22,-2 -28,0 -28,6"
        fill="none" stroke="rgba(255,228,100,0.4)" strokeWidth="1" />

      {/* Acanthus lobe 2 — going along left rail (negative y direction) */}
      <path
        d="M-4,-18 C-2,-22 0,-28 6,-28 C10,-28 12,-24 10,-20 C8,-16 4,-16 -4,-18"
        fill="#c8a030" />

      {/* Secondary smaller lobe — fills inner corner */}
      <path
        d="M-8,-8 C-12,-10 -14,-16 -10,-18 C-6,-20 -2,-16 -4,-12 C-6,-8 -10,-8 -8,-8"
        fill="#b89020" />

      {/* Terminal rosette at scroll end */}
      <circle cx="-20" cy="-24" r="4" fill="#c9a030" />
      <circle cx="-20" cy="-24" r="2.5" fill="#7a5010" />
      <circle cx="-20" cy="-24" r="1.2" fill="#e8c840" />
      <circle cx="-20.6" cy="-24.6" r="0.5" fill="rgba(255,245,140,0.9)" />

      {/* Small leaf tips at ends of lobes */}
      <path d="M-28,8 C-30,10 -28,13 -26,11 Z" fill="#b08018" />
      <path d="M8,-28 C10,-30 13,-28 11,-26 Z" fill="#b08018" />
    </g>
  )
}

/* ── RAIL CENTER ROSETTE ────────────────────────────────────────── */
function RailRosette({ cx, cy }) {
  return (
    <g transform={`translate(${cx},${cy})`} filter="url(#gf-relief)">
      {/* Outer petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse key={angle}
          cx={0} cy={-7}
          rx="2.5" ry="4.5"
          fill="#c9a030"
          transform={`rotate(${angle})`} />
      ))}
      {/* Inner ring */}
      <circle cx={0} cy={0} r="5.5" fill="#b89020" />
      <circle cx={0} cy={0} r="3.5" fill="#c9a030" />
      <circle cx={0} cy={0} r="2" fill="#7a5010" />
      <circle cx={0} cy={0} r="1" fill="#e8c840" />
      <circle cx={-0.4} cy={-0.4} r="0.4" fill="rgba(255,245,140,0.9)" />
    </g>
  )
}
