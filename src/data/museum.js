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
      blurb: [
        "Hello! My name is Abigail (Abby), I'm 19 years old, and I grew up in Menlo Park, California.",
        "I'm currently an undergraduate at the University of Chicago, double majoring in Economics & Computer Science with a minor in Astronomy/Astrophysics, and possibly English if time lets me.",
        "I built this because I wanted to showcase what I've done so far in a creative way, and since some of my favorite memories are visiting art museums, I figured why not combine the two.",
        "Experience: I have strong skills in business development, machine learning, financial modelling, and many AI tools, but I'm also open to any new kind of opportunity that pops up (as you can see in my portfolio).",
        "More about me: I have a younger brother named Joseph, and he's my favorite person in the world. You can see us together in the photos below. When I have free time, I love to read, crochet, travel, build side projects like this one, cook, and so much more.",
        "I'm happiest when I'm learning something new or making something from scratch. Please feel free to reach out, and click {{SOCIALS}} to find all of my contact information!",
      ],
      why: "I chose this painting because I am an older sister with a (formerly blonde) younger brother. While I am not blonde, this painting reminds me of the two of us as children. See the photos below for reference, because I swear that baby and my baby brother look the same!",
      items: [], images: [], artwork: 'William-Adolphe Bouguereau - The Elder Sister',
      links: [],
    },
  },
  {
    id: 'projects', title: 'Projects', wing: 'Projects Wing', pos: [R, 34], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Each painting here is one project. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'HelpMynd', artwork: 'Rembrandt - The Return of the Prodigal Son', art: 'prodigal.jpg', artAspect: 1.305,
          blurb: [
            "I founded HelpMynd because I cared about mental health and I wanted to build something that actually reached the people who needed support. I started it in February 2023 and I ran it as Founder and CEO until January 2026.",
            "I grew HelpMynd into a registered 501(c)(3) nonprofit with more than 35 team members across over 130 countries. I secured partnerships with Stanford Hospital and the Jamaican Ministry of Health because I wanted the work to be credible and connected to real medical systems.",
            "I built and launched a curated global mental health directory so people could find resources near them. I also led international conferences and workshops because I wanted HelpMynd to bring people together in person and not only live online.",
            "I learned how to recruit people, keep a large remote team motivated, and turn an idea I believed in into an organization that runs across many time zones.",
          ],
          why: "I chose this painting because it shows a son who returns home in a desolate state after very bad life choices and is embraced by his father without any punishment. That was our goal for HelpMynd: giving people access to mental health care without judgement or bias, and focusing only on what they needed and how to help them. Rembrandt is also one of my favorite painters because of the way he paints light, so this was another chance to glaze him!",
          skills: ['Nonprofit leadership', 'Building and managing a remote team', 'Partnership development', 'Public speaking', 'Turning an idea into an organization'],
          items: [], images: [], links: [] },
        { title: 'Museum Portfolio', artwork: 'Carel Fabritius - The Goldfinch', art: 'goldfinch.jpg', artAspect: 1.527,
          blurb: [
            "This project is an interactive virtual museum designed to replace a traditional portfolio with an explorable digital experience.",
            "Visitors navigate through galleries containing:",
            ["Research experiences", "Internships", "Projects", "Awards", "UChicago programs", "Hobbies", "Personal interests"],
            "Each painting functions as an interactive exhibit that tells part of my story.",
          ],
          why: "I chose this painting because this entire portfolio is modeled after the Mauritshuis Museum in The Hague, Netherlands. The museum is incredibly beautiful, with deep green walls and very famous paintings like Girl with a Pearl Earring. My favorite piece from that visit, and the one that largely inspired this project, was The Goldfinch. When I visited in the summer of 2025, I happened to be reading the novel The Goldfinch by Donna Tartt, so I was floored to randomly stumble upon the actual painting that the Pulitzer Prize winning book was based on. When I came up with the idea for this project, I immediately thought of The Goldfinch and the Mauritshuis!",
          skills: ['React and Three.js', '3D web development', 'UX and UI design', 'Git and deployment', 'Creative problem solving'],
          items: [], images: [], links: [] },
        { title: 'Tech Showcase Parking App', artwork: 'Salvador Dalí - The Elephants', art: 'elephants.jpg', artAspect: 0.835,
          blurb: [
            "I will be working on a parking app for the University of Chicago Summer Tech Showcase.",
            "The program runs from June 15 to July 29, 2026, and it provides:",
            ["$750 in initial project funding", "Mentorship and office hours", "Structured development support", "Final showcase presentations", "Potential prize funding"],
          ],
          why: "I chose this painting because it feels mysterious and unknown to me when I look at it. I know some vague details of what I will be building, though it is largely going to be a go with the flow process, so I am excited for the mystery and the ambiguity.",
          items: [], images: [], links: [] },
        { title: 'Handshake AI Agent', artwork: 'René Magritte - Golconda', art: 'golconda.jpg', artAspect: 0.815,
          blurb: [
            "I don't like Handshake's recommendation algorithm for internships, jobs, and events, because it won't let you filter by internship time period or even by industry. So I am going to build my own.",
            "I also want this agent to fill out my job applications for me, then email me to say it finished so I can do the final check. Hopefully a two day project I can knock out this summer.",
          ],
          why: "I chose this painting because Handshake's recommendation algorithm currently sends a lot of noise, and I want to filter it out. Magritte's many identical bowler-hatted men, all blurring together, reminded me of exactly that.",
          items: [], images: [], links: [] },
        { title: 'Color Block Jam - Ad Blocker', artwork: 'Edvard Munch - The Scream', art: 'scream.jpg', artAspect: 1.264,
          blurb: [
            "I play Color Block Jam for fun because it is therapeutic, and it has SO MANY ads, plus it wants you to pay 9 dollars to get rid of them.",
            "I am going to see whether I can build (with Claude) and download a mobile extension that blocks these ads for me, so I don't have to pay the 9 dollars and can play my game uninterrupted. Timeline is TBD, whenever I get around to it.",
          ],
          why: "My favorite game, Color Block Jam, has these stupid Kalshi ads that annoy me so much, because it is the same one every time and it plays after every single round. The Scream represents exactly how I feel when these ads ruin my favorite game.",
          items: [], images: [], links: [] },
        { title: 'Lyft/Via UChicago App for Fall', artwork: 'J.M.W. Turner - Rain, Steam and Speed', art: 'rainsteamspeed.jpg', artAspect: 0.743,
          blurb: [
            "I won't say too much, because I'm not sure if this is allowed, but when the Via system gets overloaded with free UChicago requests, Via gives you a free Lyft.",
            "I want to see if I can overload it on demand to get a free Lyft every time I want to Via somewhere. (Free lyfts everytime, muahahahahah.) Timeline is TBD, hopefully done before school starts in fall 2026.",
          ],
          why: "I chose this painting because this is basically what Chicago weather is like whenever it rains. It floods, and it is incredibly windy, so free Lyfts would be really great.",
          items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'professional', title: 'Internships', wing: 'Internships Wing', pos: [L, 20.25], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Each painting here is one internship. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'AWS - Retail Crime Prediction', artwork: 'Hieronymus Bosch - The Garden of Earthly Delights', art: 'garden.jpg', artAspect: 0.569,
          blurb: [
            "I worked as a Computer Science Intern at Amazon Web Services in Seattle during the summer of 2024.",
            "I built a machine learning model that used geographic datasets to find risk patterns and inform site selection decisions. I spent a lot of my time turning the technical output into clear business insights because the model only mattered if the people making decisions could actually use it.",
            "I placed second in an international AWS data competition and I presented my findings to senior leadership. I focused on risk forecasting and on explaining my analysis carefully because I wanted the room to trust the numbers.",
          ],
          why: "I chose this painting because a lot of my work was cleaning messy, chaotic datasets, and this painting is so busy and chaotic that it reminded me of exactly that. It is also my favorite painting of all time, so I had to include it somewhere!",
          skills: ['Machine learning', 'Geographic data analysis', 'Turning technical results into business insights', 'Presenting to leadership', 'Risk forecasting'],
          items: [], images: [], links: [{ label: 'Final Presentation', pdf: 'AWS_Final_Presentation.pdf' }] },
        { title: 'Maroon Cays Consulting', artwork: 'Honoré Daumier - The Chess Players', art: 'chessplayers.jpg', artAspect: 0.774,
          blurb: [
            "I worked as a Strategy Consulting Intern with the Winter Metcalf Clinic on the Maroon Cays Innovation Projects in early 2026.",
            "I conducted market analysis and I evaluated the strategic positioning of a sustainability venture. I built investor-style pitch materials, and I prioritized partnerships based on market opportunity and how well they could scale.",
            "I liked this work because it let me study a real business and then make concrete recommendations about where it should focus next.",
          ],
          why: "I chose this painting because we had to start from scratch and build a plan for a pilot test center, and Daumier's The Chess Players felt like the right fit for that kind of careful, strategic planning.",
          skills: ['Market analysis', 'Strategic positioning', 'Investor pitch development', 'Partnership prioritization', 'Financial reasoning'],
          items: [], images: [], links: [
            { label: 'Executive Summary', pdf: 'MaroonCays_Executive_Summary.pdf' },
            { label: 'Venture Analysis', pdf: 'MaroonCays_Venture_Analysis.pdf' },
            { label: 'Presentation', pdf: 'MaroonCays_Presentation.pdf' },
          ] },
        { title: 'Gigamon - Global Program Office', artwork: 'Rembrandt - The Night Watch', art: 'nightwatch.jpg', artAspect: 0.838, blurb: 'I will be working as a Global Program Office Intern this summer. Details TBD!',
          why: "I chose this painting because Gigamon is a cybersecurity company that protects client data, so The Night Watch, with its guards watching over and protecting the city, felt like the perfect fit. Also, more Rembrandt, because he is just so skilled!",
          items: [], images: [], links: [] },
        { title: 'SDIG - Web Development', artwork: 'Claude Monet - The Bridge at Argenteuil', art: 'argenteuil.jpg', artAspect: 0.761,
          blurb: "I will be working as a web development intern for the nonprofit SDIG (Systemic Diversity & Inclusion Group) from June 2026 to September 2026, where I'll be helping to re-vamp and re-develop their website. More details to come!",
          why: "I chose this painting because it is too beautiful not to include. Love Monet :)",
          items: [], images: [], links: [{ label: 'SDIG Website', url: 'https://www.sdigeducation.org/' }] },
      ],
    },
  },
  {
    id: 'research', title: 'Research Experience', wing: 'Research Experience Wing', pos: [R, 20.25], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Each painting here is one research project. Tap any to learn more.', images: [], links: [],
      pieces: [
        { title: 'CMU - Rectangle Packing (NP-hard)', artwork: 'M.C. Escher - Relativity', art: 'relativity.jpg', artAspect: 0.958,
          blurb: [
            "I worked as a Research Intern at Carnegie Mellon University from January to November of 2024.",
            "I designed and optimized algorithms for NP-hard rectangle packing problems. I worked directly with faculty and PhD researchers because the problems were hard and I learned a lot from people who had studied them for years.",
            "I built the entire PackIt game, including its full AI mode. The game was presented at the 12th International Conference on Fun with Algorithms on the island of La Maddalena in Sardinia, Italy, in June 2024. I'm credited on page 26 of the published paper, which you can read below, and you can play the game at the link too.",
            "I am proud of this work because rectangle packing problems are genuinely difficult and I got to push on them alongside serious researchers.",
          ],
          why: "I chose this painting because my research dealt with mathematical optimization, and all of M.C. Escher's work plays with optimization and impossible structure. This one is a personal favorite :)",
          skills: ['Algorithm design', 'Optimization', 'NP-hard problem solving', 'Research collaboration', 'Technical presentation'],
          items: [], images: [], links: [
            { label: 'PackIt Paper (page 26)', pdf: 'PackIt_Paper.pdf' },
            { label: 'Play PackIt', url: 'https://packit.surge.sh/' },
          ] },
        { title: 'UCSB - LLM Hallucinations', artwork: 'Salvador Dalí - The Temptation of Saint Anthony', art: 'stanthony.jpg', artAspect: 0.783,
          blurb: [
            "I wrote a literature review paper on LLM hallucinations: how often they occur, the techniques used to reduce them, and what they mean for safely using large language models in mental health and clinical psychology. My paper focused on prompting techniques to reduce LLM hallucinations in clinical psychology settings.",
            "I presented this paper at a UCSB international academic conference, where I was ranked in the top 10% of presenters out of more than 700, and I earned 2 UCSB academic credits for presenting it as a high schooler.",
            "The full paper is being kept private while it is prepared for submission, so I'm sharing the presentation that walks through the work below.",
          ],
          skills: ['LLM evaluation', 'Research methods', 'Data analysis', 'Technical writing'],
          why: "I chose this painting because my literature review focused on LLM hallucination rates, methods for mitigating those hallucinations, and what they mean for using LLMs in mental health and psychiatry. Dalí's surreal, almost hallucinogenic paintings felt like the perfect match.",
          items: [], images: [], links: [{ label: 'Presentation', pdf: 'UCSB_Prompting_Techniques.pdf' }] },
        { title: 'Booth - Center for Applied AI', artwork: 'Joseph Wright of Derby - An Experiment on a Bird in the Air Pump', art: 'airpump.jpg', artAspect: 0.749,
          blurb: "At the University of Chicago Booth Center for Applied AI, I am helping with data collection for a research project that Professor Levy and Anna Costello are working on. More details to come!",
          why: "I chose this painting because it shows a group gathered around a live scientific experiment, watching the evidence unfold by candlelight. That mix of curiosity and careful observation is exactly what data collection and applied AI research feel like to me.",
          items: [], images: [], links: [] },
        { title: 'UChicago HealthLab - Housing & Health', artwork: 'Luke Fildes - The Doctor', art: 'doctor.jpg', artAspect: 0.677,
          blurb: [
            "Excited to be joining the University of Chicago Section of Hospital Medicine as a Research Assistant under Dr. Jong-Wook Ban. I will be contributing to research on the intersection of health and housing instability, including literature reviews, systematic reviews and meta-analyses, data analysis, and projects that examine how research priorities identified by affected communities compare to those prioritized by experts and existing research.",
            "The goal of this work is to help ensure that future research and policy efforts better reflect the needs of people experiencing housing instability.",
          ],
          why: "I chose The Doctor by Luke Fildes because it shows a physician watching over a sick child inside a humble home, which is exactly where this work lives: the place where health and housing meet. The painting centers the dignity and care owed to vulnerable families, which is the heart of research meant to reflect what affected communities actually need.",
          items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'uchicago', title: 'UChicago Programs and Clubs', wing: 'UChicago Programs and Clubs Wing', pos: [L, 6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Programs, cohorts, and clubs at the University of Chicago.', images: [], links: [],
      pieces: [
        { title: 'Succeeding in the Entrepreneurial Workplace', artwork: 'Peter Paul Rubens - Self-Portrait', art: 'rubens.jpg', artAspect: 1.510,
          blurb: [
            "The Succeeding in the Entrepreneurial Workplace program is a six-month professional development experience focused on preparing students for startup environments and entrepreneurial careers.",
            "The program includes:",
            ["Workshops on startup culture", "Professional communication training", "Career readiness sessions", "AI productivity tools", "Networking events", "Required cohort meetings", "Mentorship opportunities"],
            "At the conclusion of the program, participants are matched with startup internship opportunities and gain exposure to early-stage companies and entrepreneurial ecosystems.",
          ],
          why: "I picked the Self-Portrait of Peter Paul Rubens because Rubens was an entrepreneur, not only a painter. He ran a full company with a large workshop of trained assistants who produced paintings for him, and he would step in to add the final touches himself. That is the reason so many of his works exist today. I chose him because that mix of craft and running a real operation is exactly the entrepreneurial mindset this program is about.",          items: [], images: [], links: [] },
        { title: 'Quantum in Business & Technology (QUBIT)', artwork: 'Caspar David Friedrich - Wanderer Above the Sea of Fog', art: 'wanderer.jpg', artAspect: 1.28,
          blurb: [
            "I was selected as a member of the 2025–2026 QUBIT Cohort, a highly selective University of Chicago program that admits only a small group of students from a large applicant pool.",
            "The program combines technology, business, research, and professional development. Activities included:",
            ["Career development workshops", "Technical training sessions", "Industry guest speakers", "Visits to organizations such as Argonne National Laboratory", "Networking with professionals in science, technology, and business", "Individualized career guidance", "Additional summer funding opportunities"],
            "Participation in QUBIT also provided an additional $1,000 in Metcalf summer funding support and access to a community of students interested in emerging technologies and interdisciplinary problem solving.",
          ],
          why: "I picked Wanderer Above the Sea of Fog by Caspar David Friedrich because it captures a figure standing at the edge of the known world, looking out over a vast and uncertain landscape. QUBIT sits at exactly that frontier: quantum technology and emerging fields where the path forward is still being charted.",
          skills: ['Quantum and emerging tech literacy', 'Interdisciplinary thinking', 'Professional development', 'Networking'],
          items: [], images: [], links: [] },
        { title: 'Venture Capital Immersion Week', artwork: 'Caravaggio - The Calling of Saint Matthew', art: 'callingmatthew.jpg', artAspect: 0.934,
          blurb: [
            "I was selected to participate in the University of Chicago Venture Capital Immersion Week, taking place September 22–25, 2026.",
            "The program includes:",
            ["Venture capital history and foundations", "Investment thesis development", "Market sizing", "Financial modeling workshops", "Portfolio construction", "Cap table analysis", "Deal sourcing", "Founder pitch evaluations", "Investment committee simulations", "Networking with investors and founders", "Office visit to DRW Venture Capital", "Sessions with Collaborative Fund, Chicago Ventures, Techstars, and other firms"],
            "Prior to the program, participants must independently:",
            ["Develop an investment thesis", "Define sectors and fund strategy", "Build a sourcing pipeline", "Identify startup opportunities", "Create investment memos", "Analyze startup performance", "Determine pricing and check sizes", "Track portfolio performance over time"],
            "The program provides a rare opportunity to experience how venture capital firms evaluate companies and allocate capital.",
          ],
          why: "I picked The Calling of Saint Matthew by Caravaggio because it captures the decisive moment of choosing one person out of many, a beam of light singling out who will be called forward. Venture capital is ultimately that act: evaluating many, then deciding which founder and which vision deserve to be backed.",          items: [], images: [], links: [] },
        { title: 'Blue Chips Investment Club', artwork: 'Rembrandt - Syndics of the Drapers’ Guild', art: 'drapers.jpg', artAspect: 0.711,
          blurb: [
            "Blue Chips is one of the University of Chicago's most selective investing organizations. During my first year, I participated in New Member Education (NME), an intensive six-week program designed to teach students the fundamentals of value investing, equity research, financial accounting, valuation, and investment analysis.",
            "The program required learning how to read and interpret financial statements, construct discounted cash flow (DCF) models from scratch, estimate intrinsic value, analyze competitive positioning, and ultimately develop an independent stock pitch supported by financial modeling. Participants were expected to absorb large amounts of material quickly and complete an examination covering the full curriculum.",
            "Through the experience I discovered that while I genuinely enjoy investing, markets, and business strategy, I am more interested in building companies and products than pursuing traditional investment banking. Nevertheless, Blue Chips provided a strong foundation in valuation, financial analysis, and strategic thinking that continues to influence how I evaluate startups, research opportunities, and business models.",
          ],
          why: "I picked The Syndics of the Drapers' Guild by Rembrandt because the painting depicts a group of professionals carefully evaluating information, making judgments, and overseeing important financial decisions. The atmosphere of analysis, scrutiny, and disciplined decision-making mirrors the process of building valuation models, defending investment theses, and learning how investors think.",
          skills: ['DCF valuation', 'Financial statement analysis', 'Equity research', 'Intrinsic value estimation', 'Investment analysis'],
          items: [], images: [], links: [] },
        { title: 'Summer Tech Showcase - Parking & Transportation App', artwork: 'Gustave Caillebotte - Paris Street; Rainy Day', art: 'rainyday.jpg', artAspect: 0.757,
          blurb: [
            "This project is being developed through the University of Chicago Summer Tech Showcase.",
            "The program provides:",
            ["$750 in initial project funding", "Mentorship and office hours", "Structured development support", "Final showcase presentations", "Potential prize funding"],
            "The project focuses on transportation and parking challenges. Additional details will be revealed as development progresses.",
          ],
          why: "I picked Paris Street; Rainy Day by Gustave Caillebotte because it depicts people navigating a rapidly modernizing city on foot, before modern transportation technologies. It highlights how dramatically mobility has changed and connects to a project focused on helping people move through cities more efficiently.",          items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'leadership', title: 'Leadership & Activities', wing: 'Leadership & Activities Wing', pos: [R, 6.75], yaw: YAW_R, sub: null,
    exhibit: {
      blurb: 'Roles where I led people and built things together.', images: [], links: [],
      pieces: [
        { title: 'Journalism / Newspaper Leadership', artwork: 'Diego Velázquez - Las Meninas', art: 'meninas.jpg', artAspect: 1.151,
          blurb: [
            "I led my school newspaper, and I earned the NSPA Leadership Award for that work.",
            "I ran the newsroom because I loved both the writing and the people. I edited stories, I set the direction for our coverage, and I made sure my staff had what they needed to do their best work.",
            "I learned how to lead a creative team under deadline because a newspaper does not wait for anyone.",
          ],
          why: "I picked Las Meninas by Velázquez because it is a painting about who is in the room and who is watching, with the artist standing right inside the scene. I chose it for journalism because editing taught me to pay attention to perspective and to my own place in the story.",
          skills: ['Editorial leadership', 'Team management', 'Writing and editing', 'Working under deadline', 'Communication'],
          items: [], images: [], links: [] },
        { title: 'Pinewood Envoys', artwork: 'Hans Holbein the Younger - The Ambassadors', art: 'ambassadors.jpg', artAspect: 0.985, blurb: 'Ambassador / envoy program.',
          skills: ['Ambassadorship', 'Public speaking', 'Relationship building', 'Representing an organization'],
          items: [], images: [], links: [] },
        { title: 'Peer Tutoring Program', artwork: 'Raphael - The School of Athens', art: 'schoolofathens.jpg', artAspect: 0.775, blurb: 'Peer tutoring and teaching.',
          skills: ['Teaching', 'Clear explanation', 'Patience', 'Subject mastery', 'Mentoring'],
          items: [], images: [], links: [] },
        { title: 'Drama Club', artwork: 'Edgar Degas - The Singer in Green', art: 'singergreen.jpg', artAspect: 1.297, blurb: 'Theatre and performance.',
          skills: ['Performance', 'Public speaking', 'Collaboration', 'Stage presence'],
          items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'awards', title: 'Honors & Awards', wing: 'Honors & Awards Wing', pos: [L, -6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Recognitions earned along the way - a small Vermeer gallery.', images: [], links: [],
      pieces: [
        { title: 'AP Scholar / Academic Achievement', artwork: 'Johannes Vermeer - The Astronomer', art: 'astronomer.jpg', artAspect: 1.136, blurb: 'Academic achievement.', items: [], images: [], links: [] },
        { title: 'NSPA Leadership Award', artwork: 'Johannes Vermeer - The Love Letter', art: 'loveletter.jpg', artAspect: 1.16,
          blurb: [
            "I received the NSPA Leadership Award for my work in student journalism.",
            "I earned this because I led a newsroom and I cared about the people on my staff as much as the stories we published.",
          ],
          why: "I picked The Love Letter by Vermeer because it is a quiet painting about a message passing between people. I chose it for journalism because writing and editing are how I learned to carry a message carefully from one person to many.",
          items: [], images: [], links: [] },
        { title: 'AWS AI Competition (2nd Place)', artwork: 'Johannes Vermeer - The Geographer', art: 'geographer.jpg', artAspect: 1.121,
          blurb: [
            "I placed second in an international AWS AI competition.",
            "I earned this because I built a data model that held up under scrutiny, and because I could explain my analysis clearly to the judges and to senior leadership.",
          ],
          why: "I picked The Geographer by Vermeer because he is a person bent over maps and measurements, working to understand the world through data. I chose it because that is exactly how I approached the competition.",
          items: [], images: [], links: [] },
        { title: 'Congressional Recognition', artwork: 'Johannes Vermeer - Girl Reading a Letter at an Open Window', art: 'girlletterwindow.jpg', artAspect: 1.308,
          blurb: [
            "I received Congressional Recognition from Representative Anna Eshoo.",
            "I earned this because of work that reached my own community. Being recognized by my representative meant a lot to me because it tied my effort back to the place I am from.",
          ],
          why: "I picked Girl Reading a Letter at an Open Window by Vermeer because it shows a private moment of receiving important news. I chose it because that is how the recognition felt to me when I first read it.",
          items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'technical', title: 'Technical Skills', wing: 'Technical Skills Wing', pos: [R, -6.75], yaw: YAW_R, sub: null,
    art: 'vitruvian.jpg', artAspect: 1.36,
    exhibit: {
      blurb: ["These are the tools I reach for when I build and analyze things. Tap any skill to jump to where I actually used it."],
      linkedItems: [
        { label: 'AI workflow automation (Claude & LLM tools)', jump: 'projects', piece: 3 },
        { label: 'Financial modeling (DCF, valuation)', jump: 'uchicago', piece: 3 },
        { label: 'Python', jump: 'professional', piece: 0 },
        { label: 'JavaScript', jump: 'research', piece: 0 },
        { label: 'Excel', jump: 'uchicago', piece: 3 },
        { label: 'Machine learning', jump: 'professional', piece: 0 },
        { label: 'Market analysis', jump: 'professional', piece: 1 },
      ],
      coursework: ['Linear Algebra', 'Calculus 3', 'Microeconomics', 'Macroeconomics'],
      why: "I picked Vitruvian Man by Leonardo da Vinci because it is the meeting of mathematics, measurement, and the human body. I chose it because I like using technical tools to understand things precisely.",
      items: [], images: [], links: [], artwork: 'Leonardo da Vinci - Vitruvian Man',
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
        { title: 'Reading', artwork: 'Jean-Honoré Fragonard - The Reader', art: 'readinggirl.jpg', artAspect: 1.257,
          blurb: "I absolutely love to read, specifically classic literature. If I have any free time, I am most likely reading. Check out my StoryGraph!",
          why: "I chose this painting because it is simply a girl lost in a book, which is me on most afternoons. Reading is my favorite way to spend free time, so it felt right to have a reader watching over this corner of the museum.",
          items: [], images: [], links: [{ label: 'My StoryGraph', url: 'https://app.thestorygraph.com/profile/abbykamenetsky' }] },
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
    id: 'licenses', title: 'Licenses, Certifications, and Speaker Series Events', wing: 'Licenses, Certifications & Speaker Series Wing', pos: [L, -33.5], yaw: YAW_L, sub: null,
    art: null, artAspect: 1.25, placeholder: true,
    exhibit: {
      blurb: [
        "Licenses and certifications are coming this summer.",
        "Speaker series events I have attended:",
      ],
      items: ['Point72 Spring Academy Sessions', 'McKinsey Insight series'],
      images: [], links: [], artwork: '',
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
