export default function CrownMolding() {
  return (
    <svg
      width="100%"
      height="32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        {/* Carved relief: shadow below + to right of each element */}
        <filter id="relief" x="-8%" y="-20%" width="120%" height="160%">
          <feDropShadow dx="0.4" dy="1.2" stdDeviation="0.65"
            floodColor="#7a6035" floodOpacity="0.7" />
        </filter>

        {/* Background plate gradient: cream top → warm tan bottom */}
        <linearGradient id="moldBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f7f0e0" />
          <stop offset="55%"  stopColor="#ede3c8" />
          <stop offset="100%" stopColor="#c4b080" />
        </linearGradient>

        {/* Single 320-wide vine tile, repeated across full width */}
        <pattern id="vine" x="0" y="0" width="320" height="32"
          patternUnits="userSpaceOnUse">

          {/* ── VINE STEM ── */}
          {/* Shadow copy for depth */}
          <path
            d="M0,16 C28,16 52,7 80,7 C108,7 132,16 160,16 C188,16 212,25 240,25 C268,25 292,16 320,16"
            stroke="#9a8050" strokeWidth="3.2" fill="none" opacity="0.32"
          />
          {/* Main vine */}
          <path
            d="M0,16 C28,16 52,7 80,7 C108,7 132,16 160,16 C188,16 212,25 240,25 C268,25 292,16 320,16"
            stroke="#ddd0a8" strokeWidth="1.9" fill="none"
          />
          {/* Highlight ridge on top of vine */}
          <path
            d="M0,15.2 C28,15.2 52,6.2 80,6.2 C108,6.2 132,15.2 160,15.2 C188,15.2 212,24.2 240,24.2 C268,24.2 292,15.2 320,15.2"
            stroke="rgba(255,250,225,0.62)" strokeWidth="0.55" fill="none"
          />

          {/* ── UPPER LEAF CLUSTER — peak at x=80 y=7 ── */}
          {/* Left leaf */}
          <path d="M80,7 C73,4 67,5 69,9 C71,11.5 77,9.5 80,7"
            fill="#e2d8ae" filter="url(#relief)" />
          {/* Right leaf */}
          <path d="M80,7 C87,4 93,5 91,9 C89,11.5 83,9.5 80,7"
            fill="#e2d8ae" filter="url(#relief)" />
          {/* Center upward leaf */}
          <path d="M80,7 C77,2 80,0.5 83,2.5 C84.5,4.5 80,7 80,7"
            fill="#ede3be" filter="url(#relief)" />
          {/* Leaf vein */}
          <line x1="80" y1="7" x2="80" y2="1.5"
            stroke="rgba(255,248,215,0.55)" strokeWidth="0.5" />
          {/* Berry / rosette */}
          <circle cx="80" cy="2" r="2.6" fill="#d8c890" filter="url(#relief)" />
          <circle cx="80" cy="2" r="1.1" fill="#f0e8cc" />
          <circle cx="80" cy="2" r="0.45" fill="rgba(255,252,230,0.95)" />

          {/* ── LOWER LEAF CLUSTER — valley at x=240 y=25 ── */}
          <path d="M240,25 C233,28 227,27 229,23 C231,20.5 237,22.5 240,25"
            fill="#e2d8ae" filter="url(#relief)" />
          <path d="M240,25 C247,28 253,27 251,23 C249,20.5 243,22.5 240,25"
            fill="#e2d8ae" filter="url(#relief)" />
          <path d="M240,25 C237,30 240,31.5 243,29.5 C244.5,27.5 240,25 240,25"
            fill="#ede3be" filter="url(#relief)" />
          <line x1="240" y1="25" x2="240" y2="30.5"
            stroke="rgba(255,248,215,0.55)" strokeWidth="0.5" />
          <circle cx="240" cy="30" r="2.6" fill="#d8c890" filter="url(#relief)" />
          <circle cx="240" cy="30" r="1.1" fill="#f0e8cc" />
          <circle cx="240" cy="30" r="0.45" fill="rgba(255,252,230,0.95)" />

          {/* ── SMALL SPIRAL TENDRILS at crossings ── */}
          <path d="M160,16 C158,11.5 163,9 166,12.5 C168,15.5 165,19 161.5,17"
            stroke="#c8bc88" strokeWidth="1.05" fill="none" filter="url(#relief)" />
          <path d="M320,16 C318,11.5 323,9 326,12.5 C328,15.5 325,19 321.5,17"
            stroke="#c8bc88" strokeWidth="1.05" fill="none" filter="url(#relief)" />

          {/* ── PAIRED SIDE LEAFLETS at mid-sections ── */}
          {/* x=40, y=11.5 — mid ascending */}
          <path d="M40,11.5 C36,7 31,8.5 33.5,12.5 C35.5,15 40,13 40,11.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />
          <path d="M40,11.5 C44,7 49,8.5 46.5,12.5 C44.5,15 40,13 40,11.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />

          {/* x=120, y=11.5 — mid descending from peak */}
          <path d="M120,11.5 C116,7 111,8.5 113.5,12.5 C115.5,15 120,13 120,11.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />
          <path d="M120,11.5 C124,7 129,8.5 126.5,12.5 C124.5,15 120,13 120,11.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />

          {/* x=200, y=20.5 — mid descending toward valley */}
          <path d="M200,20.5 C196,25 191,23.5 193.5,19.5 C195.5,17 200,19 200,20.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />
          <path d="M200,20.5 C204,25 209,23.5 206.5,19.5 C204.5,17 200,19 200,20.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />

          {/* x=280, y=20.5 — mid ascending from valley */}
          <path d="M280,20.5 C276,25 271,23.5 273.5,19.5 C275.5,17 280,19 280,20.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />
          <path d="M280,20.5 C284,25 289,23.5 286.5,19.5 C284.5,17 280,19 280,20.5"
            fill="#d4c890" opacity="0.82" filter="url(#relief)" />
        </pattern>
      </defs>

      {/* Background plate */}
      <rect width="100%" height="32" fill="url(#moldBg)" />
      {/* Vine pattern tiles across full width */}
      <rect width="100%" height="32" fill="url(#vine)" />
      {/* Bottom edge: hard shadow where molding meets wall */}
      <rect y="28" width="100%" height="4" fill="#1a1008" opacity="0.5" />
    </svg>
  )
}
