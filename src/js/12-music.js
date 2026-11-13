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
