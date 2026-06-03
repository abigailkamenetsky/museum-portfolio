/*
 * Photorealistic dark walnut wide-plank floor.
 *
 * Pipeline per plank:
 *   feTurbulence (warp field)
 *   feTurbulence (grain, low x-freq = long horizontal runs)
 *   feDisplacementMap  → bends grain lines organically
 *   feComponentTransfer (table) → maps noise to dark-espresso / walnut grain bands
 *   feTurbulence + feColorMatrix → micro pore overlay
 *   feMerge
 *
 * Each of the 4 planks uses a different seed so the grain is unique per plank.
 * Color range: #0D0502 (deep espresso grain lines) → #401C09 (rich walnut body)
 * No orange, no red, no gray.
 */

const H      = 92
const PLANK  = 23

const PLANKS = [
  { y: 0,  seed: 31 },
  { y: 23, seed: 47 },
  { y: 46, seed: 19 },
  { y: 69, seed: 63 },
]

export default function FloorPlanks() {
  return (
    <svg
      width="100%"
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        {PLANKS.map(({ seed }, i) => (
          <filter
            key={i}
            id={`fp-p${i}`}
            colorInterpolationFilters="sRGB"
          >
            {/* Organic warp field — low-freq isotropic noise */}
            <feTurbulence
              type="turbulence"
              baseFrequency="0.006 0.006"
              numOctaves="2"
              seed={seed + 100}
              result="warp"
            />

            {/*
             * Primary grain.
             * x=0.0018: long horizontal grain runs across 1440 px (~2.6 cycles)
             * y=0.06:   ~1.4 turbulence cycles per 23 px plank height
             * Combined with 2-cycle table below → ~3 visible grain lines per plank
             */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0018 0.06"
              numOctaves="5"
              seed={seed}
              result="baseGrain"
            />

            {/* Bend grain lines to simulate natural wood curvature */}
            <feDisplacementMap
              in="baseGrain"
              in2="warp"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warpedGrain"
            />

            {/*
             * Table mapping: oscillates dark espresso → walnut body → dark espresso
             * 5 values = 2 full dark/light cycles = ~3 visible grain lines per plank.
             * Dark:  R=0.05 G=0.020 B=0.006 → #0D0501 (deep espresso grain line)
             * Light: R=0.25 G=0.111 B=0.033 → #401C08 (rich dark walnut)
             */}
            <feComponentTransfer in="warpedGrain" result="coloredGrain">
              <feFuncR type="table" tableValues="0.05 0.25 0.07 0.26 0.05" />
              <feFuncG type="table" tableValues="0.020 0.111 0.028 0.115 0.020" />
              <feFuncB type="table" tableValues="0.006 0.033 0.008 0.035 0.006" />
            </feComponentTransfer>

            {/* Micro pore texture — wood cell structure at fine scale */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028 0.70"
              numOctaves="2"
              seed={seed + 50}
              result="pores"
            />
            <feColorMatrix
              type="matrix"
              in="pores"
              values="0.035 0 0 0 0
                      0.015 0 0 0 0
                      0.004 0 0 0 0
                      0.30  0 0 0 -0.06"
              result="poreLayer"
            />

            <feMerge>
              <feMergeNode in="coloredGrain" />
              <feMergeNode in="poreLayer" />
            </feMerge>
          </filter>
        ))}

        <linearGradient id="fp-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#010000" stopOpacity="0.94" />
          <stop offset="55%"  stopColor="#010000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#010000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 4 wide planks, each with its own grain seed */}
      {PLANKS.map(({ y }, i) => (
        <rect
          key={i}
          x="0"
          y={y}
          width="100%"
          height={PLANK}
          filter={`url(#fp-p${i})`}
        />
      ))}

      {/* Plank seam lines */}
      {[23, 46, 69].map(y => (
        <line
          key={y}
          x1="0" y1={y}
          x2="100%" y2={y}
          stroke="#020100"
          strokeWidth="2"
        />
      ))}

      {/* Shadow cast by wainscoting above */}
      <rect width="100%" height="18" fill="url(#fp-shadow)" />
    </svg>
  )
}
