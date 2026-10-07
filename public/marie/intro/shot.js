import * as THREE from 'three';
import { GLTFLoader } from '/marie/vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from '/marie/vendor/loaders/DRACOLoader.js';

/* ── the shot ──────────────────────────────────────────────────────────────
   A  0.00-tap   stable, fully framed bust. drag orbits the camera; she never moves.
   B  0.00-0.34  anticipation: she settles back before letting go
   C  0.34-0.92  the fall, accelerating under gravity
   D  0.92       impact
   E-G 0.92+     the Blender bake breaks; the Mantaflow dust plays over it
   H  swap behind the dust, then the title through the clearing haze

   Every number below is derived from measured geometry or stated once here.
   Nothing is a magic pixel value.                                          */
const FOV       = 40;
const FILL      = 0.38;   // she is the whole subject here, not one work on a wall
const HEADROOM  = 0.10;   // above her crown at rest; the rest is room to fall into
const T_EASE    = 0.11;
const T_FALL    = 0.52;   // matches real gravity at bust scale
const T_IMPACT  = T_EASE + T_FALL;
const DROP      = 1.25;   // multiples of bust height
const DUST_RATE = 1.18;   // play the dust at the same tightened pace
const SWAP_AT   = 0.92;   // seconds after impact: peak obscuration
const TITLE_AT  = 1.16;
const DUR       = 3.20;
// The shot used to end on a still of the hall and a title card. It now hands
// over inside the cloud, at peak obscuration, so the museum's own home screen
// is what emerges from the dust: map, cassette, copy and all.
const NEXT      = '/preview/';   // must match the prefetch exactly
// Measured off the clip itself: the cloud is 99.7% opaque at 1.32s and a full
// 100% from 1.35s of its 1.80s. Cutting on the wall clock instead flashed,
// because a buffering video left the screen dark at the moment of the cut
// while the next page opened bright.
const PEAK_VT   = 1.40;
const NAV_FLOOR = T_IMPACT + 0.50;   // never cut before the break reads
const NAV_LIMIT = 2.55;              // < DUR, or the shot ends first and never hands over

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEV = new URLSearchParams(location.search).has('dev')
  || new URLSearchParams(location.search).has('t');
const AUTONAV = !DEV && !REDUCED;
// ?auto=1 runs the shot as soon as it is ready. Needed to test on devices and
// simulators where a synthetic tap is not available.
const AUTOSTART = new URLSearchParams(location.search).has('auto');

let handedOver = false, museumStarted = false;
const R = new THREE.WebGLRenderer({antialias:true});
// 1.5 rather than 2: on a Retina panel the full ratio quadruples the pixels
// under 117 shadow-casting shards for a difference you cannot see on a dark
// marble bust. This is the single biggest frame cost here.
R.setPixelRatio(Math.min(devicePixelRatio,1.5)); R.setSize(innerWidth,innerHeight);
R.setClearColor(0x000000,1); R.toneMapping=THREE.ACESFilmicToneMapping;
R.shadowMap.enabled=true; R.shadowMap.type=THREE.PCFSoftShadowMap;
// Nothing moves until the tap, so re-rendering the shadow map every frame
// while the visitor is just orbiting is pure waste.
R.shadowMap.autoUpdate=false;
R.domElement.tabIndex=0;
R.domElement.setAttribute('role','button');
R.domElement.setAttribute('aria-label','Marie Antoinette bust. Activate to shatter it and enter the museum.');
document.body.appendChild(R.domElement);

const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(FOV,innerWidth/innerHeight,0.02,120);
scene.add(new THREE.AmbientLight(0x33343a,0.75));
const key=new THREE.DirectionalLight(0xfff8ef,2.4); key.position.set(-1.4,1.2,1.6);
key.castShadow=true; key.shadow.mapSize.set(1024,1024);
key.shadow.radius=3; key.shadow.bias=-0.0004; key.shadow.normalBias=0.035;  // acne
scene.add(key);
const fill=new THREE.DirectionalLight(0xd8e4ff,0.5); fill.position.set(1.6,0.2,1.0); scene.add(fill);
const rim=new THREE.DirectionalLight(0xfff2dd,1.3); rim.position.set(0.8,0.9,-1.7); scene.add(rim);
// the intact mesh and the shards are different geometry, so the swap is a hard
// cut. a brief bloom across it reads as the impact rather than as a pop.
const flash=new THREE.PointLight(0xfff0d8,0,9); scene.add(flash);
// bounce off the floor, rising as she closes on it
const bounce=new THREE.PointLight(0xffeedd,0,6); scene.add(bounce);
const marble=new THREE.MeshPhysicalMaterial({
  color:0xdcd8d1, roughness:0.46, metalness:0.0, vertexColors:true,
  clearcoat:0.08, clearcoatRoughness:0.75,
  sheen:0.24, sheenColor:new THREE.Color(0xfffaf0), sheenRoughness:0.85,
});

