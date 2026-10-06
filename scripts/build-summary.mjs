// The plain-text counterpart to the museum, generated from the same source so
// the two can never disagree. An interviewer told Abby the interactive version
// was hard to read quickly, which is a fair thing to say about a museum, so the
// front door offers this instead.
//
// Laid out after brittanychiang.com, which Abby picked: a sticky left rail
// carrying the name, the navigation and the links, against a right column that
// scrolls through the sections. The palette is hers, not the reference's teal
// on navy: the museum's own green ground, gilt and cream.
//
// The script here is an enhancement and nothing more. Every entry is in the
// HTML, the folds are native <details>, and the page reads and prints correctly
// with JavaScript switched off.
import fs from 'node:fs';
import path from 'node:path';
const m = await import('../src/data/museum.js');
const OUT = 'public/summary/index.html';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const clean = (s) => String(s).replace(/\{\{SOCIALS\}\}/g, 'the links in the sidebar');

const blocks = (b) => {
  if (!b) return [];
  const out = [];
  for (const part of (Array.isArray(b) ? b : [b])) {
    if (Array.isArray(part)) {
      out.push('<ul class="bul">' + part.map(li => '<li>' + esc(clean(li)) + '</li>').join('') + '</ul>');
    } else if (String(part).trim()) {
      out.push('<p>' + esc(clean(part)) + '</p>');
    }
  }
  return out;
};

const flatText = (b) => {
  const o = [];
  (function walk(x) {
    if (typeof x === 'string') o.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
  })(b);
  return o.join(' ');
};

// Dates are taken from Abby's own sentences and never invented. A piece may
// also declare `period` in museum.js, which always wins.
const periodOf = (p) => {
  if (p.period) return p.period;
  const ys = [...new Set((flatText(p.blurb).match(/\b(?:19|20)\d{2}\b/g) || []))].sort();
  if (!ys.length) return '';
  return ys[0] === ys[ys.length - 1] ? ys[0] : ys[0] + ' — ' + ys[ys.length - 1];
};

const linksOf = (ls) => (ls || []).flatMap(l => {
  if (l.emails) return l.emails.map(e => ({
    label: e.label ? e.label + ' email' : 'Email', url: 'mailto:' + e.addr }));
  if (l.url) return [{ label: l.label, url: l.url }];
  return [];
});

const ARROW = '<svg class="arw" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">' +
  '<path d="M6.22 4.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06-1.06L10.94 10 6.22 5.28a.75.75 0 0 1 0-1.06Z"/></svg>';

const pills = (xs) => (xs && xs.length)
  ? '<ul class="pills">' + xs.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>'
  : '';

const outLinks = (ls) => {
  const ln = linksOf(ls);
  return ln.length ? '<ul class="olinks">' + ln.map(l =>
    `<li><a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>` +
    `<span>${esc(l.label)}</span>${ARROW}</a></li>`).join('') + '</ul>' : '';
};

