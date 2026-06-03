/*
 * Simple painted baseboard — same trim language as the crown molding but minimal.
 * Profile (top to bottom):
 *   shadow cast from wall above
 *   narrow cove step (recessed)
 *   small bead row (echoes crown molding's bead liner)
 *   flat face
 *   bottom step + base plinth
 *
 * Colours match the crown molding's cream/ivory palette so both reads as
 * one continuous painted-trim system.
 */

const H = 10

export default function Baseboard() {
  return (
    <svg
      width="100%"
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 4,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bs-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f0e8d4" />
          <stop offset="100%" stopColor="#d4cbb0" />
        </linearGradient>

        {/* Shadow gradient — cast from wall above onto the trim */}
        <linearGradient id="bs-wall-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#080604" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#080604" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Thin cove step at top */}
      <rect y="0" width="100%" height="2" fill="#b8b09a" />

      {/* Highlight — top edge of face catches light */}
      <rect y="2" width="100%" height="1" fill="rgba(255,252,240,0.6)" />

      {/* Main flat face */}
      <rect y="3" width="100%" height="5" fill="url(#bs-face)" />

      {/* Base step — meets floor */}
      <rect y="8" width="100%" height="2" fill="#c0b89c" />

      {/* Shadow cast from wall above */}
      <rect width="100%" height="4" fill="url(#bs-wall-shadow)" />
    </svg>
  )
}
