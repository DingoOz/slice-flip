// Headless self-check: node test.js
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const ctx = { AU: new Proxy({}, { get: () => () => {} }), localStorage: { getItem: () => null, setItem() {} }, Math, JSON, console };
vm.createContext(ctx);
for (const f of ['levels.js', 'game.js']) vm.runInContext(fs.readFileSync(f, 'utf8').replace(/^const /gm, 'var '), ctx);
vm.runInContext(`
  for (let n = 1; n <= 20; n++) for (const b of [false, true]) {
    const L = makeLevel(n, b, n * 31), t = L.objs.filter(o => o.t === 'target');
    const bottom = Math.max(...t.map(o => o.y + o.h));
    if (t[0].y !== 0 || Math.abs(bottom - GROUND) > 1e-6) throw Error('pillar gap level ' + n);
  }
  startLevel(1); flip();
  for (let i = 0; i < 30; i++) update(1 / 60);
  if (G.k.spin !== 0 || G.k.a !== 0) throw Error('flip did not finish upright');
  if (G.k.y >= GROUND - 3) throw Error('flip did not lift knife');
  // dumb bot taps at varying heights; a run must end (spiked or pillar), never stall
  startLevel(1); let steps = 0;
  while (G.mode === 'play' && steps++ < 60 * 120) { if (G.k.y > 150 + (steps * 7919 % 300) && G.k.vy >= 0) flip(); update(1 / 60); }
  if (G.mode === 'play') throw Error('run never ended at x=' + G.k.x + ' y=' + G.k.y + ' vx=' + G.k.vx + ' near=' + JSON.stringify(G.L.objs.filter(o => !o.dead && Math.abs(o.x - G.k.x) < 150)));
  result = G.mode + ' at x=' + Math.round(G.k.x) + ' coins=' + G.coins;
`, ctx);
console.log('ok:', ctx.result);
