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
      width: big ? 'min(500px,92vw)' : 'min(530px,92vw)', maxHeight: '96vh', background: 'linear-gradient(165deg,#7d1c2c 0%,#5a1019 60%,#4a0d15 100%)',
      borderRadius: 34, border: '3px solid #2c0a10', padding: '18px 20px 20px',
      boxShadow: '0 30px 70px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.12), inset 0 -3px 8px rgba(0,0,0,0.4)',
      fontFamily: serif, display: 'flex', flexDirection: 'column',
    }}>
      {/* speaker grille + brand */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 9 }}>
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 6, background: '#2c0a10' }} />)}
      </div>
      <div style={{ textAlign: 'center', color: '#e9c9b0', font: `600 15px ${serif}`, letterSpacing: 4, opacity: 0.7, marginBottom: 9 }}>MUSEUM · AUDIO GUIDE</div>
      {/* screen */}
      <div style={{
        background: '#0f120e', border: `1px solid ${GOLD}55`, borderRadius: 16, padding: '18px 20px',
        minHeight: 320, maxHeight: 'min(62vh, 540px)', overflowY: 'auto', color: '#efe7d6',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7)',
      }}>
        {children}
      </div>
      {/* hardware buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 14 }}>
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
      width: 54, height: 54, borderRadius: 54, cursor: 'pointer',
      background: h ? 'radial-gradient(#3a0c12,#240709)' : 'radial-gradient(#320b10,#1f0608)',
      border: `2px solid ${GOLD}${h ? 'cc' : '77'}`, color: GOLD, font: `500 24px ${serif}`,
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)',
    }}>{label}</button>
  )
}

const row = (active) => ({
  display: 'block', width: '100%', textAlign: 'left', padding: '12px 13px', margin: '4px 0',
  background: active ? 'rgba(227,194,102,0.16)' : 'transparent', border: 'none',
  borderBottom: `1px solid ${GOLD}22`, color: '#efe7d6', font: `500 22px ${serif}`,
  cursor: 'pointer', borderRadius: 8,
})
const pill = (active) => ({
  display: 'block', width: '100%', textAlign: 'center', padding: '12px 13px', margin: '7px 0',
  background: active ? 'rgba(227,194,102,0.2)' : 'rgba(227,194,102,0.06)', border: `1px solid ${GOLD}66`,
  color: GOLD, font: `600 21px ${serif}`, cursor: 'pointer', borderRadius: 10,
})

export default function Guide() {
  const s = useMuseum()
  const [hover, setHover] = useState(null)
  const [piece, setPiece] = useState(null)   // selected piece within an exhibit card
  const [emailOpen, setEmailOpen] = useState(false)   // contact: reveal the two email options
  const [copied, setCopied] = useState(null)          // which email address was just copied
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  const advance = () => {
    const m = museum.get()
    if (m.phase === 'welcome') museum.set({ phase: 'howto' })
    else if (m.phase === 'howto') { museum.set({ phase: 'explore' }); openGuide() }
  }
  useEffect(() => {
    const cp = museum.get().cardPiece
    setPiece(cp ?? null)
    setEmailOpen(false); setCopied(null)
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
  const linkPill = { padding: '14px 24px', background: 'rgba(227,194,102,0.1)', border: `1px solid ${GOLD}66`, borderRadius: 10, color: GOLD, textDecoration: 'none', font: `500 23px ${serif}`, cursor: 'pointer' }

  return (
    <>
      {/* LOADING SCREEN - covers everything until assets are ready */}
      {!ready && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0a0c08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: serif }}>
          <div style={{ color: GOLD, font: `500 13px ${serif}`, letterSpacing: 5, textTransform: 'uppercase', opacity: 0.8 }}>Abby's Museum</div>
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
          <div style={{ display: 'inline-block', padding: '20px 46px', background: INK, border: `1px solid ${GOLD}66`, borderRadius: 12 }}>
            <div style={{ color: GOLD, font: `600 20px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.8 }}>Now Entering</div>
            <div style={{ color: '#f3ecd9', font: `400 46px ${serif}`, marginTop: 6 }}>{s.titleCard}</div>
          </div>
        </div>
      )}

      {/* STEP 1 - welcome */}
      {s.phase === 'welcome' && (
        <div onClick={advance} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, cursor: 'pointer', animation: 'fadeIn 1.2s ease' }}>
          <div style={{ textAlign: 'center', maxWidth: 'min(720px,92vw)', padding: '48px 58px', background: 'rgba(8,10,8,0.62)', border: `1px solid ${GOLD}44`, borderRadius: 18, backdropFilter: 'blur(3px)' }}>
            <div style={{ color: GOLD, font: `500 20px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>Welcome to</div>
            <div style={{ color: '#f3ecd9', font: `400 clamp(46px,9vw,66px) ${serif}`, margin: '14px 0 20px' }}>Abby's Museum</div>
            <div style={{ color: '#e7ddca', font: `400 26px/1.55 ${serif}`, opacity: 0.9 }}>An interactive gallery where each art piece reveals a chapter of my journey: projects, internships, research, and hobbies.</div>
            <div style={{ color: GOLD, font: `500 24px ${serif}`, marginTop: 30, letterSpacing: 0.5 }}>Tap the screen or press <b>SPACE</b> to see how it works</div>
          </div>
        </div>
      )}

      {/* STEP 2 - how it works (handheld audio guide) */}
      {s.phase === 'howto' && (
        <div onClick={advance} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, cursor: 'pointer', animation: 'fadeIn .8s ease' }}>
          <div style={{ textAlign: 'center', maxWidth: 'min(700px,92vw)', padding: '44px 54px', background: 'rgba(8,10,8,0.62)', border: `1px solid ${GOLD}44`, borderRadius: 18, backdropFilter: 'blur(3px)' }}>
            <div style={{ color: GOLD, font: `500 20px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>Your Audio Guide</div>
            {/* small centered device icon */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '26px 0' }}>
              <div style={{ width: 140, background: 'linear-gradient(165deg,#7d1c2c,#4a0d15)', border: '2px solid #2c0a10', borderRadius: 22, padding: '13px 12px 16px', boxShadow: '0 14px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 8 }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: 5, background: '#2c0a10' }} />)}</div>
                <div style={{ height: 116, background: '#0f120e', border: `1px solid ${GOLD}55`, borderRadius: 10, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.7)' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 11 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 15, height: 15, borderRadius: 15, border: `1px solid ${GOLD}88` }} />)}</div>
              </div>
            </div>
            <div style={{ color: '#e7ddca', font: `400 24px/1.55 ${serif}`, opacity: 0.92, marginTop: 2 }}>Use your audio guide to jump to any section of the wing, or click "Guide Me" to walk there yourself. When you get there, tap the paintings to see information for each experience!</div>
            <div style={{ color: GOLD, font: `500 24px ${serif}`, marginTop: 26 }}>Tap the screen or press <b>SPACE</b> to open the Audio Guide</div>
          </div>
        </div>
      )}

      {/* THE DEVICE - guide menu */}
      {s.menu && (
        <div style={dim} onClick={e => { if (e.target === e.currentTarget) closeGuide() }}>
          <Device>
            {!cat ? (
              <>
                <div style={{ color: GOLD, font: `600 18px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>Museum Guide</div>
                <div style={{ font: `400 22px ${serif}`, margin: '4px 0 14px' }}>Pick a section to visit:</div>
                {WINGS.map(w => (
                  <button key={w.id} style={row(hover === w.id)} onMouseEnter={() => setHover(w.id)} onMouseLeave={() => setHover(null)} onClick={() => museum.set({ menu: w.id })}>{w.title}</button>
                ))}
              </>
            ) : (
              <>
                <div style={{ color: GOLD, font: `600 17px ${serif}`, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.8 }}>{cat.wing}</div>
                <div style={{ font: `400 28px ${serif}`, margin: '4px 0 14px' }}>{cat.title}</div>
                {cat.sub && cat.sub.map(t => <div key={t} style={{ font: `400 19px ${serif}`, padding: '6px 0', borderBottom: `1px solid ${GOLD}22`, opacity: 0.85 }}>· {t}</div>)}
                <div style={{ font: `400 20px ${serif}`, margin: '14px 0 6px', opacity: 0.85 }}>Visit this exhibit:</div>
                <button style={pill(hover === 'gm')} onMouseEnter={() => setHover('gm')} onMouseLeave={() => setHover(null)} onClick={() => guideMe(cat)}>Guide Me</button>
                <button style={pill(hover === 'tp')} onMouseEnter={() => setHover('tp')} onMouseLeave={() => setHover(null)} onClick={() => teleport(cat)}>Teleport</button>
              </>
            )}
          </Device>
        </div>
      )}

      {/* exhibit card (E) - wings with `pieces` show a list → each piece opens its own detail */}
      {cardWing && (() => {
        const ex = cardWing.exhibit, pcs = ex.pieces
        const inList = pcs && piece === null
        const d = pcs ? (piece != null ? pcs[piece] : null) : ex
        const artFile = piece != null ? pcs[piece].art : (pcs ? null : cardWing.art)   // the painting itself
        const renderText = (str) => {
          const parts = String(str).split('{{SOCIALS}}')
          if (parts.length === 1) return str
          return parts.flatMap((p, idx) => idx === 0 ? [p] : [
            <button key={'sb' + idx} onClick={() => museum.set({ card: 'contact', cardPiece: null })} style={{ ...linkPill, display: 'inline-block', padding: '3px 14px', font: `600 19px ${serif}`, verticalAlign: 'baseline', margin: '0 4px' }}>SOCIALS</button>,
            p,
          ])
        }
        const Blocks = ({ data }) => {
          const blocks = Array.isArray(data) ? data : (data ? [data] : [])
          return blocks.map((blk, i) => Array.isArray(blk)
            ? <ul key={i} style={{ margin: '0 0 16px', paddingLeft: 28, lineHeight: 1.6 }}>{blk.map((it, j) => <li key={j} style={{ opacity: 0.92, marginBottom: 5 }}>{it}</li>)}</ul>
            : <p key={i} style={{ opacity: 0.9, lineHeight: 1.6, margin: '0 0 16px' }}>{renderText(blk)}</p>)
        }
        const detail = obj => (
          <>
            <Blocks data={obj.blurb} />
            {obj.images?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 22 }}>
                {obj.images.map((src, i) => <img key={i} src={ASSET + src} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, border: `1px solid ${GOLD}44` }} />)}
              </div>
            )}
            {obj.items?.length > 0 && <ul style={{ margin: '0 0 20px', paddingLeft: 28, lineHeight: 1.7 }}>{obj.items.map((it, i) => <li key={i} style={{ opacity: 0.92 }}>{it}</li>)}</ul>}
            {obj.skills?.length > 0 && (
              <div style={{ marginTop: 4, marginBottom: 18 }}>
                <div style={{ color: GOLD, font: `600 14px ${serif}`, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: 10 }}>Skills I gained</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {obj.skills.map((sk, i) => <span key={i} style={{ padding: '6px 13px', background: 'rgba(227,194,102,0.08)', border: `1px solid ${GOLD}55`, borderRadius: 20, font: `500 16px ${serif}`, opacity: 0.95 }}>{sk}</span>)}
                </div>
              </div>
            )}
            {obj.links?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
                {obj.links.map(l => {
                  if (l.emails) return (
                    <div key={l.label} style={{ position: 'relative' }}>
                      <button onClick={() => setEmailOpen(o => !o)} style={linkPill}>{l.label} {emailOpen ? '▴' : '▾'}</button>
                      {emailOpen && (
                        <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: 0, zIndex: 6, minWidth: 340, background: INK, border: `1px solid ${GOLD}77`, borderRadius: 13, padding: 12, boxShadow: '0 16px 36px rgba(0,0,0,0.6)' }}>
                          {l.emails.map(em => (
                            <div key={em.addr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 10px' }}>
                              <div style={{ textAlign: 'left', minWidth: 0 }}>
                                <div style={{ color: GOLD, font: `600 16px ${serif}`, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>{em.label}</div>
                                <div style={{ color: '#efe7d6', font: `400 21px ${serif}`, whiteSpace: 'nowrap' }}>{em.addr}</div>
                              </div>
                              <button onClick={() => { navigator.clipboard?.writeText(em.addr); setCopied(em.addr); setTimeout(() => setCopied(c => (c === em.addr ? null : c)), 1600) }} style={{ ...linkPill, padding: '8px 18px', font: `600 19px ${serif}`, whiteSpace: 'nowrap', background: copied === em.addr ? 'rgba(227,194,102,0.28)' : 'rgba(227,194,102,0.1)' }}>{copied === em.addr ? 'Copied!' : 'Copy'}</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                  if (l.jump) return <button key={l.label} onClick={() => museum.set({ card: l.jump, cardPiece: null })} style={linkPill}>{l.label}</button>
                  const href = l.pdf ? ASSET + l.pdf : l.url
                  return <a key={l.label} href={href} target="_blank" rel="noreferrer" style={linkPill}>{l.label}</a>
                })}
              </div>
            )}
          </>
        )
        return (
          <div style={dim} onClick={e => { if (e.target === e.currentTarget) museum.set({ card: null }) }}>
            <div style={{ width: inList ? 'min(860px,94vw)' : 'min(1240px,96vw)', maxHeight: '88vh', overflowY: 'auto', background: INK, border: `1px solid ${GOLD}55`, borderRadius: 18, padding: '44px 52px', color: '#efe7d6', fontFamily: serif, fontSize: 22, boxShadow: '0 24px 70px rgba(0,0,0,0.6)' }}>
              <div style={{ color: GOLD, font: `600 19px ${serif}`, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.8 }}>{cardWing.wing}</div>
              <div style={{ font: `400 48px ${serif}`, margin: '6px 0 18px' }}>{piece != null ? pcs[piece].title : cardWing.title}</div>
              {inList ? (
                <>
                  <div style={{ opacity: 0.9, lineHeight: 1.55, marginBottom: 24 }}>{ex.blurb}</div>
                  {pcs.map((p, i) => (
                    <button key={i} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '20px 24px', margin: '10px 0', background: hover === 'pc' + i ? 'rgba(227,194,102,0.16)' : 'rgba(227,194,102,0.05)', border: `1px solid ${GOLD}44`, borderRadius: 11, color: '#efe7d6', font: `500 27px ${serif}`, cursor: 'pointer' }} onMouseEnter={() => setHover('pc' + i)} onMouseLeave={() => setHover(null)} onClick={() => setPiece(i)}>{p.title} ›</button>
                  ))}
                </>
              ) : (
                <>
                  {pcs && <button style={{ marginBottom: 18, padding: '10px 20px', background: 'transparent', border: `1px solid ${GOLD}55`, borderRadius: 10, color: GOLD, font: `500 22px ${serif}`, cursor: 'pointer' }} onClick={() => setPiece(null)}>‹ All of {cardWing.title}</button>}
                  <div style={{ display: 'flex', gap: 34, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 360px', minWidth: 300 }}>{detail(d)}</div>
                    {artFile && (
                      <div style={{ flex: '0 0 460px', maxWidth: '100%', margin: '0 auto' }}>
                        <img src={ASSET + 'art/hi/' + artFile} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ASSET + 'art/' + artFile }} alt="" style={{ width: '100%', display: 'block', borderRadius: 6, border: `2px solid ${GOLD}55`, boxShadow: '0 12px 34px rgba(0,0,0,0.55)' }} />
                        {d.artwork && <div style={{ marginTop: 14, textAlign: 'center', color: GOLD, opacity: 0.8, font: `italic 400 21px ${serif}`, lineHeight: 1.4 }}>{d.artwork}</div>}
                        {d.why && (
                          <div style={{ marginTop: 16, padding: '16px 18px', background: 'rgba(227,194,102,0.06)', borderLeft: `3px solid ${GOLD}99`, borderRadius: 8, textAlign: 'left' }}>
                            <div style={{ color: GOLD, font: `600 14px ${serif}`, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: 8 }}>Why this painting?</div>
                            <Blocks data={d.why} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              {cardWing.id === 'about' && (() => {
                const photos = cardWing.exhibit.photos || []
                const slots = photos.length ? photos : [null, null, null]
                return (
                  <div style={{ marginTop: 28 }}>
                    <div style={{ color: GOLD, font: `600 14px ${serif}`, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: 12 }}>Me &amp; My Family</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      {slots.map((p, i) => p
                        ? <img key={i} src={ASSET + 'about/' + p} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 10, border: `2px solid ${GOLD}66` }} />
                        : <div key={i} style={{ aspectRatio: '4 / 3', borderRadius: 10, border: `2px dashed ${GOLD}55`, background: 'rgba(227,194,102,0.04)' }} />)}
                    </div>
                  </div>
                )
              })()}
              <button style={{ marginTop: 26, padding: '14px 28px', background: 'rgba(227,194,102,0.08)', border: `1px solid ${GOLD}66`, borderRadius: 10, color: GOLD, font: `500 24px ${serif}`, cursor: 'pointer' }} onClick={() => museum.set({ card: null })}>Close</button>
            </div>
          </div>
        )
      })()}

      {/* hover label when near/looking at a painting (tap it to open) */}
      {!s.menu && !s.card && s.phase === 'explore' && s.focus && (
        <button onClick={() => museum.set({ card: s.focus.wingId, cardPiece: s.focus.piece })} style={{ position: 'fixed', left: '50%', bottom: isMobile ? 78 : 64, transform: 'translateX(-50%)', zIndex: 23, padding: '14px 26px', background: INK, border: `1px solid ${GOLD}77`, borderRadius: 11, color: GOLD, font: `500 23px ${serif}`, cursor: 'pointer', animation: 'fadeIn .25s ease', whiteSpace: 'nowrap' }}>Tap each painting to see different projects</button>
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
