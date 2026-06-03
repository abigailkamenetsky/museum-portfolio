import { useState, useEffect, useRef } from 'react'

const SPEED   = 4    // px per frame at 60 fps
const CHAR_W  = 38   // character sprite width

export default function useCharacter() {
  const [x,      setX]      = useState(180)
  const [facing, setFacing] = useState(1)   // 1 = right, -1 = left

  const keys   = useRef({})
  const xRef   = useRef(180)
  const raf    = useRef()

  useEffect(() => {
    const onDown = e => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      keys.current[e.key] = true
    }
    const onUp = e => { keys.current[e.key] = false }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)

    const tick = () => {
      const goLeft  = keys.current['ArrowLeft']
      const goRight = keys.current['ArrowRight']

      if (goLeft || goRight) {
        const maxX = window.innerWidth - CHAR_W
        let next = xRef.current + (goRight ? SPEED : -SPEED)
        next = Math.max(0, Math.min(maxX, next))

        if (next !== xRef.current) {
          xRef.current = next
          setX(next)
        }
        setFacing(goRight ? 1 : -1)
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup',   onUp)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return { x, facing }
}