function radialTex(stops){
  const c=document.createElement('canvas'); c.width=c.height=256;
  const g=c.getContext('2d'), rg=g.createRadialGradient(128,128,0,128,128,128);
  for(const [o,col] of stops) rg.addColorStop(o,col);
  g.fillStyle=rg; g.fillRect(0,0,256,256); return new THREE.CanvasTexture(c);
}
const floorMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),
  new THREE.MeshStandardMaterial({map:radialTex([[0,'rgba(150,140,125,.80)'],
    [0.42,'rgba(66,60,52,.30)'],[1,'rgba(0,0,0,0)']]),transparent:true,depthWrite:false,
    opacity:0,roughness:0.9,metalness:0}));
floorMesh.rotation.x=-Math.PI/2; floorMesh.receiveShadow=true; scene.add(floorMesh);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(1,1),
  new THREE.MeshBasicMaterial({map:radialTex([[0,'rgba(0,0,0,.85)'],
    [0.55,'rgba(0,0,0,.32)'],[1,'rgba(0,0,0,0)']]),transparent:true,depthWrite:false,opacity:0}));
contact.rotation.x=-Math.PI/2; scene.add(contact);

// two encodes because only Safari does HEVC alpha and only Chrome/Firefox VP9 alpha
const dv=document.getElementById('dustvid');
let vidReady=false, vidDur=1.83, dustUsable=true, alphaChecked=false;
// A safety net, not a workaround for a known fault. HEVC alpha DOES composite
// correctly on iOS: an earlier probe said otherwise, but it read the frame 1.4s
// into a 1.8s clip, where the cloud is legitimately at full coverage, and
// mistook "fully covered" for "opaque". This samples early, where the clip
// really is mostly transparent, and only drops the dust on a browser that
// genuinely cannot composite it, since no dust reads better than a grey slab.
function checkDustAlpha(){
  if(alphaChecked) return; alphaChecked=true;
  try{
    if(!dv.videoWidth) { alphaChecked=false; return; }
    const c=document.createElement('canvas'); c.width=40; c.height=22;
    const g=c.getContext('2d',{willReadFrequently:true});
    g.clearRect(0,0,40,22); g.drawImage(dv,0,0,40,22);
    const d=g.getImageData(0,0,40,22).data;
    let clear=0; for(let i=3;i<d.length;i+=4) if(d[i]<200) clear++;
    dustUsable = clear > (40*22*0.08);
    if(!dustUsable){ dv.style.display='none'; dv.style.opacity='0'; }
  }catch(_){}
}
const DUST_SRC = dv.canPlayType('video/mp4; codecs="hvc1"')!==''
  ? '/marie/intro/dust_hevc.mp4' : '/marie/intro/dust_vp9.webm';
dv.addEventListener('loadedmetadata',()=>{ if(dv.duration) vidDur=dv.duration; });
dv.addEventListener('canplay',()=>{
  vidReady=true; readyCheck();
  // spin the decoder up while she is still standing there. Cold-starting it at
  // the moment of impact is what put a hitch right on the break.
  try{
    dv.play().then(()=>{
      setTimeout(()=>{ if(state==='IDLE'){ dv.pause(); dv.currentTime=0; } }, 260);
    }).catch(()=>{});
  }catch(_){}
},{once:true});
// belt and braces: if the browser is coy about canplay, accept enough buffer
setInterval(()=>{ if(!vidReady && dv.readyState>=3){ vidReady=true; readyCheck(); } },400);
dv.addEventListener('error',()=>{ vidReady=false; readyCheck(); });

// A bare "loading" for twenty seconds on a slow line is indistinguishable from
// a broken page. Report real bytes instead.
// Count only what actually holds the tap back. sim.glb is the biggest file of
// the three and it is deliberately loaded after the bust, so including it made
// the number crawl and then park: bust plus dust complete at exactly 48% of the
// old total, which is the "frozen at 45%" Abby reported. The percentage now
// reaches 100 at the moment the statue becomes tappable, which is what it was
// always meant to say.
const WEIGHT = { bust:676892,
                 dust: /hevc/.test(DUST_SRC) ? 628000 : 1265722 };
