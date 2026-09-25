/* =========================================================================
   util.js — math helpers, persistent save data, synthesized audio, toasts
   ========================================================================= */
window.TD = window.TD || {};

/* --------------------------------- math --------------------------------- */
TD.clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
TD.lerp = (a, b, t) => a + (b - a) * t;
TD.rand = (a, b) => a + Math.random() * (b - a);
TD.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
TD.pick = arr => arr[Math.floor(Math.random() * arr.length)];
TD.dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
TD.dist = (ax, az, bx, bz) => Math.sqrt(TD.dist2(ax, az, bx, bz));
TD.angleLerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
TD.fmt = n => {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'k';
  return n.toLocaleString('en-US');
};

/* -------------------------------- save data ------------------------------ */
TD.Save = (function () {
  const KEY = 'laststand.save.v1';
  const DEFAULT = {
    name: 'Defender',
    coins: 1200,
    gems: 25,
    xp: 0,
    unlocked: ['recruit', 'rifleman', 'splatter', 'homestead'],
    loadout: ['recruit', 'rifleman', 'splatter', 'homestead', null],
    wins: 0, losses: 0, bestWave: 0, kills: 0,
    mapsBeaten: {},
    settings: { sound: true, music: true, shadows: true, dmgNumbers: true, sens: 1, quality: 1 }
  };
  let mem = null, usable = true;
  try { localStorage.getItem(KEY); } catch (e) { usable = false; }

  function load() {
    if (mem) return mem;
    let raw = null;
    if (usable) { try { raw = localStorage.getItem(KEY); } catch (e) { } }
    let d;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    mem = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), d || {});
    mem.settings = Object.assign({}, DEFAULT.settings, mem.settings || {});
    // Loadout must always be exactly 5 entries.
    mem.loadout = (mem.loadout || []).slice(0, 5);
    while (mem.loadout.length < 5) mem.loadout.push(null);
    return mem;
  }
  function save() {
    if (!usable) return;
    try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) { }
  }
  function reset() { mem = JSON.parse(JSON.stringify(DEFAULT)); save(); return mem; }
  return { load, save, reset, get data() { return load(); } };
})();

/* XP curve: level n needs 120 * n^1.35 cumulative-ish; simple and readable. */
TD.levelFromXp = xp => {
  let lvl = 1, need = 150, acc = 0;
  while (xp >= acc + need && lvl < 200) { acc += need; lvl++; need = Math.floor(150 * Math.pow(lvl, 1.18)); }
  return { level: lvl, into: xp - acc, need: need };
};

/* --------------------------------- audio --------------------------------- */
TD.Audio = (function () {
  let ctx = null, master = null, musicGain = null, musicTimer = null, musicStep = 0;
  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.12; musicGain.connect(master);
    return ctx;
  }
  function on() { return TD.Save.data.settings.sound; }

  function blip(freq, dur, type, vol, slideTo) {
    if (!on() || !ensure() || ctx.state === 'suspended') return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, ctx.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }
  function noise(dur, vol, filterFreq) {
    if (!on() || !ensure() || ctx.state === 'suspended') return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq || 1400;
    const g = ctx.createGain(); g.gain.value = vol || 0.18;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }

  const S = {
    shoot: () => blip(TD.rand(620, 780), 0.05, 'square', 0.07, 260),
    heavy: () => { blip(150, 0.14, 'sawtooth', 0.14, 60); noise(0.12, 0.1, 900); },
    boom: () => { noise(0.34, 0.26, 700); blip(90, 0.28, 'sine', 0.2, 32); },
    laser: () => blip(1250, 0.09, 'sawtooth', 0.06, 700),
    hit: () => blip(TD.rand(190, 240), 0.035, 'triangle', 0.05, 120),
    place: () => { blip(420, 0.07, 'triangle', 0.16); setTimeout(() => blip(640, 0.1, 'triangle', 0.16), 70); },
    sell: () => { blip(560, 0.07, 'triangle', 0.14, 300); },
    coin: () => { blip(880, 0.05, 'triangle', 0.1); setTimeout(() => blip(1320, 0.07, 'triangle', 0.1), 45); },
    error: () => blip(150, 0.14, 'square', 0.12, 90),
    upgrade: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.1, 'triangle', 0.14), i * 55)); },
    leak: () => { blip(220, 0.4, 'sawtooth', 0.2, 70); noise(0.3, 0.16, 500); },
    wave: () => { [392, 523, 659].forEach((f, i) => setTimeout(() => blip(f, 0.16, 'square', 0.1), i * 100)); },
    boss: () => { [110, 98, 87].forEach((f, i) => setTimeout(() => { blip(f, 0.5, 'sawtooth', 0.22); noise(0.4, 0.14, 420); }, i * 220)); },
    win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.16), i * 130)); },
    lose: () => { [440, 392, 330, 262].forEach((f, i) => setTimeout(() => blip(f, 0.34, 'sawtooth', 0.15), i * 190)); },
    ui: () => blip(700, 0.035, 'triangle', 0.07),
    ability: () => { blip(300, 0.2, 'sawtooth', 0.14, 900); noise(0.2, 0.08, 2200); },
    jump: () => blip(500, 0.1, 'triangle', 0.08, 800),
    step: () => noise(0.045, 0.035, 480)
  };

  /* A tiny generative loop so the lobby isn't silent. */
  const SCALE = [0, 3, 5, 7, 10, 12];
  function musicTick() {
    if (!TD.Save.data.settings.music || !ensure() || ctx.state === 'suspended') return;
    const root = 55;
    const n = SCALE[Math.floor(Math.random() * SCALE.length)] + (Math.random() < .3 ? 12 : 0);
    const f = root * Math.pow(2, (n + (musicStep % 4 === 0 ? 0 : 12)) / 12);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = musicStep % 4 === 0 ? 'triangle' : 'sine';
    o.frequency.value = f * 2;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
    o.connect(g); g.connect(musicGain); o.start(); o.stop(ctx.currentTime + 1.2);
    musicStep++;
  }
  function startMusic() { if (musicTimer) return; musicTimer = setInterval(musicTick, 620); }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
  function resume() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function setMusicVolume(v) { if (musicGain) musicGain.gain.value = v; }

  return Object.assign(S, { resume, startMusic, stopMusic, setMusicVolume, ensure });
})();

/* --------------------------------- toasts -------------------------------- */
TD.toast = function (msg, kind) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2500);
  while (host.children.length > 4) host.firstChild.remove();
};

/* ----------------------------- tiny DOM helper ---------------------------- */
TD.el = function (tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
TD.$ = sel => document.querySelector(sel);
TD.$$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));
