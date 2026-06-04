import { useEffect, useState } from 'react'
import Scene from './components/Scene/Scene'
import './index.css'

export default function App() {
  const [hint, setHint] = useState(true)
  useEffect(() => {
    const onLock = () => setHint(document.pointerLockElement == null)
    document.addEventListener('pointerlockchange', onLock)
    return () => document.removeEventListener('pointerlockchange', onLock)
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
          Click to look around &nbsp;·&nbsp; <b>WASD</b> / arrows to move &nbsp;·&nbsp; <b>Shift</b> to run &nbsp;·&nbsp; <b>Esc</b> to release
        </div>
      )}
    </>
  )
}