const TOTAL = WEIGHT.bust + WEIGHT.dust;
const got = { sim:0, bust:0, dust:0 };
let progTimer = setInterval(showProgress, 180);
function showProgress(){
  if(canRun()){ clearInterval(progTimer); return; }
  try{
    if(dv.buffered.length){
      const frac = dv.buffered.end(dv.buffered.length-1) / (dv.duration || vidDur);
      got.dust = Math.min(WEIGHT.dust, WEIGHT.dust * frac);
    }
  }catch(_){}
  const pct = Math.min(99, Math.round(100*(got.bust+got.dust)/TOTAL));
  elHint.textContent = (got.bust>=WEIGHT.bust*0.98 && !bustReady)
    ? 'unpacking the marble\u2026'
    : 'preparing the gallery \u00b7 ' + pct + '%';
}

let armCapped=false, capTimer=null;
// One definition, used by the hint, the progress line, the tap, the key and the
// replay button. They each used to test the video separately, so capping the
// wait in one of them left the others still stuck.
function canRun(){ return bustReady; }
function readyCheck(){
  const models = bustReady;
  // iOS ignores preload on video: Safari will not buffer one until a gesture,
  // so canplay never fires AND error never fires. This gate simply never opened
  // and the progress sat frozen forever. Abby saw it stop at 45% on her phone.
  // Wait a bounded time for the dust, then let her in regardless; the tap is
  // itself the gesture that gets the video going.
  if(state!=='IDLE') return;   // the shot has begun; never put the hint back
  if(models){
    elHint.textContent='drag to look \u00b7 tap to shatter';
    startMuseum();
    elHint.classList.add('in');
    if(AUTOSTART && state==='IDLE'){ setTimeout(()=>{ if(state==='IDLE') start(); }, 900); }
  }
}

let intact=null, shards=null, mixer=null, simDur=1;
let bustH=1, bustMinY=0, ORB=5;
let state='IDLE', t=0, az=0, el=0.05, dragAmt=0, t0=0, dirty=true, dustOn=false;
let az0=0, el0=0.05;                 // where the orbit was when it started
const HOME=0.34;                     // seconds to bring the view home
const EL_MIN=-1.1, EL_MAX=1.25;

const draco=new DRACOLoader(); draco.setDecoderPath('/marie/vendor/draco/');
// The shatter is 117 separate meshes, so it is 117 separate Draco decodes, and
// the default pool of four workers makes them queue. Measured: the file landed
// at 5.5s and did not finish decoding until 13.6s.
draco.setWorkerLimit(Math.max(4, Math.min(16, (navigator.hardwareConcurrency||4))));
draco.preload();   // otherwise it is fetched only once a model needs decoding
const L=new GLTFLoader(); L.setDRACOLoader(draco);
const hud=document.getElementById('hud');
const elHint=document.getElementById('hint'), elRev=document.getElementById('reveal');
const elEnter=document.getElementById('renter');
const elMus=document.getElementById('museum');
const elHaze=document.getElementById('haze');
// The readout and scrubber are for working on the shot, not for visiting it.
if(DEV){ document.getElementById('hud').hidden=false;
         document.getElementById('tl').classList.remove('hide'); }
const elTitle=document.getElementById('rtitle'), elSub=document.getElementById('rsub');
const elTn=document.getElementById('tn'), elSc=document.getElementById('sc');
const elHall=document.getElementById('hall');
// 137KB that only the dev ending ever shows, but which used to compete with
// the bust for bandwidth on every single visit.
if(DEV) elHall.style.backgroundImage="url('/marie/intro/hall.jpg')";
let lastTn='', lastSc=-1, vidGeom='';
const ease=(x)=>1-Math.pow(1-x,3), accel=(x)=>x*x;

// The two models used to load one inside the other, so the 677KB bust did not
// start downloading until the 1.68MB sim had finished. They are independent
// fetches; only the assembly below needs both.
// The bust used to wait for the 1.4MB shatter file before it could be drawn,
// so the screen stayed black for seven seconds behind a progress number.
// Framing is taken from whichever model lands first and the other is scaled
// to match, so the bust appears the moment its own 646KB arrives.
let simReady=false, bustReady=false, shardCount=0, framed=false;
// The impact lights were tuned against a two unit bust. Framing now comes from
// whichever model lands first, so bustH can be one, which halved every light
// distance and, by inverse square, made the impact four times brighter: on a
// phone the statue blew out to pure white and the break was invisible inside
// it. Scale the distances and the intensities with the model instead.
let LS=1, LS2=1;

