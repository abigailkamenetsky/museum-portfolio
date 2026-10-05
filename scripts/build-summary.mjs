// The plain-text counterpart to the museum, generated from the same source so
// the two can never disagree. An interviewer told Abby the interactive version
// was hard to read quickly, which is a fair thing to say about a museum, so the
// front door now offers this instead: one page, readable in a minute, and
// printable as a resume.
//
// It carries a small amount of script (filter, section tracking, expand all).
// All of it is an enhancement: every entry is in the HTML and open to a reader
// with no JavaScript, and the <details> folds are native either way.
import fs from 'node:fs';
import path from 'node:path';
const m = await import('../src/data/museum.js');
const OUT = 'public/summary/index.html';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const clean = (s) => String(s).replace(/\{\{SOCIALS\}\}/g, 'the contact links above');

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
  // The raw addresses ran to four rows of chips on a phone before any content.
  // Named, they fit on one, and the address is still in the href and the title.
  if (l.emails) return l.emails.map(e => ({
    label: e.label ? e.label + ' email' : 'Email', url: 'mailto:' + e.addr }));
  if (l.url) return [{ label: l.label, url: l.url }];
  return [];
});

const anchor = (l) =>
  `<a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`;

const linkRow = (ls) => {
  const ln = linksOf(ls);
  return ln.length ? '<p class="lk">' + ln.map(anchor).join('') + '</p>' : '';
};

const chips = (xs) => (xs && xs.length)
  ? '<p class="chips">' + xs.map(x => `<span>${esc(x)}</span>`).join('') + '</p>'
  : '';

// Lead paragraph stays open, the rest folds. The fold is a native <details>, so
// it works with the script switched off and it opens for printing.
const entry = (p) => {
  const bs = blocks(p.blurb);
  const lead = bs.shift() || '';
  const rest = bs.join('');
  const words = (p.blurb ? JSON.stringify(p.blurb) : '').split(/\s+/).length;
  return `<article>
  <h3>${esc(p.title)}</h3>
  ${lead}
  ${rest ? `<details><summary><span class="more">Read more</span><span class="less">Show less</span></summary>${rest}</details>` : ''}
  ${chips(p.skills)}
  ${linkRow(p.links)}
</article>`;
};

const wing = (id) => m.WINGS.find(w => w.id === id);
const pieces = (id) => (wing(id).exhibit.pieces || []);

const about = wing('about').exhibit;
const tech = wing('technical').exhibit;
const soft = wing('soft').exhibit;
const lic = wing('licenses').exhibit;
const contact = wing('contact').exhibit;
const contactLinks = linksOf(contact.links);
const skillList = (e) => (e.linkedItems || []).map(i => i.label);
const hobbies = pieces('hobbies').map(p => p.title);

const SECTIONS = [
  ['experience', 'Experience', 'professional'],
  ['projects', 'Projects', 'projects'],
  ['research', 'Research', 'research'],
  ['university', 'University', 'uchicago'],
  ['awards', 'Awards', 'awards'],
  ['leadership', 'Leadership', 'leadership'],
];

