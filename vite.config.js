import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is '/' by default (Vercel/Netlify root domains).
// The GitHub Pages workflow sets VITE_BASE='/museum-portfolio/' so assets
// resolve under the project subpath. https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
