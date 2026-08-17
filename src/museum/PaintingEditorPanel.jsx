/**
 * Development-only placement editor overlay.
 *
 * Marble paints its picture frames into the texture, so there is no geometry to
 * snap to and three separate detection attempts failed. A human eye placing
 * paintings by sight is both faster and more accurate, which is what this is
 * for: select a painting, nudge it until it sits in the frame, copy the JSON.
 *
 * Gated on import.meta.env.DEV and VITE_ENABLE_MUSEUM_EDITOR so it can never
 * reach production. It is not an auth mechanism, it is a build-time flag.
 */
import { useEffect } from 'react'
import { editor, useEditor, nudge, reset, exportJSON, goTo, dragBy } from './paintingEditorStore'
import { MUSEUM_EDITOR_ENABLED } from '../data/museumConfig'

const KEY_HELP = [
  ['hold G + drag', 'MOVE the painting'],
  ['← →', 'along the wall'],
  ['↑ ↓', 'height'],
  ['[ ]', 'width'],
  ['- =', 'height'],
  [', .', 'rotate'],
  ['1 2', 'depth off / into wall'],
  ['R', 'reset this painting'],
  ['N / P', 'next / previous painting'],
  ['Esc', 'stop editing'],
]

export default function PaintingEditorPanel({ entries, placements }) {
  const s = useEditor()

  useEffect(() => {
    if (!MUSEUM_EDITOR_ENABLED) return
    const onKey = (e) => {
      // only take keys while a painting is selected, so WASD still walks
      if (!s.selected) return
      const i = placements.findIndex((p) => p.id === s.selected)
      if (i < 0) return
      const base = placements[i]
      const fine = e.shiftKey ? 0.02 : 0.1
      const map = {
        ArrowLeft: { z: -fine }, ArrowRight: { z: fine },
        ArrowUp: { y: fine }, ArrowDown: { y: -fine },
        '[': { w: -fine }, ']': { w: fine },
        '-': { h: -fine }, '=': { h: fine },
        ',': { ry: -0.02 }, '.': { ry: 0.02 },
        '1': { x: base.position[0] < 0 ? -fine : fine },
        '2': { x: base.position[0] < 0 ? fine : -fine },
      }
      if (map[e.key]) { e.preventDefault(); nudge(s.selected, base, map[e.key]); return }
      if (e.key === 'r' || e.key === 'R') { reset(s.selected); return }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); goTo(placements, s.index + 1); return }
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); goTo(placements, s.index - 1); return }
      if (e.key === 'Escape') { editor.set({ selected: null, enabled: false }) }
    }
    // G holds the grab: while down, canvas drags move the painting not the camera
    const onDown = (e) => {
      if ((e.key === 'g' || e.key === 'G') && s.selected && !e.repeat) {
        editor.set({ grabbing: true })
      }
    }
    const onUp = (e) => {
      if (e.key === 'g' || e.key === 'G') editor.set({ grabbing: false })
    }
    const onDrag = (e) => {
      const st = editor.get()
      if (!st.selected) return
      const base = placements.find((p) => p.id === st.selected)
      if (base) dragBy(st.selected, base, e.detail.dx, e.detail.dy)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('museum:dragPainting', onDrag)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('museum:dragPainting', onDrag)
    }
  }, [s.selected, placements])

  if (!MUSEUM_EDITOR_ENABLED) return null

  const i = placements.findIndex((p) => p.id === s.selected)
  const cur = i >= 0 ? placements[i] : null
  const ov = cur ? s.overrides[cur.id] : null
  const pos = ov?.position ?? cur?.position
  const wid = ov?.width ?? cur?.width

  const box = {
    position: 'fixed', right: 12, top: 12, zIndex: 60, width: 292,
    background: 'rgba(12,14,12,.93)', border: '1px solid #3c4a3c', borderRadius: 10,
    padding: '12px 14px', color: '#dfe6df', font: '12px/1.55 ui-monospace, monospace',
    pointerEvents: 'auto',
  }
  const btn = {
    background: '#1d2a1d', border: '1px solid #46603f', color: '#cfe6cf',
    borderRadius: 6, padding: '5px 9px', cursor: 'pointer', font: 'inherit',
  }

  return (
    <div style={box}>
      <div style={{ color: '#8fdc9a', marginBottom: 8, letterSpacing: '.08em' }}>
        PLACEMENT EDITOR · dev only
      </div>

      {!cur && (
        <>
          <div style={{ opacity: .8 }}>
            Walk with WASD, drag to look. Click a painting to select it, then
            hold <b style={{ color: '#8fdc9a' }}>G</b> and drag to move it.
          </div>
        </>
      )}

      {cur && (
        <>
          <div style={{ color: '#f0d68a', marginBottom: 2 }}>
            {entries[i].title}
          </div>
          <div style={{ opacity: .6, marginBottom: 6 }}>
            {i + 1} of {placements.length}
          </div>
          <div style={{ opacity: .85 }}>
            x {pos[0].toFixed(2)}  y {pos[1].toFixed(2)}  z {pos[2].toFixed(2)}<br />
            {wid.toFixed(2)} x {(ov?.height ?? cur.height).toFixed(2)} m
            {ov ? ' (moved)' : ' (default)'}
          </div>
          <table style={{ marginTop: 8, opacity: .8, borderSpacing: 0 }}>
            <tbody>
              {KEY_HELP.map(([k, d]) => (
                <tr key={k}>
                  <td style={{ color: '#9fd2a8', paddingRight: 10 }}>{k}</td>
                  <td>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ opacity: .6, marginTop: 6 }}>hold Shift for fine steps</div>
        </>
      )}

      {cur && s.grabbing && (
        <div style={{ color: '#8fdc9a', marginTop: 8 }}>● moving — release G to stop</div>
      )}

      {cur && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={btn} onClick={() => goTo(placements, i - 1)}>← Prev</button>
          <button style={{ ...btn, flex: 1 }} onClick={() => goTo(placements, i + 1)}>
            Next painting →
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          style={btn}
          onClick={() => {
            navigator.clipboard.writeText(exportJSON(entries, placements))
            console.log(exportJSON(entries, placements))
          }}
        >
          Copy all JSON
        </button>
        <button style={btn} onClick={() => { editor.set({ overrides: {} }) }}>
          Reset all
        </button>
      </div>
      <div style={{ opacity: .55, marginTop: 7 }}>
        {Object.keys(s.overrides).length} of {placements.length} moved
      </div>
    </div>
  )
}