function frameFrom(h, minY){
  bustH=h; bustMinY=minY;
  ORB = bustH/(2*FILL*Math.tan(THREE.MathUtils.degToRad(FOV/2)));
  const sc=key.shadow.camera, r=bustH*2.2;
  sc.left=-r; sc.right=r; sc.top=r; sc.bottom=-r;
  sc.near=0.1; sc.far=bustH*14; sc.updateProjectionMatrix();
  LS = bustH/2; LS2 = LS*LS;
  flash.distance  = 9*LS;
  bounce.distance = 6*LS;
  key.position.set(-bustH*0.9, bustMinY+bustH*2.4, bustH*1.1);
  key.target.position.set(0,bustMinY,0);
  if(!key.target.parent) scene.add(key.target);
  framed=true;
}

function warmPipeline(){
  try{
    if(shards) shards.visible=true;
    if(intact) intact.visible=true;
    R.compile(scene, cam);
    R.shadowMap.needsUpdate=true;
    R.render(scene, cam);
    if(shards) shards.visible=false;
  }catch(_){}
}

L.load('/marie/intro/marie_lite.glb',(gi)=>{
  const ib=new THREE.Box3().setFromObject(gi.scene), ic=new THREE.Vector3(); ib.getCenter(ic);
  const h=ib.max.y-ib.min.y;
  if(!framed) frameFrom(h, 0);
  gi.scene.position.sub(ic);
  intact=new THREE.Group(); intact.add(gi.scene);
  intact.scale.setScalar(bustH/h);
  gi.scene.position.y += (ic.y-ib.min.y);        // feet at the group origin
  intact.position.y = bustMinY;
  intact.traverse(o=>{ if(o.isMesh){ o.material=marble; o.castShadow=true; } });
  scene.add(intact);
  bustReady=true; warmPipeline(); readyCheck(); dirty=true;
  // Order matters on a slow line. The statue is up and tappable, so now fetch
  // what the impact will need: the dust first, it is wanted before the shards.
  setTimeout(()=>{ startDust(); loadRest(); }, 0);
},(e)=>{ got.bust=e.loaded||0; },(e)=>{hud.textContent='FAILED '+e;});

// All three download together; the bust is the smallest so it lands first and
// gets drawn while the other two are still arriving.
// The museum builds ten rooms and forty works synchronously, and it does that
// on this page's main thread. Measured: starting it at page load pushed the
// bust's own load callback from 1.8s out to 14.5s, so the bust could not be
// tapped for fifteen seconds. It now starts the moment the shot is tappable,
// which gives it all the time she is being looked at, and the uncover already
// waits for it with the haze up if it is still building.
function startMuseum(){
  if(!AUTONAV || museumStarted) return;
  museumStarted=true; elMus.src=NEXT;
}

// The dust is a video, so it costs the main thread nothing: start it now.
// The dust is 1.2MB and was racing the bust for the connection from the
// moment of the choice. It starts once the statue is actually on screen.
function startDust(){ if(startDust.done) return; startDust.done=true;
  dv.src = DUST_SRC; try{ dv.load(); }catch(_){} }

// The shatter is 117 meshes and 117 animation clips, and parsing that occupies
// the main thread for long enough to delay the bust's own load callback. Loaded
// alongside the bust it held arming back to seventeen seconds even after the
// tap stopped requiring it. It starts once the bust is on screen instead, and
// has all the time she is being looked at to finish.
function loadRest(){
  if(loadRest.done) return; loadRest.done=true;
  L.load('/marie/sim/sim.glb',(g)=>{
    shards=g.scene; shards.visible=false; scene.add(shards);
    let n=0; shards.traverse(o=>{ if(o.isMesh){ o.material=marble; o.castShadow=true; n++; } });
    mixer=new THREE.AnimationMixer(shards); simDur=0;
    for(const cl of g.animations){ const a=mixer.clipAction(cl);
      a.loop=THREE.LoopOnce; a.clampWhenFinished=true; a.play();
      simDur=Math.max(simDur,cl.duration); }
    mixer.setTime(0); shards.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(shards);
    const sh=b.max.y-b.min.y;
    if(!framed){ frameFrom(sh, b.min.y); }
    else {
      // match the bust already on screen, uniformly, so the shot is unchanged
      shards.scale.setScalar(bustH/sh);
      shards.updateMatrixWorld(true);
      const b2=new THREE.Box3().setFromObject(shards);
      shards.position.y += (bustMinY - b2.min.y);
    }
    shardCount=n; simReady=true;
    hud.innerHTML='<b>shards</b> '+shardCount+'<br><b>bust</b> '+bustH.toFixed(2)+'u<br><b>orbit</b> '+
      ORB.toFixed(2)+'u<br><b>drop</b> '+T_IMPACT.toFixed(2)+'s<br><b>fps</b> <span id="fps">--</span>';
    warmPipeline(); readyCheck(); dirty=true;
  },(e)=>{ got.sim=e.loaded||0; },(e)=>{hud.textContent='FAILED '+e;});
}

