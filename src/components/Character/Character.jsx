/*
 * Pure black silhouette — bold humanoid in a mid-stride walking pose.
 * Matches the reference style: large round head, chunky solid limbs.
 * scaleX flips direction; transformOrigin keeps feet grounded.
 */

const W = 38
const H = 108

export default function Character({ x, facing }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 90,
      left: x,
      width: W,
      pointerEvents: 'none',
      zIndex: 10,
      transform: `scaleX(${facing})`,
      transformOrigin: '50% 100%',
    }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head — large round, like the reference */}
        <circle cx="19" cy="10" r="10" fill="#0d0d0d" />

        {/* Torso — tapers slightly from shoulders to hips */}
        <path
          d="M 13,19
             C 11,24 10,36 11,48
             C 12,55 13,62 12,66
             L 26,66
             C 25,62 26,55 27,48
             C 28,36 27,24 25,19
             C 23,17 15,17 13,19 Z"
          fill="#0d0d0d"
        />

        {/* Left arm — swings forward */}
        <path
          d="M 11,25
             C 7,31 3,41 5,48
             C 6,52 10,51 11,47
             C 12,43 10,34 13,28 Z"
          fill="#0d0d0d"
        />

        {/* Right arm — swings back */}
        <path
          d="M 27,25
             C 31,31 35,39 33,46
             C 32,50 28,49 28,45
             C 28,41 29,33 27,28 Z"
          fill="#0d0d0d"
        />

        {/* Left leg — stepping back */}
        <path
          d="M 13,66
             C 10,76 8,88 9,98
             C 10,103 14,104 15,101
             C 16,97 14,86 16,76
             L 19,66 Z"
          fill="#0d0d0d"
        />

        {/* Right leg — stepping forward */}
        <path
          d="M 25,66
             L 19,66
             C 21,76 22,86 22,97
             C 22,102 26,103 27,100
             C 28,96 27,85 28,75
             L 29,66 Z"
          fill="#0d0d0d"
        />
      </svg>
    </div>
  )
}
