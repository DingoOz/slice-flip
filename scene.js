'use strict';
// Three.js world. Game logic stays 2D (x right, y down); here y is flipped so the ground is y=0
// and everything sits on the z=0 plane, viewed by a camera pitched down 45°.
// Camera knobs: pitch = degrees looking down, yaw = swing around the vertical axis (positive = from behind the knife).
const CAM = { pitch: 25, yaw: 45, dist: 900 }; // degrees; live-tunable with the ` debug panel
const CAM_FOV = 40;
const Y = v => GROUND - v;

const gl = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfe3ff');
scene.fog = new THREE.Fog('#bfe3ff', 1400, 3200);
const camera = new THREE.PerspectiveCamera(CAM_FOV, W / H, 10, 6000);

scene.add(new THREE.HemisphereLight('#ffffff', '#b98ab0', 0.75));
const sun = new THREE.DirectionalLight('#ffffff', 0.75);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -700, right: 700, top: 700, bottom: -700, near: 10, far: 2500 });
scene.add(sun, sun.target);

const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
const MAT = { spike: mat('#ff2e88'), solid: mat('#8a8fa3'), crate: mat('#e8a35c'), trunk: mat('#8b5a2b') };
const GEO = {
  pyramid: new THREE.ConeGeometry(1, 1, 4), box: new THREE.BoxGeometry(1, 1, 1),
  ball: new THREE.SphereGeometry(1, 20, 14), tree: new THREE.ConeGeometry(1, 1, 7),
};
function mesh(geo, m, sx, sy, sz, x, y, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.scale.set(sx, sy, sz); o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}

function labelMaterial(o) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = Math.max(64, Math.round(256 * o.h / o.w));
  const g = c.getContext('2d');
  g.fillStyle = OP_COLORS[o.op]; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 10; g.strokeRect(5, 5, c.width - 10, c.height - 10);
  g.font = `900 ${o.op === 'BONUS' ? 60 : Math.min(110, c.height * 0.6)}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 12; g.strokeStyle = 'rgba(40,20,60,.8)'; g.strokeText(o.label, 128, c.height / 2);
  g.fillStyle = '#fff'; g.fillText(o.label, 128, c.height / 2);
  const map = new THREE.CanvasTexture(c); map.userData.label = true;
  return new THREE.MeshStandardMaterial({ map, roughness: 0.5 });
}

function spikeRow(grp, x, w, yBase, h, dir) { // row of pyramids, two deep
  const n = Math.max(1, Math.round(w / 20)), tw = w / n;
  for (let i = 0; i < n; i++) for (const z of [-16, 16]) {
    const p = mesh(GEO.pyramid, MAT.spike, tw / 1.4, h, tw / 1.4, x + i * tw + tw / 2, yBase + dir * h / 2, z);
    p.rotation.y = Math.PI / 4;
    if (dir < 0) p.rotation.x = Math.PI;
    grp.add(p);
  }
}

function objMesh(o) {
  const cx = o.x + o.w / 2, cy = Y(o.y + o.h / 2);
  if (o.t === 'slice' && o.shape === 'ball') { const f = fruitModel(o.k, o.w / 2); f.position.set(cx, cy, 0); f.rotation.y = o.x; return f; }
  if (o.t === 'slice') return mesh(GEO.box, MAT.crate, o.w, o.h, o.w, cx, cy);
  if (o.t === 'solid') return mesh(GEO.box, MAT.solid, o.w, o.h, 70, cx, cy);
  if (o.t === 'target') {
    const side = mat(OP_COLORS[o.op]), lab = labelMaterial(o);
    const m = new THREE.Mesh(GEO.box, [side, lab, side, side, lab, side]);
    m.scale.set(o.w, o.h - 4, 110); m.position.set(cx, cy, 0); m.castShadow = m.receiveShadow = true;
    return m;
  }
  const g = new THREE.Group();
  if (o.kind === 'up') spikeRow(g, o.x, o.w, Y(o.y + o.h), o.h, 1);
  else if (o.kind === 'down') {
    g.add(mesh(GEO.box, MAT.spike, o.w, o.h - 22, 54, cx, Y((o.h - 22) / 2)));
    spikeRow(g, o.x, o.w, Y(o.h - 22), 22, -1);
  } else {
    g.add(mesh(GEO.box, MAT.spike, o.w, o.h - 12, 54, cx, cy));
    spikeRow(g, o.x, o.w, Y(o.y + 6), 10, 1);
    spikeRow(g, o.x, o.w, Y(o.y + o.h - 6), 10, -1);
  }
  return g;
}

let levelGroup = null, builtFor = null;
function buildLevel(L) {
  if (levelGroup) { scene.remove(levelGroup); levelGroup.traverse(o => [].concat(o.material || []).forEach(m => m.map?.userData.label && m.map.dispose())); }
  levelGroup = new THREE.Group(); builtFor = L;
  const ground = mesh(GEO.box, mat(G.bonus ? '#f6c56b' : '#93d67f'), L.len + 4000, 40, 3000, L.len / 2, -20, 0);
  const lane = mesh(GEO.box, mat(G.bonus ? '#ffe3a1' : '#e2c08f'), L.len + 4000, 2, 140, L.len / 2, 1, 0);
  levelGroup.add(ground, lane);
  const R = rng(L.len);
  for (let x = -800; x < L.len + 1500; x += 90 + R() * 120) { // background trees and hills
    const z = -260 - R() * 900, s = 30 + R() * 50;
    if (R() < 0.7) {
      levelGroup.add(mesh(GEO.box, MAT.trunk, s / 5, s, s / 5, x, s / 2, z));
      levelGroup.add(mesh(GEO.tree, mat(R() < 0.5 ? '#4fae5b' : '#6cc46a'), s, s * 2.2, s, x, s * 2, z));
    } else levelGroup.add(mesh(GEO.ball, mat(R() < 0.5 ? '#6fbf6a' : '#a58fe0'), s * 3, s * 1.6, s * 2, x, 0, z - 300));
  }
  for (const o of L.objs) { o.mesh = objMesh(o); levelGroup.add(o.mesh); }
  scene.add(levelGroup);
}

const knife = new THREE.Group(); scene.add(knife);
let knifeSkin = -1;
function buildKnife(sk) {
  knife.clear();
  const h0 = -KL / 2, b0 = h0 + HANDLE, tip = KL / 2, bh = sk.wide ? 22 : 14;
  const shape = new THREE.Shape();
  shape.moveTo(b0, 7); shape.lineTo(tip, 7); shape.quadraticCurveTo(tip - 18, 7 - bh, b0, 7 - bh); shape.closePath();
  const blade = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1, bevelSegments: 1 }),
    new THREE.MeshStandardMaterial({ color: sk.blade, metalness: 0.6, roughness: 0.25,
      emissive: sk.glow ? sk.trail : '#000000', emissiveIntensity: sk.glow ? 0.45 : 0 }));
  blade.position.z = -1.5;
  const handle = mesh(GEO.box, mat(sk.handle), HANDLE, 12, 10, h0 + HANDLE / 2, 0);
  const guard = mesh(GEO.box, mat('#4a4a55'), 6, 22, 16, b0, 0);
  blade.castShadow = true;
  knife.add(blade, handle, guard);
}

// Particles: one Points cloud refilled each frame.
const MAXP = 1000, pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const dot = document.createElement('canvas'); dot.width = dot.height = 32;
{ const g = dot.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(16, 16, 15, 0, TAU); g.fill(); }
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 9, vertexColors: true, map: new THREE.CanvasTexture(dot), alphaTest: 0.5 }));
points.frustumCulled = false; scene.add(points);
