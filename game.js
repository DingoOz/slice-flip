'use strict';
const SPEED = 270, JUMP = 620, GRAV = 1750, SPIN_RATE = (Math.PI * 2) / 0.42;
const KL = 92, HANDLE = 34, TAU = Math.PI * 2, SAVE_KEY = 'sliceflip.v1';

function defSave() { return { coins: 0, owned: [0], skin: 0, max: 1, pick: 1, best: {}, endless: 0, sound: true }; }
function loadSave() {
  try { return Object.assign(defSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); }
  catch (e) { return defSave(); }
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { /* private mode */ } }

const G = {
  mode: 'menu', save: loadSave(), level: 1, bonus: false, endless: false, seed: 0, L: null, k: null,
  coins: 0, combo: 0, pieces: [], parts: [], texts: [], cam: 0, shake: 0, t: 0, endT: 0,
  result: null, started: false, buttons: [],
};

function startLevel(n, opts = {}) {
  G.level = n; G.bonus = !!opts.bonus; G.endless = !!opts.endless;
  G.seed = opts.seed ?? (G.endless ? (Math.random() * 1e9) | 0 : n * 7919 + (G.bonus ? 77 : 13));
  G.L = makeLevel(G.endless ? 15 + n : n, G.bonus, G.seed);
  G.k = { x: 140, y: GROUND - 3, vx: 0, vy: 0, a: 0, spin: 0, cool: 0 };
  Object.assign(G, { coins: 0, combo: 0, pieces: [], parts: [], texts: [], cam: 0, mode: 'play', started: false, result: null });
}
function restart() { startLevel(G.level, { bonus: G.bonus, endless: G.endless, seed: G.seed }); }
function next() {
  if (G.result.bonus) startLevel(G.level, { bonus: true, endless: G.endless });
  else startLevel(G.level + 1, { endless: G.endless });
}

function knifePts(k) {
  const c = Math.cos(k.a), s = Math.sin(k.a), out = [];
  for (let i = 0; i <= 8; i++) {
    const d = -KL / 2 + (KL * i) / 8;
    out.push({ x: k.x + c * d, y: k.y + s * d, blade: d > -KL / 2 + HANDLE });
  }
  return out;
}

function inside(p, o) {
  const m = o.t === 'spike' ? 5 : 0, bottom = o.y + o.h + (o.ground ? 30 : -m);
  return p.x > o.x + m && p.x < o.x + o.w - m && p.y > o.y + m && p.y < bottom;
}

function flip() {
  const k = G.k;
  G.started = true; k.vy = -JUMP; k.vx = SPEED;
  // Queue enough spin to finish upright (blade forward), at least one full turn beyond now.
  const end = k.a + k.spin;
  let rem = (TAU - (((end % TAU) + TAU) % TAU)) % TAU;
  if (rem < Math.PI) rem += TAU;
  k.spin += rem;
  if (k.spin > 2 * TAU) k.spin -= TAU;
  AU.whoosh();
}

function burst(x, y, c, n, sp = 260) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = Math.random() * sp;
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.5 + Math.random() * 0.4, c, r: 2 + Math.random() * 4, g: 1 });
  }
}

function slice(o) {
  const k = G.k;
  o.dead = true; G.combo++;
  const mult = 1 + Math.min(4, Math.floor(G.combo / 3)), gain = o.v * mult;
  G.coins += gain;
  for (const s of [-1, 1]) {
    G.pieces.push({ x: o.x + o.w / 2, y: o.y + o.h / 2, vx: k.vx * 0.3 + s * 90, vy: -160 - Math.random() * 120,
      a: k.a, va: s * 6, w: o.w, h: o.h, c: o.c, k: o.k, shape: o.shape, side: s, life: 2 });
  }
  burst(o.x + o.w / 2, o.y + o.h / 2, o.c, 14);
  G.texts.push({ x: o.x + o.w / 2, y: o.y, s: '+' + gain, life: 0.8 });
  AU.slice(G.combo);
}

function bounce() {
  const k = G.k;
  k.vx = -SPEED * 0.6; k.vy = Math.max(k.vy, 0); k.spin = 0; k.x -= 8; k.cool = 0.3;
  AU.thunk();
}