// A row is the reference's card: an aside on the left holding either the dates
// or the painting, and the body on the right. The whole row lifts on hover.
const row = (p, mode) => {
  const bs = blocks(p.blurb);
  const lead = bs.shift() || '';
  const rest = bs.join('');
  const per = periodOf(p);
  let aside = '';
  if (mode === 'date') {
    aside = `<header class="when">${per ? esc(per) : ''}</header>`;
  } else if (mode === 'art' && p.art) {
    aside = `<div class="shot"><img src="./thumb/${esc(p.art)}" alt="${esc(p.artwork || '')}" loading="lazy" decoding="async" width="240"></div>`;
  }
  const first = linksOf(p.links)[0];
  const title = first
    ? `<a href="${esc(first.url)}" target="_blank" rel="noopener" class="rlink">${esc(p.title)}${ARROW}</a>`
    : esc(p.title);
  return `<li class="row">
  ${aside}
  <div class="rbody">
    <h3>${title}</h3>
    ${mode !== 'date' && per ? `<p class="per">${esc(per)}</p>` : ''}
    ${lead}
    ${rest ? `<details><summary><span class="more">Read more</span><span class="less">Show less</span></summary>${rest}</details>` : ''}
    ${pills(p.skills)}
    ${outLinks(p.links)}
  </div>
</li>`;
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
const hobbies = pieces('hobbies');

const SECTIONS = [
  ['about', 'About', null, null],
  ['experience', 'Experience', 'professional', 'date'],
  ['projects', 'Projects', 'projects', 'art'],
  ['research', 'Research', 'research', 'art'],
  ['university', 'University', 'uchicago', 'art'],
  ['awards', 'Awards', 'awards', 'art'],
  ['leadership', 'Leadership', 'leadership', 'art'],
  ['skills', 'Skills', null, null],
  ['beyond', 'Beyond work', null, null],
];

// The rail already shows paragraph 1 (the UChicago line), so the About section
// must not repeat it. Everything else survives, in order.
const aboutBody = blocks(Array.isArray(about.blurb)
  ? about.blurb.filter((_, i) => i !== 1)
  : about.blurb).join('');

const sec = (id, label, inner) => `<section id="${id}" aria-label="${esc(label)}">
  <div class="shead"><h2>${esc(label)}</h2></div>
  ${inner}
</section>`;

const listSec = (id, label, wid, mode) =>
  sec(id, label, `<ol class="rows">${pieces(wid).map(p => row(p, mode)).join('\n')}</ol>`);

const skillsBlock = `<div class="panel">
  <h3>Technical</h3>${pills(skillList(tech))}
  <h3>Soft</h3>${pills(skillList(soft))}
  ${(tech.coursework || []).length ? `<h3>Relevant coursework</h3>${pills(tech.coursework)}` : ''}
</div>`;

const beyondBlock = `<div class="panel">
  <h3>Certifications &amp; speaker series</h3>
  ${blocks(lic.blurb).slice(0, 1).join('')}
  ${(lic.items || []).length ? pills(lic.items) : ''}
  <h3>Interests</h3>
  ${pills(hobbies.map(h => h.title))}
</div>`;

const bodyHtml = SECTIONS.map(([id, label, wid, mode]) => {
  if (id === 'about') return sec(id, label, `<div class="prose">${aboutBody}</div>`);
  if (id === 'skills') return sec(id, label, skillsBlock);
  if (id === 'beyond') return sec(id, label, beyondBlock);
  return listSec(id, label, wid, mode);
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Abby Kamenetsky &middot; Summary</title>
<meta name="description" content="Abigail (Abby) Kamenetsky: economics and computer science at the University of Chicago. Experience, projects, research, awards and leadership on one page.">
<link rel="canonical" href="https://portfolio.abbykamenetsky.com/summary/">
<meta name="theme-color" content="#0B0F0C">
<meta property="og:type" content="profile">
<meta property="og:title" content="Abby Kamenetsky &middot; Summary">
<meta property="og:description" content="Experience, projects, research, awards and leadership on one page.">
<meta property="og:url" content="https://portfolio.abbykamenetsky.com/summary/">
<style>
  :root{
    --bg:#0B0F0C; --ink:#F2ECDC; --body:#A49C86; --faint:#7B7460;
    --gilt:#C9A24E; --giltHi:#E8CF89;
    --card:rgba(201,162,78,.045); --ring:rgba(201,162,78,.13);
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
    --util:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box}
  [hidden]{display:none!important}
  html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--body);font-family:var(--serif);
    font-size:17px;line-height:1.7;-webkit-font-smoothing:antialiased}

  /* The reference's cursor spotlight, in gilt rather than teal. Pointer only. */
  #spot{position:fixed;inset:0;z-index:0;pointer-events:none;transition:opacity .3s;
    background:radial-gradient(600px at var(--mx,50%) var(--my,50%),rgba(201,162,78,.055),transparent 80%)}
  @media (pointer:coarse){#spot{display:none}}

  .page{position:relative;z-index:1;margin:0 auto;max-width:1152px;
    padding:0 24px env(safe-area-inset-bottom)}
  @media (min-width:1024px){
    .page{display:flex;justify-content:space-between;gap:16px}
    .rail{position:sticky;top:0;display:flex;flex-direction:column;justify-content:space-between;
      max-height:100vh;width:48%;padding:96px 0}
    .main{width:52%;padding:96px 0}
  }
  .rail{padding:72px 0 0}
  .main{padding:40px 0 64px}

  /* ── the rail ─────────────────────────────────────────────────────────── */
  h1{margin:0;font-size:clamp(34px,4.6vw,46px);font-weight:400;line-height:1.1;
    letter-spacing:.2px;color:var(--ink)}
  .role{margin:12px 0 0;font-size:18px;color:var(--ink)}
  .blurb{margin:16px 0 0;max-width:36ch;font-size:16px}
  .rail .rlinks{display:flex;flex-wrap:wrap;gap:7px;margin:26px 0 0;padding:0;list-style:none}
  .rail .rlinks a{display:inline-block;font-family:var(--util);font-size:11px;letter-spacing:.1em;
    text-transform:uppercase;color:var(--giltHi);text-decoration:none;
    border:1px solid rgba(201,162,78,.32);border-radius:999px;padding:9px 13px}
  .rail .rlinks a:hover,.rail .rlinks a:focus-visible{border-color:var(--gilt);background:rgba(201,162,78,.10)}

  nav.side{display:none;margin:56px 0 0}
  @media (min-width:1024px){nav.side{display:block}}
  nav.side ul{margin:0;padding:0;list-style:none}
  nav.side a{display:flex;align-items:center;gap:13px;padding:10px 0;text-decoration:none;
    font-family:var(--util);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--faint);transition:color .2s}
  nav.side .bar{display:block;height:1px;width:32px;background:#4A4433;transition:width .2s,background .2s}
  nav.side a:hover,nav.side a:focus-visible{color:var(--ink)}
  nav.side a:hover .bar,nav.side a:focus-visible .bar{width:64px;background:var(--ink)}
  nav.side a[aria-current="true"]{color:var(--giltHi)}
  nav.side a[aria-current="true"] .bar{width:64px;background:var(--giltHi)}

  .ralt{margin:34px 0 0;font-size:14.5px;color:var(--faint)}
  .ralt a{color:var(--giltHi)}

  /* ── sections ─────────────────────────────────────────────────────────── */
  section{margin:0 0 86px;scroll-margin-top:24px}
  section:last-of-type{margin-bottom:40px}
  .shead{position:sticky;top:0;z-index:4;margin:0 -24px 18px;padding:14px 24px;
    background:rgba(11,15,12,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  .shead h2{margin:0;font-family:var(--util);font-size:11.5px;letter-spacing:.24em;
    text-transform:uppercase;color:var(--ink);font-weight:400}
  @media (min-width:1024px){
    .shead{position:static;margin:0 0 14px;padding:0;background:none;backdrop-filter:none}
    .shead h2{color:var(--gilt)}
  }

  .prose p{margin:0 0 15px;max-width:62ch}
  .prose p:last-child{margin-bottom:0}

  .rows{margin:0;padding:0;list-style:none}
  .row{position:relative;display:grid;gap:4px 16px;padding:18px 0;
    grid-template-columns:1fr;transition:background .2s}
  @media (min-width:640px){.row{grid-template-columns:132px 1fr;gap:4px 20px;padding:22px 0}}
  /* The hover plate sits behind the row and bleeds past it, as in the reference,
     so the card reads as lifting rather than as a boxed-in panel. */
  .row::before{content:"";position:absolute;inset:-8px -18px;border-radius:5px;z-index:-1;
    background:transparent;transition:background .2s,box-shadow .2s}
  @media (hover:hover) and (min-width:640px){
    .rows:hover .row{opacity:.72;transition:opacity .2s}
    .rows:hover .row:hover{opacity:1}
    .row:hover::before{background:var(--card);box-shadow:inset 0 1px 0 0 var(--ring)}
  }
  .row:focus-within::before{background:var(--card);box-shadow:inset 0 1px 0 0 var(--ring)}

  .when{font-family:var(--util);font-size:11px;letter-spacing:.12em;text-transform:uppercase;
    color:var(--faint);padding-top:7px;white-space:nowrap}
  /* The paintings are portrait and landscape both, so an uncapped thumbnail
     makes every row a different height. Capped and contained, never cropped:
     these are artworks and half a painting is worse than a small one. */
  .shot{display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:3px;
    border:1px solid rgba(201,162,78,.16);background:#0E130F;align-self:start;
    width:132px;height:104px}
  .shot img{display:block;max-width:100%;max-height:100%;width:auto;height:auto}
  .per{margin:0 0 7px;font-family:var(--util);font-size:11px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--faint)}

  .rbody h3{margin:0 0 8px;font-size:18.5px;font-weight:400;color:var(--ink);line-height:1.34}
  .rlink{color:inherit;text-decoration:none}
  .row:hover .rlink,.rlink:focus-visible{color:var(--giltHi)}
  /* the heading link is the whole row's hit area, as in the reference */
  .rlink::after{content:"";position:absolute;inset:-8px -18px;z-index:1}
  .arw{display:inline-block;width:.72em;height:.72em;margin-left:.3em;vertical-align:baseline;
    transition:transform .2s}
  .rlink:hover .arw,.rlink:focus-visible .arw{transform:translate(2px,-2px)}
  .rbody p{margin:0 0 11px;font-size:15.5px;line-height:1.66}
  .rbody .bul{margin:0 0 11px;padding-left:19px}
  .rbody .bul li{margin:0 0 5px;font-size:15.5px}

  details{margin:0 0 11px;position:relative;z-index:2}
  summary{cursor:pointer;width:max-content;list-style:none;padding:7px 0;
    font-family:var(--util);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
    color:var(--faint)}
  summary::-webkit-details-marker{display:none}
  summary::before{content:"+";color:var(--gilt);display:inline-block;width:1.2em}
  details[open] summary::before{content:"\\2212"}
  summary:hover,summary:focus-visible{color:var(--giltHi)}
  .less{display:none}
  details[open] .more{display:none}
  details[open] .less{display:inline}

  .pills,.olinks{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 0;padding:0;list-style:none;
    position:relative;z-index:2}
  .pills li{font-family:var(--util);font-size:11px;letter-spacing:.03em;color:var(--giltHi);
    background:rgba(201,162,78,.10);border-radius:999px;padding:6px 11px;line-height:1.5}
  .olinks a{display:inline-flex;align-items:center;font-family:var(--util);font-size:11px;
    letter-spacing:.07em;text-transform:uppercase;color:var(--giltHi);text-decoration:none}
  .olinks a:hover span,.olinks a:focus-visible span{text-decoration:underline}

  .panel h3{margin:0 0 10px;font-size:15px;font-weight:400;color:var(--ink)}
  .panel h3 + .pills{margin:0 0 24px}
  .panel p{margin:0 0 12px;font-size:15.5px;max-width:62ch}

  footer{margin:0;padding:0 0 70px;font-size:13.5px;color:var(--faint);max-width:56ch}
  footer a{color:var(--giltHi)}

  a:focus-visible,summary:focus-visible{outline:2px solid var(--gilt);outline-offset:3px}

  /* Sized for a thumb, not a pointer. The row headings look small here too but
     their hit area is the whole row (.rlink::after), so they are left alone. */
  @media (pointer:coarse){
    .rail .rlinks a{padding:12px 15px}
    summary{padding:13px 0}
    .olinks a{padding:13px 0}
    nav.side a{padding:12px 0}
  }
  @media (prefers-reduced-motion:reduce){
    html{scroll-behavior:auto}
    *{transition:none!important}
  }

  @media print{
    #spot{display:none}
    body{background:#fff;color:#000;font-size:10.5pt}
    .page{display:block;max-width:none;padding:0}
    .rail,.main{width:auto;padding:0}
    nav.side,.rail .rlinks,.shot,.olinks{display:none}
    .shead{position:static;margin:0 0 8px;padding:0;background:none}
    .shead h2{color:#000}
    section{margin:0 0 18px}
    .row{grid-template-columns:90px 1fr;padding:10px 0;break-inside:avoid}
    .row::before{display:none}
    summary{display:none}
    details > *:not(summary){display:block!important}
    .rbody h3{color:#000}
    .pills li{color:#444;background:none;border:1px solid #bbb}
    footer{display:none}
  }
</style>
</head>
<body>
<div id="spot" aria-hidden="true"></div>
<div class="page">

  <header class="rail">
    <div>
      <h1>Abigail Kamenetsky</h1>
      <p class="role">Economics &amp; Computer Science at the University of Chicago</p>
      <p class="blurb">${esc(clean(Array.isArray(about.blurb) ? about.blurb[1] || about.blurb[0] : about.blurb))}</p>
      <nav class="side" aria-label="Sections">
        <ul>
          ${SECTIONS.map(([id, label]) =>
            `<li><a href="#${id}"><span class="bar"></span>${esc(label)}</a></li>`).join('\n          ')}
        </ul>
      </nav>
    </div>
    <div>
      <ul class="rlinks">
        ${contactLinks.map(l =>
          `<li><a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a></li>`).join('\n        ')}
      </ul>
      <p class="ralt">Prefer the long way round? The same material is a museum you walk through at <a href="/preview/">the interactive portfolio</a>.</p>
    </div>
  </header>

  <main class="main" id="content">
${bodyHtml}
    <footer>
      <p>Built from one source file, so this page and the museum always say the
      same thing. Set in Iowan Old Style, deployed on GitHub Pages.</p>
    </footer>
  </main>

</div>

<script>
(function(){
  var spot = document.getElementById('spot');
  if (spot && matchMedia('(pointer:fine)').matches){
    addEventListener('pointermove', function(e){
      spot.style.setProperty('--mx', e.clientX + 'px');
      spot.style.setProperty('--my', e.clientY + 'px');
    }, {passive:true});
  }
  var links = [].slice.call(document.querySelectorAll('nav.side a'));
  var secs = [].slice.call(document.querySelectorAll('main section'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var ratio = {};
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ ratio[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
    var best = null, top = 0;
    Object.keys(ratio).forEach(function(k){ if (ratio[k] > top){ top = ratio[k]; best = k; } });
    links.forEach(function(a){
      if (best && a.getAttribute('href') === '#' + best) a.setAttribute('aria-current','true');
      else a.removeAttribute('aria-current');
    });
  }, { rootMargin: '-10% 0px -55% 0px', threshold: [0, .1, .4, 1] });
  secs.forEach(function(s){ io.observe(s); });
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

const n = SECTIONS.filter(s => s[2]).reduce((a, s) => a + pieces(s[2]).length, 0);
console.log('  wrote ' + OUT);
console.log('  sections : ' + SECTIONS.length);
console.log('  entries  : ' + n);
console.log('  size     : ' + (html.length / 1024).toFixed(1) + 'KB');
