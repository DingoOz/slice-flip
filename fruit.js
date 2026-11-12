'use strict';
// 3D fruit models. fruitModel(kind, r, part): part 0 = whole, -1 / +1 = left / right half after a slice.
// Models are centred on the fruit's centre and sized to radius r (the hitbox half-width).
const FRUIT_MAT = {}, FRUIT_GEO = {};
const fmat = (c, o = {}) => FRUIT_MAT[c + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...o });
const fgeo = (key, make) => FRUIT_GEO[key] ||= make();
const stemGeo = () => fgeo('stem', () => new THREE.CylinderGeometry(0.06, 0.08, 1, 6));

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const TEX = {
  peel: canvasTex(128, 128, (g, w, h) => { // dimples for citrus (bump map)
    g.fillStyle = '#888'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? '#666' : '#aaa'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }),
  melon: canvasTex(256, 64, (g, w, h) => { // dark jagged stripes running top to bottom
    g.fillStyle = '#6fbf4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f6b2a';
    for (let s = 0; s < 10; s++) {
      g.beginPath(); const x0 = s * w / 10;
      for (let y = 0; y <= h; y += 4) g.lineTo(x0 + Math.sin(y * 0.6 + s) * 3, y);
      for (let y = h; y >= 0; y -= 4) g.lineTo(x0 + 12 + Math.sin(y * 0.5 + s) * 3, y);
      g.fill();
    }
  }),
  melonCut: canvasTex(128, 128, (g, w, h) => { // red flesh, white rind ring, seeds
    g.fillStyle = '#1f6b2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f7d0'; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill();
    g.fillStyle = '#ff4d5e'; g.beginPath(); g.arc(64, 64, 55, 0, TAU); g.fill();
    g.fillStyle = '#2a1a1a';
    for (let i = 0; i < 18; i++) { const a = i * 2.4, d = 18 + (i % 3) * 11; g.beginPath(); g.ellipse(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 2.5, 4.5, a, 0, TAU); g.fill(); }
  }),
};

const FRUIT_KINDS = {
  apple: { skin: () => fmat('#e8322f', { roughness: 0.35 }), flesh: '#fff1c9', s: [1, 0.92, 1] },
  orange: { skin: () => fmat('#ff9a1f', { roughness: 0.85, bumpMap: TEX.peel, bumpScale: 1.5 }), flesh: '#ffb347', s: [1, 1, 1] },
  watermelon: { skin: () => fmat('#ffffff', { map: TEX.melon, roughness: 0.4 }), flesh: 'melon', s: [1.08, 1, 1] },
  lemon: { skin: () => fmat('#ffe23a', { roughness: 0.8, bumpMap: TEX.peel, bumpScale: 1 }), flesh: '#fff7b0', s: [1.2, 0.88, 0.88] },
};

function halfSphere(skin, flesh, part) {
  const g = new THREE.Group();
  // SphereGeometry has x = -cos(phi)·sin(theta): phi from -π/2 gives the x ≤ 0 half.
  const geo = part ? fgeo('hemi' + part, () => new THREE.SphereGeometry(1, 24, 16, part < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI))
    : fgeo('sphere', () => new THREE.SphereGeometry(1, 24, 16));
  g.add(mesh(geo, skin, 1, 1, 1, 0, 0));
  if (part) {
    const capMat = flesh === 'melon' ? fmat('#ffffff', { map: TEX.melonCut }) : fmat(flesh);
    const cap = mesh(fgeo('cap', () => new THREE.CircleGeometry(0.99, 24)), capMat, 1, 1, 1, 0, 0);
    cap.rotation.y = part < 0 ? Math.PI / 2 : -Math.PI / 2; // face the cut outward
    g.add(cap);
  }
  return g;
}

function stemLeaf(g, r, x = 0) {
  g.add(mesh(stemGeo(), fmat('#6b4423'), r, r * 0.35, r, x, r * 0.98));
  const leaf = mesh(GEO.ball, fmat('#4caf50'), r * 0.32, r * 0.08, r * 0.16, x + r * 0.22, r * 1.05);
  leaf.rotation.z = 0.5; g.add(leaf);
}

class BananaArc extends THREE.Curve {
  constructor(a0, a1) { super(); this.a0 = a0; this.a1 = a1; }
  getPoint(t, out = new THREE.Vector3()) {
    const a = this.a0 + (this.a1 - this.a0) * t;
    return out.set(Math.sin(a) * 1.15, 0.55 - Math.cos(a) * 1.15, 0); // a smile-shaped arc
  }
}
function banana(r, part) {
  r *= 1.3; // a banana reads small at the same radius as round fruit
  const g = new THREE.Group(), A = 1.0;
  const [a0, a1] = part < 0 ? [-A, 0] : part > 0 ? [0, A] : [-A, A];
  const tube = fgeo('banana' + part, () => new THREE.TubeGeometry(new BananaArc(a0, a1), 12, 0.3, 6, false));
  g.add(mesh(tube, fmat('#ffd93b', { side: THREE.DoubleSide, roughness: 0.5, flatShading: true }), r, r, r, 0, 0));
  const end = (a, c, s) => g.add(mesh(GEO.ball, fmat(c), r * s, r * s, r * s, Math.sin(a) * 1.15 * r, (0.55 - Math.cos(a) * 1.15) * r));
  if (part <= 0) end(-A, '#5a3d1e', 0.16);
  if (part >= 0) end(A, '#6d8a2a', 0.18);
  if (part) end(0, '#fff3c4', 0.27); // pale flesh at the cut
  return g;
}

const GRAPES = [];
[[0.45, 4, 0.5], [0.1, 4, 0.45], [-0.25, 3, 0.35], [-0.55, 2, 0.2], [-0.8, 1, 0]].forEach(([y, n, rad], j) => {
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + j; GRAPES.push([Math.cos(a) * rad, y, Math.sin(a) * rad]); }
});
function grapes(r, part) {
  const g = new THREE.Group(), m = fmat('#7b3fb8', { roughness: 0.3 });
  for (const [x, y, z] of GRAPES) if (!part || (part < 0 ? x <= 0 : x > 0)) g.add(mesh(GEO.ball, m, r * 0.3, r * 0.3, r * 0.3, x * r, y * r, z * r));
  if (part <= 0) g.add(mesh(stemGeo(), fmat('#6b4423'), r * 0.8, r * 0.4, r * 0.8, 0, r * 0.8));
  return g;
}

function fruitModel(kind, r, part = 0) {
  if (kind === 'banana') return banana(r, part);
  if (kind === 'grapes') return grapes(r, part);
  const k = FRUIT_KINDS[kind], g = new THREE.Group(), body = halfSphere(k.skin(), k.flesh, part);
  body.scale.set(k.s[0] * r, k.s[1] * r, k.s[2] * r);
  g.add(body);
  if (kind === 'apple' && part <= 0) stemLeaf(g, r);
  if (kind === 'orange' && part <= 0) g.add(mesh(GEO.ball, fmat('#3f8f3a'), r * 0.12, r * 0.06, r * 0.12, 0, r));
  if (kind === 'lemon') for (const sx of [-1, 1]) if (!part || part === sx) {
    g.add(mesh(GEO.ball, k.skin(), r * 0.22, r * 0.2, r * 0.2, sx * r * 1.18, 0));
  }
  return g;
}