function sync(){
  const running = state!=='IDLE';
  // The shatter may still be decoding if she was tapped the instant the bust
  // appeared. Hold her on the floor rather than breaking into nothing.
  if(state==='RUN' && !simReady && t>T_IMPACT){ t=T_IMPACT; t0=performance.now()-T_IMPACT*1000; }
  const hit = running && t>=T_IMPACT;
  const ta = Math.max(0, t-T_IMPACT);

  // ── where she is ───────────────────────────────────────────────────────
  let lift = DROP*bustH;
  if(running && !hit){
    if(t<T_EASE) lift = DROP*bustH - ease(t/T_EASE)*0.02*bustH;   // sags, never rises
    else lift = (DROP*bustH-0.02*bustH) * (1-accel((t-T_EASE)/T_FALL));
  } else if(hit) lift = 0;

  const fallK = running ? Math.max(0, Math.min(1,(t-T_EASE)/T_FALL)) : 0;
  const tipK  = running ? Math.max(0, Math.min(1, t/T_EASE)) : 0;
  const TILT  = 0.085;                       // ~5 degrees by the time she lands
  // she goes over because she tips past her balance point: the lean starts in
  // the beat before the drop, so that beat is anticipation rather than a pause
  const tilt  = TILT*(0.22*tipK*tipK + 0.78*fallK*fallK);
  if(intact){
    intact.position.y = bustMinY + lift;
    intact.rotation.z = tilt;
    intact.rotation.x = tilt*0.35;
    intact.visible = !hit;
  }
  if(shards){
    shards.visible = hit;
    // land at the attitude she fell in, then let the pile settle level
    const rel = hit ? Math.max(0,1-ta/0.7) : 1;
    // settling stone jolts rather than glides; the wobble decays with the pile
    const j = hit ? Math.exp(-ta*5.5)*0.012 : 0;
    shards.rotation.z = TILT*rel + Math.sin(ta*41)*j;
    shards.rotation.x = TILT*0.35*rel + Math.cos(ta*33)*j;
  }

  // the ground resolves as she nears it, so the drop has a destination
  const near = 1 - Math.min(1, lift/(DROP*bustH||1));
  const fs = bustH*7;
  floorMesh.scale.set(fs,fs,fs); floorMesh.position.set(0,bustMinY-0.002,0);
  floorMesh.material.opacity = running ? 0.05 + Math.min(0.46, near*near*0.55) + (hit?0.14:0) : 0.05;
  const cs = bustH*(2.1-near*1.05) * (hit ? 1+Math.min(0.5,ta*0.35) : 1);  // spreads with the debris
  contact.scale.set(cs,cs,cs); contact.position.set(0,bustMinY+0.004,0);
  contact.material.opacity = running
    ? Math.min(0.34, near*near*0.42) * (hit ? Math.max(0.30,1-ta*0.5) : 1) : 0;

  // ── the camera frames her, wherever she is ─────────────────────────────
  // solve the aim so her crown sits HEADROOM below the top edge
  if(running){                          // travel back to the front, do not cut
    const hk=Math.min(1, t/HOME), he=hk*hk*(3-2*hk);
    az = az0*(1-he);
    el = el0 + (0.05-el0)*he;
  }
  const frameH = 2*ORB*Math.tan(THREE.MathUtils.degToRad(FOV/2));
  // A fully locked camera could not hold her: she falls 57% of the frame from
  // 17% of headroom, so she left the bottom edge and the post-impact settle
  // then hauled her back up and larger - which is what read as glitching.
  // The camera follows part of the descent instead, so the fall still shows as
  // relative motion but she stays in shot and the settle is small.
  const crown   = bustMinY + lift + bustH;
  const aimRest = (bustMinY + DROP*bustH + bustH) - frameH*(0.5-HEADROOM);
  const aimTrack= crown - frameH*(0.5-HEADROOM);
  const FOLLOW  = 0.25;                       // it lags, so the drop still reads
  // The camera simply stops where the fall left it. Any post-impact move
  // drifts the wreck back up the frame, and after a descent that reads as a
  // bounce - which is the thing that kept looking like a glitch.
  const aimLanded = aimRest + ((bustMinY + bustH) - frameH*(0.5-HEADROOM) - aimRest)*FOLLOW;
  const aimY    = hit ? aimLanded : aimRest + (aimTrack-aimRest)*FOLLOW;
  cam.position.set(
    ORB*Math.cos(el)*Math.sin(az),
    aimY + ORB*Math.sin(el),
    ORB*Math.cos(el)*Math.cos(az));
  let shake=0;
  if(hit && ta<0.18){ const k=1-ta/0.18; shake=k*k*0.03*bustH; }   // felt, not seen
  cam.position.x += Math.sin(ta*118)*shake*0.28;   // the impulse is vertical
  cam.position.y += Math.cos(ta*104)*shake;
  cam.lookAt(0,aimY,0);

  // ── the break ──────────────────────────────────────────────────────────
  if(mixer && hit) mixer.setTime(Math.min(ta+0.05,simDur));   // enter already moving
  bounce.position.set(0, bustMinY+bustH*0.10, bustH*0.35);
  bounce.intensity = (running ? near*near*1.5 + (hit?Math.max(0,1-ta*1.2)*0.8:0) : 0) * LS2;
  flash.position.set(0,bustMinY+bustH*0.25,bustH*0.3);
  flash.intensity = (hit ? Math.max(0,1-ta/0.10)*1.6 : 0) * LS2;   // floor bounce, not a spark

  // ── the dust ───────────────────────────────────────────────────────────
  // the clip is shorter than the shot, so it must fade out rather than hold
  // its final fully-covered frame on screen for the rest of the sequence
  if(vidReady){
    // put the clip's ground line on the projected impact point, and size it to
    // the bust, so the cloud rises from the wreck rather than the screen edge
    const ip=new THREE.Vector3(0,bustMinY,0).project(cam);
    const py=(1-ip.y)/2*innerHeight;
    const top=new THREE.Vector3(0,bustMinY+bustH,0).project(cam);
    const bustPx=Math.abs((1-top.y)/2*innerHeight - py);
    // Derived from the render camera in dustsim.py rather than guessed: that
    // camera sat 4.75 units back and 0.95 above the floor at 40 degrees, so a
    // 2-unit bust occupies 58% of the clip's height and the floor line sits
    // 77.5% down it. Sizing it any other way makes the cloud a separate object.
    // The element keeps a FIXED size and grows via transform. Animating width
    // and height meant writing layout properties on every single frame, which
    // forces a reflow of a large video element sixty times a second - the same
    // trap as before, reintroduced by making the size animate.
    let vw=bustPx*3.074, vh=bustPx*1.729;
    // Widen it until it actually spans this window. Scaled uniformly, anchored
    // on the same floor point, so the clip is never distorted.
    const cover=Math.max(1, (innerWidth*1.15)/vw);
    vw*=cover; vh*=cover;
    const ty=py - vh*0.775;                    // the clip's floor sits on hers
    const geom=vw.toFixed(0)+'x'+vh.toFixed(0);
    if(geom!==vidGeom){                        // only when the bust itself resizes
      dv.style.width=vw+'px'; dv.style.height=vh+'px'; dv.style.top='0px';
      vidGeom=geom;
    }
    // transform-origin is the floor line, so scaling grows the cloud upward and
    // outward from her base and leaves that contact point pinned
    const grow = hit ? 1 + Math.min(1.35, ta*0.95) : 1;
    dv.style.transform='translate(-50%,'+ty.toFixed(1)+'px) scale('+grow.toFixed(3)+')';
    if(hit){
      const want=Math.min(ta*DUST_RATE, vidDur-0.01);
      if(state==='SCRUB'){
        if(Math.abs(dv.currentTime-want)>0.04) dv.currentTime=want;
      } else {
        if(!dustOn){                      // latch, not a window a slow frame can skip
          dustOn=true;
          setTimeout(checkDustAlpha, 140);
          try{ dv.currentTime=Math.min(Math.max(0,ta*DUST_RATE), vidDur-0.01); }catch(_){}
          dv.playbackRate=DUST_RATE;
          dv.play().catch(()=>{});
        }
        // the clip is the master here, so it is never reseeked backwards:
        // that is exactly the snap the render stall used to produce
        if(dv.playbackRate!==DUST_RATE) dv.playbackRate=DUST_RATE;
      }
      const clipEnds=vidDur/DUST_RATE;            // in shot time, not clip time
      const tail=Math.max(0,(ta-(clipEnds-0.28))/0.95);
      const onset=Math.min(1, ta/0.10);           // same event as the impact
      dv.style.opacity=(Math.max(0,1-tail)*onset).toFixed(3);
    } else { dv.style.opacity='0'; if(!dv.paused) dv.pause(); }
  }

  // ── the swap, hidden inside the cloud, then the title through the haze ─
  const rv=elRev, ti=elTitle, sb=elSub;
  // The hall-and-title ending belongs to the dev view only. When the shot is
  // going to hand over, drawing it means the reveal is already half faded in
  // at the moment we freeze, so the held frame is the museum with the pile of
  // shards sitting in the middle of it. Recorded on 2026-09-01: two full
  // seconds of broken statue lying in the gallery.
  const sw=(hit && !AUTONAV) ? Math.max(0,Math.min(1,(ta-SWAP_AT)/0.22)) : 0;
  rv.style.opacity = (sw*sw*(3-2*sw)).toFixed(3);
  // ease out of the push-in as the haze thins, so you settle into the room
  const settleIn = hit ? Math.max(0,Math.min(1,(ta-SWAP_AT)/1.05)) : 0;
  elHall.style.transform = 'scale('+(1.08-0.08*(settleIn*settleIn*(3-2*settleIn))).toFixed(4)+')';
  const k=AUTONAV ? 0 : Math.max(0,Math.min(1,(ta-TITLE_AT)/0.8));
  const e=k<0.5 ? 4*k*k*k : 1-Math.pow(-2*k+2,3)/2;
  ti.style.opacity=e.toFixed(3); sb.style.opacity=e.toFixed(3);
  // the way on: comes after the title so the room reads first
  const kb=AUTONAV ? 0 : Math.max(0,Math.min(1,(ta-(TITLE_AT+0.72))/0.62));
  const eb=kb<0.5 ? 4*kb*kb*kb : 1-Math.pow(-2*kb+2,3)/2;
  elEnter.style.opacity=eb.toFixed(3);
  elEnter.classList.toggle('on', eb>0.85);

  const tn=t.toFixed(2)+'s';
  if(tn!==lastTn){ elTn.textContent=tn; lastTn=tn; }
  const sv=Math.round(t/DUR*500);
  if(sv!==lastSc){ elSc.value=sv; lastSc=sv; }
  R.render(scene,cam);
}

