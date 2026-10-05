// The plain-text counterpart to the museum, generated from the same source so
// the two can never disagree. An interviewer told Abby the interactive version
// was hard to read quickly, which is a fair thing to say about a museum, so the
// front door now offers this instead: one page, no JavaScript, no 3D, readable
// in a minute and printable as a resume.
import fs from 'node:fs';
import path from 'node:path';
const m = await import('../src/data/museum.js');
const OUT = 'public/summary/index.html';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const clean = (s) => String(s).replace(/\{\{SOCIALS\}\}/g, 'the contact section');

// A blurb is a string, or a list of paragraphs where a nested array is a bullet
// list. Returns HTML blocks in order.
const blocks = (b) => {
  if (!b) return [];
  const out = [];
  for (const part of (Array.isArray(b) ? b : [b])) {
    if (Array.isArray(part)) {
      out.push('<ul>' + part.map(li => '<li>' + esc(clean(li)) + '</li>').join('') + '</ul>');
    } else if (String(part).trim()) {
      out.push('<p>' + esc(clean(part)) + '</p>');
    }
  }
  return out;
};

const linksOf = (ls) => (ls || []).flatMap(l => {
  if (l.emails) return l.emails.map(e => ({ label: e.addr, url: 'mailto:' + e.addr }));
  if (l.url) return [{ label: l.label, url: l.url }];
  return [];
});

const linkRow = (ls) => {
  const ln = linksOf(ls);
  if (!ln.length) return '';
  return '<p class="lk">' + ln.map(l =>
    `<a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`
  ).join('') + '</p>';
};

const chips = (xs, cls = 'chips') => (xs && xs.length)
  ? `<p class="${cls}">` + xs.map(x => `<span>${esc(x)}</span>`).join('') + '</p>'
  : '';

// Lead paragraph stays open; the rest folds into a native <details> so the page
// scans in a minute but still holds everything. No script required for either.
const entry = (p) => {
  const bs = blocks(p.blurb);
  const lead = bs.shift() || '';
  const rest = bs.join('');
  return `<article>
  <h3>${esc(p.title)}</h3>
  ${lead}
  ${rest ? `<details><summary>More detail</summary>${rest}</details>` : ''}
  ${chips(p.skills)}
  ${linkRow(p.links)}
</article>`;
};

const wing = (id) => m.WINGS.find(w => w.id === id);
const pieces = (id) => (wing(id).exhibit.pieces || []);

const section = (title, id, note = '') => `<section>
  <h2>${esc(title)}</h2>
  ${note ? `<p class="note">${esc(note)}</p>` : ''}
  ${pieces(id).map(entry).join('\n')}
</section>`;

const about = wing('about').exhibit;
const tech = wing('technical').exhibit;
const soft = wing('soft').exhibit;
const lic = wing('licenses').exhibit;
const contact = wing('contact').exhibit;

const contactLinks = linksOf(contact.links);

const skillList = (e) => (e.linkedItems || []).map(i => i.label);

