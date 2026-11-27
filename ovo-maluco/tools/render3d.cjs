// Gera img/criaturas/<id>.png a partir dos modelos 3D (tools/modelos.js).
// Uso: npm run render3d            (opcional: node tools/render3d.cjs tung,tralalero)
// Requer: npm install  e  Playwright com Chromium disponível.
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'img', 'criaturas');
const only = process.argv[2] ? process.argv[2].split(',') : null;
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(8790, async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:8790/tools/render3d.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  fs.mkdirSync(OUT, { recursive: true });
  const ids = (await p.evaluate(() => LISTA.map(c => c.id))).filter(id => !only || only.includes(id));
  for (const id of ids) {
    const url = await p.evaluate(id => renderOne(id), id);
    fs.writeFileSync(path.join(OUT, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log('ok', id);
  }
  if (errs.length) console.log('ERROS', errs);
  await b.close(); server.close();
});
