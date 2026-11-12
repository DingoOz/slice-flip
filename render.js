'use strict';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let SCALE = 1;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  SCALE = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = W * SCALE + 'px'; cv.style.height = H * SCALE + 'px';
  cv.width = Math.round(W * SCALE * dpr); cv.height = Math.round(H * SCALE * dpr);
  renderer.setPixelRatio(Math.min(dpr, 2)); // ponytail: cap for weak GPUs; lower to 1 if laggy
  renderer.setSize(W * SCALE, H * SCALE);
}
addEventListener('resize', resize); resize();

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function text(s, x, y, size, color = '#fff', align = 'center', outline = true) {
  ctx.font = `900 ${size}px system-ui, "Ubuntu", sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (outline) { ctx.lineWidth = size / 6; ctx.strokeStyle = 'rgba(40,20,60,.75)'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
const fmt = n => Math.floor(n).toLocaleString('en-US');

function drawKnife(k, sk, scale = 1) {
  const h0 = -KL / 2, b0 = h0 + HANDLE, tip = KL / 2, bh = sk.wide ? 22 : 14;
  ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.a); ctx.scale(scale, scale);
  if (sk.glow) { ctx.shadowColor = sk.trail; ctx.shadowBlur = 14; }
  ctx.fillStyle = sk.blade; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(b0, -7); ctx.lineTo(tip, -7);
  ctx.quadraticCurveTo(tip - 18, bh - 7, b0, bh - 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = sk.edge; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(tip - 3, -6); ctx.quadraticCurveTo(tip - 18, bh - 9, b0 + 4, bh - 9); ctx.stroke();
  ctx.fillStyle = sk.handle; rr(h0, -6, HANDLE, 12, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(h0 + 6, -4, HANDLE - 12, 2);
  ctx.fillStyle = '#4a4a55'; rr(b0 - 3, -10, 6, 20, 2); ctx.fill();
  ctx.restore();
}


let camX = 0;
const pieceMeshes = new Map(), tmpV = new THREE.Vector3(), tmpC = new THREE.Color();

function toScreen(x, y) { // game coords -> overlay coords
  tmpV.set(x, Y(y), 0).project(camera);
  return [(tmpV.x + 1) * W / 2, (1 - tmpV.y) * H / 2];
}

function pieceMesh(p) {
  const m = p.shape === 'ball' ? fruitModel(p.k, p.w / 2, p.side) : mesh(GEO.box, MAT.crate, p.w / 2, p.h, p.w, 0, 0);
  scene.add(m); return m;
}

function sync3D() {
  if (!G.L) startLevel(1), G.mode = 'menu'; // menu backdrop
  if (builtFor !== G.L) { buildLevel(G.L); pieceMeshes.forEach(m => scene.remove(m)); pieceMeshes.clear(); }
  if (knifeSkin !== G.save.skin) { knifeSkin = G.save.skin; buildKnife(SKINS[knifeSkin]); }
  for (const o of G.L.objs) { o.mesh.visible = !o.dead; if (o.shape === 'ball') o.mesh.rotation.y = o.x + G.t * 0.8; }
  const k = G.k, playing = G.mode === 'play' || G.mode === 'dead' || G.mode === 'win';
  knife.visible = G.mode !== 'dead';
  knife.position.set(k.x, Y(k.y), 0); knife.rotation.z = -k.a;
  // halves of sliced objects
  const live = new Set(G.pieces);
  for (const [p, m] of pieceMeshes) if (!live.has(p)) { scene.remove(m); pieceMeshes.delete(p); } // geometries are shared, nothing to dispose
  for (const p of G.pieces) {
    if (!pieceMeshes.has(p)) pieceMeshes.set(p, pieceMesh(p));
    const m = pieceMeshes.get(p);
    m.position.set(p.x + (p.shape === 'ball' ? 0 : p.side * p.w / 4), Y(p.y), p.side * 10);
    m.rotation.set(0, 0, -p.a);
  }
  const n = Math.min(MAXP, G.parts.length);
  for (let i = 0; i < n; i++) {
    const p = G.parts[i];
    pPos.set([p.x, Y(p.y), (i % 7 - 3) * 4], i * 3);
    tmpC.set(p.c); pCol.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
  }
  pGeo.setDrawRange(0, n);
  pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = true;
  // camera: follows the knife, pitched down 45 degrees
  const want = playing ? k.x + 190 : G.cam + 300;
  camX += (want - camX) * (playing && G.started && Math.abs(want - camX) < 400 ? 0.12 : 1);
  const sh = (Math.random() - 0.5) * G.shake, ty = GROUND / 2;
  const P = CAM.pitch * Math.PI / 180, Yw = CAM.yaw * Math.PI / 180, flat = CAM.dist * Math.cos(P);
  camera.position.set(camX - flat * Math.sin(Yw) + sh, ty + CAM.dist * Math.sin(P) + sh, flat * Math.cos(Yw));
  camera.lookAt(camX, ty, 0);
  sun.position.set(camX - 500, 900, 500); sun.target.position.set(camX, 0, 0);
  scene.background.set(G.bonus ? '#ffe9a8' : '#bfe3ff');
  scene.fog.color.copy(scene.background);
}

function render() {
  sync3D();
  renderer.render(scene, camera);
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(SCALE * dpr, 0, 0, SCALE * dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  G.buttons = [];
  if (G.mode === 'play' || G.mode === 'dead' || G.mode === 'win') {
    for (const t of G.texts) { ctx.globalAlpha = Math.min(1, t.life * 2); const [x, y] = toScreen(t.x, t.y); text(t.s, x, y, 22, '#ffe14d'); }
    ctx.globalAlpha = 1;
    hud(); overlay();
  } else {
    if (G.mode !== 'menu') { ctx.fillStyle = 'rgba(30,20,60,.35)'; ctx.fillRect(0, 0, W, H); }
    UI[G.mode]();
  }
}
