'use strict';
const W = 960, H = 540, GROUND = 470;

const SKINS = [
  { name: 'Kitchen Knife', cost: 0, blade: '#d8dee6', edge: '#ffffff', handle: '#5b3a29', trail: null },
  { name: 'Neon Blade', cost: 5000, blade: '#39ff9f', edge: '#eafff4', handle: '#1a1a2e', trail: '#39ff9f', glow: true },
  { name: 'Wooden Cleaver', cost: 12000, blade: '#a0703c', edge: '#e2bf8f', handle: '#4a2c14', trail: '#c89b6a', wide: true },
  { name: 'Ice Shard', cost: 25000, blade: '#bfefff', edge: '#ffffff', handle: '#4a7fa8', trail: '#dff7ff', glow: true },
  { name: 'Flame Edge', cost: 40000, blade: '#ff7a1a', edge: '#ffe066', handle: '#3a1208', trail: '#ff9a2a', glow: true },
  { name: 'Golden Edge', cost: 65000, blade: '#ffd23f', edge: '#fff6c9', handle: '#7a4e00', trail: '#ffe680' },
  { name: 'Cyber Dagger', cost: 90000, blade: '#00e5ff', edge: '#ff2bd6', handle: '#161625', trail: '#ff2bd6', glow: true },
  { name: 'Galaxy Saber', cost: 130000, blade: '#7b5cff', edge: '#e0d7ff', handle: '#20124d', trail: '#ffffff', stars: true, glow: true },
  { name: 'Void Splitter', cost: 180000, blade: '#1a0024', edge: '#b14dff', handle: '#000000', trail: '#6a00ff', glow: true },
];

// k = 3D model kind (fruit.js), c = juice colour, r = hitbox radius
const FRUITS = [
  { k: 'apple', c: '#fff1c9', v: 10, r: 22 }, { k: 'orange', c: '#ffa733', v: 15, r: 23 },
  { k: 'watermelon', c: '#ff4d5e', v: 30, r: 32 }, { k: 'banana', c: '#fff3c4', v: 20, r: 26 },
  { k: 'grapes', c: '#9b5de5', v: 25, r: 22 }, { k: 'lemon', c: '#fff36b', v: 12, r: 20 },
];

const OPS = {
  '+': (a, b) => a + b, '×': (a, b) => a * b,
  '−': (a, b) => a - b, '÷': (a, b) => a / b,
};
const OP_COLORS = { '+': '#3cc46b', '×': '#ff9f1c', '−': '#e05a3a', '÷': '#3a86ff', BONUS: '#8d3cff' };

// Deterministic RNG so each level number always builds the same layout.
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ponytail: levels are seeded-procedural, not hand-placed; swap in hand-built objs arrays per level if needed.
function makeLevel(n, bonus, seed) {
  const R = rng(seed), d = bonus ? 0 : Math.min(1.3, (n - 1) / 14);
  const mul = bonus ? 3 : 1, objs = [];
  const len = bonus ? 2200 : 2400 + Math.min(n, 20) * 220;
  const fruit = (x, y) => {
    const f = FRUITS[(R() * FRUITS.length) | 0], s = f.r * 2;
    objs.push({ t: 'slice', shape: 'ball', x: x - f.r, y: y - f.r, w: s, h: s, c: f.c, k: f.k, v: f.v * mul });
  };
  const box = (x, y, s) => objs.push({ t: 'slice', shape: 'box', x, y, w: s, h: s, c: '#e8a35c', v: 20 * mul });
  const spike = (x, y, w, h, kind) => objs.push({ t: 'spike', kind, ground: kind === 'up', x, y, w, h });

  let x = 650;
  while (x < len - 350) {
    const r = R();
    if (bonus || r < 0.4 - d * 0.15) { // arc of fruit
      const k = 2 + ((R() * 4) | 0), y0 = 200 + R() * 220;
      for (let i = 0; i < k; i++) fruit(x + i * 55, y0 - Math.sin((i / (k - 1)) * Math.PI) * 60);
      if (bonus) for (let i = 0; i < k; i++) fruit(x + i * 55, y0 + 90);
      x += k * 55;
    } else if (r < 0.6) { // ground spikes, fruit above
      const w = 60 + R() * (60 + d * 120);
      spike(x, GROUND - 26, w, 26, 'up');
      fruit(x + w / 2, GROUND - 130 - R() * 80);
      x += w;
    } else if (r < 0.72) { // hanging ceiling spikes
      const h = 120 + R() * (80 + d * 110), w = 50 + R() * 40;
      spike(x, 0, w, h, 'down');
      fruit(x + w / 2, h + 60 + R() * 60);
      x += w;
    } else if (r < 0.85) { // stack of crates, maybe hiding spikes underneath
      const s = 44, k = 2 + ((R() * 3) | 0), hide = d > 0.25 ? 18 : 0;
      if (hide) spike(x, GROUND - hide, s, hide, 'up');
      for (let i = 0; i < k; i++) box(x, GROUND - hide - s * (i + 1), s);
      x += s;
    } else if (r < 0.93) { // solid stone block (bounces the knife)
      const y = 180 + R() * 180;
      objs.push({ t: 'solid', x, y, w: 40, h: 100 });
      fruit(x + 20, y - 60);
      x += 40;
    } else { // floating pink slab
      const y = 220 + R() * 150, w = 100 + R() * 80 * (1 + d);
      spike(x, y, w, 20, 'slab');
      fruit(x + w / 2, y - 50); fruit(x + w / 2, y + 75);
      x += w;
    }
    x += bonus ? 60 + R() * 80 : 320 - d * 120 + R() * 160;
  }

  // End pillar: a full-height column of targets, BONUS (smallest) at the top.
  const pool = bonus
    ? [['×', 2], ['×', 3], ['×', 2], ['×', 3]]
    : [['×', 2], ['×', 3], ['×', 5], ['+', 50], ['+', 100], ['+', 200], ['−', 100], ['−', 50], ['÷', 2], ['÷', 3]];
  for (let i = pool.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const picks = bonus ? pool : pool.slice(0, 7);
  const topH = 44, rest = (GROUND - topH) / picks.length, px = len;
  objs.push(bonus
    ? { t: 'target', op: '×', n: 4, label: '×4', x: px, y: 0, w: 120, h: topH }
    : { t: 'target', op: 'BONUS', label: 'BONUS', x: px, y: 0, w: 120, h: topH });
  picks.forEach(([op, v], i) =>
    objs.push({ t: 'target', op, n: v, label: op + v, x: px, y: topH + i * rest, w: 120, h: rest }));
  return { objs, len };
}

function applyOp(o, coins) { return Math.max(0, Math.floor(OPS[o.op](coins, o.n))); }

if (typeof module !== 'undefined') module.exports = { makeLevel, applyOp, GROUND, SKINS };
