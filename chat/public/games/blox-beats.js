/* =====================================================================
   BLOXVERSE — BEAT STUDIO. A neon rooftop club where you make music.
   Walk up to a studio booth (or press 🎹 Studio) for the beat maker: a
   drum machine (kick, snare, clap, hi-hats, tom), a bassline and a
   melody, each sixteen steps long, in any key and scale, with six bass
   and lead instruments, tempo and swing, presets, 🎲 surprise beats and
   three save slots. Press 📡 Go live and your beat plays on the club's
   speakers for everyone here, in time, with your name up on the LED
   wall; when nobody's live the resident DJ plays. The dance floor, the
   speakers, the lights and the equalisers all move to the music, and
   anyone standing on the dance floor dances. Others can ❤️ your beat
   (Blox Coins for you).
   Everything is made from numbers: a beat fits in a short string that
   goes in your presence, and everyone's clock says which step it's on.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .bsx{display:flex;flex-direction:column;gap:12px;color:#e2e8f0;font:600 13px var(--fb)}
    .bsx .top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:linear-gradient(135deg,#1e1037,#0f172a);border:1px solid rgba(217,70,239,.35);border-radius:16px;padding:10px 12px}
    .bsx .top .grp{display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.28);border-radius:12px;padding:6px 9px}
    .bsx .top label{font:800 10.5px var(--fb);text-transform:uppercase;letter-spacing:.08em;color:#c4b5fd}
    .bsx .top input[type=range]{width:110px;accent-color:#e879f9}
    .bsx .top select{background:#1e1b4b;color:#f5f3ff;border:1px solid rgba(196,181,253,.35);border-radius:8px;padding:4px 6px;font:700 12px var(--fb)}
    .bsx .top b.v{font:700 14px var(--fh);color:#fff;min-width:30px;text-align:right;font-variant-numeric:tabular-nums}
    .bsx .bb{border:0;border-radius:12px;padding:9px 13px;font:700 14px var(--fh);color:#fff;background:#334155;box-shadow:0 3px 0 #1e293b;cursor:pointer;white-space:nowrap}
    .bsx .bb:active{transform:translateY(2px);box-shadow:0 1px 0 #1e293b}
    .bsx .bb.play{background:linear-gradient(180deg,#22c55e,#15803d);box-shadow:0 3px 0 #14532d;min-width:96px}.bsx .bb.play.on{background:linear-gradient(180deg,#f43f5e,#be123c);box-shadow:0 3px 0 #881337}
    .bsx .bb.live{background:linear-gradient(180deg,#d946ef,#9333ea);box-shadow:0 3px 0 #581c87}.bsx .bb.live.on{background:linear-gradient(180deg,#f43f5e,#be123c);box-shadow:0 3px 0 #881337;animation:bsLive 1s infinite}
    @keyframes bsLive{50%{filter:brightness(1.35)}}
    .bsx .bb.sm{padding:6px 10px;font-size:12.5px}
    .bsx .trk{background:linear-gradient(180deg,#141a2b,#0c111d);border:1px solid rgba(148,163,184,.18);border-radius:16px;padding:10px 12px;overflow-x:auto}
    .bsx .trk h4{margin:0 0 8px;display:flex;align-items:center;gap:8px;font:700 16px var(--fh);color:#f8fafc}
    .bsx .trk h4 small{font:700 11px var(--fb);color:#94a3b8}
    .bsx .grid{display:grid;grid-template-columns:96px repeat(16,minmax(24px,1fr));gap:3px;min-width:560px}
    .bsx .grid .rl{display:flex;align-items:center;gap:5px;font:700 11.5px var(--fb);color:#cbd5e1;white-space:nowrap;overflow:hidden}
    .bsx .grid .rl button{border:0;background:none;padding:0;font-size:14px;cursor:pointer;filter:grayscale(0)}.bsx .grid .rl button.mu{filter:grayscale(1);opacity:.45}
    .bsx .c{height:24px;border:0;border-radius:6px;background:#1f2937;cursor:pointer;padding:0;transition:background .08s,transform .08s;box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}
    .bsx .c.q{background:#273449}
    .bsx .c:hover{filter:brightness(1.3)}
    .bsx .c.on{box-shadow:0 0 10px var(--g),inset 0 -2px 0 rgba(0,0,0,.25)}
    .bsx .d .c.on{background:#fb923c;--g:rgba(251,146,60,.6)}.bsx .b .c.on{background:#4ade80;--g:rgba(74,222,128,.6)}.bsx .m .c.on{background:#38bdf8;--g:rgba(56,189,248,.6)}
    .bsx .c.ph{outline:2px solid #fde047;outline-offset:-2px;filter:brightness(1.45)}
    .bsx .c.on.ph{transform:scale(1.1)}
    .bsx .row2{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .bsx .slots{display:flex;gap:6px;align-items:center}
    .bsx .tip{color:#94a3b8;font:600 12px/1.4 var(--fb)}
    .bsx .live-tag{display:inline-flex;align-items:center;gap:6px;background:#be123c;color:#fff;border-radius:999px;padding:3px 10px;font:800 11px var(--fh);letter-spacing:.06em}
    #bsNow{position:absolute;left:50%;top:64px;transform:translateX(-50%);z-index:4;pointer-events:none;display:flex;align-items:center;gap:8px;background:rgba(15,10,30,.72);border:1px solid rgba(232,121,249,.45);border-radius:999px;padding:6px 14px;font:700 13px var(--fh);color:#f5d0fe;box-shadow:0 0 22px rgba(217,70,239,.35);white-space:nowrap}
    #bsNow i{font-style:normal;display:inline-block;animation:bsBounce .5s ease-in-out infinite alternate}
    @keyframes bsBounce{to{transform:translateY(-3px) scale(1.15)}}
    body.touchy #bsNow{top:56px;font-size:12px}`;
  document.head.append(style);

  /* ---------------- the music ---------------- */
  const DRUMS = [['Kick', '🥁'], ['Snare', '🪘'], ['Clap', '👏'], ['Hi-hat', '🎩'], ['Open hat', '🔔'], ['Tom', '🛢️']];
  const LEADS = ['🎹 Piano', '🎛️ Synth', '🪕 Pluck', '🔔 Bell', '👾 Chip', '🌊 Pad'];
  const BASSES = ['🔊 Sub bass', '🎸 Saw bass', '🌀 Wobble'];
  const SCALES = [['Major', [0, 2, 4, 5, 7, 9, 11, 12]], ['Minor', [0, 2, 3, 5, 7, 8, 10, 12]], ['Pentatonic', [0, 3, 5, 7, 10, 12, 15, 17]], ['Blues', [0, 3, 5, 6, 7, 10, 12, 15]]];
  const KEYS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const blank = () => ({ d: DRUMS.map(() => Array(16).fill(0)), b: Array(16).fill(0), m: Array.from({ length: 8 }, () => Array(16).fill(0)), bpm: 110, key: 0, sc: 1, li: 1, bi: 0, sw: 0, mu: [0, 0, 0], nm: 'My beat' });
  // presets: drums as x/. strings, the bass as one digit a step (the scale's note + 1, or .), the melody as step:rows
  const PRESETS = [
    ['🎧 Boom Bap', 90, 9, 1, 0, 0, 12, ['x......x..x.....', '....x.......x...', '................', 'x.x.x.x.x.x.x.xx', '..............x.', '................'], '1......1..1...4.', '0:024 3:4 6:135 8:024 11:2 14:135'],
    ['🏠 House', 124, 5, 1, 1, 1, 0, ['x...x...x...x...', '................', '....x.......x...', 'x.xxx.xxx.xxx.xx', '..x...x...x...x.', '................'], '..1...1...3...4.', '2:024 6:024 10:135 14:246'],
    ['🔥 Trap', 142, 2, 1, 3, 0, 0, ['x......x.x......', '........x.......', '........x.......', 'x.x.x.xxx.x.xxxx', '................', '.............x.x'], '1......1.1....6.', '0:7 3:5 6:4 8:5 11:3 14:2'],
    ['☁️ Lo-fi', 78, 0, 0, 0, 0, 30, ['x.....x...x.....', '....x.......x...', '................', 'x.x.x.x.x.x.x.x.', '................', '..............x.'], '1.....1...6...5.', '0:0246 8:1357 12:4'],
    ['🌆 Synthwave', 108, 9, 1, 5, 1, 0, ['x...x...x...x...', '....x.......x...', '................', 'x.x.x.x.x.x.x.x.', '................', '..........x.x.x.'], '1.1.1.1.6.6.7.7.', '0:4 2:4 4:5 6:4 8:2 10:3 12:4 14:7'],
    ['👾 Chiptune', 150, 7, 0, 4, 1, 0, ['x.......x.......', '....x.......x...', '................', 'x.x.x.x.x.x.x.x.', '................', '................'], '1.5.1.5.4.1.4.5.', '0:0 1:2 2:4 3:7 4:4 5:2 6:0 7:2 8:3 9:5 10:7 11:5 12:4 13:2 14:1 15:4'],
    ['🌀 Dubstep', 140, 4, 1, 1, 2, 0, ['x.........x.....', '........x.......', '........x.......', 'x...x.x.x...x.x.', '................', '..............xx'], '1.1...1.1.3.1.6.', '0:4 4:3 8:4 12:2'],
    ['🎷 Jazzy', 96, 3, 3, 0, 0, 35, ['x......x..x.....', '....x.......x...', '................', 'x.xxx.xxx.xxx.xx', '.........x......', '................'], '1...3...4...6.5.', '0:024 4:5 6:4 8:135 12:3 14:2'],
  ];
  function preset(i) {
    const [nm, bpm, key, sc, li, bi, sw, d, b, m] = PRESETS[i], B = blank();
    Object.assign(B, { nm: nm.replace(/^\S+\s/, ''), bpm, key, sc, li, bi, sw });
    B.d = d.map((r) => r.split('').map((c) => (c === 'x' ? 1 : 0)));
    B.b = b.split('').map((c) => (c === '.' ? 0 : +c));
    for (const tok of m.split(' ')) { const [s, rows] = tok.split(':'); for (const r of rows) if (+r < 8) B.m[+r][+s] = 1; }
    return B;
  }
  // a beat as a short string (for your presence and your saves) and back
  const hex16 = (row) => parseInt(row.slice().reverse().join(''), 2).toString(16).padStart(4, '0');
  const unhex16 = (h) => { const v = parseInt(h, 16) || 0; return Array.from({ length: 16 }, (_, k) => (v >> k) & 1); };
  function enc(B) { return ['2', B.d.map(hex16).join(''), B.b.join(''), B.m.map(hex16).join(''), B.bpm, B.key, B.sc, B.li, B.bi, B.sw, B.mu.join(''), String(B.nm || '').replace(/[|]/g, '').slice(0, 24)].join('|'); }
  function dec(s) {
    const p = String(s || '').split('|'); if (p[0] !== '2' || p.length < 11) return null;
    const B = blank();
    B.d = DRUMS.map((_, r) => unhex16(p[1].slice(r * 4, r * 4 + 4)));
    B.b = p[2].split('').slice(0, 16).map((c) => clamp(+c || 0, 0, 8)); while (B.b.length < 16) B.b.push(0);
    B.m = Array.from({ length: 8 }, (_, r) => unhex16(p[3].slice(r * 4, r * 4 + 4)));
    B.bpm = clamp(+p[4] || 110, 60, 200); B.key = clamp(+p[5] || 0, 0, 11); B.sc = clamp(+p[6] || 0, 0, SCALES.length - 1); B.li = clamp(+p[7] || 0, 0, LEADS.length - 1); B.bi = clamp(+p[8] || 0, 0, BASSES.length - 1); B.sw = clamp(+p[9] || 0, 0, 60);
    B.mu = String(p[10] || '000').split('').slice(0, 3).map((c) => (c === '1' ? 1 : 0)); B.nm = String(p[11] || 'A beat').slice(0, 24);
    return B;
  }
  const notesIn = (B) => B.d.flat().filter(Boolean).length + B.b.filter(Boolean).length + B.m.flat().filter(Boolean).length;
  // a beat out of nowhere that still sounds like music
  function surprise() {
    const r = Math.random, B = blank(), pick = (a) => a[Math.floor(r() * a.length)];
    const style = pick([[90, 1], [100, 0], [124, 1], [140, 1], [110, 2], [128, 0], [84, 3]]);
    Object.assign(B, { bpm: style[0] + Math.round((r() - 0.5) * 10), key: Math.floor(r() * 12), sc: style[1], li: Math.floor(r() * LEADS.length), bi: Math.floor(r() * BASSES.length), sw: r() < 0.3 ? 25 : 0, nm: pick(['Night Drive', 'Neon Rain', 'Block Party', 'Sky High', 'Lo Battery', 'Pixel Heart', 'Bass Face', 'Sunset Loop', 'Moon Jump', 'Turbo Mode']) });
    const four = r() < 0.5;
    for (let s = 0; s < 16; s++) {
      B.d[0][s] = four ? +(s % 4 === 0) : +(s === 0 || s === 8 || (r() < 0.18 && s % 2 === 0));
      B.d[r() < 0.5 ? 1 : 2][s] = +(s === 4 || s === 12);
      B.d[3][s] = +(r() < (four ? 0.8 : 0.6) || s % 2 === 0);
      B.d[4][s] = +(four && s % 4 === 2 && r() < 0.8);
      B.d[5][s] = +(s > 12 && r() < 0.35);
    }
    const roots = [0, pick([3, 5, 4]), pick([4, 5]), pick([3, 0, 5])];
    for (let s = 0; s < 16; s++) if (s % 4 === 0 || r() < 0.22) B.b[s] = roots[Math.floor(s / 4)] + 1;
    let row = Math.floor(r() * 5);
    for (let s = 0; s < 16; s++) if (r() < 0.55 || s === 0) { row = clamp(row + Math.round((r() - 0.5) * 4), 0, 7); B.m[row][s] = 1; }
    return B;
  }

  /* ---------------- the sounds ---------------- */
  const A = { ac: null, bus: null, noise: null };
  function audio() {
    const s = window.Sfx && Sfx.audio && Sfx.audio(); if (!s) return null;
    if (A.ac !== s.ac) {
      A.ac = s.ac; A.noise = null;
      const comp = s.ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.18;
      const g = s.ac.createGain(); g.gain.value = 0.9; comp.connect(g); g.connect(s.out); A.bus = comp;
    }
    return A;
  }
  function noise(ac, t, dur, off) {
    if (!A.noise) { const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; A.noise = b; }
    const s = ac.createBufferSource(); s.buffer = A.noise; s.start(t, off != null ? off : Math.random() * 0.5); s.stop(t + dur + 0.02); return s;
  }
  const filt = (ac, type, f, q) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; };
  function gainEnv(ac, t, peak, att, dec, hold = 0) { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + att); if (hold) g.gain.setValueAtTime(Math.max(0.0002, peak), t + att + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + att + hold + dec); return g; }
  const osc = (ac, type, f, t, end) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; };
  const DRUM = [
    (ac, d, t, v) => { // kick: a thump that drops in pitch, and a click
      const o = osc(ac, 'sine', 165, t, t + 0.55); o.frequency.exponentialRampToValueAtTime(46, t + 0.12); const g = gainEnv(ac, t, v, 0.003, 0.45); o.connect(g); g.connect(d);
      const n = noise(ac, t, 0.02), hp = filt(ac, 'highpass', 2500), g2 = gainEnv(ac, t, v * 0.25, 0.001, 0.02); n.connect(hp); hp.connect(g2); g2.connect(d);
    },
    (ac, d, t, v) => { // snare: a crack of noise, a body under it
      const n = noise(ac, t, 0.22), bp = filt(ac, 'bandpass', 1900, 0.7), g = gainEnv(ac, t, v * 0.55, 0.002, 0.19); n.connect(bp); bp.connect(g); g.connect(d);
      const o = osc(ac, 'triangle', 200, t, t + 0.14); o.frequency.exponentialRampToValueAtTime(140, t + 0.1); const g2 = gainEnv(ac, t, v * 0.4, 0.002, 0.11); o.connect(g2); g2.connect(d);
    },
    (ac, d, t, v) => { // clap: three quick slaps and a tail
      const n = noise(ac, t, 0.3), bp = filt(ac, 'bandpass', 1250, 1.1), g = ac.createGain(); n.connect(bp); bp.connect(g); g.connect(d);
      g.gain.setValueAtTime(0.0001, t); for (const k of [0, 0.011, 0.022]) { g.gain.setValueAtTime(v * 0.6, t + k); g.gain.exponentialRampToValueAtTime(v * 0.1, t + k + 0.009); }
      g.gain.setValueAtTime(v * 0.5, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    },
    (ac, d, t, v) => { const n = noise(ac, t, 0.06), hp = filt(ac, 'highpass', 7800), g = gainEnv(ac, t, v * 0.28, 0.001, 0.045); n.connect(hp); hp.connect(g); g.connect(d); },
    (ac, d, t, v) => { const n = noise(ac, t, 0.36), hp = filt(ac, 'highpass', 6800), g = gainEnv(ac, t, v * 0.22, 0.003, 0.3); n.connect(hp); hp.connect(g); g.connect(d); },
    (ac, d, t, v) => { const o = osc(ac, 'sine', 230, t, t + 0.32); o.frequency.exponentialRampToValueAtTime(115, t + 0.25); const g = gainEnv(ac, t, v * 0.6, 0.002, 0.28); o.connect(g); g.connect(d); },
  ];
  const BASS = [
    (ac, d, t, f, len, v) => { const o = osc(ac, 'sine', f, t, t + len + 0.12), o2 = osc(ac, 'triangle', f * 2, t, t + len + 0.12), g = gainEnv(ac, t, v * 0.75, 0.008, 0.1, len), g2 = ac.createGain(); g2.gain.value = 0.18; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(d); },
    (ac, d, t, f, len, v) => { const o = osc(ac, 'sawtooth', f, t, t + len + 0.12), lp = filt(ac, 'lowpass', 1500, 7); lp.frequency.setValueAtTime(1500, t); lp.frequency.exponentialRampToValueAtTime(260, t + Math.max(0.08, len)); const g = gainEnv(ac, t, v * 0.42, 0.006, 0.09, len); o.connect(lp); lp.connect(g); g.connect(d); },
    (ac, d, t, f, len, v, bpm) => { // wobble: the filter opening and closing in eighth notes
      const o = osc(ac, 'sawtooth', f, t, t + len + 0.12), o2 = osc(ac, 'square', f * 0.5, t, t + len + 0.12), lp = filt(ac, 'lowpass', 500, 9), lfo = osc(ac, 'sine', (bpm / 60) * 2, t, t + len + 0.12), lg = ac.createGain();
      lg.gain.value = 900; lfo.connect(lg); lg.connect(lp.frequency); const g = gainEnv(ac, t, v * 0.4, 0.01, 0.08, len); o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(d);
    },
  ];
  const LEAD = [
    (ac, d, t, f, len, v) => { const g = gainEnv(ac, t, v * 0.32, 0.004, 1.3), lp = filt(ac, 'lowpass', 3600); for (const [m, k, ty] of [[1, 1, 'triangle'], [2, 0.32, 'sine'], [3, 0.1, 'sine']]) { const o = osc(ac, ty, f * m, t, t + 1.4), gg = ac.createGain(); gg.gain.value = k; o.connect(gg); gg.connect(lp); } lp.connect(g); g.connect(d); },
    (ac, d, t, f, len, v) => { const lp = filt(ac, 'lowpass', 3400, 3); lp.frequency.setValueAtTime(3400, t); lp.frequency.exponentialRampToValueAtTime(1100, t + 0.3); const g = gainEnv(ac, t, v * 0.16, 0.01, 0.16, len); for (const k of [0.996, 1.004]) osc(ac, 'sawtooth', f * k, t, t + len + 0.2).connect(lp); lp.connect(g); g.connect(d); },
    (ac, d, t, f, len, v) => { const lp = filt(ac, 'lowpass', 5200, 4); lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.22); const g = gainEnv(ac, t, v * 0.24, 0.002, 0.34); osc(ac, 'square', f, t, t + 0.4).connect(lp); lp.connect(g); g.connect(d); },
    (ac, d, t, f, len, v) => { const c = osc(ac, 'sine', f, t, t + 1.7), m = osc(ac, 'sine', f * 3.5, t, t + 1.7), mg = ac.createGain(); mg.gain.setValueAtTime(f * 2.4, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.2); m.connect(mg); mg.connect(c.frequency); const g = gainEnv(ac, t, v * 0.3, 0.003, 1.6); c.connect(g); g.connect(d); },
    (ac, d, t, f, len, v) => { const g = gainEnv(ac, t, v * 0.12, 0.002, 0.04, Math.max(0.04, len * 0.75)); osc(ac, 'square', f, t, t + len + 0.1).connect(g); g.connect(d); },
    (ac, d, t, f, len, v) => { const lp = filt(ac, 'lowpass', 1900, 1), g = gainEnv(ac, t, v * 0.1, 0.22, 0.5, len); for (const k of [0.993, 1, 1.007]) osc(ac, 'sawtooth', f * k, t, t + len + 0.8).connect(lp); lp.connect(g); g.connect(d); },
  ];
  // one step of a beat, at time t on the sound card (sd: a step's length)
  function playStep(ac, dest, B, s, t, sd, v) {
    if (!B.mu[0]) B.d.forEach((row, r) => { if (row[s]) DRUM[r](ac, dest, t, v * (r === 0 ? 1 : 0.95)); });
    const sc = SCALES[B.sc][1];
    if (!B.mu[1] && B.b[s]) { let n = 1; while (n < 4 && !B.b[(s + n) % 16]) n++; BASS[B.bi](ac, dest, t, NOTE(36 + B.key + sc[B.b[s] - 1]), sd * n * 0.92, v, B.bpm); }
    if (!B.mu[2]) for (let r = 0; r < 8; r++) if (B.m[r][s]) { let n = 1; while (n < 4 && !B.m[r][(s + n) % 16]) n++; LEAD[B.li](ac, dest, t, NOTE(60 + B.key + sc[r]), sd * n * 0.9, v); }
  }
  // a stream: a beat playing from a moment on everyone's clock (t0), its own volume
  function stream(B, t0) { return { B, t0, last: null, g: null, vol: 0 }; }
  const stepLen = (B) => 60 / B.bpm / 4;
  const stepTime = (st, k) => st.t0 + k * stepLen(st.B) + (k % 2 ? (st.B.sw / 100) * stepLen(st.B) * 0.66 : 0);
  function pump(st, vol) { // schedule what's due in the next moment
    const a = audio(); if (!a) { st.last = null; return; }
    const ac = a.ac;
    if (!st.g || st.g.context !== ac) { st.g = ac.createGain(); st.g.gain.value = 0; st.g.connect(a.bus); }
    st.g.gain.setTargetAtTime(vol, ac.currentTime, 0.12);
    if (vol < 0.01) { st.last = null; return; }
    const ns = now(), sd = stepLen(st.B);
    let k = Math.floor((ns - st.t0) / sd); if (st.last != null) k = Math.max(k, st.last + 1);
    for (let guard = 0; guard < 32; guard++, k++) {
      const ts = stepTime(st, k); if (ts > ns + 0.15) break;
      if (ts >= ns - 0.03) playStep(ac, st.g, st.B, ((k % 16) + 16) % 16, ac.currentTime + Math.max(0, ts - ns) + 0.02, sd, 0.9);
      st.last = k;
    }
  }
  function stopStream(st) { if (st && st.g) { try { st.g.gain.setTargetAtTime(0, st.g.context.currentTime, 0.05); const g = st.g; setTimeout(() => g.disconnect(), 600); } catch (e) {} st.g = null; } }

  /* ---------------- pictures ---------------- */
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function textPlane(text, w, h, o = {}) {
    const c = cv(1024, Math.round((1024 * h) / w)), g = c.getContext('2d');
    g.font = `900 ${o.fs || 150}px "Segoe UI",system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = o.glow || '#f0abfc'; g.shadowBlur = 40; g.fillStyle = o.color || '#fdf4ff';
    for (let k = 0; k < 3; k++) g.fillText(text, c.width / 2, c.height / 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.userData.ownGeo = true; m.material.userData.own = true; return m;
  }
  const fabric = (c) => ({ c, mat: 'fabric' });

  const BS = {
    id: 'beats', code: 'bt', genre: 'Music', rank: 0.0001, name: 'Beat Studio', emoji: '🎧', max: 16, stat: 'Likes', killY: -40, banner: true, camDist: 18,
    land: { theme: 'night', mode: 'sky', low: -90, extras: ['stars'] },
    color: 'linear-gradient(135deg,#d946ef,#6d28d9 50%,#0ea5e9)',
    desc: 'Make your own beats on a neon rooftop club. Step up to a studio booth for the beat maker — drums, a bassline and a melody, any key, tempo and swing, with presets, surprise beats and save slots — then go live and play it on the club’s speakers for everyone. The dance floor, lights and speakers move to the music, and people can ❤️ your beat for Blox Coins.',
    welcome: 'Walk up to a 🎹 studio booth (or press Studio) to make a beat, then go live!',
    build() {
      sky('#07031a', '#2a0f4a');
      this.fx = {}; const F = this.fx;
      // the roof: dark tiles, a glass railing all round with a neon strip on it
      slab(0, 0, 0, 96, 76, 0x1a1626, { sy: 2, mat: 'tiles' });
      for (const [x, z, sx, sz] of [[0, -38, 96, 0.6], [0, 38, 96, 0.6], [-48, 0, 0.6, 76], [48, 0, 0.6, 76]]) {
        part({ x, y: 2, z, sx, sy: 4, sz, c: 0x93c5fd, alpha: 0.18, plain: true });
        part({ x, y: 4.1, z, sx: sx + 0.2, sy: 0.25, sz: sz + 0.2, c: 0xd946ef, neon: true, solid: false });
      }
      F.rails = parts.slice(-8).filter((p, i) => i % 2 === 1);
      // the dance floor: 8×8 squares of light
      F.tiles = [];
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const p = part({ x: -14 + i * 4, y: 0.12, z: -18 + j * 4, sx: 3.8, sy: 0.24, sz: 3.8, c: 0x6d28d9, neon: true }); p.i = i; p.j = j; F.tiles.push(p); }
      part({ x: 0, y: 0.06, z: -4, sx: 34, sy: 0.12, sz: 34, c: 0x0b0b12, plain: true, solid: false, mat: 'metal' });
      // the stage, its steps, the DJ booth
      const SZ = -30;
      slab(0, 2.6, SZ, 44, 12, 0x232031, { sy: 2.6, mat: 'metal' });
      part({ x: 0, y: 2.65, z: SZ + 6.05, sx: 44, sy: 0.2, sz: 0.2, c: 0x22d3ee, neon: true, solid: false });
      for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) slab(sx * 24.5, 0.87 * (k + 1), SZ + 2 - k * 0, 5 - k * 1.4, 8, 0x2e2a40, { sy: 0.87, mat: 'metal' });
      slab(0, 5.6, SZ - 1, 12, 3.4, 0x111018, { sy: 3, mat: 'metal' }); // the desk
      F.deskLed = part({ x: 0, y: 4.1, z: SZ + 0.75, sx: 11.6, sy: 0.35, sz: 0.1, c: 0xd946ef, neon: true, solid: false });
      const vinyl = new THREE.CylinderGeometry(1.25, 1.25, 0.12, 28), lab = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 18);
      F.platters = [-3.5, 3.5].map((x) => {
        const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 3), new THREE.MeshPhongMaterial({ color: 0x2b2b35, specular: 0x666666, shininess: 60 })); base.position.set(x, 5.8, SZ - 1); place.add(base);
        const g = new THREE.Group(); g.position.set(x, 6.08, SZ - 1); place.add(g);
        const v = new THREE.Mesh(vinyl, new THREE.MeshPhongMaterial({ color: 0x0a0a0a, specular: 0x555555, shininess: 90 })); g.add(v);
        const l = new THREE.Mesh(lab, new THREE.MeshBasicMaterial({ color: x < 0 ? 0xf472b6 : 0x38bdf8 })); g.add(l);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.8), new THREE.MeshPhongMaterial({ color: 0xd1d5db, specular: 0xffffff, shininess: 90 })); arm.position.set(x + 1.15, 6.25, SZ - 1.4); arm.rotation.y = 0.35; place.add(arm);
        return g;
      });
      F.knobs = [];
      { const mix = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2.6), new THREE.MeshPhongMaterial({ color: 0x1f1f2a, specular: 0x666666, shininess: 50 })); mix.position.set(0, 5.85, SZ - 1); place.add(mix);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 10), new THREE.MeshBasicMaterial({ color: [0xf472b6, 0x38bdf8, 0xfacc15][i] })); k.position.set(-0.8 + i * 0.8, 6.15, SZ - 1.7 + j * 0.7); place.add(k); F.knobs.push(k); }
        for (let i = 0; i < 3; i++) { const fd = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.5), new THREE.MeshBasicMaterial({ color: 0x4ade80 })); fd.position.set(-0.8 + i * 0.8, 6.13, SZ - 0.2); place.add(fd); F.knobs.push(fd); } }
      // the LED wall, and the equalisers either side of it
      F.led = cv(768, 288); F.ledTex = new THREE.CanvasTexture(F.led);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(34, 12.75), new THREE.MeshBasicMaterial({ map: F.ledTex })); wall.position.set(0, 11.5, SZ - 5.6); place.add(wall); wall.userData.ownGeo = true;
      part({ x: 0, y: 11.5, z: SZ - 6.1, sx: 35.4, sy: 14.2, sz: 0.6, c: 0x111018, mat: 'metal' });
      F.eq = [];
      for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const p = part({ x: sx * (19.5 + i * 1.3), y: 3, z: SZ - 5.4, sx: 1, sy: 1, sz: 1, c: 0x22d3ee, neon: true, solid: false }); p.band = i; F.eq.push(p); }
      // the speakers: stacks either side, their cones thump
      F.cones = [];
      const cone = new THREE.CylinderGeometry(1, 1, 0.3, 24), dome = new THREE.SphereGeometry(0.35, 12, 8);
      for (const sx of [-1, 1]) for (const [y, r] of [[4.6, 1.5], [8.4, 1.5], [11.6, 0.9]]) {
        if (y === 4.6) part({ x: sx * 16, y: 2.6 + 6.2, z: SZ - 2, sx: 5, sy: 12.4, sz: 4, c: 0x16151d, mat: 'fabric' });
        const g = new THREE.Group(); g.position.set(sx * 16, 2.6 + y, SZ); place.add(g);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.12, 8, 24), new THREE.MeshPhongMaterial({ color: 0x9ca3af, specular: 0xffffff, shininess: 80 })); g.add(ring);
        const c = new THREE.Mesh(cone, new THREE.MeshPhongMaterial({ color: 0x27272a, specular: 0x333333, shininess: 20 })); c.scale.set(r, 1, r); c.rotation.x = Math.PI / 2; g.add(c);
        const dm = new THREE.Mesh(dome, new THREE.MeshPhongMaterial({ color: 0x3f3f46, specular: 0x999999, shininess: 60 })); dm.scale.setScalar(r * 0.8); dm.position.z = 0.1; g.add(dm);
        F.cones.push(g);
      }
      // the truss over the stage, its lights sweeping the crowd
      for (const sx of [-1, 1]) part({ x: sx * 21, y: 2.6 + 9, z: SZ + 5, sx: 1, sy: 18, sz: 1, c: 0x52525b, mat: 'metal' });
      part({ x: 0, y: 2.6 + 18, z: SZ + 5, sx: 43, sy: 1, sz: 1, c: 0x52525b, mat: 'metal', solid: false });
      F.beams = [];
      const beamGeo = new THREE.ConeGeometry(3.4, 30, 20, 1, true); beamGeo.translate(0, -15, 0);
      for (let i = 0; i < 6; i++) {
        const g = new THREE.Group(); g.position.set(-17.5 + i * 7, 2.6 + 17.4, SZ + 5); place.add(g);
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 12), new THREE.MeshPhongMaterial({ color: 0x18181b, specular: 0x777777, shininess: 60 })); g.add(can);
        const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); g.add(beam);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), new THREE.MeshBasicMaterial({ color: 0xffffff })); lens.rotation.x = Math.PI / 2; lens.position.y = -0.61; g.add(lens);
        g.userData = { beam, lens, ph: i * 1.1 }; F.beams.push(g);
      }
      // the disco ball over the dance floor
      { const c = cv(256, 128), g = c.getContext('2d'); for (let y = 0; y < 128; y += 8) for (let x = 0; x < 256; x += 8) { const v = 120 + Math.floor(Math.random() * 135); g.fillStyle = `rgb(${v},${v},${v + 10})`; g.fillRect(x, y, 7, 7); }
        const ball = new THREE.Mesh(new THREE.SphereGeometry(2.2, 28, 18), new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(c), specular: 0xffffff, shininess: 120, emissive: 0x221133 }));
        ball.position.set(0, 21, -4); place.add(ball); F.ball = ball;
        part({ x: 0, y: 26.5, z: -4, sx: 0.12, sy: 9, sz: 0.12, c: 0x71717a, solid: false, plain: true });
        F.sparks = [];
        for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: [0xf0abfc, 0x67e8f9, 0xfde047, 0xffffff][i % 4], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(1.6); place.add(sp); sp.userData.ph = Math.random() * 7; sp.userData.r = 6 + Math.random() * 14; F.sparks.push(sp); } }
      // the studio booths, two down each side
      this.booths = [];
      for (const sx of [-1, 1]) for (const z of [-12, 6]) {
        const x = sx * 41;
        part({ x: x + sx * 5.6, y: 5, z, sx: 0.8, sy: 10, sz: 12, c: 0x2e1065, mat: 'fabric' }); // the back wall
        for (const dz of [-6, 6]) part({ x: x + sx * 2.6, y: 4, z: z + dz, sx: 6.4, sy: 8, sz: 0.6, c: 0x3b0764, mat: 'fabric' });
        part({ x: x + sx * 2.6, y: 8.2, z, sx: 6.4, sy: 0.4, sz: 12.6, c: 0x1e1b4b, mat: 'metal', solid: false });
        part({ x: x + sx * 2.6, y: 7.95, z, sx: 6.2, sy: 0.1, sz: 0.2, c: 0xe879f9, neon: true, solid: false });
        part({ x: x + sx * 3.4, y: 1.6, z, sx: 3, sy: 3.2, sz: 7, c: 0x7c4a1e, mat: 'wood' }); // the desk
        // the keyboard: white keys, black keys
        for (let k = 0; k < 14; k++) part({ x: x + sx * 2.6, y: 3.3, z: z - 3.05 + k * 0.47, sx: 1.1, sy: 0.18, sz: 0.42, c: 0xf8fafc, plain: true, solid: false });
        for (let k = 0; k < 13; k++) if ([0, 1, 3, 4, 5].includes(k % 7)) part({ x: x + sx * 2.85, y: 3.45, z: z - 2.82 + k * 0.47, sx: 0.65, sy: 0.18, sz: 0.24, c: 0x111111, plain: true, solid: false });
        part({ x: x + sx * 3.9, y: 3.3, z: z, sx: 1.4, sy: 0.25, sz: 6.6, c: 0x18181b, mat: 'metal', solid: false });
        // a screen with a beat on it, two monitor speakers
        const scr = part({ x: x + sx * 4.6, y: 5.2, z, sx: 0.2, sy: 2.4, sz: 3.8, c: 0x22d3ee, neon: true, solid: false }); scr.screen = 1;
        for (const dz of [-3.3, 3.3]) { part({ x: x + sx * 4.3, y: 4.55, z: z + dz, sx: 1.2, sy: 2, sz: 1.2, c: 0x18181b, mat: 'plastic', solid: false }); part({ x: x + sx * 3.68, y: 4.4, z: z + dz, sx: 0.05, sy: 0.8, sz: 0.8, c: 0x52525b, plain: true, solid: false }); }
        part({ x: x + sx * 0.6, y: 1.2, z, sx: 1.8, sy: 0.4, sz: 1.8, c: 0x18181b, mat: 'fabric' }); part({ x: x + sx * 0.6, y: 0.5, z, sx: 0.3, sy: 1, sz: 0.3, c: 0x71717a, mat: 'metal' });
        const sg = label('🎹 STUDIO', { size: 1.6, color: '#f5d0fe' }); sg.position.set(x + sx * 1, 9.6, z); place.add(sg);
        this.booths.push({ x: x - sx * 1.5, z, sx });
      }
      // the lounge: sofas facing the stage, tables, plants
      for (const sx of [-1, 1]) for (const z of [22, 30]) {
        const x = sx * 24, c = sx < 0 ? 0x7e22ce : 0x0e7490;
        part(Object.assign({ x, y: 0.9, z, sx: 10, sy: 1.6, sz: 3.4 }, fabric(c))); part(Object.assign({ x, y: 2.1, z: z + 1.5, sx: 10, sy: 2.6, sz: 0.9 }, fabric(c)));
        for (const dx of [-5, 5]) part(Object.assign({ x: x + dx, y: 1.5, z, sx: 1, sy: 2.4, sz: 3.4 }, fabric(new THREE.Color(c).multiplyScalar(0.8).getHex())));
        part({ x, y: 0.6, z: z - 3.4, sx: 5, sy: 1.2, sz: 2.2, c: 0xe5e7eb, mat: 'marble' });
        part({ x, y: 1.25, z: z - 3.4, sx: 4, sy: 0.1, sz: 0.1, c: sx < 0 ? 0xf0abfc : 0x67e8f9, neon: true, solid: false });
      }
      for (const [x, z] of [[-44, 34], [44, 34], [-44, -34], [44, -34], [-12, 34], [12, 34]]) {
        part({ x, y: 1, z, sx: 2.2, sy: 2, sz: 2.2, c: 0xd6d3d1, mat: 'stone' });
        const g = new THREE.Group(); g.position.set(x, 2, z); place.add(g);
        for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(KIT_ICO, new THREE.MeshLambertMaterial({ color: [0x16a34a, 0x15803d, 0x22c55e][k % 3] })); b.scale.setScalar(0.9 + Math.random() * 0.5); b.position.set((Math.random() - 0.5) * 1.6, 0.8 + k * 0.45, (Math.random() - 0.5) * 1.6); g.add(b); }
      }
      // a juice bar at the back, under the sign
      part({ x: 0, y: 1.7, z: 33, sx: 18, sy: 3.4, sz: 3, c: 0x1f1b2e, mat: 'marble' });
      part({ x: 0, y: 3.5, z: 33, sx: 18.4, sy: 0.2, sz: 3.4, c: 0xe5e7eb, mat: 'marble' });
      part({ x: 0, y: 2.6, z: 31.4, sx: 18, sy: 0.2, sz: 0.1, c: 0x22d3ee, neon: true, solid: false });
      for (let k = 0; k < 5; k++) { part({ x: -8 + k * 4, y: 1.3, z: 30, sx: 1.4, sy: 0.3, sz: 1.4, c: 0xdb2777, mat: 'fabric' }); part({ x: -8 + k * 4, y: 0.6, z: 30, sx: 0.25, sy: 1.2, sz: 0.25, c: 0xa1a1aa, mat: 'metal' }); }
      for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 10), new THREE.MeshPhongMaterial({ color: [0xf97316, 0x84cc16, 0xec4899, 0x06b6d4][k % 4], transparent: true, opacity: 0.85, shininess: 100, specular: 0xffffff })); b.position.set(-6 + k * 2, 4.05, 33.6); place.add(b); }
      // the big neon sign
      const sign = textPlane('BEAT STUDIO', 34, 6.4, { color: '#fdf4ff', glow: '#e879f9' }); sign.position.set(0, 12, 37.4); sign.rotation.y = Math.PI; place.add(sign);
      part({ x: 0, y: 12, z: 37.8, sx: 36, sy: 7, sz: 0.4, c: 0x0f0a1e, mat: 'metal', solid: false });
      for (const sx of [-1, 1]) part({ x: sx * 17, y: 4.5, z: 37.6, sx: 0.6, sy: 9, sz: 0.6, c: 0x3f3f46, mat: 'metal' });
      const wel = textPlane('🎧 make a beat · go live', 22, 2.6, { fs: 84, color: '#e0f2fe', glow: '#22d3ee' }); wel.position.set(0, 7.6, 37.3); wel.rotation.y = Math.PI; place.add(wel);
      this.boothScreens = parts.filter((p) => p.screen);
    },
    pres() { return { bt: '', lv: 0, lk: '', lks: 0 }; },
    menu() { return [['🎹 Studio', () => this.openStudio()]]; },
    prompts() { return (this.booths || []).map((b) => ({ x: b.x, z: b.z, r: 6, text: '🎹 Open the studio', fn: () => this.openStudio() })); },
    enter() {
      this.B = this.B || (W.beats && dec(W.beats[0])) || preset(0);
      this.mine = null; this.club = null; this.live = 0; this.likesGot = new Set(); this.lks = 0; this.myLikes = new Set(); this.vis = { k: -1, kick: 0, snare: 0, hat: 0, mel: 0, bass: 0, hue: 0.8 }; this.ledAt = 0; this.sentAt = 0; this.dirty = false; this.liveSince = 0;
      this.drawBar();
      if (!document.getElementById('bsNow')) { const n = document.createElement('div'); n.id = 'bsNow'; (document.getElementById('hud') || document.body).append(n); }
    },
    leave() { stopStream(this.mine); stopStream(this.club); this.mine = this.club = null; const n = document.getElementById('bsNow'); if (n) n.remove(); this.live = 0; },
    spawn() { return [(Math.random() - 0.5) * 16, 0.5, 13 + Math.random() * 5, 0]; },
    drawBar() {
      const dj = this.dj && this.dj.peer && this.dj.peer !== myPeer() ? this.dj : null, liked = dj && this.myLikes.has(dj.peer + ':' + dj.lv);
      setBar(`<button class="xslot" data-k="studio" title="Beat maker (B)"><span class="k">B</span><span class="e">🎹</span>Studio</button>`
        + `<button class="xslot" data-k="live" title="Play your beat for the club"><span class="e">${this.live ? '⏹️' : '📡'}</span>${this.live ? 'Stop live' : 'Go live'}</button>`
        + (dj ? `<button class="xslot" data-k="like" title="Like this beat" ${liked ? 'disabled' : ''}><span class="e">${liked ? '💖' : '❤️'}</span>${liked ? 'Liked' : 'Like'}</button>` : ''), (b) => {
        if (b.dataset.k === 'studio') this.openStudio(); else if (b.dataset.k === 'live') this.toggleLive(); else if (b.dataset.k === 'like') this.like();
      });
    },
    key(code, down) { if (down && code === 'KeyB') { if (this.studioOpen()) closePanel(); else this.openStudio(); return true; } return false; },

    /* ---- who's playing: the DJ (whoever went live last), or the resident DJ ---- */
    findDJ() {
      let best = null;
      if (this.live) best = { peer: myPeer(), nm: Net.name, lv: this.live, B: this.B, s: enc(this.B) };
      for (const p of Net.peers) { if (p.isMe || !p.presence) continue; const lv = +p.presence.lv || 0, s = String(p.presence.bt || ''); if (lv > 0 && s && (!best || lv > best.lv)) { const B = this.decCache(s); if (B) best = { peer: p.peer, nm: String(p.presence.nm || 'Someone').slice(0, 20), lv, B, s }; } }
      if (best) return best;
      const per = 192, slot = Math.floor(now() / per), B = preset(slot % PRESETS.length);
      return { peer: '', nm: 'DJ Blox', lv: slot * per, B, s: 'res' + slot, resident: true };
    },
    decCache(s) { if (!this.dc || this.dc.s !== s) this.dc = { s, B: dec(s) }; return this.dc.B; },
    studioOpen() { return panelOpen() && $('#xpTitle').textContent.startsWith('🎹'); },

    tick(dt) {
      const dj = this.findDJ(), key = dj.peer + ':' + dj.lv;
      if (!this.dj || this.dj.peer !== dj.peer || this.dj.lv !== dj.lv) { this.dj = dj; this.drawBar(); }
      this.dj = dj;
      if (!this.club || this.club.key !== key) { stopStream(this.club); this.club = stream(dj.B, dj.lv); this.club.key = key; }
      this.club.B = dj.B;
      // your studio: while it's open and playing you hear only yours
      const mineOn = !!(this.mine && this.mine.on), sd = Math.hypot(P.x, P.z + 26);
      if (this.mine) { this.mine.B = this.B; pump(this.mine, mineOn && this.studioOpen() ? 0.95 : 0); if (!this.studioOpen() && this.mine.on && !this.live) { this.mine.on = false; } }
      const musicOn = typeof Music === 'undefined' || Music.on; // (🎵 Music off in the menu: the club's quiet; your own studio still plays)
      pump(this.club, mineOn && this.studioOpen() ? 0 : musicOn ? clamp(1.05 - sd / 110, 0.4, 1) : 0);
      // what everyone sees: the club's beat, step by step
      const src = mineOn && this.studioOpen() ? this.mine : this.club, B = src.B, k = Math.floor((now() - src.t0) / stepLen(B)), s = ((k % 16) + 16) % 16, V = this.vis;
      if (k !== V.k) {
        V.k = k;
        if (B.d[0][s] && !B.mu[0]) V.kick = 1; if ((B.d[1][s] || B.d[2][s]) && !B.mu[0]) V.snare = 1; if ((B.d[3][s] || B.d[4][s]) && !B.mu[0]) V.hat = 1;
        if (B.b[s] && !B.mu[1]) V.bass = 1; if (!B.mu[2] && B.m.some((r) => r[s])) V.mel = 1;
        if (s === 0) V.hue = (V.hue + 0.13) % 1;
        V.s = s; V.bar = Math.floor(k / 16);
        if (this.studioOpen()) this.playhead(mineOn ? s : -1);
      }
      for (const n of ['kick', 'snare', 'hat', 'bass', 'mel']) V[n] = Math.max(0, V[n] - dt * (n === 'hat' ? 9 : n === 'kick' ? 5 : 3.5));
      this.animate(dt, B);
      // the DJ: likes coming in
      if (this.live) {
        const mine = myPeer() + ':' + this.live;
        for (const p of Net.peers) if (!p.isMe && p.presence && p.presence.lk === mine && !this.likesGot.has(p.peer + mine)) {
          this.likesGot.add(p.peer + mine); this.lks++; send({ lks: this.lks }); quest('beats.likes', 1);
          earn(15, `❤️ ${String(p.presence.nm || 'Someone').slice(0, 16)} liked your beat`); sfx('reward');
        }
        if (this.dirty && performance.now() - this.sentAt > 400) { this.dirty = false; this.sentAt = performance.now(); send({ bt: enc(this.B) }); }
      }
      const nw = document.getElementById('bsNow');
      if (nw) { const t = `<i>🎵</i> ${dj.resident ? 'Resident DJ' : dj.peer === myPeer() ? '📡 You’re live' : '📡 Live'}: <b>${esc(dj.nm)}</b> — “${esc(dj.B.nm)}” · ${dj.B.bpm} BPM`; if (nw.dataset.t !== t) { nw.dataset.t = t; nw.innerHTML = t; } nw.style.display = this.studioOpen() ? 'none' : ''; }
    },
    // the club moving to the music
    animate(dt, B) {
      const F = this.fx, V = this.vis; if (!F) return;
      const t = performance.now() / 1000, beat = V.kick;
      F.tiles.forEach((p) => {
        const d = Math.hypot(p.i - 3.5, p.j - 3.5), wave = 0.5 + 0.5 * Math.sin(d * 1.3 - (V.k || 0) * 0.9), h = (V.hue + d * 0.045 + (p.i + p.j) * 0.01) % 1;
        const l = 0.12 + 0.3 * wave * (0.4 + 0.6 * Math.max(V.bass, V.mel)) + 0.28 * beat * (d < 2.5 ? 1 : 0.4);
        p.m.material.color.setHSL(h, 0.9, Math.min(0.62, l));
      });
      F.cones.forEach((g, i) => { const k = 1 + (i % 3 === 2 ? V.hat * 0.06 : beat * 0.12); g.scale.set(k, k, 1 + beat * 0.5); });
      F.platters.forEach((g) => (g.rotation.y += dt * (B.bpm / 60) * Math.PI * 0.6));
      F.knobs.forEach((k, i) => { k.material.color.setHSL((V.hue + i * 0.12) % 1, 0.9, 0.45 + 0.3 * (i % 2 ? V.snare : V.kick)); });
      F.deskLed.m.material.color.setHSL((V.hue + 0.5) % 1, 1, 0.4 + 0.3 * beat);
      F.rails.forEach((p, i) => p.m.material.color.setHSL((V.hue + i * 0.25 + t * 0.05) % 1, 1, 0.45 + 0.2 * beat));
      const bands = [V.kick, V.bass, V.snare, V.mel, V.hat, (V.hat + V.mel) / 2];
      F.eq.forEach((p) => { const v = 0.15 + bands[p.band] * (0.8 + 0.2 * Math.sin(t * 9 + p.band)); const h = 1 + v * 11; p.m.scale.y = h; p.m.position.y = 2.6 + h / 2; p.m.material.color.setHSL((V.hue + p.band * 0.07) % 1, 1, 0.5); });
      F.beams.forEach((g, i) => {
        const ph = g.userData.ph, sp = 0.5 + (B.bpm / 120) * 0.4;
        g.rotation.x = 0.55 + 0.32 * Math.sin(t * sp + ph); g.rotation.z = 0.5 * Math.sin(t * sp * 0.7 + ph * 1.7);
        const c = new THREE.Color().setHSL((V.hue + i * 0.17) % 1, 1, 0.55); g.userData.beam.material.color.copy(c); g.userData.lens.material.color.copy(c);
        g.userData.beam.material.opacity = 0.07 + 0.09 * (i % 2 ? V.snare : beat);
      });
      F.ball.rotation.y += dt * 0.6;
      F.sparks.forEach((sp, i) => { const u = sp.userData, a = u.ph + t * 0.6; sp.position.set(Math.cos(a) * u.r, 0.5 + ((i * 1.7 + t * 0.2) % 1) * 0.2 + (i % 5) * 3, -4 + Math.sin(a) * u.r * 0.9); sp.material.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 + u.ph)) * (0.4 + 0.6 * beat); });
      this.boothScreens.forEach((p, i) => p.m.material.color.setHSL((V.hue + 0.5 + i * 0.1) % 1, 0.85, 0.4 + 0.15 * V.mel));
      if (t - this.ledAt > 0.07) { this.ledAt = t; this.drawLed(B); }
    },
    drawLed(B) {
      const F = this.fx, c = F.led, g = c.getContext('2d'), V = this.vis, W0 = c.width, H0 = c.height, t = performance.now() / 1000, dj = this.dj || {};
      const gr = g.createLinearGradient(0, 0, W0, H0); gr.addColorStop(0, `hsl(${V.hue * 360},85%,30%)`); gr.addColorStop(1, `hsl(${(V.hue * 360 + 80) % 360},85%,18%)`); g.fillStyle = gr; g.fillRect(0, 0, W0, H0);
      // the bars: the beat's own notes, lit as they play
      const n = 32, bw = W0 / n;
      for (let i = 0; i < n; i++) {
        const s = Math.floor(i / 2), on = B.d.some((r) => r[s]) + B.b[s] * 0.15 + B.m.some((r) => r[s]), cur = s === V.s;
        const h = (0.3 + 0.22 * on + (cur ? 0.45 * Math.max(V.kick, V.snare, V.mel) : 0) + 0.08 * Math.sin(t * 6 + i)) * H0 * 0.62;
        g.fillStyle = `hsl(${(V.hue * 360 + i * 7) % 360},100%,${cur ? 70 : 55}%)`; g.fillRect(i * bw + 2, H0 - h, bw - 4, h);
      }
      g.textAlign = 'center'; g.shadowColor = '#000'; g.shadowBlur = 12;
      g.font = '900 54px "Segoe UI",system-ui,sans-serif'; g.fillStyle = '#fff'; g.fillText(dj.resident ? '🎧 DJ BLOX' : `📡 ${String(dj.nm || '').toUpperCase()}`, W0 / 2, 70);
      g.font = '800 30px "Segoe UI",system-ui,sans-serif'; g.fillStyle = '#f5d0fe'; g.fillText(`“${B.nm}” · ${B.bpm} BPM · ${KEYS[B.key]} ${SCALES[B.sc][0]}`, W0 / 2, 112);
      g.shadowBlur = 0; F.ledTex.needsUpdate = true;
    },
    // everyone on the dance floor dances, on the beat
    pose() {
      const V = this.vis; if (!V || !this.B) return;
      const ph = (now() - (this.club ? this.club.t0 : 0)) / (stepLen(this.club ? this.club.B : this.B) * 4) * Math.PI, sw = Math.sin(ph), up = Math.abs(Math.cos(ph));
      const dance = (a, x, z, moving, k) => {
        if (!a) return;
        if (a.dead || moving || a.em || Math.abs(x) > 16 || z < -20 || z > 12) { if (a.dancing) { a.dancing = false; if (!a.em) a.body.position.y = 0; } return; }
        a.dancing = true;
        const style = k % 3;
        if (style === 0) { a.armL.rotation.z = -0.6 - 0.9 * up; a.armR.rotation.z = 0.6 + 0.9 * up; a.armL.rotation.x = a.armR.rotation.x = 0.3 * sw; }
        else if (style === 1) { a.armL.rotation.x = 1.2 + 0.8 * sw; a.armR.rotation.x = 1.2 - 0.8 * sw; }
        else { a.armR.rotation.z = 2.4 + 0.3 * sw; a.armL.rotation.x = 0.6 * sw; }
        a.body.position.y = 0.18 * up;
        if (a.head) a.head.rotation.x = 0.18 * up;
      };
      const mv = Math.hypot(P.vx || 0, P.vz || 0) > 1;
      dance(me, P.x, P.z, mv, 0);
      let k = 1; for (const [, a] of Net.avatars) { const p = a.g.position, lp = a.danceP || p.clone(), m = p.distanceTo(lp) > 0.05; a.danceP = p.clone(); dance(a, p.x, p.z, m, k++); }
    },
    statOf(pr, isMe) { return isMe ? this.lks : +pr.lks || 0; },
    sortKey(pr, isMe) { return (isMe ? this.lks : +pr.lks || 0) + ((isMe ? this.live : +pr.lv) ? 1000 : 0); },
    hud() { return this.live ? '📡 <b>You’re live</b> — everyone here hears your beat' : '🎹 Make a beat in a studio booth · 📡 go live to play it for everyone'; },

    /* ---- going live, likes ---- */
    toggleLive() {
      if (this.live) { this.live = 0; send({ lv: 0 }); toast('⏹️ You’re off the decks', '#e9d5ff'); sfx('click'); }
      else {
        if (notesIn(this.B) < 4) { sfx('error'); toast('🎹 Put some notes in your beat first (open the Studio)', '#fca5a5'); return; }
        const sd = stepLen(this.B) * 16; this.live = Math.ceil(now() / sd + 0.5) * sd; // (it starts on the next bar)
        this.lks = this.lks || 0; send({ bt: enc(this.B), lv: this.live, lks: this.lks });
        quest('beats.live', 1); sfx('start'); toast('📡 You’re live! Everyone here hears your beat', '#f5d0fe');
        if (performance.now() - (this.paidAt || -1e9) > 300000) { this.paidAt = performance.now(); earn(30, '📡 Playing for the club'); }
        say(`📡 ${Net.name} is live on the decks with “${this.B.nm}”!`, '#f0abfc');
      }
      this.drawBar(); if (this.studioOpen()) this.drawStudio();
    },
    like() {
      const dj = this.dj; if (!dj || dj.resident || dj.peer === myPeer()) return;
      const k = dj.peer + ':' + dj.lv; if (this.myLikes.has(k)) return;
      this.myLikes.add(k); send({ lk: k }); sfx('select'); toast(`❤️ You liked ${dj.nm}’s beat`, '#fda4af');
      puffAt(P.x, P.y + 6, P.z, [0xf43f5e, 0xfda4af, 0xffffff], 10); this.drawBar();
    },

    /* ---- the studio ---- */
    openStudio() { sfx('open'); if (!this.mine) this.mine = stream(this.B, now()); this.drawStudio(); },
    drawStudio() {
      const B = this.B, on = !!(this.mine && this.mine.on), sel = (arr, v, k) => `<select data-sel="${k}">${arr.map((x, i) => `<option value="${i}" ${i === v ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
      const cells = (kind, rows, label) => rows.map((row, r) => `<div class="rl">${label(r)}</div>${row.map((v, s) => `<button class="c${v ? ' on' : ''}${Math.floor(s / 4) % 2 ? ' q' : ''}" data-c="${kind},${r},${s}" data-s="${s}" aria-label="${kind} ${r} step ${s + 1}"></button>`).join('')}`).join('');
      const sc = SCALES[B.sc][1], nn = (m) => KEYS[(B.key + m) % 12];
      const drums = cells('d', B.d, (r) => `${DRUMS[r][1]} ${DRUMS[r][0]}`);
      const bass = cells('b', Array.from({ length: 8 }, (_, i) => B.b.map((v) => +(v === 8 - i))), (r) => `${nn(sc[7 - r])}${7 - r === 0 ? ' ⬤' : ''}`);
      const mel = cells('m', B.m.slice().reverse(), (r) => `${nn(sc[7 - r])}${7 - r === 0 ? ' ⬤' : ''}`);
      const mute = (i, ic) => `<button class="bb sm" data-mu="${i}" title="Mute">${B.mu[i] ? '🔇 Muted' : '🔊 On'}</button>`;
      const slots = [0, 1, 2].map((i) => { const s = W.beats && W.beats[i], b = s && dec(s); return `<button class="bb sm" data-save="${i}" title="Save to slot ${i + 1}">💾 ${i + 1}</button><button class="bb sm" data-load="${i}" ${b ? '' : 'disabled'} title="${b ? esc(b.nm) : 'Empty'}">📂 ${b ? esc(b.nm.slice(0, 10)) : 'empty'}</button>`; }).join('');
      openPanel('🎹 Beat Studio', `<div class="bsx">
        <div class="top">
          <button class="bb play${on ? ' on' : ''}" data-k="play">${on ? '⏹ Stop' : '▶ Play'}</button>
          <div class="grp"><label>Tempo</label><input type="range" min="60" max="200" value="${B.bpm}" data-rng="bpm"><b class="v" id="bsBpm">${B.bpm}</b></div>
          <div class="grp"><label>Swing</label><input type="range" min="0" max="60" value="${B.sw}" data-rng="sw"><b class="v" id="bsSw">${B.sw}%</b></div>
          <div class="grp"><label>Key</label>${sel(KEYS, B.key, 'key')}${sel(SCALES.map((x) => x[0]), B.sc, 'sc')}</div>
          <div class="grp"><label>Preset</label><select data-sel="pre"><option value="-1">Pick one…</option>${PRESETS.map((p, i) => `<option value="${i}">${esc(p[0])}</option>`).join('')}</select></div>
          <button class="bb" data-k="rnd">🎲 Surprise me</button><button class="bb" data-k="clr">🗑️ Clear</button>
          <button class="bb live${this.live ? ' on' : ''}" data-k="live">${this.live ? '⏹️ Stop live' : '📡 Go live'}</button>
        </div>
        <div class="row2"><label class="tip">Name</label><input id="bsName" maxlength="24" value="${esc(B.nm)}" style="background:#1e1b4b;color:#fff;border:1px solid rgba(196,181,253,.35);border-radius:8px;padding:6px 8px;font:700 13px var(--fb);width:180px"><div class="slots">${slots}</div>${this.live ? '<span class="live-tag">● LIVE — the club hears every change</span>' : ''}</div>
        <div class="trk d"><h4>🥁 Drums <small>tap the squares: each column is a sixteenth of a bar</small>${mute(0)}</h4><div class="grid">${drums}</div></div>
        <div class="trk b"><h4>🎸 Bass ${sel(BASSES, B.bi, 'bi')}<small>one note a step · ⬤ is the key’s note</small>${mute(1)}</h4><div class="grid">${bass}</div></div>
        <div class="trk m"><h4>🎹 Melody ${sel(LEADS, B.li, 'li')}<small>stack notes for chords</small>${mute(2)}</h4><div class="grid">${mel}</div></div>
        <p class="tip">Press <b>B</b> to open and close the studio. Your beat saves with your account (💾). Go live and it plays on the club speakers for everyone here, with your name on the screen — and when someone ❤️s it you get Blox Coins.</p></div>`, (b) => this.studioClick(b), () => { if (this.mine && !this.live) this.mine.on = false; }, { full: true });
      const body = document.getElementById('xpBody');
      body.querySelectorAll('[data-rng]').forEach((r) => (r.oninput = () => { const k = r.dataset.rng, v = +r.value; B[k] = v; if (k === 'bpm') { document.getElementById('bsBpm').textContent = v; this.retime(); } else document.getElementById('bsSw').textContent = v + '%'; this.changed(); }));
      body.querySelectorAll('[data-sel]').forEach((s) => (s.onchange = () => { const k = s.dataset.sel, v = +s.value; if (k === 'pre') { if (v >= 0) { this.setBeat(preset(v)); sfx('select'); } return; } B[k] = v; this.changed(); if (k === 'key' || k === 'sc') this.drawStudio(); }));
      const nm = document.getElementById('bsName'); nm.oninput = () => { B.nm = nm.value.replace(/[|]/g, '').slice(0, 24) || 'My beat'; this.changed(); };
      nm.onkeydown = (e) => e.stopPropagation();
      this.cols = Array.from({ length: 16 }, (_, s) => [...body.querySelectorAll(`.c[data-s="${s}"]`)]); this.phAt = -1;
    },
    playhead(s) { if (!this.cols) return; if (this.phAt >= 0) for (const c of this.cols[this.phAt] || []) c.classList.remove('ph'); this.phAt = s; if (s >= 0) for (const c of this.cols[s] || []) c.classList.add('ph'); },
    retime() { // a new tempo: keep the step you're on
      if (this.mine && this.mine.on) { const k = (this.mine.last != null ? this.mine.last : 0) + 1; this.mine.t0 = now() + 0.05 - k * stepLen(this.B); this.mine.last = k - 1; }
      if (this.live) { const sd = stepLen(this.B) * 16; this.live = Math.ceil(now() / sd) * sd; send({ lv: this.live, bt: enc(this.B) }); }
    },
    changed() { this.dirty = true; if (notesIn(this.B) >= 8 && !this.madeOne) { this.madeOne = true; quest('beats.made', 1); } },
    setBeat(B) { const live = this.live; this.B = B; if (this.mine) this.mine.B = B; this.changed(); if (live) this.retime(); this.drawStudio(); },
    studioClick(b) {
      const B = this.B;
      if (b.dataset.c) {
        const [kind, r, s] = b.dataset.c.split(','), R = +r, S = +s;
        if (kind === 'd') { B.d[R][S] ^= 1; b.classList.toggle('on', !!B.d[R][S]); if (B.d[R][S]) this.preview('d', R); }
        else if (kind === 'b') { const v = 8 - R; B.b[S] = B.b[S] === v ? 0 : v; this.cols[S].forEach((c) => { if (c.dataset.c.startsWith('b,')) c.classList.toggle('on', 8 - +c.dataset.c.split(',')[1] === B.b[S]); }); if (B.b[S]) this.preview('b', v); }
        else { const row = 7 - R; B.m[row][S] ^= 1; b.classList.toggle('on', !!B.m[row][S]); if (B.m[row][S]) this.preview('m', row); }
        this.changed(); return;
      }
      if (b.dataset.mu) { B.mu[+b.dataset.mu] ^= 1; this.changed(); b.textContent = B.mu[+b.dataset.mu] ? '🔇 Muted' : '🔊 On'; return; }
      if (b.dataset.save) { W.beats = (W.beats || ['', '', '']).slice(0, 3); while (W.beats.length < 3) W.beats.push(''); W.beats[+b.dataset.save] = enc(B); saveAv(); sfx('buy'); toast(`💾 “${B.nm}” saved in slot ${+b.dataset.save + 1}`, '#bbf7d0'); this.drawStudio(); return; }
      if (b.dataset.load) { const L = W.beats && dec(W.beats[+b.dataset.load]); if (L) { this.setBeat(L); sfx('select'); } return; }
      const k = b.dataset.k;
      if (k === 'play') { if (!this.mine) this.mine = stream(B, now()); this.mine.on = !this.mine.on; if (this.mine.on) { this.mine.t0 = now() + 0.08; this.mine.last = null; } else this.playhead(-1); b.classList.toggle('on', this.mine.on); b.textContent = this.mine.on ? '⏹ Stop' : '▶ Play'; sfx('click'); }
      else if (k === 'rnd') { this.setBeat(surprise()); sfx('magic'); }
      else if (k === 'clr') { const nb = blank(); Object.assign(nb, { bpm: B.bpm, key: B.key, sc: B.sc, li: B.li, bi: B.bi, nm: B.nm }); this.setBeat(nb); sfx('click'); }
      else if (k === 'live') this.toggleLive();
    },
    preview(kind, r) { // a tap plays the sound
      const a = audio(); if (!a) return; const g = a.ac.createGain(); g.gain.value = 0.8; g.connect(a.bus); const t = a.ac.currentTime + 0.01, B = this.B, sc = SCALES[B.sc][1];
      if (kind === 'd') DRUM[r](a.ac, g, t, 0.9); else if (kind === 'b') BASS[B.bi](a.ac, g, t, NOTE(36 + B.key + sc[r - 1]), 0.25, 0.9, B.bpm); else LEAD[B.li](a.ac, g, t, NOTE(60 + B.key + sc[r]), 0.3, 0.9);
      setTimeout(() => g.disconnect(), 2500);
    },
  };
  addExp(BS);
  window.__rbBS = BS;
  window.__beats = { enc, dec, preset, surprise, PRESETS, notesIn, stepLen, playStep, DRUM, BASS, LEAD }; // for tests
})();
