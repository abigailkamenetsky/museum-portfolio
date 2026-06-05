import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { museum, useMuseum, openGuide, closeGuide } from '../../museum/store'
import { WINGS, wingById } from '../../data/museum'

const ASSET = import.meta.env.BASE_URL + 'assets/'

const GOLD = '#e3c266'
const INK = 'rgba(14,16,12,0.94)'
const serif = 'Georgia, "Times New Roman", serif'

/* ── teleport / guide-me actions ─────────────────────────── */
function teleport(w) {
  closeGuide()
  museum.set({ guide: null, fade: 1 })   // abandon any active Guide-Me arrow
  setTimeout(() => {
    museum.set({ teleport: { x: w.pos[0], z: w.pos[1], yaw: w.yaw, title: w.wing }, fade: 0, titleCard: w.wing })
    setTimeout(() => { if (museum.get().titleCard === w.wing) museum.set({ titleCard: null }) }, 2800)
  }, 430)
}
function guideMe(w) { closeGuide(); museum.set({ guide: { id: w.id, pos: w.pos, title: w.wing } }) }

/* ── the handheld audio-guide device shell ───────────────── */
function Device({ children, big }) {
  return (
    <div style={{
      width: big ? 300 : 330, background: 'linear-gradient(165deg,#7d1c2c 0%,#5a1019 60%,#4a0d15 100%)',
      borderRadius: 30, border: '2px solid #2c0a10', padding: '16px 15px 18px',
      boxShadow: '0 30px 70px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.12), inset 0 -3px 8px rgba(0,0,0,0.4)',
      fontFamily: serif,
    }}>
      {/* speaker grille + brand */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: 4, background: '#2c0a10' }} />)}
      </div>
      <div style={{ textAlign: 'center', color: '#e9c9b0', font: `600 10px ${serif}`, letterSpacing: 3, opacity: 0.7, marginBottom: 8 }}>MUSEUM · AUDIO GUIDE</div>
      {/* screen */}
      <div style={{
        background: '#0f120e', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '14px 14px',
        minHeight: 300, maxHeight: 'min(56vh, 360px)', overflowY: 'auto', color: '#efe7d6',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7)',
      }}>
        {children}
      </div>
      {/* hardware buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 14 }}>
        <DeviceBtn label="‹" title="Back" onClick={() => { const m = museum.get().menu; museum.set({ menu: m && m !== 'home' ? 'home' : null }) }} />
        <DeviceBtn label="⌂" title="Home" onClick={() => museum.set({ menu: 'home' })} />
        <DeviceBtn label="✕" title="Close" onClick={closeGuide} />
      </div>
    </div>
  )
}
function DeviceBtn({ label, title, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: 42, height: 42, borderRadius: 42, cursor: 'pointer',
      background: h ? 'radial-gradient(#3a0c12,#240709)' : 'radial-gradient(#320b10,#1f0608)',
      border: `1.5px solid ${GOLD}${h ? 'cc' : '77'}`, color: GOLD, font: `500 18px ${serif}`,
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)',
    }}>{label}</button>
  )
}

const row = (active) => ({
  display: 'block', width: '100%', textAlign: 'left', padding: '9px 10px', margin: '3px 0',
  background: active ? 'rgba(227,194,102,0.16)' : 'transparent', border: 'none',
  borderBottom: `1px solid ${GOLD}22`, color: '#efe7d6', font: `500 15px ${serif}`,
  cursor: 'pointer', borderRadius: 6,
})
const pill = (active) => ({
  display: 'block', width: '100%', textAlign: 'center', padding: '9px 10px', margin: '6px 0',
  background: active ? 'rgba(227,194,102,0.2)' : 'rgba(227,194,102,0.06)', border: `1px solid ${GOLD}66`,
  color: GOLD, font: `600 14px ${serif}`, cursor: 'pointer', borderRadius: 8,
})

export default function Guide() {
  const s = useMuseum()
  const [hover, setHover] = useState(null)
  const [piece, setPiece] = useState(null)   // selected piece within an exhibit card
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  const advance = () => {
    const m = museum.get()
    if (m.phase === 'welcome') museum.set({ phase: 'howto' })
    else if (m.phase === 'howto') { museum.set({ phase: 'explore' }); openGuide() }
  }
  useEffect(() => {
    const cp = museum.get().cardPiece
    setPiece(cp ?? null)
    if (cp != null) museum.set({ cardPiece: null })
  }, [s.card])

  // LOADING GATE: hold a loading screen until assets finish, THEN show the welcome
  const { active, progress } = useProgress()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (ready || active || progress < 100) return
    const t = setTimeout(() => { setReady(true); museum.set({ phase: 'welcome' }) }, 900)  // grace for non-Suspense textures
    return () => clearTimeout(t)
  }, [active, progress, ready])
  useEffect(() => {   // safety: never get stuck on the loader
    const t = setTimeout(() => setReady(r => { if (!r) museum.set({ phase: 'welcome' }); return true }), 16000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = e => {
      const m = museum.get()
      if (e.code === 'Space') {
        e.preventDefault()
        if (m.phase === 'welcome' || m.phase === 'howto') advance()
        else if (!m.menu && !m.card) openGuide()
      } else if (e.code === 'KeyM') {
        e.preventDefault(); museum.set({ phase: 'explore' }); m.menu ? closeGuide() : openGuide()
      } else if (e.code === 'Escape') {
        if (m.card) museum.set({ card: null }); else if (m.menu) closeGuide()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cat = s.menu && s.menu !== 'home' ? wingById(s.menu) : null
  const cardWing = s.card ? wingById(s.card) : null
  const dim = { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, background: 'rgba(6,8,6,0.5)', backdropFilter: 'blur(3px)' }

  return (
    <>
      {/* LOADING SCREEN — covers everything until assets are ready */}
      {!ready && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0a0c08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: serif }}>
          <div style={{ color: GOLD, font: `500 13px ${serif}`, letterSpacing: 5, textTransform: 'uppercase', opacity: 0.8 }}>The Museum of Abby</div>
          <div style={{ color: '#f3ecd9', font: `400 26px ${serif}`, margin: '14px 0 18px' }}>Preparing the gallery…</div>
          <div style={{ width: 220, height: 3, background: 'rgba(227,194,102,0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.round(progress))}%`, height: '100%', background: GOLD, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {/* teleport fade */}
      <div style={{ position: 'fixed', inset: 0, background: '#000', opacity: s.fade, pointerEvents: 'none', transition: 'opacity .42s ease', zIndex: 40 }} />

      {/* "Now Entering" title card */}
      {s.titleCard && (
        <div style={{ position: 'fixed', top: '15%', left: 0, right: 0, textAlign: 'center', zIndex: 35, pointerEvents: 'none', animation: 'fadeIn .7s ease' }}>
          <div style={{ display: 'inline-block', padding: '12px 28px', background: INK, border: `1px solid ${GOLD}66`, borderRadius: 10 }}>
            <div style={{ color: GOLD, font: `600 12px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>Now Entering</div>
            <div style={{ color: '#f3ecd9', font: `400 27px ${serif}`, marginTop: 3 }}>{s.titleCard}</div>
          </div>
        </div>
      )}

      {/* STEP 1 — welcome */}
      {s.phase === 'welcome' && (
        <div onClick={advance} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, cursor: 'pointer', animation: 'fadeIn 1.2s ease' }}>
          <div style={{ textAlign: 'center', maxWidth: 460, padding: '30px 38px', background: 'rgba(8,10,8,0.62)', border: `1px solid ${GOLD}44`, borderRadius: 14, backdropFilter: 'blur(3px)' }}>
            <div style={{ color: GOLD, font: `500 12px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>Welcome to the</div>
            <div style={{ color: '#f3ecd9', font: `400 clamp(30px,6vw,40px) ${serif}`, margin: '8px 0 12px' }}>Museum of Abby</div>
            <div style={{ color: '#e7ddca', font: `400 16px/1.55 ${serif}`, opacity: 0.9 }}>An interactive gallery where each art piece reveals a chapter of my journey: projects, internships, research, and hobbies.</div>
            <div style={{ color: GOLD, font: `500 15px ${serif}`, marginTop: 20, letterSpacing: 0.5 }}>Tap the screen or press <b>SPACE</b> to see how it works</div>
          </div>
        </div>
      )}

      {/* STEP 2 — how it works (handheld audio guide) */}
      {s.phase === 'howto' && (
        <div onClick={advance} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, cursor: 'pointer', animation: 'fadeIn .8s ease' }}>
          <div style={{ textAlign: 'center', maxWidth: 440, padding: '26px 34px', background: 'rgba(8,10,8,0.62)', border: `1px solid ${GOLD}44`, borderRadius: 14, backdropFilter: 'blur(3px)' }}>
            <div style={{ color: GOLD, font: `500 12px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>Your Audio Guide</div>
            {/* small centered device icon */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
              <div style={{ width: 84, background: 'linear-gradient(165deg,#7d1c2c,#4a0d15)', border: '2px solid #2c0a10', borderRadius: 16, padding: '8px 7px 10px', boxShadow: '0 14px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 5 }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: 3, background: '#2c0a10' }} />)}</div>
                <div style={{ height: 70, background: '#0f120e', border: `1px solid ${GOLD}55`, borderRadius: 6, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.7)' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 7 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 9, border: `1px solid ${GOLD}88` }} />)}</div>
              </div>
            </div>
            <div style={{ color: '#e7ddca', font: `400 15px/1.55 ${serif}`, opacity: 0.92, marginTop: 2 }}>Tap on the paintings to see information for each project! Or use your handheld guide to jump to any wing.</div>
            <div style={{ color: GOLD, font: `500 15px ${serif}`, marginTop: 16 }}>Tap the screen or press <b>SPACE</b> to open the Audio Guide</div>
          </div>
        </div>
      )}

      {/* THE DEVICE — guide menu */}
      {s.menu && (
        <div style={dim} onClick={e => { if (e.target === e.currentTarget) closeGuide() }}>
          <Device>
            {!cat ? (
              <>
                <div style={{ color: GOLD, font: `600 12px ${serif}`, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>Museum Guide</div>
                <div style={{ font: `400 18px ${serif}`, margin: '2px 0 10px' }}>How would you like to explore?</div>
                {WINGS.map(w => (
                  <button key={w.id} style={row(hover === w.id)} onMouseEnter={() => setHover(w.id)} onMouseLeave={() => setHover(null)} onClick={() => museum.set({ menu: w.id })}>{w.title}</button>
                ))}
              </>
            ) : (
              <>
                <div style={{ color: GOLD, font: `600 11px ${serif}`, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>{cat.wing}</div>
                <div style={{ font: `400 20px ${serif}`, margin: '2px 0 8px' }}>{cat.title}</div>
                <div style={{ opacity: 0.85, font: `400 14px/1.5 ${serif}`, marginBottom: cat.sub ? 8 : 12 }}>{cat.exhibit.blurb}</div>
                {cat.sub && cat.sub.map(t => <div key={t} style={{ font: `400 13px ${serif}`, padding: '4px 0', borderBottom: `1px solid ${GOLD}22`, opacity: 0.85 }}>· {t}</div>)}
                <div style={{ font: `400 14px ${serif}`, margin: '12px 0 4px', opacity: 0.85 }}>Visit this exhibit:</div>
                <button style={pill(hover === 'gm')} onMouseEnter={() => setHover('gm')} onMouseLeave={() => setHover(null)} onClick={() => guideMe(cat)}>Guide Me</button>
                <button style={pill(hover === 'tp')} onMouseEnter={() => setHover('tp')} onMouseLeave={() => setHover(null)} onClick={() => teleport(cat)}>Teleport</button>
              </>
            )}
          </Device>
        </div>
      )}

      {/* exhibit card (E) — wings with `pieces` show a list → each piece opens its own detail */}
      {cardWing && (() => {
        const ex = cardWing.exhibit, pcs = ex.pieces
        const inList = pcs && piece === null
        const d = pcs ? (piece != null ? pcs[piece] : null) : ex
        const artFile = piece != null ? pcs[piece].art : (pcs ? null : cardWing.art)   // the painting itself
        const detail = obj => (
          <>
            {obj.artwork && <div style={{ color: GOLD, opacity: 0.75, font: `italic 400 13px ${serif}`, marginBottom: 8 }}>{obj.artwork}</div>}
            {obj.blurb && <div style={{ opacity: 0.9, lineHeight: 1.55, marginBottom: 14 }}>{obj.blurb}</div>}
            {obj.images?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
                {obj.images.map((src, i) => <img key={i} src={ASSET + src} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: `1px solid ${GOLD}44` }} />)}
              </div>
            ) : cardWing.id === 'about' && (
              <div style={{ marginBottom: 16, padding: '22px', textAlign: 'center', border: `1px dashed ${GOLD}44`, borderRadius: 8, opacity: 0.6, font: `400 14px ${serif}` }}>Photos coming soon — add them to <code>public/assets/about/</code></div>
            )}
            {obj.items?.length > 0 && <ul style={{ margin: '0 0 14px', paddingLeft: 20, lineHeight: 1.7 }}>{obj.items.map((it, i) => <li key={i} style={{ opacity: 0.92 }}>{it}</li>)}</ul>}
            {obj.links?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                {obj.links.map(l => <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{ padding: '9px 16px', background: 'rgba(227,194,102,0.1)', border: `1px solid ${GOLD}66`, borderRadius: 8, color: GOLD, textDecoration: 'none', font: `500 15px ${serif}` }}>{l.label}</a>)}
              </div>
            )}
          </>
        )
        return (
          <div style={dim} onClick={e => { if (e.target === e.currentTarget) museum.set({ card: null }) }}>
            <div style={{ width: inList ? 'min(600px,92vw)' : 'min(880px,94vw)', maxHeight: '86vh', overflowY: 'auto', background: INK, border: `1px solid ${GOLD}55`, borderRadius: 14, padding: '28px 32px', color: '#efe7d6', fontFamily: serif, boxShadow: '0 24px 70px rgba(0,0,0,0.6)' }}>
              <div style={{ color: GOLD, font: `600 12px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>{cardWing.wing}</div>
              <div style={{ font: `400 28px ${serif}`, margin: '4px 0 12px' }}>{piece != null ? pcs[piece].title : cardWing.title}</div>
              {inList ? (
                <>
                  <div style={{ opacity: 0.9, lineHeight: 1.55, marginBottom: 16 }}>{ex.blurb}</div>
                  {pcs.map((p, i) => (
                    <button key={i} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '13px 16px', margin: '7px 0', background: hover === 'pc' + i ? 'rgba(227,194,102,0.16)' : 'rgba(227,194,102,0.05)', border: `1px solid ${GOLD}44`, borderRadius: 9, color: '#efe7d6', font: `500 16px ${serif}`, cursor: 'pointer' }} onMouseEnter={() => setHover('pc' + i)} onMouseLeave={() => setHover(null)} onClick={() => setPiece(i)}>{p.title} ›</button>
                  ))}
                </>
              ) : (
                <>
                  {pcs && <button style={{ marginBottom: 12, padding: '6px 14px', background: 'transparent', border: `1px solid ${GOLD}55`, borderRadius: 8, color: GOLD, font: `500 14px ${serif}`, cursor: 'pointer' }} onClick={() => setPiece(null)}>‹ All of {cardWing.title}</button>}
                  <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px', minWidth: 230 }}>{detail(d)}</div>
                    {artFile && (
                      <div style={{ flex: '0 0 320px', maxWidth: '100%', margin: '0 auto' }}>
                        <img src={ASSET + 'art/' + artFile} alt="" style={{ width: '100%', display: 'block', borderRadius: 6, border: `2px solid ${GOLD}55`, boxShadow: '0 12px 34px rgba(0,0,0,0.55)' }} />
                      </div>
                    )}
                  </div>
                </>
              )}
              <button style={{ marginTop: 18, padding: '8px 18px', background: 'rgba(227,194,102,0.08)', border: `1px solid ${GOLD}66`, borderRadius: 8, color: GOLD, font: `500 15px ${serif}`, cursor: 'pointer' }} onClick={() => museum.set({ card: null })}>Close</button>
            </div>
          </div>
        )
      })()}

      {/* hover label when near/looking at a painting (tap it to open) */}
      {!s.menu && !s.card && s.phase === 'explore' && s.focus && (
        <button onClick={() => museum.set({ card: s.focus.wingId, cardPiece: s.focus.piece })} style={{ position: 'fixed', left: '50%', bottom: isMobile ? 70 : 60, transform: 'translateX(-50%)', zIndex: 23, padding: '9px 18px', background: INK, border: `1px solid ${GOLD}77`, borderRadius: 9, color: GOLD, font: `500 15px ${serif}`, cursor: 'pointer', animation: 'fadeIn .25s ease', whiteSpace: 'nowrap' }}>Tap each painting to see different projects</button>
      )}

      {/* desktop-only bottom hint (hidden on mobile) */}
      {!isMobile && !s.menu && !s.card && s.phase === 'explore' && (
        <div style={{ position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', textAlign: 'center', color: '#efe7d6', opacity: 0.55, font: `500 13px ${serif}` }}>
          WASD / arrows · drag to look · <b>M</b> audio guide · click a painting
        </div>
      )}

      {/* mobile-only audio-guide button (bottom-right) */}
      {isMobile && ready && !s.menu && !s.card && s.phase === 'explore' && (
        <button onClick={openGuide} aria-label="Open audio guide" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 22, width: 58, height: 76, padding: '7px 6px', borderRadius: 14, border: '2px solid #2c0a10', background: 'linear-gradient(165deg,#7d1c2c,#4a0d15)', boxShadow: '0 8px 22px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: 3, background: '#2c0a10' }} />)}</div>
          <div style={{ height: 38, background: '#0f120e', border: `1px solid ${GOLD}66`, borderRadius: 5, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)' }} />
          <div style={{ color: GOLD, font: `600 7px ${serif}`, textAlign: 'center', marginTop: 5, letterSpacing: 1.5 }}>GUIDE</div>
        </button>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </>
  )
}
