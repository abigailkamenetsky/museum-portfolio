/**
 * Screenshot a page after REAL elapsed time, via the Chrome DevTools Protocol.
 *
 * `--virtual-time-budget` fast-forwards timers, which silently starves anything
 * that depends on a Web Worker replying (Spark's splat sorting, for one). This
 * drives a real browser for real seconds instead.
 *
 *   node scripts/shot.mjs <url> <out.png> [waitMs] [w] [h]
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

// `clean` as a 6th arg hides every DOM overlay, leaving only the canvas. The
// welcome / audio-guide cards are dismissed by timed keypresses, which race
// against asset load and kept blocking verification shots.
const [url, out, waitMs = '8000', W = '1200', H = '800', clean] = process.argv.slice(2)
if (!url || !out) { console.error('usage: shot.mjs <url> <out.png> [waitMs] [w] [h]'); process.exit(1) }

const PORT = 9333 + Math.floor(Math.random() * 200)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--use-angle=metal',
  `--remote-debugging-port=${PORT}`,
  `--window-size=${W},${H}`,
  '--user-data-dir=/tmp/cdp-profile-' + PORT,
  'about:blank',
], { stdio: 'ignore' })

const logs = []
try {
  let targets
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`)
      targets = await r.json()
      if (targets.find(t => t.type === 'page')) break
    } catch { /* not up yet */ }
  }
  const page = targets.find(t => t.type === 'page')
  if (!page) throw new Error('no page target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
    if (m.method === 'Runtime.consoleAPICalled') {
      logs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '))
    }
  }
  const send = (method, params = {}) =>
    new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })) })

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url })
  await sleep(11000)  // mesh + splat + statues must be up before the UI responds
  // dismiss the welcome/how-to overlay so the room is actually visible
  for (let i = 0; i < 2; i++) {   // welcome -> howto -> explore; a 3rd opens the guide
    for (const type of ['keyDown', 'keyUp']) {
      await send('Input.dispatchKeyEvent', { type, key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 })
    }
    await sleep(400)
  }
  // entering 'explore' auto-opens the guide menu; Escape closes it
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
  }
  await sleep(Number(waitMs))          // real seconds, workers get to reply
  if (clean === 'clean') {
    // hide by ancestry, so the canvas's own wrappers survive
    await send('Runtime.evaluate', {
      expression: `(() => { const c = document.querySelector('canvas'); if (!c) return
        document.querySelectorAll('body *').forEach((el) => {
          if (el === c || el.contains(c)) return
          el.style.display = 'none'
        }) })()`,
    })
    await sleep(600)
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(data, 'base64'))
  console.log(`saved ${out} after ${waitMs}ms`)
  for (const l of logs) if (l.trim()) console.log('  |', l)
} finally {
  chrome.kill()
}
