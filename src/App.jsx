import { useEffect, useState } from 'react'
import Scene from './components/Scene/Scene'
import './index.css'

export default function App() {
  const [hint, setHint] = useState(true)
  useEffect(() => {
    const hide = () => setHint(false)
    window.addEventListener('pointerdown', hide, { once: true })
    return () => window.removeEventListener('pointerdown', hide)
  }, [])
  return (
    <>
      <Scene />
      {hint && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)',
          padding: '10px 18px', borderRadius: 10, pointerEvents: 'none',
          background: 'rgba(12,14,10,0.62)', color: '#efe7d6', font: '500 14px/1.4 ui-sans-serif, system-ui',
          letterSpacing: 0.3, textAlign: 'center', backdropFilter: 'blur(3px)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
        }}>
          <b>WASD</b> / arrows to move &nbsp;·&nbsp; <b>drag</b> to look around &nbsp;·&nbsp; <b>scroll</b> to zoom &nbsp;·&nbsp; <b>Shift</b> to run
        </div>
      )}
    </>
  )
}
