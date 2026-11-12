'use strict';
// All sounds are synthesised with WebAudio, so there are no audio files to ship.
const AU = {
  ctx: null, master: null, nb: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.setOn(G.save.sound);
      this.startMusic();
    } catch (e) { this.ctx = null; }
  },
  setOn(on) { if (this.master) this.master.gain.value = on ? 0.6 : 0; },
  env(node, v, d, t) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    node.connect(g); g.connect(this.master);
  },
  tone(f, d, type = 'sine', v = 0.2, f2 = f, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + d);
    this.env(o, v, d, t); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d, v, f, q = 1, f2 = f) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (!this.nb) {
      const n = this.ctx.sampleRate;
      this.nb = this.ctx.createBuffer(1, n, n);
      const a = this.nb.getChannelData(0);
      for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    }
    const s = this.ctx.createBufferSource(), bp = this.ctx.createBiquadFilter();
    s.buffer = this.nb; bp.type = 'bandpass'; bp.Q.value = q;
    bp.frequency.setValueAtTime(f, t);
    bp.frequency.exponentialRampToValueAtTime(f2, t + d);
    s.connect(bp); this.env(bp, v, d, t); s.start(t); s.stop(t + d + 0.02);
  },
  slice(combo) { // crunchy slice, pitch rises with combo
    const p = Math.pow(1.06, Math.min(combo, 14));
    this.noise(0.09, 0.6, 2600 * p, 0.8);
    this.tone(420 * p, 0.1, 'triangle', 0.15, 720 * p);
  },
  whoosh() { this.noise(0.22, 0.3, 300, 1.2, 1600); },
  thunk() { this.tone(160, 0.12, 'sine', 0.35, 70); this.noise(0.05, 0.2, 800); },
  clack() { this.tone(900, 0.06, 'square', 0.2, 600); this.tone(120, 0.3, 'sawtooth', 0.25, 40); this.noise(0.15, 0.4, 2000); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.2, f, i * 0.09)); },
  click() { this.tone(660, 0.05, 'sine', 0.15); },
  startMusic() {
    const notes = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 392, 349, 330, 294];
    let i = 0;
    setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const f = notes[i++ % notes.length];
      this.tone(f, 0.2, 'triangle', 0.04);
      if (i % 4 === 1) this.tone(f / 2, 0.45, 'sine', 0.06);
    }, 230);
  },
};
