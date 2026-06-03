/*
 * Painted plaster texture overlay.
 *
 * Uses mix-blend-mode: overlay so hue is mathematically preserved —
 * for any source channel S < 0.5, overlay = 2*S*overlay_value.
 * Since all channels of #4c5a3d (R=0.298, G=0.353, B=0.239) are < 0.5,
 * the multiplicative formula keeps R:G:B ratios identical regardless of
 * noise value. Only luminosity varies.
 *
 * feColorMatrix maps fractalNoise → [0.40, 0.60] centered on 0.5.
 * At 0.5 the overlay is perfectly neutral (no change).
 * Brighter noise areas lighten the wall ~12%, darker areas darken ~12%.
 *
 * baseFrequency 0.08, numOctaves 5 gives multi-scale plaster character:
 *   octave 1: 0.08  (~12 px) — large plaster section variation
 *   octave 2: 0.16  (~6 px)  — medium brush / application marks
 *   octave 3: 0.32  (~3 px)  — fine surface grain
 *   octave 4: 0.64  (~1.5px) — micro paint texture
 *   octave 5: 1.28            — sub-pixel depth character
 */

export default function PlasterOverlay() {
  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="po-plaster" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.08"
            numOctaves="5"
            seed="42"
          />
          {/* Map noise [0,1] → [0.40, 0.60]. At 0.5 = perfectly neutral. */}
          <feColorMatrix
            type="matrix"
            values="0.20 0 0 0 0.40
                    0.20 0 0 0 0.40
                    0.20 0 0 0 0.40
                    0    0 0 1 0"
          />
        </filter>
      </defs>

      <rect width="100%" height="100%" filter="url(#po-plaster)" />
    </svg>
  )
}
