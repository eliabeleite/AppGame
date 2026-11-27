// Ovo Maluco: criaturas modeladas em 3D (Three.js) a partir de formas básicas.
// Renderizadas uma vez em PNG (tools/render3d.cjs). As de "privado: true" são fan art de memes
// de terceiros, só para uso familiar; não publique essas imagens.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- materiais ----------
const cache = {};
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (cache[k]) return cache[k];
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: o.r ?? .42, metalness: o.metal ?? 0, clearcoat: o.cc ?? .35, clearcoatRoughness: .35, map: o.map || null, emissive: o.emissive || 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side || THREE.FrontSide });
  return (cache[k] = m);
}
function canvasTex(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); paint(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const TEX = {
  bark: () => canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#b97a42'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = Math.random() * w; g.strokeStyle = `rgba(${90 + Math.random() * 40},${50 + Math.random() * 25},20,.55)`; g.lineWidth = 2 + Math.random() * 5; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 20) g.lineTo(x + Math.sin(y * .05 + i) * 6, y); g.stroke(); }
  }),
  rings: () => canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#f0cd94'; g.fillRect(0, 0, w, w);
    for (let r = 12; r < 128; r += 14) { g.strokeStyle = 'rgba(160,100,45,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); }
  }),
  coco: () => canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#7a4a24'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const x = Math.random() * w, y = Math.random() * h; g.strokeStyle = Math.random() < .5 ? 'rgba(200,150,90,.55)' : 'rgba(60,35,15,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.random() * 10 - 5, y + 8 + Math.random() * 6); g.stroke(); }
  }),
  clock: () => canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#fffdf5'; g.fillRect(0, 0, w, w); g.translate(256, 256);
    g.fillStyle = '#3b2414'; g.font = '700 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    [[12, 0], [3, 1], [6, 2], [9, 3]].forEach(([n, i]) => { const a = -Math.PI / 2 + i * Math.PI / 2; g.fillText(n, Math.cos(a) * 180, Math.sin(a) * 180); });
    for (let i = 0; i < 12; i++) { if (i % 3 === 0) continue; const a = i * Math.PI / 6; g.beginPath(); g.arc(Math.cos(a) * 185, Math.sin(a) * 185, 10, 0, 7); g.fill(); }
    g.lineCap = 'round'; g.strokeStyle = '#3b2414'; g.lineWidth = 18; g.beginPath(); g.moveTo(0, 0); g.lineTo(90, -60); g.stroke();
    g.strokeStyle = '#e5533d'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -150); g.stroke(); g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fillStyle = '#3b2414'; g.fill();
  }),
  spots: () => canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#fffdf7'; g.fillRect(0, 0, w, h); g.fillStyle = '#232323';
    for (const [x, y, r] of [[60, 70, 34], [200, 160, 46], [330, 60, 30], [430, 170, 40], [120, 210, 22], [470, 40, 22], [280, 230, 20]]) { g.beginPath(); g.ellipse(x, y, r * 1.2, r, .4, 0, 7); g.fill(); }
  }),
  wrapper: () => canvasTex(512, 128, (g, w, h) => {
    for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#7fd0ff' : '#4aa8e0'; g.fillRect(x, 0, 32, h); }
  }),
  stripes: () => canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#d6ec8a'; g.fillRect(0, 0, w, w); g.fillStyle = '#ff8a1f';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(40 + i * 45, 18, 10, 34, .3, 0, 7); g.fill(); }
  }),
};

// ---------- peças ----------
function add(parent, geo, material, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, material); m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const sph = (r = 1, seg = 48) => new THREE.SphereGeometry(r, seg, Math.round(seg * .75));
const cyl = (rt, rb, h, seg = 40) => new THREE.CylinderGeometry(rt, rb, h, seg);
const cap = (r, h) => new THREE.CapsuleGeometry(r, h, 12, 24);
const cone = (r, h, seg = 32) => new THREE.ConeGeometry(r, h, seg);
const rbox = (w, h, d, rad = .08) => new RoundedBoxGeometry(w, h, d, 4, rad);
function tube(parent, pts, radius, material, seg = 40) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => V(...p)));
  return add(parent, new THREE.TubeGeometry(curve, seg, radius, 16, false), material);
}
// olho de desenho animado: branco + pupila + brilho, virado para +z (ou direção dada)
function eye(parent, p, r = .14, look = [0, 0, 1]) {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  add(g, sph(r), mat('#ffffff', { r: .15, cc: .8 }));
  const d = V(...look).normalize();
  add(g, sph(r * .5), mat('#15100a', { r: .1, cc: 1 }), [d.x * r * .62, d.y * r * .62 + r * .05, d.z * r * .62]);
  add(g, sph(r * .16), mat('#ffffff', { r: .1, emissive: 0xffffff, ei: .4 }), [d.x * r * .9 - r * .18, d.y * r * .9 + r * .25, d.z * r * .9]);
  return g;
}
function smile(parent, p, w = .18, color = '#3b1a10', open = false) {
  if (open) return add(parent, sph(w), mat('#5a1f12', { r: .6 }), p, [1, .7, .35]);
  const curve = new THREE.EllipseCurve(0, 0, w, w * .8, Math.PI * 1.15, Math.PI * 1.85);
  const pts = curve.getPoints(20).map(q => V(q.x, q.y, 0));
  const m = add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .025, 8, false), mat(color, { r: .5 }), p);
  return m;
}
function ear(parent, p, s, color, inner) {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  add(g, sph(1), mat(color), [0, 0, 0], s);
  if (inner) add(g, sph(1), mat(inner), [0, 0, s[2] * .5], [s[0] * .62, s[1] * .62, s[2] * .6]);
  return g;
}

