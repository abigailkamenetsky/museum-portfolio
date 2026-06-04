// MUSEUM WINGS — the visitor experience structure.
// pos = [x, z] standing spot in front of the exhibit; yaw = facing toward the wall.
// Content here is PLACEHOLDER scaffolding — fill `exhibit` with Abigail's real details.
// Gallery is x:[-9,9], z:[-39,39]; side walls at x≈±9, entrance at z≈+39, feature wall at z≈-39.

const L = -6, R = 6   // stand spots in front of the left / right walls
const YAW_L = -Math.PI / 2   // face the left (-X) wall
const YAW_R = Math.PI / 2    // face the right (+X) wall

export const WINGS = [
  {
    id: 'professional', title: 'Professional Experience', wing: 'Professional Experience Wing',
    pos: [L, 34], yaw: YAW_L,
    sub: ['Current Internship', 'Past Internships'],
    exhibit: {
      blurb: 'Internships and professional roles — where the work met the world.',
      items: ['Current Internship — role, company, dates, impact', 'Past Internships — selected highlights'],
      tech: [], links: [],
    },
  },
  {
    id: 'projects', title: 'Projects', wing: 'Projects Hall',
    pos: [R, 34], yaw: YAW_R,
    sub: ['Current Projects', 'Past Projects'],
    exhibit: {
      blurb: 'Things built — from prototypes to shipped work.',
      items: ['Current Projects — what you are building now', 'Past Projects — selected showcases'],
      tech: [], links: [],
    },
  },
  {
    id: 'research', title: 'Research Experience', wing: 'Research Gallery',
    pos: [L, 20.25], yaw: YAW_L,
    sub: ['Current Research', 'Past Research'],
    exhibit: {
      blurb: 'Questions pursued — posters, publications, and findings.',
      items: ['Current Research — lab, topic, methods', 'Past Research — prior projects + results'],
      tech: [], links: [],
    },
  },
  {
    id: 'leadership', title: 'Leadership Experience', wing: 'Leadership Gallery',
    pos: [R, 20.25], yaw: YAW_R, sub: null,
    exhibit: { blurb: 'Roles where you led people and built things together.', items: ['Organizations, events, and the teams you led'], tech: [], links: [] },
  },
  {
    id: 'uchicago', title: 'UChicago Programs', wing: 'UChicago Programs Exhibit',
    pos: [L, 6.75], yaw: YAW_L, sub: null,
    exhibit: { blurb: 'Programs and cohorts at the University of Chicago.', items: ['QUBIT cohort, academic programs, fellowships'], tech: [], links: [] },
  },
  {
    id: 'awards', title: 'Honors & Awards', wing: 'Honors & Awards Gallery',
    pos: [R, 6.75], yaw: YAW_R, sub: null,
    exhibit: { blurb: 'Recognitions earned along the way.', items: ['Awards, honors, and competition placements'], tech: [], links: [] },
  },
  {
    id: 'technical', title: 'Technical Skills', wing: 'Technical Skills Exhibit',
    pos: [L, -6.75], yaw: YAW_L, sub: null,
    exhibit: { blurb: 'Languages, tools, and systems.', items: ['Programming languages, frameworks, ML, data, tooling'], tech: [], links: [] },
  },
  {
    id: 'soft', title: 'Soft Skills', wing: 'Soft Skills Gallery',
    pos: [R, -6.75], yaw: YAW_R, sub: null,
    exhibit: { blurb: 'How you work with people and ideas.', items: ['Communication, leadership, collaboration, judgment'], tech: [], links: [] },
  },
  {
    id: 'hobbies', title: 'Hobbies & Interests', wing: 'Hobbies & Interests Gallery',
    pos: [L, -20.25], yaw: YAW_L, sub: null,
    exhibit: { blurb: 'Life outside the work — what you love.', items: ['Photography, travel, books, personal projects'], tech: [], links: [] },
  },
  {
    id: 'contact', title: 'Socials & Contact', wing: 'Connect With Abigail',
    pos: [0, -33], yaw: Math.PI, sub: null,
    exhibit: {
      blurb: 'The conclusion of the museum — let’s connect.',
      items: [],
      links: [
        { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
        { label: 'GitHub', url: 'https://github.com/abigailkamenetsky' },
        { label: 'Portfolio', url: '#' },
        { label: 'Resume', url: '#' },
        { label: 'Email', url: 'mailto:abbykamenetsky@uchicago.edu' },
      ],
      tech: [],
    },
  },
]

export const wingById = id => WINGS.find(w => w.id === id)
