# Museum Portfolio — Project Intelligence

## What This Project Is
An interactive, art-museum-style resume portfolio built as a side-scrolling web experience. The user walks a character through gallery rooms, discovers "paintings" on the walls, and clicks them to reveal resume sections, projects, and achievements. The goal is a WOW-effect first impression that is simultaneously practical and readable for recruiters and hiring managers.

## Core Design Philosophy
- **Gallery, not a game.** Movement is intuitive and requires no instruction. Think Google Arts & Culture meets personal narrative — not an arcade.
- **Three layers:** Promenade (hallway walking) → Encounter (proximity glow + placard) → Story (full-screen modal with project detail).
- **Content in one place.** ALL resume content lives in `src/data/paintings.js`. Updating the resume means editing one file, never touching components.
- **Build a little, test a little.** Each milestone has a hard definition of done. Nothing moves forward until that bar is cleared.

## Owner / Context
- **Owner:** Abigail (Abby) Kamenetsky
- **Degree:** BA Economics + BS Computer Science, University of Chicago (2025–2029)
- **Target audience:** Recruiters and hiring managers — they have 90 seconds and have seen a thousand PDF resumes.

## Tech Stack (June 2026)
- **Framework:** React 19 + Vite 6
- **Language:** JavaScript (not TypeScript — solo project, simple data shapes)
- **Animation:** Framer Motion
- **Audio:** Howler.js
- **Styling:** CSS Modules
- **Deployment:** Vercel (auto-deploy on push to main, free tier)
- **Domain:** Vercel auto-URL for now, custom domain deferred
- **Node version:** 22 LTS

## Repository
- **GitHub username:** abigailkamenetsky
- **Repo name:** museum-portfolio
- **Remote:** https://github.com/abigailkamenetsky/museum-portfolio.git
- **Branch strategy:** `main` is always deployable. Feature work on named branches. Every completed milestone ends with a commit and push.