function cheek(parent, p, r = .1) { return add(parent, sph(r), mat('#ff8fa8', { r: .6, cc: 0 }), p, [1, .62, .35]); }
function brow(parent, p, len, rotZ, color = '#3b2414') { return add(parent, cap(.035, len), mat(color, { r: .6 }), p, [1, 1, 1], [0, 0, Math.PI / 2 + rotZ]); }
function lash(parent, p, rotZ) { return add(parent, cap(.012, .08), mat('#15100a', { r: .6 }), p, [1, 1, 1], [0, 0, rotZ]); }
const C3 = ['#ef5b5b', '#ffd23f', '#3b82f6', '#4cc26a', '#a855f7', '#ffffff'];

// ---------- criaturas ----------
const B = {};

B.tung = (g) => {
  const wood = mat('#c98b4a', { map: TEX.bark(), r: .7, cc: .1 });
  add(g, cyl(.62, .66, 1.9), wood, [0, 1.25, 0]);
  add(g, cyl(.62, .62, .02), mat('#f0cd94', { map: TEX.rings(), r: .6, cc: .1 }), [0, 2.21, 0]);
  eye(g, [-.24, 1.62, .55], .2); eye(g, [.24, 1.62, .55], .2);
  add(g, rbox(.32, .07, .08, .03), mat('#4a2a12'), [-.25, 1.9, .6], [1, 1, 1], [0, 0, -.35]);
  add(g, rbox(.32, .07, .08, .03), mat('#4a2a12'), [.25, 1.9, .6], [1, 1, 1], [0, 0, .35]);
  smile(g, [0, 1.28, .6], .22, '#3b1a10', true);
  add(g, sph(.1), mat('#ff7a9a'), [0, 1.22, .66], [1.2, .5, .5]);
  const limb = mat('#a8693a', { map: TEX.bark(), r: .7, cc: .1 });
  add(g, cap(.09, .5), limb, [-.25, .12, 0]); add(g, cap(.09, .5), limb, [.25, .12, 0]);
  add(g, rbox(.32, .14, .45, .07), mat('#6e4019'), [-.25, -.15, .08]); add(g, rbox(.32, .14, .45, .07), mat('#6e4019'), [.25, -.15, .08]);
  add(g, cap(.09, .55), limb, [-.78, 1.1, .1], [1, 1, 1], [0, 0, -.7]);
  add(g, cap(.09, .55), limb, [.86, 1.5, .1], [1, 1, 1], [0, 0, -.9]);
  add(g, sph(.13), limb, [1.14, 1.73, .1]);
  const bat = new THREE.Group(); bat.position.set(1.14, 1.73, .18); bat.rotation.set(0, 0, .45); g.add(bat);
  add(bat, cyl(.07, .05, .35), mat('#3b2414', { r: .6 }), [0, -.05, 0]);
  add(bat, cyl(.17, .065, 1.6), mat('#f2d7a2', { r: .5 }), [0, .85, 0]);
  add(bat, sph(.17), mat('#f2d7a2', { r: .5 }), [0, 1.65, 0]);
  for (const [x, y] of [[-.38, .75], [.3, 1.85], [.42, .55]]) { add(g, sph(.1), mat('#7a4a1e', { r: .8 }), [x, y, Math.sqrt(Math.max(0, .64 * .64 - x * x)) - .02], [1, 1.3, .45]); add(g, sph(.05), mat('#4a2a12'), [x, y, Math.sqrt(Math.max(0, .64 * .64 - x * x)) + .01], [1, 1.3, .5]); }
  add(g, rbox(.09, .08, .04, .015), mat('#ffffff'), [-.05, 1.36, .66]); add(g, rbox(.09, .08, .04, .015), mat('#ffffff'), [.06, 1.36, .66]);
  cheek(g, [-.38, 1.45, .5]); cheek(g, [.38, 1.45, .5]);
  add(g, sph(.13), limb, [-1.02, .82, .1]);
  const tape = new THREE.Group(); tape.position.copy(bat.position); tape.rotation.copy(bat.rotation); g.add(tape);
  for (let i = 0; i < 3; i++) add(tape, new THREE.TorusGeometry(.075, .022, 8, 24), mat('#e5533d'), [0, .08 + i * .08, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
};

B.tralalero = (g) => {
  const blue = mat('#2f7fd6', { r: .3, cc: .6 });
  const body = new THREE.Group(); body.position.set(0, 1.35, 0); g.add(body);
  add(body, sph(1), blue, [0, 0, 0], [1.25, .62, .6]);
  add(body, sph(1), mat('#f4f8ff', { r: .35 }), [.15, -.2, .1], [1.08, .4, .5]);
  add(body, cone(.45, 1, 4), blue, [-1.35, 0, 0], [1, 1, .25], [0, 0, Math.PI / 2]);
  add(body, cone(.28, .7, 4), blue, [-1.45, .35, 0], [1, 1, .25], [0, 0, 2.2]);
  add(body, cone(.28, .7, 4), blue, [-1.45, -.35, 0], [1, 1, .25], [0, 0, .95]);
  add(body, cone(.32, .7, 4), blue, [-.05, .72, 0], [1, 1, .22], [0, 0, -.25]);
  add(body, cone(.18, .5, 4), blue, [.25, -.3, .45], [1, 1, .25], [1.3, 0, .4]);
  eye(body, [.78, .18, .38], .15, [.6, 0, 1]);
  eye(body, [.78, .18, -.38], .15, [.6, 0, -1]);
  add(body, sph(1), mat('#7a1f1f', { r: .6 }), [1.02, -.18, 0], [.28, .1, .32]);
  for (let i = 0; i < 6; i++) { const a = -.9 + i * .36; add(body, cone(.035, .1, 8), mat('#ffffff'), [1.0 + Math.cos(a) * .05, -.12, Math.sin(a) * .3], [1, 1, 1], [Math.PI, 0, 0]); }
  const leg = mat('#2a6fbd', { r: .35, cc: .5 });
  [[-.45, .15], [.0, -.15], [.45, .15]].forEach(([x, z]) => {
    add(g, cap(.13, .5), leg, [x, .62, z]);
    add(g, rbox(.52, .26, .38, .12), mat('#ffffff', { r: .3 }), [x + .12, .16, z]);
    add(g, rbox(.53, .07, .39, .03), mat('#e5533d'), [x + .12, .05, z]);
    add(g, rbox(.2, .06, .4, .02), mat('#2f7fd6'), [x + .05, .24, z], [1, 1, 1], [0, 0, .4]);
  });
  for (const z of [.4, -.4]) for (let i = 0; i < 3; i++) add(body, cap(.018, .14), mat('#1f4f88'), [.42 + i * .09, .02, z * 1.02], [1, 1, 1], [0, 0, .15]);
  add(body, sph(.03), mat('#1f2f4a'), [1.18, .05, .1]); add(body, sph(.03), mat('#1f2f4a'), [1.18, .05, -.1]);
  cheek(body, [.92, -.05, .34], .07); cheek(body, [.92, -.05, -.34], .07);
  brow(body, [.78, .4, .4], .14, -.3); brow(body, [.78, .4, -.4], .14, -.3);
  [[-.45, .15], [.0, -.15], [.45, .15]].forEach(([x, z]) => {
    add(g, new THREE.TorusGeometry(.14, .045, 10, 24), mat('#ffffff'), [x, .34, z], [1, 1, 1], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 3; i++) add(g, cap(.012, .2), mat('#ffffff'), [x + .02 + i * .07, .31, z], [1, 1, 1], [Math.PI / 2, 0, 0]);
  });
};

B.cocofanto = (g) => {
  add(g, sph(.85), mat('#7a4a24', { map: TEX.coco(), r: .8, cc: .05 }), [0, .95, 0]);
  const grey = mat('#a9b4c2', { r: .4 });
  for (const [x, z] of [[-.45, .3], [.45, .3], [-.45, -.3], [.45, -.3]]) add(g, cyl(.16, .18, .4), grey, [x, .2, z]);
  add(g, sph(.62), grey, [0, 2.05, .05]);
  ear(g, [-.68, 2.1, -.05], [.45, .55, .12], '#a9b4c2', '#f4b6c2').rotation.y = .5;
  ear(g, [.68, 2.1, -.05], [.45, .55, .12], '#a9b4c2', '#f4b6c2').rotation.y = -.5;
  eye(g, [-.22, 2.2, .52], .14); eye(g, [.22, 2.2, .52], .14);
  tube(g, [[0, 1.95, .55], [0, 1.6, .75], [.05, 1.25, .8], [.25, 1.05, .78], [.38, 1.15, .7]], .13, grey);
  add(g, sph(.13), grey, [.4, 1.18, .68]);
  add(g, cone(.06, .3, 16), mat('#fffaf0', { r: .3 }), [-.17, 1.82, .5], [1, 1, 1], [-1.9, 0, .25]); add(g, cone(.06, .3, 16), mat('#fffaf0', { r: .3 }), [.17, 1.82, .5], [1, 1, 1], [-1.9, 0, -.25]);
  for (const [x, y] of [[-.18, 1.45], [.18, 1.45], [0, 1.25]]) add(g, sph(.07), mat('#3b2414', { r: .9 }), [x, y, .58], [1, 1, .4]);
  for (const [x, z] of [[-.45, .3], [.45, .3], [-.45, -.3], [.45, -.3]]) for (const dx of [-.07, 0, .07]) add(g, sph(.04), mat('#fffaf0'), [x + dx, .05, z + .16]);
  cheek(g, [-.38, 2.0, .45]); cheek(g, [.38, 2.0, .45]);
  tube(g, [[0, .9, -.8], [-.1, .7, -1.0], [-.05, .55, -1.05]], .03, grey); add(g, sph(.07), mat('#3b2414'), [-.05, .5, -1.05]);
};

B.ballerina = (g) => {
  const pink = mat('#ffb3d1', { r: .45 });
  add(g, cap(.055, .9), pink, [-.12, .5, 0]);
  add(g, cap(.055, .75), pink, [.45, .95, .05], [1, 1, 1], [0, 0, 1.15]);
  add(g, sph(.1), mat('#ff6fa5'), [-.12, .02, .05], [1, .6, 1.5]);
  add(g, cap(.2, .35), mat('#ff8fbf'), [0, 1.2, 0]);
  const tutu = mat('#ffc6df', { r: .6, cc: .1 });
  add(g, cyl(.25, 1.0, .18, 24), tutu, [0, 1.0, 0]);
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; add(g, sph(.2), tutu, [Math.cos(a) * .9, .95, Math.sin(a) * .9], [1, .55, 1]); }
  add(g, cap(.05, .7), pink, [-.45, 1.75, 0], [1, 1, 1], [0, 0, .6]);
  add(g, cap(.05, .7), pink, [.45, 1.75, 0], [1, 1, 1], [0, 0, -.6]);
  const cup = new THREE.LatheGeometry([V(0, 0, 0), V(.42, 0, 0), V(.5, .2, 0), V(.62, .85, 0), V(.66, .9, 0), V(.6, .9, 0)].map(v => new THREE.Vector2(v.x, v.y)), 48);
  add(g, cup, mat('#fffaf2', { r: .2, cc: .8, side: THREE.DoubleSide }), [0, 1.48, 0]);
  add(g, cyl(.6, .6, .04), mat('#8a5a32', { r: .5 }), [0, 2.3, 0]);
  add(g, sph(.12), mat('#fff6e8'), [-.06, 2.33, .1], [1, .25, 1]); add(g, sph(.12), mat('#fff6e8'), [.08, 2.33, .1], [1, .25, 1]);
  add(g, new THREE.TorusGeometry(.2, .05, 12, 32, Math.PI * 1.2), mat('#fffaf2', { r: .2, cc: .8 }), [.66, 1.95, 0], [1, 1, 1], [0, 0, -1.7]);
  eye(g, [-.18, 1.95, .55], .12); eye(g, [.18, 1.95, .55], .12);
  smile(g, [0, 1.75, .58], .1);
  add(g, new THREE.TorusGeometry(.86, .07, 10, 48), mat('#ffe0ee', { r: .6 }), [0, 1.05, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (const [x, rot] of [[-.27, .5], [-.22, .1], [.27, -.5], [.22, -.1]]) lash(g, [x, 2.07, .58], rot);
  cheek(g, [-.32, 1.82, .5], .09); cheek(g, [.32, 1.82, .5], .09);
  for (let i = 0; i < 5; i++) { const a = i * 1.26; add(g, sph(.045), mat('#3b2414', { r: .4 }), [Math.cos(a) * .35, 2.33, Math.sin(a) * .35], [1, .6, .7]); }
};

B.bombardiro = (g) => {
  const green = mat('#5fb24a', { r: .35, cc: .5 });
  const body = new THREE.Group(); body.position.set(0, 1.2, 0); g.add(body);
  add(body, cap(.42, 1.6), green, [0, 0, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(body, sph(1), mat('#e4f2c0'), [.1, -.22, 0], [1.05, .18, .35]);
  add(body, rbox(.9, .22, .5, .1), green, [1.35, -.08, 0]);
  for (let i = 0; i < 6; i++) { add(body, cone(.04, .1, 8), mat('#fff'), [1.0 + i * .13, -.22, .2], [1, 1, 1], [Math.PI, 0, 0]); add(body, cone(.04, .1, 8), mat('#fff'), [1.0 + i * .13, -.22, -.2], [1, 1, 1], [Math.PI, 0, 0]); }
  add(body, sph(.18), green, [.75, .38, .22]); add(body, sph(.18), green, [.75, .38, -.22]);
  eye(body, [.8, .44, .3], .12, [.3, .2, 1]); eye(body, [.8, .44, -.3], .12, [.3, .2, -1]);
  for (let i = 0; i < 5; i++) add(body, cone(.08, .18, 4), mat('#4a9a3a'), [-.7 + i * .3, .45, 0]);
  add(body, rbox(1.0, .08, 2.8, .04), mat('#7f9c6a', { r: .5 }), [.0, -.05, 0]);
  add(body, rbox(.45, .05, 1.0, .03), mat('#7f9c6a', { r: .5 }), [-1.1, .1, 0]);
  add(body, rbox(.4, .45, .05, .03), green, [-1.15, .35, 0]);
  add(body, cyl(.08, .08, .1), mat('#555', { metal: .6 }), [1.85, -.08, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(body, rbox(.03, 1.0, .1, .015), mat('#ddd', { metal: .4 }), [1.92, -.08, 0], [1, 1, 1], [.5, 0, 0]);
  for (const z of [-.35, .35]) { add(body, cyl(.03, .03, .45), mat('#555'), [.2, -.55, z]); add(body, new THREE.TorusGeometry(.12, .05, 12, 24), mat('#222'), [.2, -.8, z]); }
  add(body, sph(.32), mat('#9fe3ff', { r: .05, cc: 1, metal: .1 }), [-.15, .38, 0], [1.3, .7, .8]);
  add(body, sph(.035), mat('#1f3a1f'), [1.78, .05, .1]); add(body, sph(.035), mat('#1f3a1f'), [1.78, .05, -.1]);
  add(body, cone(.08, .16, 16), mat('#e5533d'), [1.98, -.08, 0], [1, 1, 1], [0, 0, -Math.PI / 2]);
  for (let i = 0; i < 2; i++) add(body, rbox(.06, .46, .07, .02), mat('#e5533d'), [-1.12 - i * .1, .35, 0]);
  for (let i = 0; i < 7; i++) add(body, sph(.025), mat('#cfe8c0', { metal: .3 }), [-.9 + i * .3, .02, .42]);
  for (let i = 0; i < 4; i++) add(body, rbox(.25, .04, .04, .01), mat('#e5533d'), [-.3 + i * .25, -.04, 1.2 - (i % 2) * .05]);
};

B.patapim = (g) => {
  add(g, cyl(.42, .5, 1.3), mat('#a0703f', { map: TEX.bark(), r: .7, cc: .1 }), [0, .95, 0]);
  add(g, sph(1), mat('#f2c99a'), [-.32, .15, .25], [.35, .14, .55]); add(g, sph(1), mat('#f2c99a'), [.32, .15, .25], [.35, .14, .55]);
  const leaf = mat('#5cbf5c', { r: .5 });
  for (const [x, y, z, r] of [[0, 2.55, 0, .45], [-.45, 2.35, 0, .35], [.45, 2.35, 0, .35], [0, 2.4, -.3, .38]]) add(g, sph(r), leaf, [x, y, z]);
  add(g, sph(.55), mat('#d8a477'), [0, 1.95, .05]);
  add(g, sph(1), mat('#f0c9a4'), [0, 1.85, .38], [.38, .3, .2]);
  eye(g, [-.2, 2.08, .45], .12); eye(g, [.2, 2.08, .45], .12);
  add(g, cap(.12, .3), mat('#e88a6a', { r: .4 }), [0, 1.75, .6], [1, 1, 1], [.3, 0, 0]);
  const br = mat('#7a4a1e', { r: .7 });
  add(g, cap(.07, .8), br, [-.65, 1.35, 0], [1, 1, 1], [0, 0, 1.0]); add(g, cap(.07, .8), br, [.65, 1.35, 0], [1, 1, 1], [0, 0, -1.0]);
  add(g, sph(.2), leaf, [-1.05, 1.62, 0]); add(g, sph(.2), leaf, [1.05, 1.62, 0]);
  for (const [x, y, z, r] of [[-.25, 2.75, .15, .3], [.28, 2.72, .1, .28], [0, 2.85, -.15, .32], [-.6, 2.2, -.1, .25], [.6, 2.2, -.1, .25]]) add(g, sph(r), mat('#4fae4f', { r: .5 }), [x, y, z]);
  brow(g, [-.2, 2.26, .48], .14, .3); brow(g, [.2, 2.26, .48], .14, -.3);
  for (const x of [-.32, .32]) for (const dx of [-.12, 0, .12]) add(g, sph(.07), mat('#f2c99a'), [x + dx, .17, .78]);
  add(g, sph(.025), mat('#5a1f12'), [-.05, 1.6, .74]); add(g, sph(.025), mat('#5a1f12'), [.05, 1.6, .74]);
  cheek(g, [-.36, 1.85, .4], .08); cheek(g, [.36, 1.85, .4], .08);
};

B.lirili = (g) => {
  const cac = mat('#55b855', { r: .5 });
  add(g, cap(.48, .95), cac, [0, 1.0, 0]);
  add(g, cap(.17, .3), cac, [-.66, 1.15, 0]); add(g, cap(.12, .2), cac, [-.55, .85, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(g, cap(.17, .3), cac, [.66, 1.3, 0]); add(g, cap(.12, .2), cac, [.55, 1.0, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  for (let i = 0; i < 36; i++) { const a = i * 2.4, y = .45 + (i % 9) * .14; const dir = V(Math.cos(a), 0, Math.sin(a)); const sp = add(g, cone(.015, .1, 6), mat('#fffbe0'), [dir.x * .5, y, dir.z * .5]); sp.lookAt(dir.x * 3, y, dir.z * 3); sp.rotateX(Math.PI / 2); }
  for (const x of [-.25, .25]) { add(g, rbox(.32, .07, .5, .03), mat('#b87333'), [x, .04, .1]); add(g, rbox(.34, .05, .06, .02), mat('#7a4a1e'), [x, .14, .1]); }
  const grey = mat('#a9b4c2', { r: .4 });
  add(g, sph(.5), grey, [0, 2.12, .05]);
  ear(g, [-.6, 2.15, -.05], [.38, .48, .1], '#a9b4c2', '#f4b6c2').rotation.y = .5;
  ear(g, [.6, 2.15, -.05], [.38, .48, .1], '#a9b4c2', '#f4b6c2').rotation.y = -.5;
  eye(g, [-.18, 2.25, .42], .12); eye(g, [.18, 2.25, .42], .12);
  tube(g, [[0, 2.0, .45], [0, 1.75, .6], [.05, 1.55, .62]], .1, grey);
  add(g, cone(.05, .24, 16), mat('#fffaf0'), [-.14, 1.98, .42], [1, 1, 1], [-1.9, 0, .25]); add(g, cone(.05, .24, 16), mat('#fffaf0'), [.14, 1.98, .42], [1, 1, 1], [-1.9, 0, -.25]);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; add(g, sph(.09), mat('#ff8fbf'), [.25 + Math.cos(a) * .1, 2.62, Math.sin(a) * .1], [1, .4, 1]); }
  add(g, sph(.06), mat('#ffd23f'), [.25, 2.64, 0]);
  for (const x of [-.25, .25]) for (const dx of [-.08, 0, .08]) add(g, sph(.045), mat('#a9b4c2'), [x + dx, .12, .33]);
  cheek(g, [-.33, 2.1, .38], .08); cheek(g, [.33, 2.1, .38], .08);
};

B.chimpanzini = (g) => {
  const yel = mat('#ffe066', { r: .45 });
  add(g, cap(.42, 1.0), yel, [0, .95, 0]);
  add(g, cyl(.08, .12, .2), mat('#6e4019'), [0, .2, 0]);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; const p = add(g, sph(1), mat('#ffd84a', { r: .5 }), [Math.cos(a) * .38, 1.55, Math.sin(a) * .38], [.18, .55, .32]); p.rotation.set(Math.sin(a) * .6, -a, -Math.cos(a) * .6); }
  add(g, sph(.48), mat('#8a5a32', { r: .55 }), [0, 1.95, .05]);
  add(g, sph(1), mat('#eac094'), [0, 1.88, .3], [.36, .32, .22]);
  ear(g, [-.5, 2.0, 0], [.16, .18, .08], '#8a5a32', '#eac094'); ear(g, [.5, 2.0, 0], [.16, .18, .08], '#8a5a32', '#eac094');
  eye(g, [-.16, 2.02, .4], .11); eye(g, [.16, 2.02, .4], .11);
  smile(g, [0, 1.8, .52], .1);
  tube(g, [[0, 2.42, 0], [.05, 2.6, 0], [.18, 2.7, 0]], .04, mat('#5cb85c'));
  add(g, sph(.1), mat('#8a5a32'), [-.42, 1.42, .2]); add(g, sph(.1), mat('#8a5a32'), [.42, 1.42, .2]);
  for (const [x, y] of [[-.25, .7], [.2, 1.1], [.05, .45], [-.1, 1.25]]) add(g, sph(.05), mat('#8a5a32', { r: .8 }), [x, y, Math.sqrt(Math.max(0, .42 * .42 - x * x)) + .01], [1, 1, .4]);
  cheek(g, [-.3, 1.85, .38], .08); cheek(g, [.3, 1.85, .38], .08);
  brow(g, [-.16, 2.17, .42], .1, .2); brow(g, [.16, 2.17, .42], .1, -.2);
};

B.trippi = (g) => {
  const shr = mat('#ff8a5c', { r: .35, cc: .5 });
  for (let i = 0; i < 6; i++) { const a = -.3 + i * .48, r = .62; add(g, sph(.34 - i * .035), i % 2 ? mat('#ff9f73', { r: .35, cc: .5 }) : shr, [Math.cos(a) * r - .2, 1.0 + Math.sin(a) * r * .9 - .35, 0], [1, .85, .9]); }
  add(g, cone(.28, .45, 3), shr, [-1.05, .95, 0], [1, 1, .4], [0, 0, 1.2]);
  for (let i = 0; i < 4; i++) add(g, cap(.03, .3), mat('#e86a3c'), [-.1 + i * .15, .35, .18], [1, 1, 1], [0, 0, .2]);
  const cat = mat('#ffae5c', { r: .45 });
  add(g, sph(.55), cat, [.25, 1.85, .05]);
  add(g, cone(.18, .32, 16), cat, [-.05, 2.35, 0], [1, 1, .5], [0, 0, .35]); add(g, cone(.18, .32, 16), cat, [.55, 2.35, 0], [1, 1, .5], [0, 0, -.35]);
  add(g, cone(.1, .18, 16), mat('#ffc2d1'), [-.03, 2.33, .06], [1, 1, .3], [0, 0, .35]); add(g, cone(.1, .18, 16), mat('#ffc2d1'), [.53, 2.33, .06], [1, 1, .3], [0, 0, -.35]);
  eye(g, [.08, 1.95, .46], .12); eye(g, [.42, 1.95, .46], .12);
  add(g, sph(.06), mat('#ff7a9a'), [.25, 1.8, .55]);
  for (const s of [-1, 1]) for (const dy of [0, -.06]) add(g, cyl(.008, .008, .45), mat('#3b2414'), [.25 + s * .3, 1.76 + dy, .5], [1, 1, 1], [0, 0, Math.PI / 2 + s * dy * 2]);
  tube(g, [[.05, 2.2, .2], [-.25, 2.7, .3], [-.5, 2.95, .2]], .02, mat('#e86a3c')); tube(g, [[.45, 2.2, .2], [.75, 2.7, .3], [1.0, 2.95, .2]], .02, mat('#e86a3c'));
  for (let i = 0; i < 5; i++) { const a = -.3 + i * .48 + .24, r = .62; add(g, new THREE.TorusGeometry(.26 - i * .03, .025, 8, 24), mat('#e86a3c'), [Math.cos(a) * r - .2, 1.0 + Math.sin(a) * r * .9 - .35, 0], [1, 1, 1], [0, Math.PI / 2, a]); }
  cheek(g, [0, 1.75, .44], .08); cheek(g, [.5, 1.75, .44], .08);
  add(g, cone(.2, .35, 3), mat('#ff8a5c'), [-1.1, 1.2, 0], [1, 1, .4], [0, 0, .7]);
};

B.gusini = (g) => {
  const grey = mat('#b9c2cf', { r: .3, cc: .7, metal: .2 });
  const b = new THREE.Group(); b.position.set(0, 1.0, 0); g.add(b);
  add(b, cap(.36, 1.5), grey, [0, 0, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(b, rbox(.8, .07, 2.4, .03), mat('#8a96a8', { r: .4 }), [-.1, -.05, 0], [1, 1, 1], [0, .0, 0]);
  add(b, rbox(.4, .05, .9, .03), mat('#8a96a8', { r: .4 }), [-1.0, .05, 0]);
  add(b, rbox(.4, .4, .05, .03), mat('#8a96a8'), [-1.0, .3, 0]);
  add(b, cyl(.2, .26, .4), mat('#6b7585', { metal: .5 }), [-1.2, -.05, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(b, cone(.2, .7, 24), mat('#ff8a1f', { emissive: 0xff6a00, ei: .9 }), [-1.65, -.05, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(b, cone(.12, .45, 24), mat('#ffe066', { emissive: 0xffd23f, ei: 1 }), [-1.55, -.05, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(b, sph(1), mat('#7fc4ff', { r: .1, cc: 1 }), [.45, .25, 0], [.35, .18, .25]);
  const white = mat('#ffffff', { r: .35 });
  tube(g, [[.75, 1.15, 0], [.95, 1.6, 0], [.9, 2.05, 0], [1.05, 2.3, 0]], .14, white);
  add(g, sph(.3), white, [1.1, 2.4, 0]);
  add(g, cone(.11, .38, 24), mat('#ff9a1f'), [1.48, 2.36, 0], [1, 1, .7], [0, 0, -Math.PI / 2]);
  eye(g, [1.2, 2.5, .22], .1, [.5, 0, 1]); eye(g, [1.2, 2.5, -.22], .1, [.5, 0, -1]);
  for (let i = 0; i < 4; i++) add(b, sph(.07), mat('#7fc4ff', { r: .05, cc: 1 }), [.05 - i * .22, .12, .32], [1, 1, .4]);
  add(b, rbox(.2, .075, 2.0, .02), mat('#ef5b5b'), [-.1, -.04, 0]);
  cheek(g, [1.22, 2.36, .24], .06); cheek(g, [1.22, 2.36, -.24], .06);
  for (let i = 0; i < 3; i++) add(g, cone(.05, .14, 8), white, [1.0 + i * .06, 2.65 - i * .02, 0], [1, 1, .6], [0, 0, -.6]);
};

B.jacarelogio = (g) => {
  const green = mat('#5fb24a', { r: .35, cc: .5 });
  add(g, cap(.09, .4), green, [-.3, .25, 0]); add(g, cap(.09, .4), green, [.3, .25, 0]);
  add(g, rbox(.32, .12, .45, .06), green, [-.3, .02, .08]); add(g, rbox(.32, .12, .45, .06), green, [.3, .02, .08]);
  add(g, cyl(.82, .82, .35, 64), mat('#ffd23f', { r: .3, cc: .8 }), [0, 1.2, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const ct = TEX.clock(); ct.center.set(.5, .5); ct.rotation = Math.PI / 2;
  add(g, cyl(.72, .72, .02, 64), mat('#ffffff', { map: ct, r: .4 }), [0, 1.2, .18], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const head = new THREE.Group(); head.position.set(0, 2.15, 0); g.add(head);
  add(head, cap(.32, .9), green, [0, 0, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(head, rbox(.6, .2, .45, .08), green, [.75, -.08, 0]);
  for (let i = 0; i < 6; i++) add(head, cone(.035, .1, 8), mat('#fff'), [.15 + i * .14, -.25, .2], [1, 1, 1], [Math.PI, 0, 0]);
  add(head, sph(.17), green, [-.15, .3, .16]); add(head, sph(.17), green, [.18, .3, .16]);
  eye(head, [-.15, .36, .25], .12); eye(head, [.18, .36, .25], .12);
  for (const x of [-.45, .45]) { add(g, sph(.22, 32), mat('#ffd23f', { metal: .4, r: .25 }), [x, 1.95, -.05], [1, .75, 1]); add(g, cyl(.03, .03, .15), mat('#8a96a8'), [x * .85, 1.8, -.05], [1, 1, 1], [0, 0, x > 0 ? -.6 : .6]); }
  add(head, sph(.035), mat('#1f3a1f'), [1.02, .05, .12]); add(head, sph(.035), mat('#1f3a1f'), [1.02, .05, -.12]);
  for (let i = 0; i < 5; i++) add(head, sph(.06), mat('#4a9a3a'), [-.4 + i * .2, .33, -.05], [1, .6, 1]);
  cheek(head, [-.35, .05, .3], .07);
};

B.abacatigre = (g) => {
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = t * 2.2; const r = Math.sin(Math.PI * Math.pow(t, .8)) * (.55 + .35 * (1 - t)); pts.push(new THREE.Vector2(Math.max(.001, r), y)); }
  const shell = add(g, new THREE.LatheGeometry(pts, 48), mat('#3f7a2e', { r: .55 }), [0, .1, 0]);
  const flesh = add(g, new THREE.LatheGeometry(pts, 48), mat('#d6ec8a', { map: TEX.stripes(), r: .5 }), [0, .2, .24], [.8, .9, .7]);
  add(g, sph(.36), mat('#8a5a2b', { r: .3, cc: .8 }), [0, .78, .42]);
  add(g, cone(.18, .35, 16), mat('#ff9f43'), [-.38, 2.25, 0], [1, 1, .5], [0, 0, .4]); add(g, cone(.18, .35, 16), mat('#ff9f43'), [.38, 2.25, 0], [1, 1, .5], [0, 0, -.4]);
  eye(g, [-.2, 1.55, .5], .13); eye(g, [.2, 1.55, .5], .13);
  add(g, sph(.05), mat('#ff7a9a'), [0, 1.38, .58]);
  for (const s of [-1, 1]) for (const dy of [0, -.06]) add(g, cyl(.008, .008, .4), mat('#3b2414'), [s * .3, 1.34 + dy, .55], [1, 1, 1], [0, 0, Math.PI / 2 + s * dy * 2]);
  cheek(g, [-.32, 1.42, .48], .07); cheek(g, [.32, 1.42, .48], .07);
  brow(g, [-.2, 1.73, .55], .1, .25); brow(g, [.2, 1.73, .55], .1, -.25);
};

B.vacafoguete = (g) => {
  add(g, cap(.55, 1.1), mat('#fffdf7', { map: TEX.spots(), r: .35, cc: .6 }), [0, 1.3, 0]);
  add(g, cone(.3, .45, 32), mat('#e5533d', { r: .3, cc: .7 }), [0, 2.55, 0]);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + Math.PI / 2; const f = add(g, rbox(.1, .6, .5, .04), mat('#e5533d', { r: .3, cc: .7 }), [Math.cos(a) * .6, .65, Math.sin(a) * .6]); f.rotation.y = -a; }
  add(g, cyl(.3, .38, .2, 32), mat('#8a96a8', { metal: .5, r: .3 }), [0, .3, 0]);
  add(g, cone(.3, .6, 24), mat('#ff8a1f', { emissive: 0xff6a00, ei: .9 }), [0, -.05, 0], [1, 1, 1], [Math.PI, 0, 0]);
  add(g, cone(.17, .4, 24), mat('#ffe066', { emissive: 0xffd23f, ei: 1 }), [0, .05, 0], [1, 1, 1], [Math.PI, 0, 0]);
  add(g, cone(.06, .28, 12), mat('#e8d8b0'), [-.34, 2.25, .1], [1, 1, 1], [0, 0, .6]); add(g, cone(.06, .28, 12), mat('#e8d8b0'), [.34, 2.25, .1], [1, 1, 1], [0, 0, -.6]);
  ear(g, [-.55, 1.95, 0], [.18, .1, .08], '#fffdf7', '#ffb3c6'); ear(g, [.55, 1.95, 0], [.18, .1, .08], '#fffdf7', '#ffb3c6');
  eye(g, [-.19, 1.95, .46], .13); eye(g, [.19, 1.95, .46], .13);
  add(g, sph(1), mat('#ffb3c6', { r: .4 }), [0, 1.62, .5], [.3, .19, .16]);
  add(g, sph(.04), mat('#3b2414'), [-.09, 1.64, .65]); add(g, sph(.04), mat('#3b2414'), [.09, 1.64, .65]);
  add(g, new THREE.TorusGeometry(.17, .045, 12, 32), mat('#cfd6e0', { metal: .6 }), [0, 1.1, .54]);
  add(g, cyl(.15, .15, .03, 32), mat('#7fd0ff', { r: .05, cc: 1 }), [0, 1.1, .54], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(.42, .05, 10, 40, Math.PI), mat('#e5533d'), [0, 1.42, .05], [1, 1, 1], [0, 0, Math.PI]);
  add(g, sph(.1), mat('#ffd23f', { metal: .5, r: .25 }), [0, 1.0, .55]);
  cheek(g, [-.38, 1.78, .38], .08); cheek(g, [.38, 1.78, .38], .08);
  tube(g, [[0, .9, -.55], [.15, .7, -.7], [.1, .55, -.75]], .025, mat('#fffdf7')); add(g, sph(.06), mat('#2b2b2b'), [.1, .52, -.75]);
};

B.capicake = (g) => {
  add(g, cyl(.75, .55, .8, 48), mat('#7fd0ff', { map: TEX.wrapper(), r: .5 }), [0, .4, 0]);
  const fr = mat('#ffb3d1', { r: .35, cc: .5 });
  add(g, new THREE.TorusGeometry(.62, .2, 16, 48), fr, [0, .88, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(.4, .17, 16, 48), fr, [0, 1.08, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const fur = mat('#a87445', { r: .7, cc: .05 });
  add(g, sph(1), fur, [0, 1.5, 0], [.62, .5, .55]);
  add(g, sph(1), mat('#7a4a1e', { r: .6 }), [0, 1.42, .45], [.32, .22, .18]);
  add(g, sph(.04), mat('#1d1208'), [-.09, 1.45, .62]); add(g, sph(.04), mat('#1d1208'), [.09, 1.45, .62]);
  ear(g, [-.42, 1.92, 0], [.12, .1, .08], '#8a5a32'); ear(g, [.42, 1.92, 0], [.12, .1, .08], '#8a5a32');
  eye(g, [-.26, 1.68, .42], .1); eye(g, [.26, 1.68, .42], .1);
  add(g, sph(.17), mat('#e5533d', { r: .2, cc: 1 }), [0, 2.1, 0]);
  tube(g, [[0, 2.22, 0], [.06, 2.4, 0], [.16, 2.5, 0]], .025, mat('#3f7a2e'));
  for (let i = 0; i < 22; i++) { const a = i * 2.39, r = .45 + (i % 3) * .12; const sp = add(g, cap(.018, .06), mat(C3[i % C3.length], { r: .4 }), [Math.cos(a) * r, .98 + (i % 2) * .08, Math.sin(a) * r]); sp.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); }
  for (const s of [-1, 1]) for (const dy of [0, -.05]) add(g, cyl(.006, .006, .35), mat('#3b2414'), [s * .3, 1.42 + dy, .56], [1, 1, 1], [0, 0, Math.PI / 2 + s * dy * 2]);
  cheek(g, [-.4, 1.5, .4], .08); cheek(g, [.4, 1.5, .4], .08);
  for (const x of [-.25, .25]) add(g, sph(.08), mat('#8a5a32'), [x, 1.05, .48], [1, .7, .7]);
};

export const LISTA = [
  { id: 'tung', nome: 'Tung Tung Tung Sahur', privado: true },
  { id: 'tralalero', nome: 'Tralalero Tralala', privado: true },
  { id: 'cocofanto', nome: 'Cocofanto Elefanto', privado: true },
  { id: 'ballerina', nome: 'Ballerina Cappuccina', privado: true },
  { id: 'bombardiro', nome: 'Bombardiro Crocodilo', privado: true },
  { id: 'patapim', nome: 'Brr Brr Patapim', privado: true },
  { id: 'lirili', nome: 'Lirilì Larilà', privado: true },
  { id: 'chimpanzini', nome: 'Chimpanzini Bananini', privado: true },
  { id: 'trippi', nome: 'Trippi Troppi', privado: true },
  { id: 'gusini', nome: 'Bombombini Gusini', privado: true },
  { id: 'jacarelogio', nome: 'Jacarelógio' },
  { id: 'abacatigre', nome: 'Abacatigre' },
  { id: 'vacafoguete', nome: 'Vaca Foguete' },
  { id: 'capicake', nome: 'Capivara Cupcake' },
];

export function build(id) { const g = new THREE.Group(); (B[id] || (() => {}))(g); return g; }