// ── input: she is fixed, the camera orbits, and only on a real tap ────────
let dragging=false,lx=0,ly=0,tDown=0;
// The chooser lives in index.html and is already dismissed by the time this
// file is fetched: it is what triggers the fetch. Kept as a constant so the
// guards below read the same as they always did.
const gateUp=false;
const inUI=(e)=>gateUp||!!(e.target && e.target.closest && e.target.closest('#tl,#renter,#gate'));
addEventListener('pointerdown',e=>{ if(inUI(e)) return;
  dragging=true; lx=e.clientX; ly=e.clientY; dragAmt=0; tDown=performance.now();
  try{R.domElement.setPointerCapture(e.pointerId);}catch(_){} });
addEventListener('pointermove',e=>{ if(!dragging) return;
  const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
  dragAmt+=Math.abs(dx)+Math.abs(dy);
  if(state==='IDLE'){ az-=dx*0.0062; el=Math.max(EL_MIN,Math.min(EL_MAX,el+dy*0.005)); dirty=true; } });
addEventListener('pointerup',e=>{ if(!dragging) return; dragging=false;
  if(inUI(e)) return;
  const quick=performance.now()-tDown<400;
  const armed = canRun();   // no half-loaded runs
  if(handedOver) return;
  if((dragAmt<14||quick) && armed && (state==='IDLE'||state==='DONE'||state==='SCRUB')){ start(); } });
