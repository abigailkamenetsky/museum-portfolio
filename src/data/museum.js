// MUSEUM WINGS — the visitor experience structure + the artwork that represents each.
// Each piece: title = the project/role, artwork = "Artist — Title", art = image in
// public/assets/art/ (null → placeholder; e.g. still-copyrighted works to source later),
// artAspect = height/width. Fill blurb/items/links/images with real details.

const L = -6, R = 6
const YAW_L = -Math.PI / 2, YAW_R = Math.PI / 2
const HW = 8.88, PY = 3.6, BACKZ = -38.25   // wall x-offset, painting height, back wall

export const WINGS = [
  {
    id: 'about', title: 'About Me', wing: 'About Abby', pos: [L, 34], yaw: YAW_L, sub: null,
    art: 'eldersister.jpg', artAspect: 1.35,
    exhibit: {
      blurb: 'Hi, I’m Abby — BA Economics + BS Computer Science at the University of Chicago (2025–2029). This museum is a walkable portrait of my journey and the people who made me.',
      items: [], images: [], links: [], artwork: 'William-Adolphe Bouguereau — The Elder Sister',
    },
  },
  {
    id: 'projects', title: 'Projects', wing: 'Projects Hall', pos: [R, 34], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Each painting here is one project. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'HelpMynd', artwork: 'Rembrandt — The Return of the Prodigal Son', art: 'prodigal.jpg', artAspect: 1.305, blurb: 'Mental-health platform. Role, stack, reach, and impact.', items: [], images: [], links: [] },
        { title: 'Museum Portfolio', artwork: 'Henri Matisse — The Goldfish', art: 'goldfish.jpg', artAspect: 0.894, blurb: 'This very museum — an interactive 3D portfolio built in React + Three.js.', items: [], images: [], links: [] },
        { title: 'Undisclosed Startup App', artwork: 'Salvador Dalí — The Elephants', art: null, artAspect: 1.5, blurb: 'Startup app (details to come). [Dalí is under copyright — add image manually.]', items: [], images: [], links: [] },
        { title: 'Handshake AI Agent', artwork: 'René Magritte — Golconda', art: null, artAspect: 0.67, blurb: 'AI agent project. [Magritte is under copyright — add image manually.]', items: [], images: [], links: [] },
        { title: 'Color Block Jam — Ad Blocker', artwork: 'Edvard Munch — The Scream', art: 'scream.jpg', artAspect: 1.264, blurb: 'Ad-blocking / game project. What it does and how it works.', items: [], images: [], links: [] },
        { title: 'Transportation App (Lyft/Via style)', artwork: 'J.M.W. Turner — Rain, Steam and Speed', art: 'rainsteamspeed.jpg', artAspect: 0.832, blurb: 'Rideshare-style transportation app. Same project as the UChicago parking showcase.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'professional', title: 'Internships', wing: 'Internships Wing', pos: [L, 20.25], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Each painting here is one internship. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'AWS — Retail Crime Prediction', artwork: 'Hieronymus Bosch — The Garden of Earthly Delights', art: 'garden.jpg', artAspect: 0.569, blurb: 'ML model for geographic retail-crime risk. Role, dates, impact.', items: [], images: [], links: [] },
        { title: 'Maroon Cays Consulting', artwork: 'Honoré Daumier — The Chess Players', art: 'chessplayers.jpg', artAspect: 0.774, blurb: 'Consulting / strategy. Role, dates, impact.', items: [], images: [], links: [] },
        { title: 'Gigamon — Product Management', artwork: 'Pieter Bruegel the Elder — The Tower of Babel', art: 'babel.jpg', artAspect: 0.732, blurb: 'Product management internship. Role, dates, impact.', items: [], images: [], links: [] },
        { title: 'SDIG — Web Development', artwork: 'Claude Monet — The Bridge at Argenteuil', art: 'argenteuil.jpg', artAspect: 0.761, blurb: 'Web development. Role, dates, impact.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'research', title: 'Research Experience', wing: 'Research Gallery', pos: [R, 20.25], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Each painting here is one research project. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'CMU — Rectangle Packing (NP-hard)', artwork: 'M.C. Escher — Relativity', art: null, artAspect: 0.64, blurb: 'Algorithms research, international presentation. [Escher is under copyright — add image manually.]', items: [], images: [], links: [] },
        { title: 'UCSB — LLM Hallucinations', artwork: 'Salvador Dalí — The Temptation of Saint Anthony', art: null, artAspect: 0.72, blurb: 'Research on LLM hallucinations. [Dalí is under copyright — add image manually.]', items: [], images: [], links: [] },
        { title: 'Booth — Center for Applied AI', artwork: 'Joseph Wright of Derby — An Experiment on a Bird in the Air Pump', art: 'airpump.jpg', artAspect: 0.749, blurb: 'Applied AI research at Chicago Booth. Topic, methods, findings.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'uchicago', title: 'UChicago Programs & Clubs', wing: 'UChicago Programs Exhibit', pos: [L, 6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Programs, cohorts, and clubs at the University of Chicago.', images: [], links: [],
      pieces: [
        { title: 'Succeeding in the Workplace Cohort', artwork: 'Hans Holbein the Younger — The Ambassadors', art: 'ambassadors.jpg', artAspect: 0.985, blurb: 'Professional development cohort.', items: [], images: [], links: [] },
        { title: 'Quantum in Business & Technology (QuBIT)', artwork: 'Caspar David Friedrich — Wanderer Above the Sea of Fog', art: 'wanderer.jpg', artAspect: 1.28, blurb: 'Quantum computing in business & technology cohort.', items: [], images: [], links: [] },
        { title: 'Venture Capital Cohort', artwork: 'Caravaggio — The Calling of Saint Matthew', art: 'callingmatthew.jpg', artAspect: 0.934, blurb: 'VC cohort.', items: [], images: [], links: [] },
        { title: 'Blue Chips Investing Club', artwork: 'Rembrandt — Syndics of the Drapers’ Guild', art: 'drapers.jpg', artAspect: 0.711, blurb: 'DCF valuation, financial analysis, intrinsic value.', items: [], images: [], links: [] },
        { title: 'Summer Tech Showcase — Parking App', artwork: 'Gustave Caillebotte — Paris Street; Rainy Day', art: 'rainyday.jpg', artAspect: 0.757, blurb: 'Parking app — same project as the transportation app in Projects.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'leadership', title: 'Leadership & Activities', wing: 'Leadership Gallery', pos: [R, 6.75], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Roles where I led people and built things together.', images: [], links: [],
      pieces: [
        { title: 'Journalism / Newspaper Leadership', artwork: 'Diego Velázquez — Las Meninas', art: 'meninas.jpg', artAspect: 1.151, blurb: 'Editorial leadership on the newspaper.', items: [], images: [], links: [] },
        { title: 'Pinewood Envoys', artwork: 'Jan van Eyck — The Arnolfini Portrait', art: 'arnolfini.jpg', artAspect: 1.368, blurb: 'Ambassador / envoy program.', items: [], images: [], links: [] },
        { title: 'Peer Tutoring Program', artwork: 'Raphael — The School of Athens', art: 'schoolofathens.jpg', artAspect: 0.775, blurb: 'Peer tutoring and teaching.', items: [], images: [], links: [] },
        { title: 'Drama Club', artwork: 'Edgar Degas — The Singer in Green', art: 'singergreen.jpg', artAspect: 1.297, blurb: 'Theatre and performance.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'awards', title: 'Honors & Awards', wing: 'Honors & Awards Gallery', pos: [L, -6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Recognitions earned along the way — a small Vermeer gallery.', images: [], links: [],
      pieces: [
        { title: 'AP Scholar / Academic Achievement', artwork: 'Johannes Vermeer — The Astronomer', art: 'astronomer.jpg', artAspect: 1.136, blurb: 'Academic achievement.', items: [], images: [], links: [] },
        { title: 'NSPA Journalism Recognition', artwork: 'Johannes Vermeer — The Love Letter', art: 'loveletter.jpg', artAspect: 1.16, blurb: 'National journalism recognition.', items: [], images: [], links: [] },
        { title: 'AWS Recognition', artwork: 'Johannes Vermeer — The Geographer', art: 'geographer.jpg', artAspect: 1.121, blurb: '2nd place, international AWS competition.', items: [], images: [], links: [] },
        { title: 'Congressional Recognition', artwork: 'Johannes Vermeer — Girl Reading a Letter at an Open Window', art: 'girlletterwindow.jpg', artAspect: 1.308, blurb: 'Congressional recognition.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'technical', title: 'Technical Skills', wing: 'Technical Skills Exhibit', pos: [R, -6.75], yaw: YAW_R, sub: null,
    art: 'vitruvian.jpg', artAspect: 1.36,
    exhibit: {
      blurb: 'Engineering, computer science, mathematics, AI, and technical foundations.',
      items: ['Engineering', 'Computer Science', 'Mathematics', 'Artificial Intelligence', 'Technical foundations'],
      images: [], links: [], artwork: 'Leonardo da Vinci — Vitruvian Man',
    },
  },
  {
    id: 'soft', title: 'Soft Skills', wing: 'Soft Skills Gallery', pos: [L, -20.25], yaw: YAW_L, sub: null,
    art: 'boatingparty.jpg', artAspect: 0.74,
    exhibit: {
      blurb: 'How I work with people and ideas.',
      items: ['Communication', 'Teamwork', 'Leadership', 'Relationship building', 'Collaboration'],
      images: [], links: [], artwork: 'Pierre-Auguste Renoir — Luncheon of the Boating Party',
    },
  },
  {
    id: 'hobbies', title: 'Hobbies & Interests', wing: 'Hobbies & Interests Gallery', pos: [R, -20.25], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Life outside the work — what I love.', images: [], links: [],
      pieces: [
        { title: 'Reading', artwork: 'Jean-Honoré Fragonard — The Reader', art: 'readinggirl.jpg', artAspect: 1.257, blurb: 'Books and reading.', items: [], images: [], links: [] },
        { title: 'Cooking', artwork: 'Johannes Vermeer — The Milkmaid', art: 'milkmaid.jpg', artAspect: 1.121, blurb: 'Cooking.', items: [], images: [], links: [] },
        { title: 'Crocheting', artwork: 'Berthe Morisot — Young Woman Knitting', art: 'knitting.jpg', artAspect: 0.835, blurb: 'Crocheting and making.', items: [], images: [], links: [] },
        { title: 'Thrifting', artwork: 'Carl Spitzweg — Der Stellwagen (street scene)', art: 'spitzweg.jpg', artAspect: 1.583, blurb: 'Thrifting and vintage finds.', items: [], images: [], links: [] },
        { title: 'Restaurants & Food', artwork: 'Vincent van Gogh — Café Terrace at Night', art: 'cafeterrace.jpg', artAspect: 1.28, blurb: 'Restaurants and food exploration.', items: [], images: [], links: [] },
        { title: 'Travel', artwork: 'J.M.W. Turner — The Fighting Temeraire', art: 'temeraire.jpg', artAspect: 0.743, blurb: 'Travel.', items: [], images: [], links: [] },
        { title: 'Hiking & Nature', artwork: 'Gustav Klimt — Beech Grove', art: 'beechforest.jpg', artAspect: 0.992, blurb: 'Hiking and the outdoors.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'contact', title: 'Socials & Contact', wing: 'Connect With Abigail', pos: [4.8, -35.5], yaw: Math.PI, sub: null,
    art: 'dancemoulin.jpg', artAspect: 0.743,
    exhibit: {
      blurb: 'The conclusion of the museum — let’s connect.',
      items: [], images: [], artwork: 'Pierre-Auguste Renoir — Dance at Le Moulin de la Galette',
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

// ── salon collage layouts (tight, varied; all plain baroque frames cls 0) ──
function cluster(n) {
  if (n <= 1) return [{ dz: 0, dy: 0, w: 2.4, h: 3.3, cls: 1 }]
  if (n === 2) return [
    { dz: -1.05, dy: 0.35, w: 1.5, h: 1.85, cls: 0 }, { dz: 1.15, dy: -0.2, w: 1.6, h: 1.45, cls: 0 },
  ]
  if (n === 3) return [
    { dz: -1.55, dy: 0.5, w: 1.25, h: 1.2, cls: 0 }, { dz: 0.0, dy: -0.2, w: 1.55, h: 1.95, cls: 0 }, { dz: 1.55, dy: 0.55, w: 1.2, h: 1.4, cls: 0 },
  ]
  if (n === 4) return [
    { dz: -1.55, dy: 0.62, w: 1.2, h: 1.0, cls: 0 }, { dz: -1.4, dy: -0.72, w: 1.05, h: 1.45, cls: 0 },
    { dz: 1.0, dy: 0.6, w: 1.45, h: 1.2, cls: 0 }, { dz: 1.5, dy: -0.7, w: 1.1, h: 1.55, cls: 0 },
  ]
  if (n === 5) return [
    { dz: -1.7, dy: 0.78, w: 1.25, h: 1.0, cls: 0 }, { dz: -1.7, dy: -0.78, w: 1.25, h: 1.5, cls: 0 },
    { dz: 0.0, dy: 0.0, w: 1.5, h: 1.85, cls: 0 },
    { dz: 1.7, dy: 0.78, w: 1.25, h: 1.0, cls: 0 }, { dz: 1.7, dy: -0.78, w: 1.25, h: 1.5, cls: 0 },
  ]
  if (n === 6) return [
    { dz: -2.5, dy: 0.78, w: 1.1, h: 0.88, cls: 0 }, { dz: -2.45, dy: -0.72, w: 1.0, h: 1.25, cls: 0 },
    { dz: -0.1, dy: 0.85, w: 1.2, h: 0.95, cls: 0 }, { dz: 0.0, dy: -0.7, w: 1.3, h: 1.5, cls: 0 },
    { dz: 2.45, dy: 0.75, w: 1.05, h: 1.3, cls: 0 }, { dz: 2.5, dy: -0.78, w: 1.1, h: 0.9, cls: 0 },
  ]
  // 7
  return [
    { dz: -2.95, dy: 0.6, w: 1.0, h: 0.82, cls: 0 }, { dz: -2.85, dy: -0.75, w: 0.95, h: 1.2, cls: 0 },
    { dz: -1.15, dy: 0.92, w: 1.1, h: 0.85, cls: 0 }, { dz: -1.05, dy: -0.82, w: 1.05, h: 1.3, cls: 0 },
    { dz: 0.75, dy: 0.2, w: 1.35, h: 1.6, cls: 0 },
    { dz: 2.5, dy: 0.8, w: 1.0, h: 1.05, cls: 0 }, { dz: 2.6, dy: -0.78, w: 1.1, h: 0.9, cls: 0 },
  ]
}

export const PAINTINGS = (() => {
  const out = []
  for (const w of WINGS) {
    if (w.id === 'contact') {   // single painting on the back wall, beside the stained glass
      out.push({ wingId: 'contact', piece: null, title: w.title, pos: [w.pos[0], PY, BACKZ], ry: 0, w: 2.4, h: 3.3, cls: 1, art: w.art || null, artAspect: w.artAspect || 1 })
      continue
    }
    const side = w.pos[0] < 0 ? -1 : 1
    const wallX = side * HW
    const ry = side < 0 ? Math.PI / 2 : -Math.PI / 2
    const pcs = w.exhibit.pieces
    cluster(pcs ? pcs.length : 1).forEach((p, j) => out.push({
      wingId: w.id, piece: pcs ? j : null,
      title: pcs ? pcs[j].title : w.title,
      pos: [wallX, PY + p.dy, w.pos[1] + p.dz], ry, w: p.w, h: p.h, cls: p.cls,
      art: pcs ? (pcs[j].art || null) : (w.art || null),
      artAspect: pcs ? (pcs[j].artAspect || 1) : (w.artAspect || 1),
    }))
  }
  return out
})()