const hobbies = pieces('hobbies').map(p => p.title).join(' · ');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Abby Kamenetsky &middot; Summary</title>
<meta name="description" content="Abigail (Abby) Kamenetsky: economics and computer science at the University of Chicago. Internships, research, projects, awards and leadership on one page.">
<link rel="canonical" href="https://portfolio.abbykamenetsky.com/summary/">
<meta name="theme-color" content="#0E120F">
<meta property="og:type" content="profile">
<meta property="og:title" content="Abby Kamenetsky &middot; Summary">
<meta property="og:description" content="Internships, research, projects, awards and leadership on one page.">
<meta property="og:url" content="https://portfolio.abbykamenetsky.com/summary/">
<style>
  :root{
    --ink:#E8E2D2; --dim:#A49C87; --faint:#7C755F;
    --bg:#0E120F; --card:#151B17; --rule:#2A332C;
    --gilt:#C9A24E; --giltHi:#E3C87E;
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
    --util:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--serif);
    font-size:17px;line-height:1.62;
    padding:0 20px env(safe-area-inset-bottom) 20px}
  .wrap{max-width:760px;margin:0 auto;padding:56px 0 90px}

  header.top{border-bottom:1px solid var(--rule);padding-bottom:26px;margin-bottom:10px}
  h1{font-size:clamp(30px,6vw,44px);font-weight:400;margin:0 0 6px;letter-spacing:.2px}
  .tag{color:var(--dim);margin:0 0 18px;font-size:16.5px}
  .meta{font-family:var(--util);font-size:12px;letter-spacing:.09em;text-transform:uppercase;
    color:var(--giltHi);margin:0 0 20px}

  .lk{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0 0}
  .lk a{font-family:var(--util);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--giltHi);text-decoration:none;border:1px solid #5B4C28;
    padding:11px 14px;border-radius:2px}
  .lk a:hover,.lk a:focus-visible{border-color:var(--gilt);background:#1D2219;color:#F2E3BC}

  nav.toc{margin:22px 0 0;display:flex;flex-wrap:wrap;gap:8px}
  nav.toc a{font-family:var(--util);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--dim);text-decoration:none;padding:9px 11px;border:1px solid var(--rule);border-radius:2px}
  nav.toc a:hover,nav.toc a:focus-visible{color:var(--giltHi);border-color:#5B4C28}

  section{margin:46px 0 0;scroll-margin-top:18px}
  h2{font-family:var(--util);font-size:12px;letter-spacing:.24em;text-transform:uppercase;
    color:var(--gilt);font-weight:400;margin:0 0 4px;
    padding-bottom:9px;border-bottom:1px solid var(--rule)}
  .note{color:var(--faint);font-size:14px;margin:10px 0 0}

  article{padding:22px 0;border-bottom:1px solid #1E2620}
  article:last-child{border-bottom:0}
  h3{font-size:20px;font-weight:400;margin:0 0 8px;color:#F1EADA;line-height:1.3}
  article p{margin:0 0 11px}
  article ul{margin:0 0 11px;padding-left:20px}
  article li{margin:0 0 4px}

  details{margin:2px 0 11px}
  summary{cursor:pointer;font-family:var(--util);font-size:11.5px;letter-spacing:.1em;
    text-transform:uppercase;color:var(--dim);padding:10px 0;list-style:none}
  summary::-webkit-details-marker{display:none}
  summary::before{content:"+ ";color:var(--gilt)}
  details[open] summary::before{content:"\\2212 "}
  summary:hover,summary:focus-visible{color:var(--giltHi)}
  details > *:not(summary){margin-top:0}

  .chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}
  .chips span{font-family:var(--util);font-size:11px;letter-spacing:.04em;color:var(--dim);
    border:1px solid var(--rule);padding:5px 9px;border-radius:2px}

  .plain{columns:2;column-gap:28px;margin:14px 0 0;padding-left:20px}
  .plain li{margin:0 0 5px;break-inside:avoid}
  @media (max-width:560px){.plain{columns:1}}

  footer{margin:58px 0 0;padding-top:24px;border-top:1px solid var(--rule);
    color:var(--faint);font-size:14px}
  footer a{color:var(--giltHi)}

  a:focus-visible,summary:focus-visible{outline:2px solid var(--gilt);outline-offset:3px}

  @media (pointer:coarse){
    nav.toc a,.lk a{padding:13px 15px}
    summary{padding:13px 0}
  }

  @media print{
    body{background:#fff;color:#000;font-size:11pt}
    .lk a,nav.toc{display:none}
    details{display:block}
    details > *:not(summary){display:block!important}
    summary{display:none}
    article{break-inside:avoid;border-bottom:1px solid #ccc}
    h2{color:#000;border-color:#999}
    h3{color:#000}
    .chips span{color:#444;border-color:#bbb}
  }
</style>
</head>
<body>
<main class="wrap">

<header class="top">
  <h1>Abigail Kamenetsky</h1>
  <p class="meta">Economics &amp; Computer Science &middot; University of Chicago</p>
  <p class="tag">${esc(clean(Array.isArray(about.blurb) ? about.blurb[1] || about.blurb[0] : about.blurb))}</p>
  <p class="lk">${contactLinks.map(l =>
    `<a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`
  ).join('')}</p>
  <nav class="toc" aria-label="Sections">
    <a href="#experience">Experience</a>
    <a href="#projects">Projects</a>
    <a href="#research">Research</a>
    <a href="#university">University</a>
    <a href="#awards">Awards</a>
    <a href="#leadership">Leadership</a>
    <a href="#skills">Skills</a>
  </nav>
</header>

<section id="experience">
  <h2>Experience</h2>
  ${pieces('professional').map(entry).join('\n')}
</section>

<section id="projects">
  <h2>Projects</h2>
  ${pieces('projects').map(entry).join('\n')}
</section>

<section id="research">
  <h2>Research</h2>
  ${pieces('research').map(entry).join('\n')}
</section>

<section id="university">
  <h2>University Programs &amp; Clubs</h2>
  ${pieces('uchicago').map(entry).join('\n')}
</section>

<section id="awards">
  <h2>Honors &amp; Awards</h2>
  ${pieces('awards').map(entry).join('\n')}
</section>

<section id="leadership">
  <h2>Leadership &amp; Activities</h2>
  ${pieces('leadership').map(entry).join('\n')}
</section>

<section id="skills">
  <h2>Skills</h2>
  <article>
    <h3>Technical</h3>
    <ul class="plain">${skillList(tech).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  </article>
  <article>
    <h3>Soft</h3>
    <ul class="plain">${skillList(soft).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  </article>
  ${(tech.coursework || []).length ? `<article>
    <h3>Relevant coursework</h3>
    <ul class="plain">${tech.coursework.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  </article>` : ''}
</section>

<section id="certifications">
  <h2>Certifications &amp; Speaker Series</h2>
  ${blocks(lic.blurb).join('')}
  ${(lic.items || []).length ? `<ul class="plain">${lic.items.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
</section>

<section id="interests">
  <h2>Interests</h2>
  <p>${esc(hobbies)}</p>
</section>

<footer>
  <p>This is the plain version. The same material is laid out as a walkable
  museum at <a href="/preview/">the interactive portfolio</a>, where every
  project hangs as a painting that opens.</p>
</footer>

</main>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

const n = ['professional', 'projects', 'research', 'uchicago', 'awards', 'leadership']
  .reduce((a, id) => a + pieces(id).length, 0);
console.log('  wrote ' + OUT);
console.log('  entries         : ' + n);
console.log('  technical skills: ' + skillList(tech).length);
console.log('  soft skills     : ' + skillList(soft).length);
console.log('  size            : ' + (html.length / 1024).toFixed(1) + 'KB');