// Swap what is underneath the cloud. The dust keeps playing and thins out on
// its own, so the museum is simply revealed by it rather than cut to.
// Verified on a real iPhone: the museum frame does not fire load for over
// twelve seconds, while the shot hands over at about ten. We were uncovering
// an empty frame, which is why iOS ended on a blank white screen. Never swap
// until the museum has actually rendered; hold the cover until it has.
function museumReady(){
  try{
    const d=elMus.contentDocument;
    return !!(d && d.readyState!=='loading' && d.querySelector('.entrance h1'));
  }catch(_){ return true; }   // same origin, so this should not happen: do not block on it
}

function uncoverMuseum(){
  if(handedOver) return;
  handedOver=true;
  elHint.classList.remove('in');
  document.getElementById('hud').style.display='none';
  document.getElementById('tl').classList.add('hide');

  const finish=()=>{
    elMus.classList.add('up');
    R.domElement.style.opacity='0';
    setTimeout(()=>elHaze.classList.remove('on'), 320);
    setTimeout(()=>{
      elMus.classList.add('live');
      // it was held out of the tab order while it sat hidden behind the shot.
      // Leaving it there meant a keyboard visitor could never reach the museum.
      elMus.removeAttribute('tabindex');
      try{ elMus.focus({preventScroll:true}); }catch(_){}
      try{ history.replaceState(null,'','/preview/'); }catch(_){}
    }, 1100);
  };

  const minCover = dustUsable ? 0 : 480;
  const t0 = performance.now();
  (function waitForMuseum(){
    const waited = performance.now()-t0;
    if((museumReady() && waited>=minCover) || waited>9000){ finish(); return; }
    elHaze.classList.add('on');     // the cloud is thinning: cover the wait
    setTimeout(waitForMuseum, 120);
  })();
}

