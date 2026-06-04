// MUSEUM WINGS — the visitor experience structure.
// pos = [x, z] standing spot in front of the exhibit; yaw = facing toward the wall.
// Content here is PLACEHOLDER scaffolding — fill `exhibit` with Abigail's real details.
// `exhibit.images` are paths under public/assets/  (e.g. 'about/family.jpg').
// Gallery is x:[-9,9], z:[-39,39]; side walls at x≈±9, entrance at z≈+39, feature wall at z≈-39.

const L = -6, R = 6
const YAW_L = -Math.PI / 2   // face the left (-X) wall
const YAW_R = Math.PI / 2    // face the right (+X) wall

export const WINGS = [
  {
    id: 'about', title: 'About Me', wing: 'About Abby',
    pos: [L, 34], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Hi, I’m Abby — BA Economics + BS Computer Science at the University of Chicago (2025–2029). This museum is a walkable portrait of my journey, the work I’ve built, and the people and places that made me.',
      items: [],
      images: [], // drop photos in public/assets/about/ and list them here, e.g. 'about/me.jpg', 'about/family.jpg'
      links: [],
    },
  },
  {
    id: 'professional', title: 'Professional Experience', wing: 'Professional Experience Wing',
    pos: [R, 34], yaw: YAW_R, sub: ['Current Internship', 'Past Internships'],
    exhibit: {
      blurb: 'Internships and roles — each painting in this wing is one chapter of the work.',
      images: [], links: [],
      pieces: [
        { title: 'Current Internship — Company', blurb: 'Role · dates. What you’re building and the impact.', items: [], images: [], links: [] },
        { title: 'Internship — Company (Year)', blurb: 'Role · dates. Summary + impact.', items: [], images: [], links: [] },
        { title: 'Internship — Company (Year)', blurb: 'Role · dates. Summary + impact.', items: [], images: [], links: [] },
        { title: 'Internship — Company (Year)', blurb: 'Role · dates. Summary + impact.', items: [], images: [], links: [] },
        { title: 'Internship — Company (Year)', blurb: 'Role · dates. Summary + impact.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'projects', title: 'Projects', wing: 'Projects Hall',
    pos: [L, 20.25], yaw: YAW_L, sub: ['Current Projects', 'Past Projects'],
    exhibit: {
      blurb: 'Things built — each painting is one project.',
      images: [], links: [],
      pieces: [
        { title: 'Current Project — Name', blurb: 'What it is, the stack, and where it’s headed.', items: [], images: [], links: [] },
        { title: 'Project — Name', blurb: 'Problem, approach, result.', items: [], images: [], links: [] },
        { title: 'Project — Name', blurb: 'Problem, approach, result.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'research', title: 'Research Experience', wing: 'Research Gallery',
    pos: [R, 20.25], yaw: YAW_R, sub: ['Current Research', 'Past Research'],
    exhibit: {
      blurb: 'Questions pursued — each painting is one research project.',
      images: [], links: [],
      pieces: [
        { title: 'Current Research — Lab / Topic', blurb: 'Question, methods, progress.', items: [], images: [], links: [] },
        { title: 'Research — Topic (Year)', blurb: 'Question, methods, findings.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'leadership', title: 'Leadership Experience', wing: 'Leadership Gallery',
    pos: [L, 6.75], yaw: YAW_L, sub: null,
    exhibit: { blurb: 'Roles where you led people and built things together.', items: ['Organizations, events, and the teams you led'], images: [], links: [] },
  },
  {
    id: 'uchicago', title: 'UChicago Programs', wing: 'UChicago Programs Exhibit',
    pos: [R, 6.75], yaw: YAW_R, sub: null,
    exhibit: { blurb: 'Programs and cohorts at the University of Chicago.', items: ['QUBIT cohort, academic programs, fellowships'], images: [], links: [] },
  },
  {
    id: 'awards', title: 'Honors & Awards', wing: 'Honors & Awards Gallery',
    pos: [L, -6.75], yaw: YAW_L, sub: null,
    exhibit: { blurb: 'Recognitions earned along the way.', items: ['Awards, honors, and competition placements'], images: [], links: [] },
  },
  {
    id: 'technical', title: 'Technical Skills', wing: 'Technical Skills Exhibit',
    pos: [R, -6.75], yaw: YAW_R, sub: null,
    exhibit: { blurb: 'Languages, tools, and systems.', items: ['Programming languages, frameworks, ML, data, tooling'], images: [], links: [] },
  },
  {
    id: 'soft', title: 'Soft Skills', wing: 'Soft Skills Gallery',
    pos: [L, -20.25], yaw: YAW_L, sub: null,
    exhibit: { blurb: 'How you work with people and ideas.', items: ['Communication, leadership, collaboration, judgment'], images: [], links: [] },
  },
  {
    id: 'hobbies', title: 'Hobbies & Interests', wing: 'Hobbies & Interests Gallery',
    pos: [R, -20.25], yaw: YAW_R, sub: null,
    exhibit: { blurb: 'Life outside the work — what you love.', items: ['Photography, travel, books, personal projects'], images: [], links: [] },
  },
  {
    id: 'contact', title: 'Socials & Contact', wing: 'Connect With Abigail',
    pos: [0, -33], yaw: Math.PI, sub: null,
    exhibit: {
      blurb: 'The conclusion of the museum — let’s connect.',
      items: [], images: [],
      links: [
        { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
        { label: 'GitHub', url: 'https://github.com/abigailkamenetsky' },
        { label: 'Portfolio', url: '#' },
        { label: 'Resume', url: '#' },
        { label: 'Email', url: 'mailto:abbykamenetsky@uchicago.edu' },
      ],
    },
  },
]

export const wingById = id => WINGS.find(w => w.id === id)

// ── physical painting placements ──────────────────────────────
// Single-piece wings → one painting. Multi-piece wings → an organic salon COLLAGE
// (varied sizes, staggered) where each painting maps to one piece (internship/project).
const HW = 8.88, PY = 3.6   // wall x-offset and painting centre height
function cluster(n) {
  if (n <= 1) return [{ dz: 0, dy: 0, w: 2.5, h: 3.4, cls: 1 }]
  if (n === 2) return [
    { dz: -1.6, dy: 0.55, w: 1.8, h: 1.35, cls: 0 },
    { dz: 1.25, dy: -0.5, w: 1.5, h: 2.0, cls: 1 },
  ]
  if (n === 3) return [
    { dz: -2.4, dy: 0.4, w: 1.5, h: 1.9, cls: 0 },
    { dz: -0.15, dy: -0.65, w: 1.95, h: 1.45, cls: 2 },
    { dz: 2.35, dy: 0.7, w: 1.4, h: 1.7, cls: 0 },
  ]
  if (n === 4) return [
    { dz: -2.7, dy: 0.6, w: 1.5, h: 1.3, cls: 0 },
    { dz: -0.9, dy: -0.7, w: 1.4, h: 1.8, cls: 0 },
    { dz: 1.0, dy: 0.8, w: 1.6, h: 1.5, cls: 2 },
    { dz: 2.7, dy: -0.5, w: 1.5, h: 1.7, cls: 0 },
  ]
  // organic salon collage (5+)
  return [
    { dz: -3.0, dy: 0.55, w: 1.7, h: 1.3, cls: 0 },
    { dz: -1.15, dy: -1.15, w: 1.3, h: 1.75, cls: 0 },
    { dz: 0.45, dy: 0.95, w: 1.45, h: 1.85, cls: 2 },
    { dz: 1.95, dy: -0.6, w: 1.8, h: 1.4, cls: 0 },
    { dz: 3.05, dy: 0.85, w: 1.2, h: 1.5, cls: 0 },
  ]
}

export const PAINTINGS = (() => {
  const out = []
  for (const w of WINGS) {
    if (w.id === 'contact') continue   // back wall = stained-glass centrepiece
    const side = w.pos[0] < 0 ? -1 : 1
    const wallX = side * HW
    const ry = side < 0 ? Math.PI / 2 : -Math.PI / 2
    const n = w.exhibit.pieces ? w.exhibit.pieces.length : 1
    cluster(n).forEach((p, j) => out.push({
      wingId: w.id,
      piece: w.exhibit.pieces ? j : null,
      title: w.exhibit.pieces ? w.exhibit.pieces[j].title : w.title,
      pos: [wallX, PY + p.dy, w.pos[1] + p.dz], ry, w: p.w, h: p.h, cls: p.cls,
    }))
  }
  return out
})()

