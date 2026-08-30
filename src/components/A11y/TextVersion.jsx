import { useEffect, useRef, useState } from 'react'
import { WINGS } from '../../data/museum'
import './TextVersion.css'

// The gallery is a single WebGL canvas, so without this every word of the
// resume is invisible to screen readers, keyboard users and crawlers.
// Same data as the 3D wings, never a second copy of the content.

const SOCIALS = 'the Socials and Contact wing'
const clean = (s) => String(s).replace(/\{\{SOCIALS\}\}/g, SOCIALS)

function Blurb({ value, keyPrefix }) {
  if (!value) return null
  const parts = Array.isArray(value) ? value : [value]
  return parts.map((part, i) =>
    Array.isArray(part) ? (
      <ul key={`${keyPrefix}-l${i}`}>
        {part.map((li, j) => <li key={j}>{clean(li)}</li>)}
      </ul>
    ) : (
      <p key={`${keyPrefix}-p${i}`}>{clean(part)}</p>
    ),
  )
}

function Links({ links }) {
  if (!links?.length) return null
  return (
    <ul className="tv-links">
      {links.map((l, i) => (
        <li key={i}>
          <a href={l.url || l.pdf} target="_blank" rel="noopener noreferrer">{l.label}</a>
        </li>
      ))}
    </ul>
  )
}

function Piece({ piece }) {
  return (
    <article className="tv-piece">
      <h3>{piece.title}</h3>
      <Blurb value={piece.blurb} keyPrefix={piece.title} />
      {piece.skills?.length > 0 && (
        <p className="tv-meta"><strong>Skills:</strong> {piece.skills.join(', ')}</p>
      )}
      {piece.items?.length > 0 && (
        <ul>{piece.items.map((it, i) => <li key={i}>{clean(it)}</li>)}</ul>
      )}
      {piece.artwork && (
        <p className="tv-art"><strong>Represented by:</strong> {piece.artwork}</p>
      )}
      {piece.why && <p className="tv-why">{clean(piece.why)}</p>}
      <Links links={piece.links} />
    </article>
  )
}

export default function TextVersion() {
  const [open, setOpen] = useState(false)
  const panel = useRef(null)
  const opener = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); opener.current?.focus() } }
    document.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={opener}
        className="tv-skip"
        onClick={() => setOpen(true)}
      >
        Read the text version of this portfolio
      </button>

      <main
        id="portfolio-text"
        ref={panel}
        tabIndex={-1}
        className={open ? 'tv-panel tv-open' : 'tv-panel tv-hidden'}
        aria-label="Text version of Abby Kamenetsky's portfolio"
      >
        {open && (
          <button className="tv-close" onClick={() => { setOpen(false); opener.current?.focus() }}>
            Close and return to the gallery
          </button>
        )}

        <h1>Abigail Kamenetsky</h1>
        <p className="tv-lede">
          Economics and Computer Science at the University of Chicago. This is the
          text version of an interactive museum portfolio. Every wing below is a
          room in the gallery, and every entry is a painting you can walk up to.
        </p>

        {WINGS.map((wing) => {
          const e = wing.exhibit || {}
          return (
            <section key={wing.id} className="tv-wing">
              <h2>{wing.title}</h2>
              <Blurb value={e.blurb} keyPrefix={wing.id} />
              {e.items?.length > 0 && (
                <ul>{e.items.map((it, i) => <li key={i}>{clean(it)}</li>)}</ul>
              )}
              {e.artwork && (
                <p className="tv-art"><strong>Represented by:</strong> {e.artwork}</p>
              )}
              {e.why && <p className="tv-why">{clean(e.why)}</p>}
              <Links links={e.links} />
              {e.pieces?.map((p) => <Piece key={p.title} piece={p} />)}
            </section>
          )
        })}
      </main>
    </>
  )
}
