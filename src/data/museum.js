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
            "I grew HelpMynd into a registered 501(c)(3) nonprofit with a team of more than 35 people across 15 countries, reaching over 60,000 site visitors a year. I sourced and closed more than 10 institutional partnerships, including Stanford Hospital and Jamaica's Ministry of Health, because I wanted the work to be credible and connected to real medical systems.",
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
        { title: 'Serai - Driveway Parking Marketplace', artwork: 'Salvador Dalí - The Elephants', art: 'elephants.jpg', artAspect: 0.835,
          blurb: [
            "Serai is a two sided marketplace for renting residential driveways by the hour. I founded it and built the whole thing myself for the UChicago Summer Tech Showcase, where it won first place out of more than 20 teams and a $1,500 prize.",
            "I started with the research rather than the idea. I scrapped my original curb apron premise once city precedent said it would not hold, sized the real supply at 14,553 viable parcels out of 110,961 from DataSF geometry, and priced it with capped dynamic rates built on 47,525 SFMTA meter transactions.",
            "Then I architected and deployed three applications: a driver app, a host wizard and an operator console, on Next.js 15, React 19 and TypeScript over PostgreSQL and PostGIS, with row level security and encrypted addresses. The map is hand inked and each listing gets its own generated illustration, both drawn on canvas from real city geometry.",
            "It is in closed beta now while I validate demand on both sides before packaging it for the App Store and Google Play.",
          ],
          why: "I chose this painting because Dali's elephants carry impossible weight on impossibly thin legs, which is what a two sided marketplace feels like before either side shows up. When I picked it I had no idea what I was building yet, so the mystery fit, and it still fits now for a different reason.",
          skills: ['Market sizing and pricing strategy', 'Next.js, React and TypeScript', 'PostgreSQL and PostGIS', 'Product architecture', 'Shipping and running a beta'],
          items: [], images: [], links: [{ label: 'Serai', url: 'https://serai-driver.vercel.app' }] },
        { title: 'Handshake AI Agent', artwork: 'René Magritte - Golconda', art: 'golconda.jpg', artAspect: 0.815,
          blurb: [
            "I don't like Handshake's recommendation algorithm for internships, jobs, and events, because it won't let you filter by internship time period or even by industry. So I am going to build my own.",
            "I also want this agent to fill out my job applications for me, then email me to say it finished so I can do the final check. Hopefully a two day project I can knock out this summer.",
          ],
          why: "I chose this painting because Handshake's recommendation algorithm currently sends a lot of noise, and I want to filter it out. Magritte's many identical bowler-hatted men, all blurring together, reminded me of exactly that.",
          items: [], images: [], links: [] },
        { title: 'SporeKeeper', artwork: 'Edvard Munch - The Scream', art: 'scream.jpg', artAspect: 1.264,
          blurb: [
            "A privacy-first Chrome extension that notices when you have started working and asks whether you clocked in, then helps you file the tabs you piled up while doing it. Built in TypeScript with 452 tests, zero runtime dependencies, and zero network requests. It is live and free on the Chrome Web Store, and there is also a browser demo if you would rather try it without installing anything.",
            "You tell it what you are tracking, a job, a thesis, a contract, and what counts as working on it: a website, a project folder in your editor, a person who emails you. When you have actually been at it long enough, one of 54 original pixel-art companions appears over the page you are on, in one of 11 hand-painted scenes, and asks whether you clocked in.",
            "It grew a second half along the way, because the same people who forget to clock in also have forty tabs open. Spore Forest sorts open tabs into folders you define by rules you write, and shows you the whole plan and the specific rule that matched each tab before it moves a single one. For job hunting it will read the role and company off every posting you have open and export the lot as a spreadsheet.",
            "The organising constraint was privacy, and it shaped every technical decision. Zero network requests is not a policy here, it is a property of the code: there is no HTTP client in the codebase at all, no server, no account, no analytics, no telemetry. Everything it knows lives in the browser's own local storage. All 10 Chrome permissions are justified in writing against the file that uses them, and anything that reads more than strictly necessary is off by default.",
            "Underneath: about 13,400 lines of strict TypeScript, 4,300 lines of tests, 4,700 lines of hand-written CSS with no framework, and a 422-line native messaging host so the extension can count time spent in an editor, which a browser cannot see by itself. Vitest runs 452 tests across 27 files. It ships with 0 runtime dependencies, so nothing reaches a user but my own code.",
            "Four invariant checks fail the build rather than warn. Every storage key in the source must appear in the privacy policy or it will not compile, which has caught me twice. The packager refuses to ship a bundle older than the code it was built from.",
            "All 54 companions are generated rather than licensed. I read all 7 pixel-art packs I evaluated, and 6 forbid redistribution, which publishing to the Chrome Web Store is. So I wrote a generator instead: creatures defined as shapes in code, rendered at build time, with the PNG encoder written from scratch against the format spec so even image encoding pulls in no dependency.",
            "The linked demo is not the extension. It is the extension's real interface and real compiled logic running in a page against a simulated browser, so you can see exactly how it works without installing it. Every decision in it is the real one. The service worker, Chrome storage and real tabs are stand-ins, and the demo page says so itself rather than leaving you to find out.",
          ],
          why: "The Scream is the feeling of remembering, hours later, that you never logged any of it. That panic is the entire reason SporeKeeper exists, and Munch's figure is also more or less what forty open tabs does to a person.",
          items: [], images: [],
          links: [
            { label: 'Chrome Web Store', url: 'https://chromewebstore.google.com/detail/sporekeeper/ffeecklpjdoplegkcpjdmkhhcgggnojk' },
            { label: 'Live Demo', url: 'https://abigailkamenetsky.github.io/sporekeeper/' },
            { label: 'Source', url: 'https://github.com/abigailkamenetsky/sporekeeper' },
          ] },
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
        { title: 'Gigamon - Product Management & Business Development', artwork: 'Rembrandt - The Night Watch', art: 'nightwatch.jpg', artAspect: 0.838,
          blurb: [
            "I joined Gigamon in June 2026 as a Product Management and Business Development Intern, working on the End of Sale and End of Life program: what happens when a product is retired, and how customers, partners and the sales teams hear about it in time to plan.",
            "The program was under-resourced when I arrived, so I ran discovery, mapped what it actually did against what it needed to do, and then built the pieces myself.",
            "What I built:",
            [
              "An agent that formats the worldwide price list out of Salesforce, applies the pricing rules, and notifies the team the moment it is ready for a human to review",
              "A notification system that runs monthly, finds every product reaching end of sale or end of life within the next year, fills out the customer notice template I wrote and had approved by product management and legal, pulls the matching customer smart list from Salesforce into Adobe Marketo, and queues the email for a human to approve and schedule",
              "A data extractor that reads end of sale and end of life dates out of the product team's internal PDFs and writes them into Salesforce, so they carry on to every external system without anyone retyping them",
              "An agent that drafts the internal Slack messages and emails, and posts the public announcement to external channels including Vue Community",
              "A Trade Agreements Act certification agent that drafts TAA certifications for the products that need one, with the worldwide price list as the source of truth",
            ],
            "I also built a model that predicts end of sale and end of life dates, so the product lifecycle team can plan against a forecast instead of waiting for each decision to land.",
          ],
          skills: ['Product discovery and scoping', 'Requirements definition', 'AI agents', 'Salesforce', 'Adobe Marketo', 'Working across product, legal and sales'],
          why: "I chose this painting because Gigamon is a cybersecurity company that protects client data, so The Night Watch, with its guards watching over and protecting the city, felt like the perfect fit. Also, more Rembrandt, because he is just so skilled!",
          items: [], images: [], links: [] },
        { title: 'SDIG - Web Development', artwork: 'Claude Monet - The Bridge at Argenteuil', art: 'argenteuil.jpg', artAspect: 0.761,
          blurb: [
            "SDIG is the Systemic Diversity and Inclusion Group, a nonprofit that helps organizations and communities advance diversity, equity and inclusion through consultancy, education and hands on programs. I was their web development intern, and I redesigned and rebuilt their website.",
            "This was a complete redesign rather than a refresh. I rebuilt every page, eighteen of them, from the home page through services, courses, educational programs, events, partners, associates, the blog, the store and contact.",
            "I worked from what the nonprofit told me they needed the site to do, and to their guidance on the colour palette. I designed around that: a warm terracotta and cream palette, a headline that cycles through peace, equality, justice and inclusion so the mission is the first thing you read, and a structure that puts their services and their partner universities where people actually look for them.",
          ],
          why: "I chose this painting because it is too beautiful not to include. Love Monet :)",
          skills: ['Web design and redesign', 'Working to a client brief', 'Colour and visual identity', 'Information architecture', 'Building out a full multi page site'],
          items: [], images: [],
          links: [{ label: 'See the redesign', url: 'https://abigailkamenetsky.github.io/sdig-site-preview/' }] },
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
          blurb: [
            "I worked at the University of Chicago Booth Center for Applied AI through the summer of 2026, on a research project run by Professor Levy and Anna Costello.",
            "My work started as data collection. The project needed a large body of articles gathered and organised, and gathering them by hand is slow, repetitive and the kind of task that quietly eats a research timeline.",
            "So I built an agent system that does it instead. It finds and downloads the articles on its own, with no human sitting over it, which turned the collection step from something somebody had to keep doing into something that simply runs.",
          ],
          skills: ['AI agents and automation', 'Research data collection', 'Working with academic researchers', 'Turning a manual process into a system'],
          why: "I chose this painting because it shows a group gathered around a live scientific experiment, watching the evidence unfold by candlelight. That mix of curiosity and careful observation is exactly what data collection and applied AI research feel like to me.",
          items: [], images: [], links: [] },
        { title: 'UChicago HealthLab - Housing & Health', artwork: 'Luke Fildes - The Doctor', art: 'doctor.jpg', artAspect: 0.677,
          blurb: [
            "I joined the University of Chicago Section of Hospital Medicine as a Research Assistant under Dr. Jong-Wook Ban, on research into the intersection of health and housing instability: how the research priorities named by the communities affected compare with the ones chosen by experts and already funded.",
                "I built the lab's website and worked on their marketing and outreach, so the work would be findable by the people and partners it needs to reach. I also completed the research certification training the lab requires.",
                "The position is on hold at the moment while the lab looks for further funding.",
            "The point of the research is to help future work and policy reflect what people experiencing housing instability actually need, rather than what is easiest to study.",
          ],
          skills: ['Web development', 'Marketing and outreach', 'Research certification', 'Working inside an academic lab'],
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
            "The UChicago Summer Tech Showcase ran from June to July 2026: $750 in starting funding, mentorship and office hours, and a final presentation in front of judges.",
            "I used it to build Serai, a marketplace for renting residential driveways by the hour, as founder and sole builder. It took first place out of more than 20 teams and a $1,500 prize.",
            "The showcase is the reason it exists as a real product rather than a sketch. The deadline forced me to size the market properly, drop the premise that did not survive contact with city precedent, and ship three working applications rather than one demo.",
            "There is a full account of what I built in the Projects room.",
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
        { title: 'Pinewood Envoys', artwork: 'Hans Holbein the Younger - The Ambassadors', art: 'ambassadors.jpg', artAspect: 0.985,
          blurb: "As Community Outreach Head of the Pinewood Envoys Program, I organized over five career fairs, guest speaker events, and open houses to strengthen the connection between students and alumni. My goal was to give students real career insights and networking opportunities while building long-term alumni relationships and a stronger professional community at my school.",
          why: "I chose The Ambassadors by Hans Holbein because being an Envoy was an ambassador role at its core: representing my school and connecting students with the people and opportunities around them.",
          skills: ['Ambassadorship', 'Public speaking', 'Relationship building', 'Representing an organization'],
          items: [], images: [], links: [] },
        { title: 'Peer Tutoring Program', artwork: 'Raphael - The School of Athens', art: 'schoolofathens.jpg', artAspect: 0.775,
          blurb: "I founded and led my school's Peer Tutoring Program, pairing upperclassmen with underclassmen to improve academic outcomes. I trained over ten tutors, organized the schedules and tutoring pairs, and built a supportive, collaborative learning environment that lifted grades and fostered mentorship across grade levels.",
          why: "I chose The School of Athens by Raphael because it shows great minds gathered to teach and learn from one another, which is exactly the spirit of peer tutoring.",
          skills: ['Teaching', 'Clear explanation', 'Patience', 'Subject mastery', 'Mentoring'],
          items: [], images: [], links: [] },
        { title: 'Drama Club', artwork: 'Edgar Degas - The Singer in Green', art: 'singergreen.jpg', artAspect: 1.297,
          blurb: "As a Drama Club Instructor for the Middle Campus Drama Club at Pinewood, I choreographed and directed seventeen plays for students in grades three through six. I guided them through the whole production process, from auditions to performances, helping them build confidence, creativity, and public speaking skills in a fun and supportive environment.",
          why: "I chose The Singer in Green by Degas because it catches a performer in her moment on stage, and Drama Club was all about helping kids find that same confidence in the spotlight.",
          skills: ['Performance', 'Public speaking', 'Collaboration', 'Stage presence'],
          items: [], images: [], links: [] },
        { title: 'Starbucks Barista', artwork: 'Édouard Manet - A Bar at the Folies-Bergère', art: 'foliesbar.jpg', artAspect: 0.747,
          blurb: "I worked as a Starbucks barista in high school for about four and a half months. I prepared drinks, worked 12+ hour weekends, restocked supplies, and worked with a team of 10+ people across all ages. It was a fast-paced, customer-facing job where I kept the quality and the experience high even under pressure.",
          why: "I chose A Bar at the Folies-Bergère by Édouard Manet because it shows a young woman standing behind a busy bar, serving drinks and holding her composure in the middle of the rush. That was me behind the Starbucks counter on a packed weekend.",
          skills: ['Customer service', 'Teamwork', 'Working under pressure', 'Multitasking'],
          items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'awards', title: 'Honors & Awards', wing: 'Honors & Awards Wing', pos: [L, -6.75], yaw: YAW_L, sub: null,
    exhibit: {
      blurb: 'Recognitions earned along the way - a small Vermeer gallery.', images: [], links: [],
      pieces: [
        { title: 'AP Scholar with Distinction', artwork: 'Johannes Vermeer - The Astronomer', art: 'astronomer.jpg', artAspect: 1.136,
          blurb: [
            "I earned the College Board's AP Scholar with Distinction award for my performance across my AP exams.",
            "Scores of 5:",
            ["AP Language & Composition", "AP Literature", "AP Calculus AB", "AP Calculus BC", "AP Computer Science Principles", "AP World History", "AP US History", "AP Government"],
            "Scores of 4:",
            ["AP Biology", "AP Spanish Language", "AP Physics C: Mechanics"],
            "I also studied AP Psychology independently, though I chose not to sit the exam since UChicago does not grant credit for it.",
          ],
          why: "I chose The Astronomer by Vermeer because it shows someone bent over their studies, reaching to understand the world. That quiet, focused effort is exactly what these exams took.",
          items: [], images: [], links: [] },
        { title: 'NSPA Leadership Award', artwork: 'Johannes Vermeer - The Love Letter', art: 'loveletter.jpg', artAspect: 1.16,
          blurb: [
            "I received the National Scholastic Press Association Leadership Award three times for my work in student journalism.",
            "I led a newsroom: assigning and editing, holding a publication schedule, and deciding what was worth printing. Three years of it, which is the part I am proudest of, because leading a staff well once is luck and doing it repeatedly is not.",
                "I earned it because I cared about the people on my staff as much as the stories we published.",
          ],
          why: "I picked The Love Letter by Vermeer because it is a quiet painting about a message passing between people. I chose it for journalism because writing and editing are how I learned to carry a message carefully from one person to many.",
          items: [], images: [], links: [] },
        { title: 'AWS AI Competition (2nd Place)', artwork: 'Johannes Vermeer - The Geographer', art: 'geographer.jpg', artAspect: 1.121,
          blurb: [
            "I placed second out of twenty two teams in an international AWS data competition, during my computer science internship at Amazon Web Services in Seattle.",
                "I trained a machine learning model on geospatial datasets to find risk patterns and inform site selection: which places carried the most risk, and what in the geography explained it.",
            "Then I presented it to senior leadership, and that part mattered as much as the model. I earned this because the analysis held up under scrutiny and because I could explain it clearly to people who were never going to read my code.",
          ],
          why: "I picked The Geographer by Vermeer because he is a person bent over maps and measurements, working to understand the world through data. I chose it because that is exactly how I approached the competition.",
          items: [], images: [], links: [] },
        { title: 'Congressional Recognition', artwork: 'Johannes Vermeer - Girl Reading a Letter at an Open Window', art: 'girlletterwindow.jpg', artAspect: 1.308,
          blurb: [
            "I received Congressional Recognition from Representative Anna Eshoo, who represents the district I grew up in on the San Francisco Peninsula.",
            "It came from work that reached my own community rather than anything abstract. Being recognised by my own representative meant a lot to me, because it tied the effort back to the place I am from and to the people it was actually for.",
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
      blurb: ["These are the soft skills I've built across everything I've done. Tap any to jump to the experience where it showed up most."],
      linkedItems: [
        { label: 'Leadership', jump: 'projects', piece: 0 },
        { label: 'Team management', jump: 'leadership', piece: 0 },
        { label: 'Communication', jump: 'research', piece: 1 },
        { label: 'Public speaking', jump: 'leadership', piece: 3 },
        { label: 'Mentorship', jump: 'leadership', piece: 2 },
        { label: 'Relationship building', jump: 'leadership', piece: 1 },
        { label: 'Collaboration', jump: 'professional', piece: 0 },
        { label: 'Strategic thinking', jump: 'professional', piece: 1 },
        { label: 'Adaptability', jump: 'projects', piece: 2 },
        { label: 'Working under pressure', jump: 'leadership', piece: 0 },
        { label: 'Partnership building', jump: 'projects', piece: 0 },
      ],
      why: "I chose Luncheon of the Boating Party by Renoir because it is a whole table of people talking, laughing, and enjoying each other's company. Soft skills are all about working well with people, and this painting is basically a celebration of exactly that. Plus it is just a joyful painting and I love it.",
      items: [], images: [], links: [], artwork: 'Pierre-Auguste Renoir - Luncheon of the Boating Party',
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
          photos: [], items: [], images: [], links: [{ label: 'My StoryGraph', url: 'https://app.thestorygraph.com/profile/abbykamenetsky' }] },
        { title: 'Cooking', artwork: 'Johannes Vermeer - The Milkmaid', art: 'milkmaid.jpg', artAspect: 1.121, blurb: "I love to cook and I'm always trying new recipes. It's one of my favorite ways to unwind.", photos: [], items: [], images: [], links: [] },
        { title: 'Crocheting', artwork: 'Berthe Morisot - Young Woman Knitting', art: 'knitting.jpg', artAspect: 0.835, blurb: "I love to finger knit, crochet, and regular knit because it's really relaxing and calms me down. Also, it gives me an excuse to watch TV/movies in the background.", photos: [], items: [], images: [], links: [] },
        { title: 'Thrifting', artwork: 'Carl Spitzweg - Der Stellwagen (street scene)', art: 'spitzweg.jpg', artAspect: 1.583, blurb: "I love thrifting and hunting for vintage finds. A lot of my wardrobe is secondhand.", photos: [], items: [], images: [], links: [] },
        { title: 'Restaurants & Food', artwork: 'Vincent van Gogh - Café Terrace at Night', art: 'cafeterrace.jpg', artAspect: 1.28, blurb: "I love trying new restaurants and exploring different food whenever I get the chance.", photos: [], items: [], images: [], links: [] },
        { title: 'Travel', artwork: 'J.M.W. Turner - The Fighting Temeraire', art: 'temeraire.jpg', artAspect: 0.743, blurb: "I love to travel and see new places. Exploring somewhere new is one of my favorite things to do.", photos: [], items: [], images: [], links: [] },
        { title: 'Hiking & Nature', artwork: 'Gustav Klimt - Beech Grove', art: 'beechforest.jpg', artAspect: 0.992, blurb: "I love hiking and being outdoors. Getting out into nature always resets me.", photos: [], items: [], images: [], links: [] },
      ],
    },
  },
  {
    id: 'licenses', title: 'Licenses, Certifications, and Speaker Series Events', wing: 'Licenses, Certifications & Speaker Series Wing', pos: [L, -33.5], yaw: YAW_L, sub: null,
    art: 'orrery.jpg', artAspect: 0.740,
    exhibit: {
      blurb: [
        "The D. E. Shaw group flew me to New York for Connect, their three day programme, and covered the flight and the hotel. We spent it at the Whitney Museum of American Art, meeting people from the firm and from the other cohorts.",
        "Three days of conversations in a museum is a strange and very good way to learn what a place is actually like, and it is the reason this room exists at all: most of what I have learned outside a classroom came from being in a room with people who knew more than me.",
        "Other speaker series I have attended:",
      ],
      items: ['Point72 Spring Academy Sessions', 'McKinsey Insight series'],
      why: "I chose A Philosopher Lecturing on the Orrery by Joseph Wright of Derby because it shows a room of people gathered around a speaker, lit up as they learn something new. That is exactly what these speaker series events feel like, and it fits a section about building knowledge and credentials.",
      images: [], links: [], artwork: 'Joseph Wright of Derby - A Philosopher Lecturing on the Orrery',
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
        // To offer the resume again: restore this line and drop the file at
        // public/assets/Abby_Kamenetsky_Resume.pdf. Nothing else to change.
        // { label: 'Resume', pdf: 'Abby_Kamenetsky_Resume.pdf' },
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