// A timer as well as the render loop: if the main thread stalls, the render
// loop stops being called and the deadline above is never even tested.
function armUncoverBackstop(){
  setTimeout(()=>{ if(AUTONAV && !handedOver) uncoverMuseum(); }, (NAV_LIMIT+0.05)*1000);
}

function start(){
  if(REDUCED){                      // deliver the outcome without the motion
    if(!DEV){ location.href='/preview/'; return; }
    state='SCRUB'; t=DUR; az=0; el=0.05; dirty=true;
    document.body.classList.add('run'); elHint.classList.remove('in');
    if(vidReady){ try{ dv.pause(); }catch(_){} }
    dv.style.opacity='0'; sync(); return;
  }
  state='RUN'; t=0; t0=performance.now(); az0=az; el0=el; dirty=true; dustOn=false;
  if(AUTONAV) armUncoverBackstop();
  dustOn=false;
  // This tap is a user gesture, and on iOS it is the only moment a script is
  // allowed to start a video. Touching it here both unlocks the later play in
  // the render loop and kicks off buffering if preload was ignored.
  try{
    if(dv.readyState===0) dv.load();
    const pr=dv.play();
    if(pr && pr.then) pr.then(()=>{ try{ dv.pause(); dv.currentTime=0; }catch(_){} }).catch(()=>{});
  }catch(_){}
  if(vidReady){ try{ dv.pause(); dv.currentTime=0; }catch(_){} }
  dv.style.opacity='0';
  document.body.classList.add('run');
  elHint.classList.remove('in');
}
R.domElement.addEventListener('keydown',e=>{
  if(gateUp) return;
  if(e.key!=='Enter' && e.key!==' ') return;
  e.preventDefault();
  if(canRun()) start();
});
document.getElementById('pp').addEventListener('click',()=>{ if(!gateUp && canRun()) start(); });
document.getElementById('sc').addEventListener('input',e=>{ if(!shards) return;
  state='SCRUB'; t=+e.target.value/500*DUR;
  document.getElementById('hint').classList.remove('in'); sync(); });
document.getElementById('hd').addEventListener('click',()=>{
  document.getElementById('tl').classList.toggle('hide'); });
const qt=new URLSearchParams(location.search).get('t');
if(qt!==null){ state='SCRUB'; t=Math.max(0,Math.min(DUR,+qt));
  if(+qt>0){ document.body.classList.add('run'); elHint.classList.remove('in'); } }

let f=0,last=performance.now();
(function tick(){ requestAnimationFrame(tick);
  if(state==='RUN'){
    // Wall clock is authoritative, always. Letting the clip drive the shot
    // meant a dropped frame teleported the animation forward by however far the
    // video had run; capping that instead made the whole shot crawl at low
    // framerates. The 3D now simply runs in real time and the dust, which
    // decodes on its own thread, is allowed to sit a little out of step - which
    // is invisible in a cloud, where a jump in the geometry is not.
    t = (performance.now()-t0)/1000;
    if(AUTONAV && !handedOver && t>=NAV_FLOOR){
      const covered = dv.ended || (vidReady && !dv.error && dv.currentTime>=PEAK_VT);
      if(covered || t>=NAV_LIMIT) uncoverMuseum();
    }
    if(t>=DUR){ t=DUR; state='DONE'; if(!dv.paused) dv.pause(); }
    dirty=true;
  }
  R.shadowMap.needsUpdate = (state==='RUN');
  if(dirty){ sync(); if(state!=='RUN') dirty=false; }
  f++; const p=performance.now();
  if(p-last>1000){ const el2=document.getElementById('fps');
    if(el2) el2.textContent=Math.round(f*1000/(p-last)); f=0; last=p; } })();
addEventListener('resize',()=>{ cam.aspect=innerWidth/innerHeight;
  cam.updateProjectionMatrix(); R.setSize(innerWidth,innerHeight); vidGeom=''; dirty=true; });
