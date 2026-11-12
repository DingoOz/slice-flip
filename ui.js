'use strict';
function btn(x, y, w, h, label, fn, { c = '#ff8a3d', fs = 26, dis = false } = {}) {
  ctx.fillStyle = 'rgba(40,20,60,.35)'; rr(x, y + 5, w, h, 14); ctx.fill();
  ctx.fillStyle = dis ? '#9a96aa' : c; rr(x, y, w, h, 14); ctx.fill();
  text(label, x + w / 2, y + h / 2, fs);
  if (!dis) G.buttons.push({ x, y, w, h, fn });
}
function coinBadge(x, y, n, align = 'left') {
  ctx.fillStyle = '#ffcf33'; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c98b00'; ctx.lineWidth = 3; ctx.stroke();
  text(fmt(n), align === 'left' ? x + 20 : x - 20, y, 24, '#fff', align);
}
function toggleSound() { G.save.sound = !G.save.sound; AU.setOn(G.save.sound); writeSave(); }

const UI = {
  menu() {
    text('SLICE FLIP', W / 2, 110, 86, '#fff');
    drawKnife({ x: W / 2, y: 205, a: Math.sin(G.t * 2) * 0.3 }, SKINS[G.save.skin], 2);
    const s = G.save;
    const pick = d => { s.pick = Math.min(99, Math.max(1, s.pick + d)); writeSave(); };
    btn(W / 2 - 220, 260, 60, 64, '◀', () => pick(-1), { c: '#ff9f1c', fs: 28 });
    btn(W / 2 - 150, 260, 300, 64, 'PLAY  ·  LEVEL ' + s.pick, () => startLevel(s.pick), { fs: 28 });
    btn(W / 2 + 160, 260, 60, 64, '▶', () => pick(1), { c: '#ff9f1c', fs: 28 });
    btn(W / 2 - 150, 336, 145, 54, 'LEVELS', () => (G.mode = 'levels'), { c: '#3a86ff', fs: 22 });
    btn(W / 2 + 5, 336, 145, 54, 'SHOP', () => (G.mode = 'shop'), { c: '#8d3cff', fs: 22 });
    btn(W / 2 - 150, 400, 300, 54, 'ENDLESS' + (s.endless ? '  ·  BEST ' + s.endless : ''), () => startLevel(1, { endless: true }), { c: '#e05a3a', fs: 22 });
    btn(W - 74, 18, 56, 44, s.sound ? '♪' : '×', toggleSound, { c: '#5d6275', fs: 24 });
    coinBadge(34, 40, s.coins);
    text('Space · Click · Tap to flip', W / 2, 505, 18, '#fff');
  },
  levels() {
    text('LEVELS', W / 2, 60, 50);
    for (let i = 1; i <= 15; i++) {
      const c = (i - 1) % 5, r = ((i - 1) / 5) | 0, x = 150 + c * 136, y = 110 + r * 116;
      btn(x, y, 116, 96, String(i), () => { G.save.pick = i; writeSave(); startLevel(i); }, { c: i === G.save.pick ? '#ff9f1c' : '#3a86ff', fs: 36 });
      if (G.save.best[i]) text('★ ' + fmt(G.save.best[i]), x + 58, y + 82, 14, '#ffe14d');
    }
    btn(30, 470, 140, 50, 'BACK', () => (G.mode = 'menu'), { c: '#5d6275', fs: 22 });
  },
  shop() {
    text('KNIFE SHOP', W / 2, 46, 44);
    coinBadge(W - 40, 46, G.save.coins, 'right');
    SKINS.forEach((sk, i) => {
      const c = i % 3, r = (i / 3) | 0, x = 90 + c * 270, y = 86 + r * 124;
      const owned = G.save.owned.includes(i), on = G.save.skin === i, afford = G.save.coins >= sk.cost;
      ctx.fillStyle = on ? '#fff6c9' : 'rgba(255,255,255,.75)'; rr(x, y, 240, 110, 14); ctx.fill();
      if (on) { ctx.strokeStyle = '#ff9f1c'; ctx.lineWidth = 4; ctx.stroke(); }
      drawKnife({ x: x + 120, y: y + 34, a: 0 }, sk, 1.3);
      text(sk.name, x + 120, y + 66, 17, '#3a2d4f', 'center', false);
      const label = on ? 'EQUIPPED' : owned ? 'EQUIP' : fmt(sk.cost);
      btn(x + 60, y + 78, 120, 26, label, () => {
        if (!owned) { G.save.coins -= sk.cost; G.save.owned.push(i); }
        G.save.skin = i; writeSave();
      }, { c: owned ? '#3cc46b' : '#ff9f1c', fs: 15, dis: on || (!owned && !afford) });
    });
    btn(30, 470, 140, 50, 'BACK', () => (G.mode = 'menu'), { c: '#5d6275', fs: 22 });
  },
};

