# Museum Portfolio

**🔗 Live site: https://abigailkamenetsky.github.io/museum-portfolio/**

An interactive 3D art-museum portfolio: walk a character through a grand gallery
and discover paintings that reveal resume content.

Auto-deployed to GitHub Pages on every push to `main` (see
`.github/workflows/deploy.yml`).

## Tech stack
- **React 19 + Vite 6** (build system)
- **React Three Fiber** (`@react-three/fiber`) + **Three.js** for the 3D scene
- **@react-three/drei**, **@react-three/postprocessing** (+ `n8ao`) for helpers and effects
- All runtime assets are static files under `public/assets/` (textures, HDRI, artwork)

## Local development
```bash
npm install
npm run dev        # http://localhost:5173
```

## Production build
```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ at http://localhost:4173 (production check)
```

## Controls
- **W / S** or **↑ / ↓** — walk forward / back
- **A / D** or **← / →** — turn
- **Q / E** or **drag the mouse vertically** — look up / down

## Deployment (static — no server required)
This is a fully static SPA. The `dist/` folder can be hosted on any static host.

**Recommended: Vercel** (auto-detects Vite)
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- No environment variables, no server functions, no special headers needed.

Deploy options:
- **Vercel**: connect the GitHub repo at vercel.com → it auto-detects Vite and deploys on every push to `main`. Or run `npx vercel` / `npx vercel --prod` from the project root.
- **Netlify**: build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: works but needs `base: '/<repo-name>/'` added to `vite.config.js` first (Vercel/Netlify do not).

### Notes
- Assets load from root-relative paths (`/assets/...`), so they work on any host root domain.
- The HDRI (`.hdr`) loads via `RGBELoader` as an array buffer — no special MIME config required on Vercel/Netlify.
- The JS bundle is ~1.3 MB (407 KB gzipped) because it includes Three.js; this is expected for a WebGL app and is fine for static hosting.
