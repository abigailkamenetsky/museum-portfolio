/**
 * Measure the side walls as a height field, the way the floor was measured.
 *
 * Marble's walls bow (|x| 2.97..4.47 on the left), so a flat panel cannot sit on
 * them. Rays are cast sideways from the centreline and the FIRST hit wins, which
 * is the wall face or whatever is mounted on it.
 *
 *   node scripts/probe_walls.mjs > src/data/wallField.json
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const PORT = 9820 + Math.floor(Math.random() * 80)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new','--no-sandbox','--use-angle=metal',`--remote-debugging-port=${PORT}`,
  '--window-size=1200,800','--user-data-dir=/tmp/cdp-pw-'+PORT,'about:blank'], {stdio:'ignore'})
try {
  let t
  for (let i=0;i<40;i++){await sleep(250);try{t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();if(t.find(x=>x.type==='page'))break}catch{}}
  const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl)
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j})
  let id=0;const p=new Map()
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id)}}
  const send=(m,q={})=>new Promise(r=>{const n=++id;p.set(n,r);ws.send(JSON.stringify({id:n,method:m,params:q}))})
  await send('Page.enable')
  await send('Page.navigate',{url:'http://localhost:5173/?environment=marble&mode=mesh&nopaint=1&cam=0,3,10,0,0'})
  await sleep(15000)
  const r=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{
    const t=window.__three, V=t.camera.position.constructor
    const rc=new (t.raycaster.constructor)(); rc.far=12
    const Z0=15.0, Z1=-42.0, NZ=77
    const Y0=0.6, Y1=5.4, NY=17
    const out={z0:Z0,z1:Z1,nz:NZ,y0:Y0,y1:Y1,ny:NY,left:[],right:[]}
    for(let j=0;j<NZ;j++){
      const z=Z0+(Z1-Z0)*j/(NZ-1)
      const rowL=[], rowR=[]
      for(let k=0;k<NY;k++){
        const y=Y0+(Y1-Y0)*k/(NY-1)
        for(const [side,row] of [[-1,rowL],[1,rowR]]){
          rc.set(new V(0,y,z), new V(side,0,0))
          const hs=rc.intersectObjects(t.scene.children,true).filter(h=>h.object.visible&&h.distance>0.4)
          row.push(hs.length? +hs[0].point.x.toFixed(3) : null)
        }
      }
      out.left.push(rowL); out.right.push(rowR)
    }
    return out})()`})
  const d=r.result.value
  for (const side of ['left','right']) {
    const all=d[side].flat().filter(v=>v!==null)
    const med=all.slice().sort((a,b)=>a-b)[Math.floor(all.length/2)]
    for (const row of d[side]) for (let k=0;k<row.length;k++) if(row[k]===null) row[k]=med
    console.error(`${side}: |x| ${Math.min(...all.map(Math.abs)).toFixed(2)}..${Math.max(...all.map(Math.abs)).toFixed(2)} median ${Math.abs(med).toFixed(2)}`)
  }
  console.log(JSON.stringify(d))
} finally { chrome.kill() }
