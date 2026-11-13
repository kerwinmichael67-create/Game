/* ========================================================================
   Audio — fully synthesized (no external files allowed in the artifact)
   ======================================================================== */
const Audio = {
  ctx: null,
  enabled: Store.get('apex.sound', true),
  master: null,
  engines: new Map(),
  ready: false,
  init() {
    if (this.ready) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(this.ctx.destination);
      /* shared noise buffer */
      const len = this.ctx.sampleRate * 2,
        buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate),
        d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.ready = true;
    } catch (e) {
      this.ready = false;
    }
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  },
  setEnabled(on) {
    this.enabled = on;
    Store.set('apex.sound', on);
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  },
  /* engine voice: two detuned saws + sub + a noise bed through a lowpass. */
  engine(id) {
    if (!this.ready) return null;
    if (this.engines.has(id)) return this.engines.get(id);
    const c = this.ctx,
      g = c.createGain();
    g.gain.value = 0;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 1.2;
    const o1 = c.createOscillator(),
      o2 = c.createOscillator(),
      o3 = c.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'square';
    o3.type = 'triangle';
    const g2 = c.createGain();
    g2.gain.value = 0.35;
    const g3 = c.createGain();
    g3.gain.value = 0.5;
    o1.connect(lp);
    o2.connect(g2).connect(lp);
    o3.connect(g3).connect(lp);
    lp.connect(g).connect(this.master);
    o1.start();
    o2.start();
    o3.start();
    /* skid noise */
    const sk = c.createBufferSource();
    sk.buffer = this.noise;
    sk.loop = true;
    const skf = c.createBiquadFilter();
    skf.type = 'bandpass';
    skf.frequency.value = 1800;
    skf.Q.value = 0.8;
    const skg = c.createGain();
    skg.gain.value = 0;
    sk.connect(skf).connect(skg).connect(this.master);
    sk.start();
    /* nitro whoosh */
    const nz = c.createBufferSource();
    nz.buffer = this.noise;
    nz.loop = true;
    const nzf = c.createBiquadFilter();
    nzf.type = 'lowpass';
    nzf.frequency.value = 600;
    const nzg = c.createGain();
    nzg.gain.value = 0;
    nz.connect(nzf).connect(nzg).connect(this.master);
    nz.start();
    const v = {
      g,
      lp,
      o1,
      o2,
      o3,
      skg,
      skf,
      nzg,
      nzf,
      stop() {
        try {
          o1.stop();
          o2.stop();
          o3.stop();
          sk.stop();
          nz.stop();
        } catch (e) {}
        g.disconnect();
        skg.disconnect();
        nzg.disconnect();
      },
    };
    this.engines.set(id, v);
    return v;
  },
  /* rpm 0..1, load 0..1, vol 0..1, skid 0..1, nitro 0..1 */
  updateEngine(id, rpm, load, vol, skid, nitro) {
    const v = this.engine(id);
    if (!v) return;
    const t = this.ctx.currentTime,
      tc = 0.04;
    const f = 38 + rpm * 150;
    v.o1.frequency.setTargetAtTime(f, t, tc);
    v.o2.frequency.setTargetAtTime(f * 0.5, t, tc);
    v.o3.frequency.setTargetAtTime(f * 2.01, t, tc);
    v.lp.frequency.setTargetAtTime(500 + rpm * 2400 + load * 900, t, tc);
    v.g.gain.setTargetAtTime(vol * (0.1 + 0.14 * rpm + 0.06 * load), t, tc);
    v.skg.gain.setTargetAtTime(skid * vol * 0.22, t, 0.06);
    v.skf.frequency.setTargetAtTime(1200 + skid * 1500, t, 0.1);
    v.nzg.gain.setTargetAtTime(nitro * vol * 0.28, t, 0.08);
    v.nzf.frequency.setTargetAtTime(400 + nitro * 2600, t, 0.1);
  },
  stopEngine(id) {
    const v = this.engines.get(id);
    if (v) {
      v.stop();
      this.engines.delete(id);
    }
  },
  stopAll() {
    for (const id of Array.from(this.engines.keys())) this.stopEngine(id);
  },
  beep(freq, dur = 0.12, type = 'square', vol = 0.25) {
    if (!this.ready || !this.enabled) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  },
  click() {
    this.beep(1800, 0.05, 'sine', 0.08);
  },
  thud(strength = 1) {
    if (!this.ready || !this.enabled) return;
    const c = this.ctx,
      s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 300 + 400 * strength;
    const g = c.createGain();
    g.gain.setValueAtTime(0.5 * clamp(strength, 0.2, 1.2), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    s.connect(f).connect(g).connect(this.master);
    s.start();
    s.stop(c.currentTime + 0.3);
    this.beep(90, 0.18, 'sine', 0.35 * strength);
  },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.25, 'triangle', 0.25), i * 120));
  },
  lap() {
    this.beep(1320, 0.08, 'sine', 0.2);
    setTimeout(() => this.beep(1760, 0.12, 'sine', 0.2), 90);
  },
  /* rising noise sweep for boost pads and drift turbos */
  whoosh(power = 1) {
    if (!this.ready || !this.enabled) return;
    const c = this.ctx,
      t = c.currentTime,
      s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(500, t);
    f.frequency.exponentialRampToValueAtTime(3200 + 1200 * power, t + 0.35);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.4 * power, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + 0.65);
  },
  tier(n) {
    this.beep(660 * Math.pow(1.26, n), 0.1, 'triangle', 0.22);
    setTimeout(() => this.beep(990 * Math.pow(1.26, n), 0.14, 'triangle', 0.2), 70);
  },
  fail() {
    this.beep(180, 0.2, 'sawtooth', 0.12);
  },
};