function die() {
  G.mode = 'dead'; G.endT = G.t; G.shake = 14; G.k.vx = 0;
  burst(G.k.x, G.k.y, '#ff2e88', 26, 340);
  AU.clack();
}

function win(o) {
  const k = G.k;
  G.mode = 'win'; G.endT = G.t;
  Object.assign(k, { vx: 0, vy: 0, spin: 0, a: 0, x: o.x + 22 - KL / 2 });
  burst(o.x, k.y, OP_COLORS[o.op], 30, 320);
  AU.win();
  const s = G.save, after = o.op === 'BONUS' ? G.coins : applyOp(o, G.coins);
  G.result = { bonus: o.op === 'BONUS', before: G.coins, after, label: o.label, op: o.op };
  s.coins += after;
  if (G.endless) s.endless = Math.max(s.endless, G.level);
  else if (!G.bonus) {
    s.max = Math.max(s.max, G.level + 1);
    s.pick = G.level + 1; // menu's Play continues from the next level
    s.best[G.level] = Math.max(s.best[G.level] || 0, after);
  }
  writeSave();
}

function stepFx(dt) {
  for (const p of G.pieces) { p.vy += GRAV * 0.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; p.life -= dt; }
  for (const p of G.parts) { p.vy += 900 * p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  for (const t of G.texts) { t.y -= 60 * dt; t.life -= dt; }
  G.pieces = G.pieces.filter(p => p.life > 0 && p.y < H + 100);
  G.parts = G.parts.filter(p => p.life > 0);
  G.texts = G.texts.filter(t => t.life > 0);
}

function trail(k) {
  const sk = SKINS[G.save.skin];
  if (!sk.trail) return;
  const c = Math.cos(k.a), s = Math.sin(k.a), d = KL / 4;
  G.parts.push({ x: k.x + c * d, y: k.y + s * d, vx: -k.vx * 0.2 + (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
    life: 0.35, c: sk.stars && Math.random() < 0.5 ? '#ffe9a8' : sk.trail, r: 2 + Math.random() * 3, g: 0 });
}

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 40);
  stepFx(dt);
  if (G.mode !== 'play' || !G.started) return;
  const k = G.k;
  k.vy = Math.min(k.vy + GRAV * dt, 1100);
  k.vx += (SPEED - k.vx) * Math.min(1, dt * 1.2);
  k.x += k.vx * dt; k.y += k.vy * dt; k.cool -= dt;
  if (k.spin > 0) {
    const s = Math.min(k.spin, SPIN_RATE * dt);
    k.a += s; k.spin -= s;
    if (k.spin <= 1e-6) { k.spin = 0; k.a = 0; }
  }
  let pts = knifePts(k);
  const ys = pts.map(p => p.y), maxY = Math.max(...ys), minY = Math.min(...ys);
  if (maxY > GROUND) {
    k.y -= maxY - GROUND;
    if (k.vy > 0) k.vy = k.vy > 300 ? -k.vy * 0.3 : 0;
    if (!k.spin) k.a += (Math.round(k.a / TAU) * TAU - k.a) * Math.min(1, dt * 8); // settle flat
    G.combo = 0;
  }
  if (minY < 0) { k.y -= minY; k.vy = Math.max(0, k.vy); }
  pts = knifePts(k);
  trail(k);
  for (const o of G.L.objs) {
    if (o.dead || o.x > k.x + KL || o.x + o.w < k.x - KL) continue;
    const p = pts.find(q => q.blade && inside(q, o)) || pts.find(q => inside(q, o));
    if (!p) continue;
    if (o.t === 'spike') { die(); return; }
    if (o.t === 'slice' && p.blade) { slice(o); continue; }
    if (o.t === 'target' && p.blade) { win(o); return; }
    if (k.cool <= 0) bounce();
  }
  G.cam = Math.max(0, k.x - 280);
}

function action() {
  AU.init();
  if (G.mode === 'play') flip();
  else if (G.mode === 'dead' && G.t - G.endT > 0.4) restart();
  else if (G.mode === 'win' && G.t - G.endT > 0.6) next();
}

if (typeof module !== 'undefined') module.exports = { G, startLevel, update, flip, knifePts };
