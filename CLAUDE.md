# Museum Portfolio — Project Intelligence

## What This Project Is
An interactive, art-museum-style resume portfolio built as a side-scrolling web experience. The user walks a character through gallery rooms, discovers "paintings" on the walls, and clicks them to reveal resume sections, projects, and achievements. The goal is a WOW-effect first impression that is simultaneously practical and readable for recruiters and hiring managers.

## Core Design Philosophy
- **Gallery, not a game.** Movement is intuitive and requires no instruction. Think Google Arts & Culture meets personal narrative — not an arcade.
- **Three layers:** Promenade (hallway walking) → Encounter (proximity glow + placard) → Story (full-screen modal with project detail).
- **Content in one place.** ALL resume content lives in `src/data/paintings.js`. Updating the resume means editing one file, never touching components.
- **Build a little, test a little.** Each milestone has a hard definition of done. Nothing moves forward until that bar is cleared.

## Owner / Context
- **Owner:** [PLACEHOLDER — user's full name]
- **Professional title:** [PLACEHOLDER — e.g., "Software Engineer", "Product Manager"]
- **Target audience:** Recruiters and hiring managers — they have 90 seconds and have seen a thousand PDF resumes.

## Tech Stack (June 2026)
- **Framework:** React 19 + Vite 6
- **Language:** [PLACEHOLDER — TypeScript or JavaScript, pending user preference]
- **Animation:** Framer Motion
- **Audio:** Howler.js
- **Styling:** CSS Modules
- **Deployment:** Vercel (auto-deploy on push to main)
- **Domain:** [PLACEHOLDER — custom domain or Vercel auto-URL]
- **Node version:** 22 LTS

## Repository
- **GitHub username:** [PLACEHOLDER]
- **Repo name:** museum-portfolio
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
[PLACEHOLDER — to be filled after user provides resume content]

Each "painting" maps to one resume section:
- Room 1: [Theme TBD]
  - Painting 1: [Artwork TBD] → [Project/Experience TBD]
  - Painting 2: [Artwork TBD] → [Project/Experience TBD]
- Room 2: [Theme TBD]
  - ...
- Room 3: [Theme TBD]
  - ...
- Room 4: [Theme TBD]
  - ...

## Visual Atmosphere
[PLACEHOLDER — dark/dramatic Louvre, bright/airy MoMA, warm classical Met, or custom]

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