const body = SECTIONS.map(([id, label, wid]) => `<section id="${id}" data-label="${esc(label)}">
  <h2>${esc(label)} <b>${pieces(wid).length}</b></h2>
  ${pieces(wid).map(entry).join('\n')}
</section>`).join('\n');

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
    --ink:#EDE7D8; --dim:#ABA38D; --faint:#847C66;
    --bg:#0E120F; --bar:#0C100D; --rule:#2B342D; --hair:#1E2620;
    --gilt:#C9A24E; --giltHi:#E8CF89;
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
    --util:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box}
  [hidden]{display:none!important}
  html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--serif);
    font-size:18px;line-height:1.74;padding:0 20px}
  .wrap{max-width:720px;margin:0 auto;padding:46px 0 90px}

  h1{font-size:clamp(31px,6.4vw,46px);font-weight:400;margin:0 0 8px;letter-spacing:.2px;
    line-height:1.14}
  .meta{font-family:var(--util);font-size:12px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--giltHi);margin:0 0 20px}
  .tag{color:var(--dim);margin:0 0 20px;font-size:17px;max-width:60ch}

  .lk{display:flex;flex-wrap:wrap;gap:8px;margin:0}
  .lk a{font-family:var(--util);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--giltHi);text-decoration:none;border:1px solid #5B4C28;
    padding:11px 14px;border-radius:2px}
  .lk a:hover,.lk a:focus-visible{border-color:var(--gilt);background:#1D2219;color:#F5E8C4}

  /* The toolbar follows the reader: it says which section they are in and lets
     them filter the whole page down to what they actually came to check. */
  .bar{position:sticky;top:0;z-index:5;margin:30px 0 0;padding:12px 0 11px;
    background:var(--bar);border-bottom:1px solid var(--rule)}
  .bar::before{content:"";position:absolute;left:-20px;right:-20px;top:0;bottom:0;
    background:var(--bar);border-bottom:1px solid var(--rule);z-index:-1}
  .toc{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 9px}
  .toc a{font-family:var(--util);font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--faint);text-decoration:none;padding:8px 10px;border:1px solid transparent;
    border-radius:2px}
  .toc a:hover,.toc a:focus-visible{color:var(--giltHi)}
  .toc a[aria-current="true"]{color:var(--giltHi);border-color:#4B4026;background:#161B15}

  .tools{display:flex;gap:8px;align-items:center}
  #q{flex:1;min-width:0;font-family:var(--serif);font-size:15px;color:var(--ink);
    background:#121711;border:1px solid var(--rule);border-radius:2px;padding:11px 13px}
  #q::placeholder{color:var(--faint)}
  #q:focus{outline:none;border-color:#5B4C28}
  .tbtn{font-family:var(--util);font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--dim);background:#121711;border:1px solid var(--rule);border-radius:2px;
    padding:12px 13px;cursor:pointer;white-space:nowrap}
  .tbtn:hover,.tbtn:focus-visible{color:var(--giltHi);border-color:#4B4026}
  #count{font-family:var(--util);font-size:11px;color:var(--faint);margin:9px 0 0;min-height:1em}

  section{margin:44px 0 0;scroll-margin-top:124px}
  h2{font-family:var(--util);font-size:12px;letter-spacing:.24em;text-transform:uppercase;
    color:var(--gilt);font-weight:400;margin:0;padding-bottom:10px;
    border-bottom:1px solid var(--rule);display:flex;align-items:baseline;gap:9px}
  h2 b{font-weight:400;color:var(--faint);font-size:11px;letter-spacing:.1em}

  article{padding:28px 0;border-bottom:1px solid var(--hair)}
  article:last-child{border-bottom:0}
  h3{font-size:21px;font-weight:400;margin:0 0 10px;color:#F6EFDE;line-height:1.32}
  article p{margin:0 0 12px}
  article ul{margin:0 0 12px;padding-left:20px}
  article li{margin:0 0 6px}

  details{margin:0 0 12px}
  summary{cursor:pointer;font-family:var(--util);font-size:11px;letter-spacing:.1em;
    text-transform:uppercase;color:var(--dim);padding:9px 0;list-style:none;width:max-content}
  summary::-webkit-details-marker{display:none}
  summary::before{content:"+";color:var(--gilt);display:inline-block;width:1.1em}
  details[open] summary::before{content:"\\2212"}
  summary:hover,summary:focus-visible{color:var(--giltHi)}
  .less{display:none}
  details[open] .more{display:none}
  details[open] .less{display:inline}
  details > *:not(summary){margin-top:0}

  .chips{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0}
  .chips span{font-family:var(--util);font-size:11px;letter-spacing:.04em;color:var(--dim);
    border:1px solid var(--rule);padding:5px 9px;border-radius:2px}
  article .lk{margin:14px 0 0}

  .plain{columns:2;column-gap:30px;margin:14px 0 0;padding-left:20px}
  .plain li{margin:0 0 6px;break-inside:avoid}
  @media (max-width:560px){.plain{columns:1}}

  #empty{color:var(--faint);font-style:italic;margin:34px 0 0}
  .top{display:inline-block;margin:36px 0 0;font-family:var(--util);font-size:11px;
    letter-spacing:.1em;text-transform:uppercase;color:var(--faint);text-decoration:none}
  .top:hover,.top:focus-visible{color:var(--giltHi)}

  footer{margin:54px 0 0;padding-top:26px;border-top:1px solid var(--rule);
    color:var(--faint);font-size:15px}
  footer a{color:var(--giltHi)}

  a:focus-visible,summary:focus-visible,button:focus-visible,#q:focus-visible{
    outline:2px solid var(--gilt);outline-offset:3px}

  @media (pointer:coarse){
    .toc a{padding:11px 12px;font-size:11.5px}
    .lk a{padding:13px 15px}
    summary{padding:13px 0}
  }
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

  @media print{
    body{background:#fff;color:#000;font-size:10.5pt;padding:0}
    .bar,.lk,.top,#count{display:none}
    details[open] summary,summary{display:none}
    details > *:not(summary){display:block!important}
    article{break-inside:avoid;border-bottom:1px solid #ccc;padding:14px 0}
    section{margin:22px 0 0}
    h2{color:#000;border-color:#999}
    h3{color:#000}
    .chips span{color:#444;border-color:#bbb}
    footer{display:none}
  }
</style>
</head>
<body>
<main class="wrap">

<header>
  <h1>Abigail Kamenetsky</h1>
  <p class="meta">Economics &amp; Computer Science &middot; University of Chicago</p>
  <p class="tag">${esc(clean(Array.isArray(about.blurb) ? about.blurb[1] || about.blurb[0] : about.blurb))}</p>
  <p class="lk">${contactLinks.map(anchor).join('')}</p>
</header>

<div class="bar">
  <nav class="toc" aria-label="Sections">
    ${SECTIONS.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('')}
    <a href="#skills">Skills</a>
  </nav>
  <div class="tools">
    <input id="q" type="search" placeholder="Filter by keyword, e.g. python, nonprofit, machine learning" aria-label="Filter entries by keyword" autocomplete="off">
    <button type="button" class="tbtn" id="expand" aria-expanded="false">Expand all</button>
  </div>
  <p id="count" role="status" aria-live="polite"></p>
</div>

${body}

<section id="skills" data-label="Skills">
  <h2>Skills <b>${skillList(tech).length + skillList(soft).length}</b></h2>
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
  <article>
    <h3>Certifications &amp; speaker series</h3>
    ${blocks(lic.blurb).slice(0, 1).join('')}
    ${(lic.items || []).length ? `<ul class="plain">${lic.items.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
  </article>
  <article>
    <h3>Interests</h3>
    <p>${esc(hobbies.join(' · '))}</p>
  </article>
</section>

<p id="empty" hidden>Nothing matches that. Clear the filter to see everything again.</p>

<a class="top" href="#">Back to top</a>

<footer>
  <p>This is the quick version. The same material is laid out as a museum you
  walk through at <a href="/preview/">the interactive portfolio</a>, where every
  project hangs as a painting that opens.</p>
</footer>

</main>

<script>
(function(){
  var arts = [].slice.call(document.querySelectorAll('article'));
  var secs = [].slice.call(document.querySelectorAll('section'));
  var links = [].slice.call(document.querySelectorAll('.toc a'));
  var q = document.getElementById('q');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var expand = document.getElementById('expand');
  var total = arts.length;

  // Cache the searchable text once. Reading textContent per keystroke on a
  // thirty entry page is wasteful and makes typing feel heavy on a phone.
  arts.forEach(function(a){ a._t = a.textContent.toLowerCase(); });
  [].forEach.call(document.querySelectorAll('h2 b'), function(b){ b.dataset.total = b.textContent; });

  function filter(){
    var v = q.value.trim().toLowerCase();
    var shown = 0;
    arts.forEach(function(a){
      var hit = !v || a._t.indexOf(v) !== -1;
      a.hidden = !hit;
      if (hit) shown++;
    });
    secs.forEach(function(s){
      var n = s.querySelectorAll('article:not([hidden])').length;
      s.hidden = n === 0;
      // The heading count has to follow the filter, or a section reading
      // "Experience 4" while showing one entry is simply wrong.
      var b = s.querySelector('h2 b');
      if (b) b.textContent = v ? n : b.dataset.total;
    });
    empty.hidden = shown !== 0;
    count.textContent = v ? (shown + ' of ' + total + ' shown') : '';
    // An open fold is how you read a filtered hit, so open them while filtering.
    if (v) arts.forEach(function(a){
      if (!a.hidden) [].forEach.call(a.querySelectorAll('details'), function(d){ d.open = true; });
    });
  }
  q.addEventListener('input', filter);
  q.addEventListener('search', filter);

  expand.addEventListener('click', function(){
    var open = expand.getAttribute('aria-expanded') !== 'true';
    [].forEach.call(document.querySelectorAll('details'), function(d){ d.open = open; });
    expand.setAttribute('aria-expanded', String(open));
    expand.textContent = open ? 'Collapse all' : 'Expand all';
  });

  // Mark the section the reader is actually in.
  if ('IntersectionObserver' in window){
    var seen = {};
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestR = 0;
      Object.keys(seen).forEach(function(k){ if (seen[k] > bestR){ bestR = seen[k]; best = k; } });
      links.forEach(function(a){
        var on = best && a.getAttribute('href') === '#' + best;
        if (on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-130px 0px -55% 0px', threshold: [0, .1, .4, 1] });
    secs.forEach(function(s){ io.observe(s); });
  }
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

const n = SECTIONS.reduce((a, [, , id]) => a + pieces(id).length, 0);
console.log('  wrote ' + OUT);
console.log('  entries         : ' + n);
console.log('  technical skills: ' + skillList(tech).length);
console.log('  soft skills     : ' + skillList(soft).length);
console.log('  size            : ' + (html.length / 1024).toFixed(1) + 'KB');
