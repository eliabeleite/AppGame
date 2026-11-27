// Testador automático: joga sozinho todas as fases com tiros aleatórios e procura bugs
// (erro de código, lança fora da arena ou que nunca para, lançador inválido).
// Requer Playwright:  npm i -D playwright && npx playwright install chromium
// Uso: npm run test:jogo            (opcional: node tests/jogar-sozinho.cjs 30 8,17  -> 30 tiros nas fases 8 e 17)
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'lancapenas-'));
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const inject = (a, b) => { if (!html.includes(a)) throw new Error('ponto de injeção não encontrado: ' + a.slice(0, 40)); html = html.replace(a, b); };
inject("  const dt = Math.min(.05, raw / 1000); last = now;", "  const dt = Math.min(.05, raw / 1000) * (window.__speed || 1); last = now;");
inject("function drawPreview() {", "window.__st = () => ({ phase, screen, li, launch: LP(), spears: spears.map(s => [s.x, s.y, s.done, s.len]), left: targetsLeft(), spearsLeft, used, T, chickens: chickens.map(c => [c.px, c.py, c.hit, c.hp]) });\nfunction drawPreview() {");
fs.writeFileSync(path.join(TMP, 'index.html'), html);
const types = { '.html': 'text/html', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => {
  const f = q.url.split('?')[0] === '/' ? path.join(TMP, 'index.html') : q.url.includes('index.html') ? path.join(TMP, 'index.html') : path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(8768);
const { chromium, devices } = require('playwright');
const SHOTS = +process.argv[2] || 16, ONLY = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8768/index.html');await p.waitForTimeout(400);
await p.evaluate(()=>localStorage.setItem('lancapenas.v3',JSON.stringify({stars:Object.fromEntries([...Array(24).keys()].map(i=>[i,2])),best:{},music:false,sound:false,kid:'Ana'})));
await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{window.__speed=4});
await p.click('#bPlay',{force:true});await p.waitForTimeout(300);
const issues=[];let rnd=1234567;const R=()=>(rnd=(rnd*1103515245+12345)%2147483648)/2147483648;
const g=await p.evaluate(()=>({w:innerWidth,h:innerHeight}));
for(let L=1;L<=24;L++){ if(ONLY&&!ONLY.includes(L))continue;
  await p.evaluate(()=>{for(const id of ['result','levels','album','weaponOv']){} document.getElementById('result').hidden=true;document.getElementById('bHome').click()});await p.waitForTimeout(200);
  await p.click('.lv >> nth='+(L-1));await p.waitForTimeout(500);
  const geo=await p.evaluate(()=>{const h=document.getElementById('hud').getBoundingClientRect().bottom;return {w:innerWidth,h:innerHeight,top:h}});
  const w2s=(x,y)=>{const top=geo.top+8,availH=geo.h-top-10,VS=Math.min((geo.w-12)/400,availH/680),OX=(geo.w-400*VS)/2,OY=top+Math.max(0,(availH-680*VS)/2);return [OX+x*VS,OY+y*VS]};
  let wins=0,fails=0;
  for(let k=0;k<SHOTS;k++){
    const st=await p.evaluate(()=>window.__st());
    const resVis=await p.evaluate(()=>!document.getElementById('result').hidden);
    if(resVis||st.phase==='done'){ if(resVis){const t=await p.textContent('#resTitle'); if(/Quase/.test(t))fails++; else wins++;} await p.waitForTimeout(150); await p.evaluate(()=>{document.getElementById('result').hidden=true;document.getElementById('bResRetry').click()}); await p.waitForTimeout(250); continue; }
    if(st.phase!=='aim'){await p.waitForTimeout(100);continue;}
    const lp=st.launch; if(!isFinite(lp.x)||!isFinite(lp.y)||lp.x<10||lp.x>390||lp.y<10||lp.y>670) issues.push(`fase ${L}: lançador fora/NaN ${JSON.stringify(lp)}`);
    // mira: metade das vezes numa galinha viva, metade aleatória
    const alive=st.chickens.filter(c=>!c[2]);let tx,ty;
    if(alive.length&&R()<.6){const c=alive[Math.floor(R()*alive.length)];tx=c[0];ty=c[1];}else{tx=20+R()*360;ty=20+R()*640;}
    const [x,y]=w2s(tx,ty);await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(Math.floor(R()*300));await p.mouse.up();
    // espera a lança parar, vigiando
    const t0=Date.now();let last=null;
    while(true){await p.waitForTimeout(120);const s=await p.evaluate(()=>window.__st());
      for(const sp of s.spears){ if(!isFinite(sp[0])||!isFinite(sp[1])) issues.push(`fase ${L}: lança NaN`); if(sp[0]<-5||sp[0]>405||sp[1]<-5||sp[1]>685) issues.push(`fase ${L}: lança fora da arena ${sp[0].toFixed(0)},${sp[1].toFixed(0)}`); }
      if(s.phase!=='flying'&&s.phase!=='wait')break;
      if(Date.now()-t0>9000){issues.push(`fase ${L}: lança não parou (fase=${s.phase}, lanças=${JSON.stringify(s.spears.map(a=>a.map(v=>typeof v==='number'?Math.round(v):v)))})`);break;}
    }
  }
  console.log(`fase ${L}: vitórias ${wins}, derrotas ${fails}`);
}
const uniq=[...new Set(issues)];console.log('PROBLEMAS',uniq.length);uniq.slice(0,30).forEach(x=>console.log(' -',x));console.log('ERROS JS',[...new Set(errs)]);await b.close();server.close();process.exit(uniq.length||errs.length?1:0);})();