## File Structure
```
museum-portfolio/
├── public/
│   └── audio/
│       └── ambient.mp3
├── src/
│   ├── assets/paintings/
│   ├── components/
│   │   ├── Museum/
│   │   │   ├── Museum.jsx (or .tsx)
│   │   │   ├── Museum.css
│   │   │   └── index.js
│   │   ├── Character/
│   │   │   ├── Character.jsx
│   │   │   └── index.js
│   │   ├── Painting/
│   │   │   ├── Painting.jsx
│   │   │   ├── Placard.jsx
│   │   │   └── index.js
│   │   ├── Modal/
│   │   │   ├── ProjectModal.jsx
│   │   │   └── index.js
│   │   ├── Room/
│   │   │   ├── Room.jsx
│   │   │   └── index.js
│   │   └── UI/
│   │       ├── Entrance.jsx
│   │       ├── Minimap.jsx
│   │       └── Controls.jsx
│   ├── data/
│   │   └── paintings.js        ← THE SINGLE SOURCE OF TRUTH FOR CONTENT
│   ├── hooks/
│   │   ├── useCharacter.js
│   │   ├── useProximity.js
│   │   └── useAudio.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## Milestones (Build Sequence)
Each milestone must reach its definition of done before the next one starts. No exceptions.

| # | Name | Status |
|---|------|--------|
| 0 | Environment: Node, Git, Vite, GitHub, Vercel live URL | Pending |
| 1 | Static Room: HTML/CSS museum room, no JS logic | Pending |
| 2 | Character Movement: keyboard-driven, wall collision | Pending |
| 3 | One Real Painting: Wikimedia image, frame, proximity glow, placard | Pending |
| 4 | Modal: full-screen overlay, left painting / right narrative, CTA | Pending |
| 5 | Multiple Rooms: 4 rooms, continuous scrolling | Pending |
| 6 | All Content: real paintings and resume data in paintings.js | Pending |
| 7 | Entrance Screen: title screen, cinematic dissolve into gallery | Pending |
| 8 | Polish Pass: parallax, footsteps, shadows, minimap, mobile fallback | Pending |
| 9 | Performance & Reliability: lazy-load, Lighthouse 90+, cross-browser | Pending |
| 10 | Launch: custom domain, Vercel connected, LinkedIn/resume updated | Pending |

## Content Map (Resume Sections)
Room names are TBD — user will supply them. 4 rooms, 2 paintings each = 8 total slots.

| # | Status | Painting | Artist | Year | Museum | Resume Section |
|---|--------|----------|--------|------|--------|----------------|
| 1 | APPROVED | The School of Athens | Raphael | 1509 | Vatican Museums | UChicago, QUBIT Cohort, Academic Identity, Congressional Recognition |
| 2 | TBD | — | — | — | — | Technical Skills / Looking Forward |
| 3 | APPROVED | The Garden of Earthly Delights | Hieronymus Bosch | 1490–1510 | Prado Museum | HelpMynd — mental health/medicine (Stanford Hospital, global mental health reach, 130+ countries) |
| 4 | APPROVED | La Primavera | Botticelli | 1477–1482 | Uffizi Gallery | Winter Metcalf Consulting (sustainability venture, market analysis, investor pitch) |
| 5 | APPROVED | The Temptation of St. Anthony | Salvador Dalí | 1946 | Royal Museums of Fine Arts of Belgium | Amazon Web Services (ML model, geographic risk patterns, 2nd place international) |
| 6 | TBD | — | — | — | — | Carnegie Mellon Research (NP-hard algorithms, international presentation) |
| 7 | APPROVED | The Calling of Saint Matthew | Caravaggio | 1599–1600 | San Luigi dei Francesi, Rome | Blue Chips Investment Club (DCF valuation, financial analysis, intrinsic value) |
| 8 | APPROVED | Breton Brother and Sister | William-Adolphe Bouguereau | 1871 | Metropolitan Museum of Art | Introduction / Profile / Personal — personal significance: Abby's baby brother who was blonde |

## Visual Atmosphere

### Primary References
1. **Mauritshuis Museum, The Hague** — the single most important visual reference
2. **Oxford historic libraries** (Duke Humfrey's Library, Bodleian) — atmosphere and furniture
3. **Dark Academia** — the overall feeling: reverent, hushed, scholarly, slightly gothic

### Walls
Mauritshuis sage green — muted, dusty blue-green, not bright. Approximately #7D8C7C. This IS the painting surface. Paintings pop against it because it is neutral and recedes.
Wainscoting / dado rail below the green. Dark wood paneling on the lower third of the wall.
Crown molding at ceiling. Heavy, ornate, classical.

### Floors
Dark herringbone parquet. Mauritshuis-style walnut/mahogany. Deep brown, almost black in shadow.

### Furniture (decorative, non-interactive)
Heavy carved dark wood throughout — Oxford library style.
Tufted leather Chesterfield chairs. Reading tables. Candelabras. Globe. Dark wood bookcases flanking walls between paintings.
These exist as atmosphere, not obstacles. Character walks in front of them.

### Lighting
Warm amber. Candlelight / old oil-lamp quality. Not bright gallery spotlights. Paintings are lit individually with a soft warm glow. The ambient room light is dim and golden.

### Character
Pure black silhouette. Humanoid. Elegant — think a figure in academic robes, not a game sprite. Moves with arrow keys (left / right). Smooth movement. The character should never draw attention away from the paintings.

### Windows
Tall Georgian / Dutch-style windows on the far wall between rooms. Warm light filtering through. Suggest depth without requiring 3D.

### Tone
Mauritshuis intimacy + Oxford gravity. The user should feel like they walked into a private collection in a great house, not a public gallery. Hushed. Beautiful. Slightly heavy with history.

## Claude Code Working Rules
- **Never build across multiple milestones in one step.** One milestone, one conversation, one commit.
- **Architecture decisions first.** Present options and tradeoffs before writing code.
- **No em dashes in any output** (written text or code comments).
- **No "but" in written text** unless completely unavoidable.
- **No unnecessary comments in code.** Only comment when WHY is non-obvious.
- **No premature abstractions.** Three similar lines is better than an early abstraction.
- **Commit after every milestone:** `git add . && git commit -m "milestone N: description" && git push`
- **Test before claiming done.** Always verify in the browser before reporting a milestone complete.
- **paintings.js is sacred.** All content edits go there, never scattered across components.

## Prompting Convention for Future Sessions
When resuming work, always open with:
```
Context: [one sentence on current state — which milestone, what's working]
Task: [exactly one thing to build]
Constraints: [what NOT to do]
Done when: [the specific, verifiable test]
```
