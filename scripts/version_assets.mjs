// Rewrites the ?v= tags in museumConfig.ts from the current file hashes.
// Run after replacing any Marble asset, or the browser will serve a stale room.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
const files = ['abby-museum-full.spz','abby-museum-mobile.spz','abby-museum-low.spz',
               'abby-museum-mesh-web.glb','abby-museum-collider.glb']
let cfg = readFileSync('src/data/museumConfig.ts', 'utf8')
for (const f of files) {
  try {
    const h = createHash('sha256').update(readFileSync(`public/museum/${f}`)).digest('hex').slice(0, 8)
    cfg = cfg.replace(new RegExp(`museum/${f.replace('.', '\\.')}\\?v=[a-f0-9]+`), `museum/${f}?v=${h}`)
    console.log(`  ${f} -> ${h}`)
  } catch { console.log(`  ${f} missing, skipped`) }
}
writeFileSync('src/data/museumConfig.ts', cfg)
