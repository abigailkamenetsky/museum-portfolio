import { useEffect, useState } from 'react'
import { museum, useMuseum, openGuide, closeGuide } from '../../museum/store'
import { WINGS, wingById } from '../../data/museum'

const GOLD = '#e3c266'
const INK = 'rgba(14,16,12,0.93)'
const serif = 'Georgia, "Times New Roman", serif'

const panel = {
  position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 30, background: 'rgba(6,8,6,0.55)', backdropFilter: 'blur(4px)',
}
const card = {
  width: 'min(680px, 92vw)', maxHeight: '86vh', overflowY: 'auto', background: INK,
  border: `1px solid ${GOLD}55`, borderRadius: 14, padding: '30px 34px', color: '#efe7d6',
  fontFamily: serif, boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
}
const goldBtn = {
  display: 'block', width: '100%', textAlign: 'left', margin: '8px 0', padding: '14px 18px',
  background: 'rgba(227,194,102,0.06)', border: `1px solid ${GOLD}44`, borderRadius: 9,
  color: '#efe7d6', font: `500 17px/1.2 ${serif}`, cursor: 'pointer', letterSpacing: 0.3,
  transition: 'background .15s, border-color .15s',
}

function teleport(w) {
  closeGuide()
  museum.set({ fade: 1 })
  setTimeout(() => {
    museum.set({ teleport: { x: w.pos[0], z: w.pos[1], yaw: w.yaw, title: w.wing }, fade: 0, titleCard: w.wing })
    setTimeout(() => { if (museum.get().titleCard === w.wing) museum.set({ titleCard: null }) }, 2800)
  }, 430)
}

function guideMe(w) {
  closeGuide()
  museum.set({ guide: { id: w.id, pos: w.pos, title: w.wing } })
}

