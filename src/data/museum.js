// MUSEUM WINGS - the visitor experience structure + the artwork that represents each.
// Each piece: title = the project/role, artwork = "Artist - Title", art = image in
// public/assets/art/ (null → placeholder; e.g. still-copyrighted works to source later),
// artAspect = height/width. Fill blurb/items/links/images with real details.

const L = -6, R = 6
const YAW_L = -Math.PI / 2, YAW_R = Math.PI / 2
const HW = 8.88, PY = 3.6   // wall x-offset, painting hang height

export const WINGS = [
  {
    id: 'about', title: 'About Me', wing: 'About Me Wing', pos: [L, 34], yaw: YAW_L, sub: null,
    art: 'eldersister.jpg', artAspect: 1.35,
    exhibit: {
      blurb: 'Hi, I’m Abby - BA Economics + BS Computer Science at the University of Chicago (2025–2029). This museum is a walkable portrait of my journey and the people who made me.',
      items: [], images: [], links: [], artwork: 'William-Adolphe Bouguereau - The Elder Sister',
    },
  },
  {
    id: 'projects', title: 'Projects', wing: 'Projects Wing', pos: [R, 34], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Each painting here is one project. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'HelpMynd', artwork: 'Rembrandt - The Return of the Prodigal Son', art: 'prodigal.jpg', artAspect: 1.305, blurb: 'Mental-health platform. Role, stack, reach, and impact.', items: [], images: [], links: [] },
        { title: 'Museum Portfolio', artwork: 'Carel Fabritius - The Goldfinch', art: 'goldfinch.jpg', artAspect: 1.527, blurb: 'This very museum - an interactive 3D portfolio built in React + Three.js.', items: [], images: [], links: [] },
        { title: 'Undisclosed Startup App', artwork: 'Salvador Dalí - The Elephants', art: 'elephants.jpg', artAspect: 0.835, blurb: 'Startup app (details to come).', items: [], images: [], links: [] },
        { title: 'Handshake AI Agent', artwork: 'René Magritte - Golconda', art: 'golconda.jpg', artAspect: 0.815, blurb: 'AI agent project.', items: [], images: [], links: [] },
        { title: 'Color Block Jam - Ad Blocker', artwork: 'Edvard Munch - The Scream', art: 'scream.jpg', artAspect: 1.264, blurb: 'Ad-blocking / game project. What it does and how it works.', items: [], images: [], links: [] },
        { title: 'Transportation App (Lyft/Via style)', artwork: 'J.M.W. Turner - Rain, Steam and Speed', art: 'rainsteamspeed.jpg', artAspect: 0.743, blurb: 'Rideshare-style transportation app. Same project as the UChicago parking showcase.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'professional', title: 'Internships', wing: 'Internships Wing', pos: [L, 20.25], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Each painting here is one internship. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'AWS - Retail Crime Prediction', artwork: 'Hieronymus Bosch - The Garden of Earthly Delights', art: 'garden.jpg', artAspect: 0.569, blurb: 'ML model for geographic retail-crime risk. Role, dates, impact.', items: [], images: [], links: [] },
        { title: 'Maroon Cays Consulting', artwork: 'Honoré Daumier - The Chess Players', art: 'chessplayers.jpg', artAspect: 0.774, blurb: 'Consulting / strategy. Role, dates, impact.', items: [], images: [], links: [] },
        { title: 'Gigamon - Product Management', artwork: 'Pieter Bruegel the Elder - The Tower of Babel', art: 'babel.jpg', artAspect: 0.732, blurb: 'Product management internship. Role, dates, impact.', items: [], images: [], links: [] },
        { title: 'SDIG - Web Development', artwork: 'Claude Monet - The Bridge at Argenteuil', art: 'argenteuil.jpg', artAspect: 0.761, blurb: 'Web development. Role, dates, impact.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'research', title: 'Research Experience', wing: 'Research Experience Wing', pos: [R, 20.25], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Each painting here is one research project. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'CMU - Rectangle Packing (NP-hard)', artwork: 'M.C. Escher - Relativity', art: 'relativity.jpg', artAspect: 0.958, blurb: 'Algorithms research, international presentation.', items: [], images: [], links: [] },
        { title: 'UCSB - LLM Hallucinations', artwork: 'Salvador Dalí - The Temptation of Saint Anthony', art: 'stanthony.jpg', artAspect: 0.783, blurb: 'Research on LLM hallucinations.', items: [], images: [], links: [] },
        { title: 'Booth - Center for Applied AI', artwork: 'Joseph Wright of Derby - An Experiment on a Bird in the Air Pump', art: 'airpump.jpg', artAspect: 0.749, blurb: 'Applied AI research at Chicago Booth. Topic, methods, findings.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'uchicago', title: 'UChicago Programs and Clubs', wing: 'UChicago Programs and Clubs Wing', pos: [L, 6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Programs, cohorts, and clubs at the University of Chicago.', images: [], links: [],
      pieces: [
        { title: 'Succeeding in the Workplace Cohort', artwork: 'Hans Holbein the Younger - The Ambassadors', art: 'ambassadors.jpg', artAspect: 0.985, blurb: 'Professional development cohort.', items: [], images: [], links: [] },
        { title: 'Quantum in Business & Technology (QuBIT)', artwork: 'Caspar David Friedrich - Wanderer Above the Sea of Fog', art: 'wanderer.jpg', artAspect: 1.28, blurb: 'Quantum computing in business & technology cohort.', items: [], images: [], links: [] },
        { title: 'Venture Capital Cohort', artwork: 'Caravaggio - The Calling of Saint Matthew', art: 'callingmatthew.jpg', artAspect: 0.934, blurb: 'VC cohort.', items: [], images: [], links: [] },
        { title: 'Blue Chips Investing Club', artwork: 'Rembrandt - Syndics of the Drapers’ Guild', art: 'drapers.jpg', artAspect: 0.711, blurb: 'DCF valuation, financial analysis, intrinsic value.', items: [], images: [], links: [] },
        { title: 'Summer Tech Showcase - Parking App', artwork: 'Gustave Caillebotte - Paris Street; Rainy Day', art: 'rainyday.jpg', artAspect: 0.757, blurb: 'Parking app - same project as the transportation app in Projects.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'leadership', title: 'Leadership & Activities', wing: 'Leadership & Activities Wing', pos: [R, 6.75], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Roles where I led people and built things together.', images: [], links: [],
      pieces: [
        { title: 'Journalism / Newspaper Leadership', artwork: 'Diego Velázquez - Las Meninas', art: 'meninas.jpg', artAspect: 1.151, blurb: 'Editorial leadership on the newspaper.', items: [], images: [], links: [] },
        { title: 'Pinewood Envoys', artwork: 'Jan van Eyck - The Arnolfini Portrait', art: 'arnolfini.jpg', artAspect: 1.368, blurb: 'Ambassador / envoy program.', items: [], images: [], links: [] },
        { title: 'Peer Tutoring Program', artwork: 'Raphael - The School of Athens', art: 'schoolofathens.jpg', artAspect: 0.775, blurb: 'Peer tutoring and teaching.', items: [], images: [], links: [] },
        { title: 'Drama Club', artwork: 'Edgar Degas - The Singer in Green', art: 'singergreen.jpg', artAspect: 1.297, blurb: 'Theatre and performance.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'awards', title: 'Honors & Awards', wing: 'Honors & Awards Wing', pos: [L, -6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Recognitions earned along the way - a small Vermeer gallery.', images: [], links: [],
      pieces: [
        { title: 'AP Scholar / Academic Achievement', artwork: 'Johannes Vermeer - The Astronomer', art: 'astronomer.jpg', artAspect: 1.136, blurb: 'Academic achievement.', items: [], images: [], links: [] },
        { title: 'NSPA Journalism Recognition', artwork: 'Johannes Vermeer - The Love Letter', art: 'loveletter.jpg', artAspect: 1.16, blurb: 'National journalism recognition.', items: [], images: [], links: [] },
        { title: 'AWS Recognition', artwork: 'Johannes Vermeer - The Geographer', art: 'geographer.jpg', artAspect: 1.121, blurb: '2nd place, international AWS competition.', items: [], images: [], links: [] },
        { title: 'Congressional Recognition', artwork: 'Johannes Vermeer - Girl Reading a Letter at an Open Window', art: 'girlletterwindow.jpg', artAspect: 1.308, blurb: 'Congressional recognition.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'technical', title: 'Technical Skills', wing: 'Technical Skills Wing', pos: [R, -6.75], yaw: YAW_R, sub: null,
    art: 'vitruvian.jpg', artAspect: 1.36,
    exhibit: {
      blurb: 'Engineering, computer science, mathematics, AI, and technical foundations.',
      items: ['Engineering', 'Computer Science', 'Mathematics', 'Artificial Intelligence', 'Technical foundations'],
      images: [], links: [], artwork: 'Leonardo da Vinci - Vitruvian Man',
    },
  },
  {
    id: 'soft', title: 'Soft Skills', wing: 'Soft Skills Wing', pos: [L, -20.25], yaw: YAW_L, sub: null,
    art: 'boatingparty.jpg', artAspect: 0.74,
    exhibit: {
      blurb: 'How I work with people and ideas.',
      items: ['Communication', 'Teamwork', 'Leadership', 'Relationship building', 'Collaboration'],
      images: [], links: [], artwork: 'Pierre-Auguste Renoir - Luncheon of the Boating Party',
    },
  },
  {
    id: 'hobbies', title: 'Hobbies & Interests', wing: 'Hobbies & Interests Wing', pos: [R, -33.5], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Life outside the work - what I love.', images: [], links: [],
      pieces: [
        { title: 'Reading', artwork: 'Jean-Honoré Fragonard - The Reader', art: 'readinggirl.jpg', artAspect: 1.257, blurb: 'Books and reading.', items: [], images: [], links: [] },
        { title: 'Cooking', artwork: 'Johannes Vermeer - The Milkmaid', art: 'milkmaid.jpg', artAspect: 1.121, blurb: 'Cooking.', items: [], images: [], links: [] },
        { title: 'Crocheting', artwork: 'Berthe Morisot - Young Woman Knitting', art: 'knitting.jpg', artAspect: 0.835, blurb: 'Crocheting and making.', items: [], images: [], links: [] },
        { title: 'Thrifting', artwork: 'Carl Spitzweg - Der Stellwagen (street scene)', art: 'spitzweg.jpg', artAspect: 1.583, blurb: 'Thrifting and vintage finds.', items: [], images: [], links: [] },
        { title: 'Restaurants & Food', artwork: 'Vincent van Gogh - Café Terrace at Night', art: 'cafeterrace.jpg', artAspect: 1.28, blurb: 'Restaurants and food exploration.', items: [], images: [], links: [] },
        { title: 'Travel', artwork: 'J.M.W. Turner - The Fighting Temeraire', art: 'temeraire.jpg', artAspect: 0.743, blurb: 'Travel.', items: [], images: [], links: [] },
        { title: 'Hiking & Nature', artwork: 'Gustav Klimt - Beech Grove', art: 'beechforest.jpg', artAspect: 0.992, blurb: 'Hiking and the outdoors.', items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'licenses', title: 'Licenses and Certifications', wing: 'Licenses and Certifications Wing', pos: [L, -33.5], yaw: YAW_L, sub: null,
    art: null, artAspect: 1.25, placeholder: true,
    exhibit: {
      blurb: 'Certifications coming this summer!',
      items: [], images: [], links: [], artwork: '',
    },
  },
  {
    id: 'contact', title: 'Socials & Contact', wing: 'Socials & Contact Wing', pos: [R, -20.25], yaw: YAW_R, sub: null,
    art: 'dancemoulin.jpg', artAspect: 0.743,
    exhibit: {
      blurb: 'Find me here. Let’s connect.',
      items: [], images: [], artwork: 'Pierre-Auguste Renoir - Dance at Le Moulin de la Galette',
      links: [
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/abigail-kamenetsky' },
        { label: 'GitHub', url: 'https://github.com/abigailkamenetsky' },
        { label: 'Instagram', url: 'https://www.instagram.com/abigailkamenetsky/' },
        { label: 'StoryGraph', url: 'https://app.thestorygraph.com/profile/abbykamenetsky' },
        { label: 'Beli', url: 'https://beliapp.co/app/abbykamenetsky' },
        { label: 'Resume', pdf: 'Abby_Kamenetsky_Resume.pdf' },
        { label: 'Email', emails: [
          { label: 'School', addr: 'abbykamenetsky@uchicago.edu' },
          { label: 'Home', addr: 'abigailk725@gmail.com' },
        ] },
      ],
    },
  },
]

export const wingById = id => WINGS.find(w => w.id === id)

// ── collage layouts - BIG paintings on an even grid (w,h = slot box; the frame is
// fitted to each artwork inside it). Multi-row hangs stack high to use the tall walls. ──
function cluster(n) {
  if (n <= 1) return [{ dz: 0, dy: 0.4, w: 3.4, h: 4.4, cls: 1 }]
  if (n === 2) return [
    { dz: -2.05, dy: 0.4, w: 2.9, h: 3.7, cls: 0 }, { dz: 2.05, dy: 0.4, w: 2.9, h: 3.7, cls: 0 },
  ]
  if (n === 3) return [   // Research: three big canvases stacked in a single vertical column
    { dz: 0, dy: 5.4, w: 4.4, h: 2.9, cls: 0 }, { dz: 0, dy: 1.9, w: 4.4, h: 2.9, cls: 0 }, { dz: 0, dy: -1.6, w: 4.4, h: 2.9, cls: 0 },
  ]
  if (n === 4) return [
    { dz: -2.1, dy: 3.1, w: 2.8, h: 3.2, cls: 0 }, { dz: 2.1, dy: 3.1, w: 2.8, h: 3.2, cls: 0 },
    { dz: -2.1, dy: -0.7, w: 2.8, h: 3.2, cls: 0 }, { dz: 2.1, dy: -0.7, w: 2.8, h: 3.2, cls: 0 },
  ]
  if (n === 5) return [
    { dz: -2.85, dy: 3.1, w: 2.4, h: 3.0, cls: 0 }, { dz: 0, dy: 3.1, w: 2.4, h: 3.0, cls: 0 }, { dz: 2.85, dy: 3.1, w: 2.4, h: 3.0, cls: 0 },
    { dz: -1.6, dy: -0.7, w: 2.6, h: 3.2, cls: 0 }, { dz: 1.6, dy: -0.7, w: 2.6, h: 3.2, cls: 0 },
  ]
  if (n === 6) return [
    { dz: -2.95, dy: 3.1, w: 2.4, h: 3.0, cls: 0 }, { dz: 0, dy: 3.1, w: 2.4, h: 3.0, cls: 0 }, { dz: 2.95, dy: 3.1, w: 2.4, h: 3.0, cls: 0 },
    { dz: -2.95, dy: -0.7, w: 2.4, h: 3.0, cls: 0 }, { dz: 0, dy: -0.7, w: 2.4, h: 3.0, cls: 0 }, { dz: 2.95, dy: -0.7, w: 2.4, h: 3.0, cls: 0 },
  ]
  // 7 - a salon hang for the tall back-right gap: rows of 2 / 3 / 2, large and centered,
  // lifted off the floor with even vertical separation so the rows read as deliberate
  return [
    { dz: -1.5, dy: 4.9, w: 2.5, h: 2.55, cls: 0 }, { dz: 1.5, dy: 4.9, w: 2.5, h: 2.55, cls: 0 },
    { dz: -2.6, dy: 1.9, w: 2.4, h: 2.55, cls: 0 }, { dz: 0, dy: 1.9, w: 2.4, h: 2.55, cls: 0 }, { dz: 2.6, dy: 1.9, w: 2.4, h: 2.55, cls: 0 },
    { dz: -1.5, dy: -1.0, w: 2.5, h: 2.55, cls: 0 }, { dz: 1.5, dy: -1.0, w: 2.5, h: 2.55, cls: 0 },
  ]
}

export const PAINTINGS = (() => {
  const out = []
  for (const w of WINGS) {
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
      placeholder: pcs ? false : (w.placeholder || false),
    }))
  }
  return out
})()
