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

const src={};
for(const w of m.WINGS){
  const e=w.exhibit||{};
  if(e.pieces) for(const p of e.pieces) src[p.title]={blurb:flat(p.blurb),why:(p.why||'').trim(),links:mapLinks(p.links)};
  else src[w.title]={blurb:flat(e.blurb),why:(e.why||'').trim(),links:mapLinks(e.links)};
}

let html=fs.readFileSync(PAGE,'utf8');
const mm=html.match(/var DATA = (\{[\s\S]*?\});\n/);
const D=JSON.parse(mm[1]);
let filled=0, grew=0, missed=[];
for(const r of D.ROOMS) for(const w of r.w){
  const s=src[w.t];
  if(!s){ missed.push(w.t); continue; }
  const before=(w.blurb||[]).length;
  if(s.blurb.length){ w.blurb=s.blurb; if(before===0) filled++; else if(s.blurb.length>before) grew++; }
  if(s.why) w.why=s.why;
  if(s.links.length) w.links=s.links;
}
html=html.replace(mm[0],'var DATA = '+JSON.stringify(D)+';\n');
fs.writeFileSync(PAGE,html);
console.log('  filled in from empty : '+filled);
console.log('  expanded             : '+grew);
if(missed.length) console.log('  no match in the source: '+missed.join(', '));
const empties=[]; for(const r of D.ROOMS) for(const w of r.w) if(!(w.blurb||[]).length) empties.push(w.t);
console.log('  still empty          : '+(empties.length?empties.join(', '):'none'));