export default function Guide() {
  const s = useMuseum()
  const [hover, setHover] = useState(null)

  // welcome appears 3s after entry
  useEffect(() => {
    const t = setTimeout(() => { if (museum.get().phase === 'enter') museum.set({ phase: 'welcome' }) }, 3000)
    return () => clearTimeout(t)
  }, [])

  // global keys: SPACE opens the guide, M toggles it, E opens the nearby exhibit
  useEffect(() => {
    const onKey = e => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!museum.get().menu && !museum.get().card) { museum.set({ phase: 'explore' }); openGuide() }
      } else if (e.code === 'KeyM') {
        e.preventDefault()
        museum.set({ phase: 'explore' })
        museum.get().menu ? closeGuide() : openGuide()
      } else if (e.code === 'KeyE') {
        const near = museum.get().near
        if (near && !museum.get().menu) museum.set({ card: near })
      } else if (e.code === 'Escape') {
        if (museum.get().card) museum.set({ card: null })
        else if (museum.get().menu) closeGuide()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hb = id => ({ ...goldBtn, ...(hover === id ? { background: 'rgba(227,194,102,0.16)', borderColor: `${GOLD}99` } : null) })
  const cat = s.menu && s.menu !== 'home' ? wingById(s.menu) : null
  const cardWing = s.card ? wingById(s.card) : null

  return (
    <>
      {/* teleport fade */}
      <div style={{ position: 'fixed', inset: 0, background: '#000', opacity: s.fade, pointerEvents: 'none', transition: 'opacity .42s ease', zIndex: 40 }} />

      {/* wing title card after teleport */}
      {s.titleCard && (
        <div style={{ position: 'fixed', top: '16%', left: 0, right: 0, textAlign: 'center', zIndex: 35, pointerEvents: 'none', animation: 'fadeIn .7s ease' }}>
          <div style={{ display: 'inline-block', padding: '14px 30px', background: INK, border: `1px solid ${GOLD}66`, borderRadius: 10 }}>
            <div style={{ color: GOLD, font: `600 13px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>Now Entering</div>
            <div style={{ color: '#f3ecd9', font: `400 30px ${serif}`, marginTop: 4 }}>{s.titleCard}</div>
          </div>
        </div>
      )}

      {/* welcome prompt */}
      {s.phase === 'welcome' && !s.menu && !s.card && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, pointerEvents: 'none', animation: 'fadeIn 1.4s ease' }}>
          <div style={{ textAlign: 'center', padding: '34px 46px', background: 'rgba(8,10,8,0.6)', border: `1px solid ${GOLD}44`, borderRadius: 14, backdropFilter: 'blur(3px)' }}>
            <div style={{ color: GOLD, font: `500 13px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>Welcome to the</div>
            <div style={{ color: '#f3ecd9', font: `400 38px ${serif}`, margin: '10px 0 4px' }}>Museum of Abigail Kamenetsky</div>
            <div style={{ color: GOLD, font: `500 16px ${serif}`, marginTop: 18, letterSpacing: 1 }}>Press <b>SPACE</b> to open the Museum Guide</div>
          </div>
        </div>
      )}

      {/* guide — home or a category */}
      {s.menu && (
        <div style={panel} onClick={e => { if (e.target === e.currentTarget) closeGuide() }}>
          <div style={card}>
            {!cat ? (
              <>
                <div style={{ color: GOLD, font: `600 13px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>Museum Guide</div>
                <div style={{ font: `400 26px ${serif}`, margin: '4px 0 18px' }}>How would you like to explore?</div>
                {WINGS.map(w => (
                  <button key={w.id} style={hb(w.id)} onMouseEnter={() => setHover(w.id)} onMouseLeave={() => setHover(null)} onClick={() => museum.set({ menu: w.id })}>
                    {w.title}
                  </button>
                ))}
                <div style={{ opacity: 0.5, fontSize: 13, marginTop: 16 }}>Press <b>M</b> any time to reopen · click outside to close</div>
              </>
            ) : (
              <>
                <button style={{ ...goldBtn, width: 'auto', display: 'inline-block', padding: '6px 14px', margin: '0 0 14px' }} onClick={() => museum.set({ menu: 'home' })}>‹ All Wings</button>
                <div style={{ color: GOLD, font: `600 13px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>{cat.wing}</div>
                <div style={{ font: `400 28px ${serif}`, margin: '4px 0 10px' }}>{cat.title}</div>
                <div style={{ opacity: 0.85, lineHeight: 1.5, marginBottom: cat.sub ? 12 : 18 }}>{cat.exhibit.blurb}</div>
                {cat.sub && (
                  <div style={{ margin: '0 0 18px' }}>
                    {cat.sub.map(t => <div key={t} style={{ padding: '6px 0', borderBottom: `1px solid ${GOLD}22`, opacity: 0.9 }}>· {t}</div>)}
                  </div>
                )}
                <div style={{ font: `400 17px ${serif}`, margin: '8px 0 6px', opacity: 0.9 }}>How would you like to visit this exhibit?</div>
                <button style={hb('gm')} onMouseEnter={() => setHover('gm')} onMouseLeave={() => setHover(null)} onClick={() => guideMe(cat)}>Guide Me — walk there with directions</button>
                <button style={hb('tp')} onMouseEnter={() => setHover('tp')} onMouseLeave={() => setHover(null)} onClick={() => teleport(cat)}>Teleport — take me straight there</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* exhibit card (E) */}
      {cardWing && (
        <div style={panel} onClick={e => { if (e.target === e.currentTarget) museum.set({ card: null }) }}>
          <div style={card}>
            <div style={{ color: GOLD, font: `600 13px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>{cardWing.wing}</div>
            <div style={{ font: `400 30px ${serif}`, margin: '4px 0 12px' }}>{cardWing.title}</div>
            <div style={{ opacity: 0.9, lineHeight: 1.55, marginBottom: 16 }}>{cardWing.exhibit.blurb}</div>
            {cardWing.exhibit.items?.length > 0 && (
              <ul style={{ margin: '0 0 16px', paddingLeft: 20, lineHeight: 1.7 }}>
                {cardWing.exhibit.items.map((it, i) => <li key={i} style={{ opacity: 0.92 }}>{it}</li>)}
              </ul>
            )}
            {cardWing.exhibit.links?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {cardWing.exhibit.links.map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{ padding: '9px 16px', background: 'rgba(227,194,102,0.1)', border: `1px solid ${GOLD}66`, borderRadius: 8, color: GOLD, textDecoration: 'none', font: `500 15px ${serif}` }}>{l.label}</a>
                ))}
              </div>
            )}
            <button style={{ ...goldBtn, width: 'auto', display: 'inline-block', padding: '8px 18px', marginTop: 18 }} onClick={() => museum.set({ card: null })}>Close</button>
          </div>
        </div>
      )}

      {/* bottom hints */}
      {!s.menu && !s.card && (
        <div style={{ position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', textAlign: 'center' }}>
          {s.near && (
            <div style={{ marginBottom: 8, display: 'inline-block', padding: '8px 16px', background: INK, border: `1px solid ${GOLD}66`, borderRadius: 8, color: GOLD, font: `500 15px ${serif}`, animation: 'fadeIn .3s ease' }}>
              Press <b>E</b> to Learn More — {wingById(s.near)?.title}
            </div>
          )}
          {s.phase === 'explore' && (
            <div style={{ color: '#efe7d6', opacity: 0.55, font: `500 13px ${serif}`, letterSpacing: 0.5 }}>
              WASD / arrows to move · drag to look · <b>M</b> guide · <b>E</b> exhibit
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </>
  )
}
