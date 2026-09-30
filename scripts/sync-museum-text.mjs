// The museum page carries its own copy of the content, and it had drifted from
// src/data/museum.js, which CLAUDE.md names as the single source. Fifteen works
// had gone completely blank. This pushes the text across and touches nothing
// else: the image path, aspect ratio and artwork credit on the page stay put.
import fs from 'node:fs';
const PAGE='public/preview/index.html';
const m=await import('../src/data/museum.js');

const flat=(b)=>{
  if(!b) return [];
  const out=[];
  for(const part of (Array.isArray(b)?b:[b])){
    if(Array.isArray(part)) for(const li of part) out.push('· '+String(li).trim());
    else if(String(part).trim()) out.push(String(part).trim());
  }
  return out.map(t=>t.replace(/\{\{SOCIALS\}\}/g,'the Socials and Contact room'));
};
const mapLinks=(ls)=>(ls||[]).flatMap(l=>{
  if(l.emails) return l.emails.map(e=>({l:e.label+': '+e.addr,u:'mailto:'+e.addr}));
  if(l.pdf)    return [{l:l.label,u:'/assets/'+l.pdf}];
  if(l.url)    return [{l:l.label,u:l.url}];
  return [];
});

// Titles are the key between the two files, so a rename has to be declared here
// or the work silently stops matching and keeps its old text.
const RENAMES={'Gigamon - Global Program Office':'Gigamon - Product Management & Business Development',
               'Tech Showcase Parking App':'Serai - Driveway Parking Marketplace'};

// Her own photographs. These are hers, not the museum artwork, so they carry
// their own alt text and caption and render as snapshots rather than as a hung
// painting. An entry may be a bare path or {src, alt, caption}.
const mapPhotos=(ps)=>(ps||[]).map(p=>{
  const o = typeof p==='string' ? {src:p} : p;
  if(!o.src) return null;
  return {u:o.src, a:(o.alt||'').trim(), c:(o.caption||'').trim()};
}).filter(Boolean);

const src={};
for(const w of m.WINGS){
  const e=w.exhibit||{};
  const pack=(x)=>({blurb:flat(x.blurb),why:(x.why||'').trim(),
                    links:mapLinks(x.links),photos:mapPhotos(x.images)});
  if(e.pieces) for(const p of e.pieces) src[p.title]=pack(p);
  else src[w.title]=pack(e);
}

let html=fs.readFileSync(PAGE,'utf8');
const mm=html.match(/var DATA = (\{[\s\S]*?\});\n/);
const D=JSON.parse(mm[1]);
let filled=0, grew=0, shots=0, missed=[];
for(const r of D.ROOMS) for(const w of r.w){
  if(RENAMES[w.t]){ w.t=RENAMES[w.t]; }
  const s=src[w.t];
  if(!s){ missed.push(w.t); continue; }
  const before=(w.blurb||[]).length;
  if(s.blurb.length){ w.blurb=s.blurb; if(before===0) filled++; else if(s.blurb.length>before) grew++; }
  if(s.why) w.why=s.why;
  if(s.links.length) w.links=s.links;
  if(s.photos.length){ w.ph=s.photos; shots+=s.photos.length; }
}
html=html.replace(mm[0],'var DATA = '+JSON.stringify(D)+';\n');
fs.writeFileSync(PAGE,html);
console.log('  filled in from empty : '+filled);
console.log('  expanded             : '+grew);
console.log('  photographs placed   : '+shots);
if(missed.length) console.log('  no match in the source: '+missed.join(', '));
const empties=[]; for(const r of D.ROOMS) for(const w of r.w) if(!(w.blurb||[]).length) empties.push(w.t);
console.log('  still empty          : '+(empties.length?empties.join(', '):'none'));
