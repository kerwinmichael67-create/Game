// Sound effects for every game, made on the fly with Web Audio (no sound files to load).
//   Sfx.play('coin')                    a named sound
//   Sfx.play('hit', { vol: 0.5, pitch: 1.2 })
//   Sfx.at('explode', distance, 80)     quieter the further away it is (silent past 80)
//   Sfx.on / Sfx.set(on) / Sfx.toggle() sound on or off (remembered; the chat's 🔊 button sets it for every game)
// Used by the chat (its own games) and by each game in a frame, which follows the chat's setting.
(() => {
  if (window.Sfx) return;
  const KEY = 'gc.sfx';
  let on = true, vol = 0.8;
  try { const v = localStorage.getItem(KEY); if (v === '0') on = false; const w = parseFloat(localStorage.getItem(KEY + '.vol')); if (w >= 0 && w <= 1) vol = w; } catch (e) { /* no storage here */ }
  let ac = null, master = null, noiseBuf = null;
  const listeners = new Set();
  function ctx() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      master = ac.createGain(); master.gain.value = on ? vol : 0;
      // a gentle limiter so lots of sounds at once don't distort
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
      master.connect(comp).connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
    return ac;
  }
  // Browsers only allow sound after a click or key press on the page: get ready on the first one.
  const unlock = () => { if (on) ctx(); if (ac && ac.state === 'running') { removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true); } };
  addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);

  // the building blocks: a tone that slides from f to f2, and a burst of filtered noise
  function tone(t0, o) {
    const t = t0 + (o.at || 0), dur = o.dur || 0.15, osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.slide || dur));
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = o.f * 0.03; l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const v = (o.vol == null ? 0.3 : o.vol) * o.k, a = o.att || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a);
    if (o.hold) g.gain.setValueAtTime(Math.max(0.0002, v), t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.dest); osc.start(t); osc.stop(t + dur + 0.03);
  }
  function noise(t0, o) {
    const t = t0 + (o.at || 0), dur = o.dur || 0.2, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = o.filter || 'lowpass'; f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(o.f || 2000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f2), t + dur);
    const v = (o.vol == null ? 0.3 : o.vol) * o.k, a = o.att || 0.003;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(o.dest); src.start(t, Math.random() * 0.6); src.stop(t + dur + 0.03);
  }
  const T = (f, dur, o) => Object.assign({ f, dur }, o), N = (f, dur, o) => Object.assign({ n: 1, f, dur }, o);
  const arp = (notes, step, o) => notes.map((f, i) => T(f, (o && o.dur) || 0.18, Object.assign({ at: i * step }, o)));
  // the sound bank: each is a list of tones (T) and noise bursts (N)
  const BANK = {
    // menus and buttons
    click: [T(1400, 0.04, { type: 'triangle', vol: 0.18 }), N(4000, 0.02, { filter: 'highpass', vol: 0.08 })],
    tap: [T(900, 0.05, { type: 'sine', vol: 0.16, f2: 700 })],
    open: [N(800, 0.16, { filter: 'bandpass', f2: 3000, q: 1.2, vol: 0.14 }), T(500, 0.12, { f2: 900, vol: 0.08 })],
    close: [N(2600, 0.14, { filter: 'bandpass', f2: 700, q: 1.2, vol: 0.12 })],
    error: [T(220, 0.12, { type: 'square', vol: 0.12 }), T(165, 0.18, { type: 'square', vol: 0.12, at: 0.1 })],
    select: [T(1046, 0.07, { type: 'triangle', vol: 0.16 }), T(1568, 0.09, { type: 'triangle', vol: 0.14, at: 0.05 })],
    toggle: [T(700, 0.05, { type: 'square', vol: 0.08 }), T(1050, 0.06, { type: 'square', vol: 0.08, at: 0.05 })],
    // money and rewards
    coin: [T(988, 0.08, { type: 'square', vol: 0.12 }), T(1319, 0.32, { type: 'square', vol: 0.12, at: 0.07 })],
    buy: [T(1568, 0.06, { type: 'triangle', vol: 0.18 }), T(2093, 0.25, { type: 'triangle', vol: 0.16, at: 0.06 }), N(6000, 0.08, { filter: 'highpass', vol: 0.06, at: 0.05 })],
    sell: [T(1319, 0.08, { type: 'square', vol: 0.1 }), T(1047, 0.08, { type: 'square', vol: 0.1, at: 0.07 }), T(1568, 0.3, { type: 'square', vol: 0.1, at: 0.14 })],
    reward: arp([784, 988, 1175, 1568], 0.06, { type: 'triangle', vol: 0.16, dur: 0.3 }),
    levelup: arp([523, 659, 784, 1047, 1319, 1568], 0.07, { type: 'square', vol: 0.09, dur: 0.22 }),
    unlock: [...arp([880, 1109, 1319, 1760], 0.05, { type: 'sine', vol: 0.18, dur: 0.4 }), N(7000, 0.5, { filter: 'highpass', vol: 0.05 })],
    magic: [N(500, 0.7, { filter: 'bandpass', f2: 5000, q: 2, vol: 0.12 }), ...arp([1047, 1319, 1568, 2093, 2637], 0.08, { type: 'sine', vol: 0.12, dur: 0.35 })],
    // how a game goes
    start: arp([392, 523, 659, 784], 0.08, { type: 'square', vol: 0.1, dur: 0.18 }),
    go: [T(1047, 0.35, { type: 'square', vol: 0.12 })],
    tick: [T(1800, 0.03, { type: 'square', vol: 0.06 })],
    count: [T(660, 0.12, { type: 'square', vol: 0.1 })],
    turn: [T(784, 0.12, { type: 'sine', vol: 0.18 }), T(1175, 0.25, { type: 'sine', vol: 0.16, at: 0.1 })],
    win: [...arp([523, 659, 784], 0.1, { type: 'square', vol: 0.11, dur: 0.16 }), T(1047, 0.6, { type: 'square', vol: 0.11, at: 0.3, vib: 6 }), T(1319, 0.6, { type: 'triangle', vol: 0.08, at: 0.3 })],
    lose: [T(392, 0.25, { type: 'triangle', vol: 0.16 }), T(370, 0.25, { type: 'triangle', vol: 0.16, at: 0.24 }), T(349, 0.25, { type: 'triangle', vol: 0.16, at: 0.48 }), T(330, 0.7, { type: 'triangle', vol: 0.16, at: 0.72, vib: 5 })],
    draw: [T(523, 0.2, { type: 'triangle', vol: 0.14 }), T(523, 0.35, { type: 'triangle', vol: 0.14, at: 0.2 })],
    correct: [T(880, 0.1, { type: 'sine', vol: 0.2 }), T(1319, 0.3, { type: 'sine', vol: 0.2, at: 0.09 })],
    wrong: [T(311, 0.18, { type: 'sawtooth', vol: 0.09 }), T(233, 0.3, { type: 'sawtooth', vol: 0.09, at: 0.15 })],
    score: [T(1047, 0.08, { type: 'square', vol: 0.11 }), T(1568, 0.22, { type: 'square', vol: 0.11, at: 0.08 })],
    point: [T(660, 0.1, { type: 'square', vol: 0.1 }), T(880, 0.18, { type: 'square', vol: 0.1, at: 0.08 })],
    horn: [T(220, 0.7, { type: 'sawtooth', vol: 0.07, att: 0.04, vib: 4 }), T(330, 0.7, { type: 'sawtooth', vol: 0.05, att: 0.04, at: 0.05 })],
    alarm: [T(880, 0.15, { type: 'square', vol: 0.08 }), T(660, 0.15, { type: 'square', vol: 0.08, at: 0.16 })],
    // board games
    place: [N(1800, 0.05, { filter: 'bandpass', q: 1.5, vol: 0.3 }), T(240, 0.07, { type: 'sine', vol: 0.25, f2: 160 })],
    move: [N(1200, 0.09, { filter: 'bandpass', q: 1, vol: 0.18, f2: 2200 }), N(1800, 0.04, { filter: 'bandpass', q: 1.5, vol: 0.25, at: 0.07 })],
    capture: [N(2200, 0.05, { filter: 'bandpass', q: 1.5, vol: 0.32 }), T(300, 0.08, { type: 'sine', vol: 0.25, f2: 180 }), N(2800, 0.04, { filter: 'bandpass', q: 1.5, vol: 0.25, at: 0.08 })],
    flip: [T(500, 0.05, { type: 'triangle', vol: 0.12, f2: 900 })],
    drop: [T(900, 0.18, { type: 'triangle', vol: 0.12, f2: 300 }), N(1500, 0.06, { filter: 'bandpass', q: 1.5, vol: 0.28, at: 0.17 }), T(200, 0.08, { vol: 0.2, at: 0.17 })],
    check: [T(988, 0.1, { type: 'square', vol: 0.1 }), T(988, 0.15, { type: 'square', vol: 0.1, at: 0.14 })],
    line: [T(600, 0.12, { type: 'triangle', vol: 0.14, f2: 1200 })],
    box: [T(784, 0.08, { type: 'triangle', vol: 0.16 }), T(1047, 0.18, { type: 'triangle', vol: 0.16, at: 0.07 })],
    seed: [T(1300, 0.05, { type: 'sine', vol: 0.12, f2: 900 })],
    // moving about
    jump: [T(300, 0.15, { type: 'square', vol: 0.07, f2: 640 })],
    land: [N(400, 0.08, { vol: 0.2 }), T(110, 0.08, { vol: 0.18, f2: 70 })],
    step: [N(900, 0.04, { filter: 'bandpass', q: 1, vol: 0.08 })],
    whoosh: [N(600, 0.25, { filter: 'bandpass', f2: 2400, q: 1.5, vol: 0.16, att: 0.05 })],
    bounce: [T(200, 0.25, { type: 'sine', vol: 0.22, f2: 700, slide: 0.12 })],
    splash: [N(1800, 0.35, { filter: 'bandpass', q: 0.8, vol: 0.2, f2: 600 }), N(3000, 0.2, { filter: 'highpass', vol: 0.06, at: 0.05 })],
    teleport: [T(300, 0.35, { type: 'sine', vol: 0.12, f2: 1600 }), N(2000, 0.35, { filter: 'bandpass', q: 3, vol: 0.08, f2: 6000 })],
    // fights and blasts
    swing: [N(900, 0.14, { filter: 'bandpass', f2: 2600, q: 2, vol: 0.18, att: 0.03 })],
    hit: [N(1200, 0.09, { vol: 0.32 }), T(160, 0.1, { vol: 0.3, f2: 70 })],
    punch: [N(800, 0.08, { vol: 0.34 }), T(130, 0.12, { vol: 0.36, f2: 60 })],
    block: [T(1800, 0.12, { type: 'square', vol: 0.05 }), T(2500, 0.18, { type: 'triangle', vol: 0.08 }), N(4000, 0.06, { filter: 'highpass', vol: 0.12 })],
    hurt: [T(420, 0.18, { type: 'sawtooth', vol: 0.1, f2: 200 })],
    oof: [T(330, 0.22, { type: 'square', vol: 0.1, f2: 140 }), N(600, 0.12, { vol: 0.08 })],
    die: [T(600, 0.6, { type: 'square', vol: 0.09, f2: 80 }), N(500, 0.4, { vol: 0.1, at: 0.1 })],
    shoot: [T(1400, 0.14, { type: 'square', vol: 0.07, f2: 300 }), N(3000, 0.05, { filter: 'highpass', vol: 0.06 })],
    laser: [T(1800, 0.12, { type: 'sawtooth', vol: 0.06, f2: 400 })],
    gun: [N(1600, 0.12, { vol: 0.28, f2: 400 }), T(140, 0.08, { vol: 0.2, f2: 60 })],
    cannon: [N(700, 0.3, { vol: 0.35, f2: 150 }), T(90, 0.3, { vol: 0.35, f2: 40 })],
    explode: [N(1200, 0.7, { vol: 0.42, f2: 90 }), T(80, 0.6, { vol: 0.42, f2: 30 })],
    boom: [N(400, 1.1, { vol: 0.5, f2: 60 }), T(60, 1, { vol: 0.5, f2: 25 })],
    zap: [T(2400, 0.08, { type: 'sawtooth', vol: 0.06, f2: 1200 }), N(5000, 0.05, { filter: 'highpass', vol: 0.06 })],
    freeze: [T(2093, 0.3, { type: 'sine', vol: 0.08, f2: 3136 }), N(8000, 0.3, { filter: 'highpass', vol: 0.06 })],
    heal: arp([659, 880, 1109, 1319], 0.07, { type: 'sine', vol: 0.12, dur: 0.3 }),
    powerup: arp([523, 784, 1047, 1568], 0.05, { type: 'square', vol: 0.08, dur: 0.14 }),
    shield: [T(300, 0.4, { type: 'sine', vol: 0.15, f2: 600, vib: 12 })],
    kill: [T(1319, 0.08, { type: 'square', vol: 0.09 }), T(1760, 0.16, { type: 'square', vol: 0.09, at: 0.06 })],
    // the world
    pop: [T(700, 0.08, { type: 'sine', vol: 0.22, f2: 250 })],
    dig: [N(500, 0.12, { vol: 0.25, f2: 200 }), N(900, 0.08, { vol: 0.15, at: 0.08 })],
    break: [N(1500, 0.16, { vol: 0.3, f2: 300 }), N(700, 0.1, { filter: 'bandpass', q: 2, vol: 0.2, at: 0.05 })],
    crunch: [N(2500, 0.06, { filter: 'bandpass', q: 2, vol: 0.2 }), N(1800, 0.06, { filter: 'bandpass', q: 2, vol: 0.18, at: 0.07 }), N(2200, 0.06, { filter: 'bandpass', q: 2, vol: 0.16, at: 0.14 })],
    hiss: [N(5000, 1.1, { filter: 'highpass', vol: 0.14, att: 0.2 })],
    chomp: [T(400, 0.06, { type: 'square', vol: 0.12, f2: 200 })],
    crash: [N(900, 0.45, { vol: 0.4, f2: 150 }), T(120, 0.3, { type: 'sawtooth', vol: 0.12, f2: 50 })],
    engine: [T(70, 0.25, { type: 'sawtooth', vol: 0.05, f2: 90 })],
    paddle: [T(440, 0.06, { type: 'square', vol: 0.14 })],
    wall: [T(220, 0.06, { type: 'square', vol: 0.12 })],
    rotate: [T(1200, 0.03, { type: 'triangle', vol: 0.08 })],
    lock: [N(1200, 0.05, { filter: 'bandpass', q: 1.2, vol: 0.2 }), T(180, 0.06, { vol: 0.16 })],
    clear: [N(600, 0.35, { filter: 'bandpass', f2: 4000, q: 2, vol: 0.16 }), ...arp([784, 1047, 1319], 0.05, { type: 'square', vol: 0.07, dur: 0.15 })],
    garbage: [T(160, 0.2, { type: 'square', vol: 0.1, f2: 90 })],
    gallop: [N(700, 0.05, { vol: 0.16 }), N(600, 0.05, { vol: 0.12, at: 0.09 })],
    bell: [T(1319, 0.9, { type: 'sine', vol: 0.18 }), T(2637, 0.5, { type: 'sine', vol: 0.06 })],
    chat: [T(1568, 0.06, { type: 'sine', vol: 0.08 }), T(2093, 0.1, { type: 'sine', vol: 0.07, at: 0.05 })],
    thunder: [N(300, 1.6, { vol: 0.4, f2: 80, att: 0.05 }), N(1500, 0.2, { vol: 0.2 })],
    groan: [T(105, 0.85, { type: 'sawtooth', vol: 0.07, f2: 72, att: 0.18 }), T(158, 0.7, { type: 'triangle', vol: 0.05, f2: 110, at: 0.08, att: 0.15 }), N(500, 0.5, { filter: 'lowpass', vol: 0.05, att: 0.2 })],
    reload: [N(3000, 0.04, { filter: 'highpass', vol: 0.14 }), T(900, 0.05, { type: 'square', vol: 0.05, at: 0.12 }), N(2400, 0.05, { filter: 'highpass', vol: 0.16, at: 0.3 })],
    egg: [N(2500, 0.05, { filter: 'bandpass', q: 3, vol: 0.2 }), N(2000, 0.05, { filter: 'bandpass', q: 3, vol: 0.2, at: 0.12 }), ...arp([784, 1047, 1568], 0.06, { type: 'triangle', vol: 0.14, dur: 0.25 }).map((x) => Object.assign(x, { at: x.at + 0.25 }))],
  };
  const last = new Map(), recent = [];
  let live = 0;
  function play(name, opt) {
    if (!on || !vol) return;
    const parts = BANK[name]; if (!parts) return;
    recent.push(name); if (recent.length > 60) recent.shift(); // what played lately (handy for checking a game)
    const o = opt || {}, now = performance.now(), gap = o.gap == null ? 40 : o.gap;
    if (now - (last.get(name) || 0) < gap) return; // the same sound piling up just gets louder, not better
    if (live > 24) return;
    if (!ctx() || ac.state !== 'running') return;
    last.set(name, now);
    const k = Math.max(0, Math.min(1.5, o.vol == null ? 1 : o.vol)), p = o.pitch || 1;
    if (k < 0.02) return;
    let dest = master;
    if (o.pan && ac.createStereoPanner) { const pn = ac.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, o.pan)); pn.connect(master); dest = pn; }
    const t0 = ac.currentTime + 0.005; let end = 0;
    for (const x of parts) {
      const q = Object.assign({}, x, { k, dest, f: x.f * p, f2: x.f2 ? x.f2 * p : 0 });
      if (x.n) noise(t0, q); else tone(t0, q);
      end = Math.max(end, (x.at || 0) + (x.dur || 0.2));
    }
    live++; setTimeout(() => live--, end * 1000 + 60);
  }
  const Sfx = {
    play,
    at(name, dist, far, opt) { const f = far || 60, d = Math.max(0, dist || 0); if (d >= f) return; play(name, Object.assign({}, opt, { vol: ((opt && opt.vol) || 1) * Math.pow(1 - d / f, 1.6) })); },
    get on() { return on; },
    get volume() { return vol; },
    set(v, quiet) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      if (master) master.gain.value = on ? vol : 0;
      if (on) ctx();
      listeners.forEach((f) => f(on));
      if (quiet) return;
      try { if (window.parent !== window) window.parent.postMessage({ sfx: 1, on }, '*'); } catch (e) {}
      if (on) play('toggle');
    },
    toggle() { Sfx.set(!on); return on; },
    setVolume(v) { vol = Math.max(0, Math.min(1, +v || 0)); try { localStorage.setItem(KEY + '.vol', String(vol)); } catch (e) {} if (master) master.gain.value = on ? vol : 0; },
    onChange(f) { listeners.add(f); return () => listeners.delete(f); },
    names: Object.keys(BANK),
    recent,
  };
  // The chat page (it has the message box) keeps the setting and tells the games in its frames;
  // a game in a frame asks the chat when it starts, and follows it (or tells it when you switch here).
  const isChat = !!document.getElementById('msgInput');
  if (isChat) {
    listeners.add(() => document.querySelectorAll('iframe').forEach((f) => { try { f.contentWindow.postMessage({ sfx: 1, on, vol }, '*'); } catch (e) {} }));
    addEventListener('message', (e) => {
      const m = e.data;
      if (!m || m.sfx !== 1 || !e.source || e.source === window) return;
      if (m.hello) { try { e.source.postMessage({ sfx: 1, on, vol }, '*'); } catch (err) {} } else if (typeof m.on === 'boolean' && m.on !== on) Sfx.set(m.on, true);
    });
  } else if (window.parent !== window) {
    addEventListener('message', (e) => {
      const m = e.data;
      if (!m || m.sfx !== 1 || e.source !== window.parent) return;
      if (typeof m.vol === 'number') Sfx.setVolume(m.vol);
      if (typeof m.on === 'boolean' && m.on !== on) Sfx.set(m.on, true);
    });
    try { window.parent.postMessage({ sfx: 1, hello: 1 }, '*'); } catch (e) {}
  }
  window.Sfx = Sfx;
})();