/* ------------------------------------------------------------------------
   Music: a small step sequencer (bass, arpeggio, pad, drums), all oscillators.
   Menu plays it soft with no drums; races add the kit and a per-circuit key.
   ------------------------------------------------------------------------ */
const Music = {
  on: Store.get('apex.music', true),
  timer: null,
  step: 0,
  nextT: 0,
  bus: null,
  wet: null,
  mode: 'menu',
  bpm: 104,
  key: 0,
  /* i – VI – III – VII, one bar each */
  bars: [
    { root: 45, arp: [57, 60, 64, 69] },
    { root: 41, arp: [53, 57, 60, 65] },
    { root: 48, arp: [60, 64, 67, 72] },
    { root: 43, arp: [55, 59, 62, 67] },
  ],
  order: [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 3, 2],
  keys: { menu: [0, 104], bay: [0, 116], alpine: [5, 120], neon: [-2, 124] },
  start() {
    if (!Audio.ready || this.timer) return;
    const c = Audio.ctx;
    this.bus = c.createGain();
    this.bus.gain.value = this.on ? 0.55 : 0;
    this.bus.connect(Audio.master);
    const delay = c.createDelay(1);
    delay.delayTime.value = 0.32;
    const fb = c.createGain();
    fb.gain.value = 0.3;
    const wet = c.createGain();
    wet.gain.value = 0.35;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.bus);
    this.wet = delay;
    this.nextT = c.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 50);
  },
  setOn(on) {
    this.on = on;
    Store.set('apex.music', on);
    if (this.bus) this.bus.gain.setTargetAtTime(on ? 0.55 : 0, Audio.ctx.currentTime, 0.1);
  },
  setMode(mode, trackId) {
    this.mode = mode;
    const k = this.keys[mode === 'race' ? trackId : 'menu'] || this.keys.menu;
    this.key = k[0];
    this.bpm = k[1];
  },
  tick() {
    const c = Audio.ctx;
    if (!c || c.state !== 'running' || !this.on) {
      if (c) this.nextT = Math.max(this.nextT, c.currentTime + 0.05);
      return;
    }
    if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.02;
    while (this.nextT < c.currentTime + 0.2) {
      this.play(this.step, this.nextT);
      this.nextT += 60 / this.bpm / 4;
      this.step = (this.step + 1) % 64;
    }
  },
  hz(m) {
    return 440 * Math.pow(2, (m + this.key - 69) / 12);
  },
  note(freq, t, dur, type, vol, cutoff, dest) {
    const c = Audio.ctx,
      o = c.createOscillator(),
      g = c.createGain(),
      f = c.createBiquadFilter();
    o.type = type;
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g);
    g.connect(this.bus);
    if (dest) g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.03);
  },
  noise(t, dur, vol, type, freq) {
    const c = Audio.ctx,
      s = c.createBufferSource();
    s.buffer = Audio.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.bus);
    s.start(t, Math.random());
    s.stop(t + dur + 0.02);
  },
  kick(t) {
    const c = Audio.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.25);
  },
  play(step, t) {
    const bar = this.bars[Math.floor(step / 16) % 4],
      s = step % 16,
      race = this.mode === 'race';
    if (s === 0)
      for (const m of [bar.arp[0], bar.arp[1], bar.arp[2]])
        this.note(this.hz(m), t, (60 / this.bpm) * 4, 'triangle', race ? 0.022 : 0.03, 900);
    if (s % 2 === 0)
      this.note(this.hz(bar.root + (s === 6 || s === 14 ? 12 : 0)), t, 0.2, 'sawtooth', race ? 0.11 : 0.06, race ? 420 : 300);
    if (race || s % 2 === 0)
      this.note(this.hz(bar.arp[this.order[s] % 4]), t, 0.16, 'square', race ? 0.035 : 0.028, race ? 2400 : 1500, this.wet);
    if (race) {
      if (s % 4 === 0) this.kick(t);
      if (s === 4 || s === 12) this.noise(t, 0.13, 0.16, 'bandpass', 1900);
      if (s % 2 === 0) this.noise(t, 0.035, s % 4 === 2 ? 0.06 : 0.03, 'highpass', 7000);
    }
  },
};
