/*
 * Architectural crown cornice — matches the carved wood reference:
 * flat top plate → egg-and-dart band → plain fascia → arch drops with pendants.
 * Rendered as a tiling SVG so it spans any room width.
 */
export default function CrownMolding() {
  const TILE = 400
  const H = 68

  return (
    <svg
      width="100%"
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        {/* Carved relief shadow */}
        <filter id="cr-shadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0.6" dy="1.4" stdDeviation="0.8"
            floodColor="#1a1008" floodOpacity="0.65" />
        </filter>

        {/* Wood/plaster top plate gradient */}
        <linearGradient id="cr-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f8f2e4" />
          <stop offset="60%"  stopColor="#ede5d0" />
          <stop offset="100%" stopColor="#d0c4a0" />
        </linearGradient>

        {/* Fascia face gradient */}
        <linearGradient id="cr-fascia" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e8e0cc" />
          <stop offset="100%" stopColor="#d4c8a8" />
        </linearGradient>

        {/* Column pilaster gradient (left→right, suggests round column) */}
        <linearGradient id="cr-col" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#b8aa88" />
          <stop offset="18%"  stopColor="#e8e0cc" />
          <stop offset="50%"  stopColor="#f4f0e4" />
          <stop offset="82%"  stopColor="#e8e0cc" />
          <stop offset="100%" stopColor="#a09078" />
        </linearGradient>

        {/* Arch soffit (inside the arch — recessed/darker) */}
        <linearGradient id="cr-arch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c8bea0" />
          <stop offset="100%" stopColor="#a89878" />
        </linearGradient>

        {/* 400-wide tile — everything tiled with patternUnits=userSpaceOnUse */}
        <pattern id="cr-tile" x="0" y="0" width={TILE} height={H}
          patternUnits="userSpaceOnUse">

          {/* ── LAYER 1: TOP FLAT PLATE (y 0–18) ── */}
          <rect x="0" y="0" width={TILE} height="18" fill="url(#cr-plate)" />
          {/* Bottom edge shadow of plate */}
          <rect x="0" y="15" width={TILE} height="3"
            fill="#1a1208" opacity="0.18" />

          {/* ── THORNY WHITE VINE — runs along the top plate ── */}
          {/* Main stem: undulates gently through y≈9 */}
          <path
            d={
              [...Array(101)].map((_, i) => {
                const x = i * (TILE / 100)
                const y = (9 + Math.sin(x * 0.072) * 3.8).toFixed(2)
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y}`
              }).join(' ')
            }
            stroke="rgba(245,242,232,0.62)"
            strokeWidth="0.9"
            fill="none"
          />
          {/* Thorns: short spines alternating above/below every 9px */}
          {[...Array(44)].map((_, i) => {
            const x = i * 9 + 3
            const stemY = 9 + Math.sin(x * 0.072) * 3.8
            const up = i % 2 === 0
            return (
              <line key={`thorn-${i}`}
                x1={x} y1={stemY}
                x2={x + (up ? 2.5 : 1.5)} y2={stemY + (up ? -4.5 : 4.5)}
                stroke="rgba(245,242,232,0.55)"
                strokeWidth="0.65"
              />
            )
          })}
          {/* Secondary branching tendrils every ~50px */}
          {[25, 75, 125, 175, 225, 275, 325, 375].map((x) => {
            const stemY = 9 + Math.sin(x * 0.072) * 3.8
            return (
              <g key={`tendril-${x}`}>
                <path
                  d={`M${x},${stemY} C${x + 6},${stemY - 5} ${x + 10},${stemY - 3} ${x + 8},${stemY + 2}`}
                  stroke="rgba(245,242,232,0.45)"
                  strokeWidth="0.65"
                  fill="none"
                />
                {/* Thorn on tendril */}
                <line
                  x1={x + 5} y1={stemY - 3.5}
                  x2={x + 7} y2={stemY - 7}
                  stroke="rgba(245,242,232,0.4)"
                  strokeWidth="0.6"
                />
              </g>
            )
          })}

          {/* ── LAYER 2: EGG-AND-DART BAND (y 18–32) ── */}
          <rect x="0" y="18" width={TILE} height="14" fill="#e4dac4" />
          {/* Repeat egg shapes every 25px */}
          {[...Array(16)].map((_, i) => {
            const x = i * 25 + 7
            return (
              <g key={i} filter="url(#cr-shadow)">
                {/* Egg shape */}
                <ellipse cx={x} cy="25" rx="7" ry="5.5"
                  fill="#f2ecd8" />
                {/* Highlight on egg */}
                <ellipse cx={x - 1.5} cy="23" rx="3" ry="2"
                  fill="rgba(255,252,240,0.7)" />
                {/* Dart between eggs */}
                <path
                  d={`M${x + 9},18 L${x + 12.5},26 L${x + 16},18`}
                  fill="#c8be9c"
                />
              </g>
            )
          })}
          {/* Top lip of band */}
          <rect x="0" y="18" width={TILE} height="1.5"
            fill="rgba(255,252,240,0.55)" />
          {/* Bottom groove of band */}
          <rect x="0" y="31" width={TILE} height="1.5"
            fill="#1a1208" opacity="0.3" />

          {/* ── LAYER 3: PLAIN FASCIA FACE (y 32–44) ── */}
          <rect x="0" y="32" width={TILE} height="12" fill="url(#cr-fascia)" />
          {/* Small circular rosettes every 100px */}
          {[50, 150, 250, 350].map((x) => (
            <g key={x} filter="url(#cr-shadow)">
              <circle cx={x} cy="38" r="5" fill="#e8e0cc" />
              <circle cx={x} cy="38" r="3" fill="#d8d0b4" />
              <circle cx={x} cy="38" r="1.5" fill="#c0b890" />
              <circle cx={x - 1} cy="37" r="0.8"
                fill="rgba(255,252,235,0.8)" />
            </g>
          ))}

          {/* ── LAYER 4: LOWER PROFILE STEP (y 44–48) ── */}
          {/* A narrow projecting step — creates 3-D shadow below fascia */}
          <rect x="0" y="44" width={TILE} height="4"
            fill="#d8d0b0" />
          <rect x="0" y="47" width={TILE} height="1"
            fill="#1a1208" opacity="0.25" />

          {/* ── LAYER 5: ARCH DROPS SECTION (y 48–68) ── */}
          {/* Background fill of the arch zone */}
          <rect x="0" y="48" width={TILE} height="20"
            fill="#c8bea2" />

          {/* Columns/pilasters at 0, 100, 200, 300, 400 */}
          {[0, 100, 200, 300, 400].map((x) => (
            <g key={x}>
              {/* Column shaft */}
              <rect x={x - 8} y="48" width="16" height="20"
                fill="url(#cr-col)" />
              {/* Column capital: white sculptural bracket */}
              <path
                d={`M${x - 8},48 C${x - 12},48 ${x - 14},44 ${x - 10},43 L${x},41 L${x + 10},43 C${x + 14},44 ${x + 12},48 ${x + 8},48`}
                fill="#f0ead8" filter="url(#cr-shadow)"
              />
              {/* Capital highlight */}
              <path
                d={`M${x - 6},48 C${x - 10},47 ${x - 11},44 ${x - 8},43.5`}
                fill="none"
                stroke="rgba(255,252,240,0.6)"
                strokeWidth="1"
              />
              {/* Capital shadow underside */}
              <path
                d={`M${x + 6},48 C${x + 10},47 ${x + 11},44 ${x + 8},43.5`}
                fill="none"
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="0.8"
              />
              {/* Column base moulding */}
              <rect x={x - 9} y="65" width="18" height="3"
                fill="#d0c8a8" />
            </g>
          ))}

          {/* Arches between columns (centered between each pair) */}
          {[50, 150, 250, 350].map((cx) => (
            <g key={cx}>
              {/* Arch opening — pointed/round arch */}
              <path
                d={`M${cx - 34},68 L${cx - 34},60 Q${cx - 34},48 ${cx},48 Q${cx + 34},48 ${cx + 34},60 L${cx + 34},68`}
                fill="url(#cr-arch)"
              />
              {/* Arch intrados highlight */}
              <path
                d={`M${cx - 32},68 L${cx - 32},60 Q${cx - 32},50 ${cx},50`}
                fill="none"
                stroke="rgba(255,252,235,0.3)"
                strokeWidth="1.2"
              />
              {/* Keystone at arch apex */}
              <path
                d={`M${cx - 7},48 L${cx},43 L${cx + 7},48 Z`}
                fill="#c9a840"
                filter="url(#cr-shadow)"
              />
              <path
                d={`M${cx - 4},48 L${cx},45 L${cx + 4},48 Z`}
                fill="#e0c060"
              />
              {/* Pendant drop hanging from arch apex */}
              <g filter="url(#cr-shadow)">
                {/* Pendant neck */}
                <rect x={cx - 3} y="56" width="6" height="6"
                  fill="#d8d0b4" />
                {/* Pendant body — acanthus drop */}
                <path
                  d={`M${cx - 5},62 C${cx - 7},64 ${cx - 6},68 ${cx},68 C${cx + 6},68 ${cx + 7},64 ${cx + 5},62 Z`}
                  fill="#e4dcc8"
                />
                {/* Pendant lobes */}
                <path
                  d={`M${cx},62 C${cx - 4},60 ${cx - 6},56 ${cx - 3},55 C${cx},54 ${cx + 3},55 ${cx},56`}
                  fill="#d8d0b4"
                />
                {/* Pendant tip detail */}
                <circle cx={cx} cy="67" r="2"
                  fill="#c8c0a0" />
                <circle cx={cx} cy="67" r="0.9"
                  fill="rgba(255,248,220,0.7)" />
              </g>
            </g>
          ))}

          {/* Top highlight line of entire molding */}
          <rect x="0" y="0" width={TILE} height="1"
            fill="rgba(255,255,245,0.7)" />
        </pattern>
      </defs>

      {/* Tile the pattern across the full viewport width */}
      <rect width="100%" height={H} fill="url(#cr-tile)" />

      {/* Hard shadow at bottom where molding meets wall */}
      <rect y={H - 4} width="100%" height="4"
        fill="#1a1008" opacity="0.45" />
    </svg>
  )
}