function hud() {
  coinBadge(34, 36, G.coins);
  const name = G.endless ? 'ENDLESS ' + G.level : G.bonus ? 'BONUS STAGE' : 'LEVEL ' + G.level;
  text(name, W / 2, 34, 26);
  if (G.combo >= 2) text(`COMBO ${G.combo}  ×${1 + Math.min(4, Math.floor(G.combo / 3))}`, W / 2, 68, 20, '#ffe14d');
  const best = G.endless ? G.save.endless : G.save.best[G.level];
  if (best && !G.bonus) text((G.endless ? 'BEST STAGE ' : 'BEST ') + fmt(best), 24, 74, 16, '#fff', 'left');
  // progress bar towards the pillar
  ctx.fillStyle = 'rgba(40,20,60,.3)'; rr(W / 2 - 120, 88, 240, 8, 4); ctx.fill();
  ctx.fillStyle = '#fff'; rr(W / 2 - 120, 88, 240 * Math.min(1, G.k.x / G.L.len), 8, 4); ctx.fill();
  btn(W - 70, 14, 52, 44, '☰', () => (G.mode = 'menu'), { c: '#5d6275', fs: 24 });
}

function overlay() {
  if (G.mode === 'play' && !G.started) text('TAP TO FLIP!', W / 2, 200, 44, '#fff');
  if (G.mode === 'dead') {
    ctx.fillStyle = 'rgba(60,0,30,.45)'; ctx.fillRect(0, 0, W, H);
    text('SPIKED!', W / 2, 200, 76, '#ff7ab8');
    if (G.coins) text('Lost ' + fmt(G.coins) + ' coins', W / 2, 270, 26);
    text('Tap to retry', W / 2, 330, 26, '#fff');
  }
  if (G.mode === 'win') {
    const r = G.result;
    ctx.fillStyle = 'rgba(30,20,60,.4)'; ctx.fillRect(0, 0, W, H);
    text(r.bonus ? 'BONUS STAGE!' : r.label, W / 2, 180, 80, OP_COLORS[r.op]);
    text(r.bonus ? 'Banked ' + fmt(r.after) : fmt(r.before) + '  →  ' + fmt(r.after), W / 2, 260, 36);
    coinBadge(W / 2 - 60, 315, G.save.coins);
    text('Tap to continue', W / 2, 370, 26);
  }
}

function pointer(x, y) {
  for (const b of G.buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { AU.init(); AU.click(); b.fn(); return true; }
  }
  return false;
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  if (!pointer((e.clientX - r.left) / SCALE, (e.clientY - r.top) / SCALE)) action();
});
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (e.repeat) return; // holding does nothing
    if (G.mode === 'menu') { AU.init(); startLevel(G.save.pick); } else action();
  } else if (e.code === 'Escape') G.mode = 'menu';
  else if (G.mode === 'menu' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { G.save.pick = Math.min(99, Math.max(1, G.save.pick + (e.code === 'ArrowLeft' ? -1 : 1))); writeSave(); }
  else if (e.code === 'KeyM') toggleSound();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  if (G.mode === 'menu' || G.mode === 'levels' || G.mode === 'shop') { G.t += dt; G.cam += dt * 60; G.bonus = false; }
  else update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Camera debug panel: press ` (backtick) to toggle. Values persist in this browser only.
const dbg = document.getElementById('dbg');
try { Object.assign(CAM, JSON.parse(localStorage.getItem('sliceflip.cam') || '{}')); } catch (e) { /* ignore */ }
function syncDbg() {
  dbg.querySelectorAll('input').forEach(i => { i.value = CAM[i.dataset.k]; i.nextElementSibling.textContent = CAM[i.dataset.k] + (i.dataset.k === 'dist' ? '' : '°'); });
  dbg.querySelector('code').textContent = `const CAM = { pitch: ${CAM.pitch}, yaw: ${CAM.yaw}, dist: ${CAM.dist} };`;
}
dbg.addEventListener('input', e => {
  CAM[e.target.dataset.k] = +e.target.value; syncDbg();
  try { localStorage.setItem('sliceflip.cam', JSON.stringify(CAM)); } catch (err) { /* ignore */ }
});
dbg.addEventListener('keydown', e => { if (e.code === 'Space') e.target.blur(); }); // keep Space for flipping
addEventListener('keydown', e => {
  if (e.key === '`') { dbg.style.display = dbg.style.display === 'block' ? 'none' : 'block'; syncDbg(); }
});
syncDbg();
