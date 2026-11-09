/* ========================================================================
   Audio — fully synthesized (no external files allowed in the artifact)
   ======================================================================== */
const Audio = {
  ctx: null, enabled: Store.get('apex.sound', true), master: null, engines: new Map(), ready: false,
  init() {
    if (this.ready) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? 0.9 : 0; this.master.connect(this.ctx.destination);
      /* shared noise buffer */
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf; this.ready = true;
    } catch (e) { this.ready = false; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
  setEnabled(on) { this.enabled = on; Store.set('apex.sound', on); if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05); },
  /* engine voice: two detuned saws + sub + a noise bed through a lowpass. */
  engine(id) {
    if (!this.ready) return null;
    if (this.engines.has(id)) return this.engines.get(id);
    const c = this.ctx, g = c.createGain(); g.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 1.2;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'triangle';
    const g2 = c.createGain(); g2.gain.value = 0.35; const g3 = c.createGain(); g3.gain.value = 0.5;
    o1.connect(lp); o2.connect(g2).connect(lp); o3.connect(g3).connect(lp); lp.connect(g).connect(this.master);
    o1.start(); o2.start(); o3.start();
    /* skid noise */
    const sk = c.createBufferSource(); sk.buffer = this.noise; sk.loop = true;
    const skf = c.createBiquadFilter(); skf.type = 'bandpass'; skf.frequency.value = 1800; skf.Q.value = 0.8;
    const skg = c.createGain(); skg.gain.value = 0; sk.connect(skf).connect(skg).connect(this.master); sk.start();
    /* nitro whoosh */
    const nz = c.createBufferSource(); nz.buffer = this.noise; nz.loop = true;
    const nzf = c.createBiquadFilter(); nzf.type = 'lowpass'; nzf.frequency.value = 600;
    const nzg = c.createGain(); nzg.gain.value = 0; nz.connect(nzf).connect(nzg).connect(this.master); nz.start();
    const v = { g, lp, o1, o2, o3, skg, skf, nzg, nzf, stop() { try { o1.stop(); o2.stop(); o3.stop(); sk.stop(); nz.stop(); } catch (e) {} g.disconnect(); skg.disconnect(); nzg.disconnect(); } };
    this.engines.set(id, v); return v;
  },
  /* rpm 0..1, load 0..1, vol 0..1, skid 0..1, nitro 0..1 */
  updateEngine(id, rpm, load, vol, skid, nitro) {
    const v = this.engine(id); if (!v) return; const t = this.ctx.currentTime, tc = 0.04;
    const f = 38 + rpm * 150;
    v.o1.frequency.setTargetAtTime(f, t, tc); v.o2.frequency.setTargetAtTime(f * 0.5, t, tc); v.o3.frequency.setTargetAtTime(f * 2.01, t, tc);
    v.lp.frequency.setTargetAtTime(500 + rpm * 2400 + load * 900, t, tc);
    v.g.gain.setTargetAtTime(vol * (0.10 + 0.14 * rpm + 0.06 * load), t, tc);
    v.skg.gain.setTargetAtTime(skid * vol * 0.22, t, 0.06); v.skf.frequency.setTargetAtTime(1200 + skid * 1500, t, 0.1);
    v.nzg.gain.setTargetAtTime(nitro * vol * 0.28, t, 0.08); v.nzf.frequency.setTargetAtTime(400 + nitro * 2600, t, 0.1);
  },
  stopEngine(id) { const v = this.engines.get(id); if (v) { v.stop(); this.engines.delete(id); } },
  stopAll() { for (const id of Array.from(this.engines.keys())) this.stopEngine(id); },
  beep(freq, dur = 0.12, type = 'square', vol = 0.25) {
    if (!this.ready || !this.enabled) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(this.master); o.start(); o.stop(c.currentTime + dur + 0.02);
  },
  click() { this.beep(1800, 0.05, 'sine', 0.08); },
  thud(strength = 1) {
    if (!this.ready || !this.enabled) return; const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300 + 400 * strength; const g = c.createGain();
    g.gain.setValueAtTime(0.5 * clamp(strength, 0.2, 1.2), c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    s.connect(f).connect(g).connect(this.master); s.start(); s.stop(c.currentTime + 0.3);
    this.beep(90, 0.18, 'sine', 0.35 * strength);
  },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.25, 'triangle', 0.25), i * 120)); },
  lap() { this.beep(1320, 0.08, 'sine', 0.2); setTimeout(() => this.beep(1760, 0.12, 'sine', 0.2), 90); },
};
