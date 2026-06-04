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
    exhibit: { blurb: 'Internships and professional roles — where the work met the world.', items: ['Current Internship — role, company, dates, impact', 'Past Internships — selected highlights'], images: [], links: [] },
  },
  {
    id: 'projects', title: 'Projects', wing: 'Projects Hall',
    pos: [L, 20.25], yaw: YAW_L, sub: ['Current Projects', 'Past Projects'],
    exhibit: { blurb: 'Things built — from prototypes to shipped work.', items: ['Current Projects — what you are building now', 'Past Projects — selected showcases'], images: [], links: [] },
  },
  {
    id: 'research', title: 'Research Experience', wing: 'Research Gallery',
    pos: [R, 20.25], yaw: YAW_R, sub: ['Current Research', 'Past Research'],
    exhibit: { blurb: 'Questions pursued — posters, publications, and findings.', items: ['Current Research — lab, topic, methods', 'Past Research — prior projects + results'], images: [], links: [] },
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
