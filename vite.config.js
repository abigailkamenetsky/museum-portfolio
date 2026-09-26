import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// base is '/' by default (Vercel/Netlify root domains).
// The GitHub Pages workflow sets VITE_BASE='/museum-portfolio/' so assets
// resolve under the project subpath. https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    // The front door is the shatter intro, which is a hand written static page
    // in public/. The React gallery builds to /3d/ so it does not claim the
    // root index.html.
    rollupOptions: { input: resolve(__dirname, '3d/index.html') },
  },
})
