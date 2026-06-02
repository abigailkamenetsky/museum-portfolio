import './index.css'

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      background: 'var(--floor-dark)',
    }}>
      <div style={{
        background: 'var(--wall-green)',
        width: '600px',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '16px solid var(--ceiling)',
        borderBottom: '24px solid var(--floor-dark)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'var(--dado)',
        }} />
        <p style={{
          fontFamily: 'Georgia, serif',
          color: 'var(--text-light)',
          fontSize: '18px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          zIndex: 1,
        }}>
          Mauritshuis Green — confirm this color
        </p>
      </div>
      <p style={{
        color: 'var(--light-ambient)',
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        opacity: 0.6,
      }}>
        var(--wall-green): #4c5a3d &nbsp;|&nbsp; Milestone 0 scaffold
      </p>
    </div>
  )
}
