/* =====================================================================
   BLOXVERSE — NATURAL DISASTER SURVIVAL. Everyone waits on the floating
   lobby, then gets dropped onto a map a few seconds before a disaster
   hits: floods, tornadoes, meteor showers, earthquakes, lightning,
   blizzards, acid rain, sandstorms and volcanoes (sometimes two at once).
   Survive to win. The round (map, disaster, timer) is run by the host;
   the disaster itself plays out the same way for everyone, from the
   round's seed and clock.
   ===================================================================== */
(() => {
  const LOBBY = [0, 70, 210], FH = 7; // floor height in buildings
  const style = document.createElement('style');
  style.textContent = `
    .nd-hp{display:inline-flex;align-items:center;gap:8px}.nd-hp .meter{width:150px;height:12px}
    .nd-hp .meter i{transition:width .2s}.nd-tag{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:8px;background:rgba(0,0,0,.35);font-size:12px}
    #ndWarn{position:absolute;left:50%;top:22%;transform:translateX(-50%);text-align:center;pointer-events:none;font:700 34px var(--fh);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.45),0 0 30px rgba(0,0,0,.4);animation:ndPop .5s ease-out;white-space:nowrap}
    #ndWarn small{display:block;font:600 16px var(--fb);opacity:.95;margin-top:4px}
    @keyframes ndPop{from{transform:translateX(-50%) scale(.6);opacity:0}}
    #ndHurt{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(220,38,38,.65);opacity:0;transition:opacity .25s}`;
  document.head.append(style);

  /* ---------------- building blocks ---------------- */
  let ladderTex = null;
  function makeLadder() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#7c4a1e'; g.fillRect(4, 0, 9, 64); g.fillRect(51, 0, 9, 64);
    g.fillStyle = '#a0662f'; for (let y = 6; y < 64; y += 16) g.fillRect(4, y, 56, 7);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const B = (o) => part(Object.assign({ nd: 1, bld: 1 }, o)); // can be wrecked
  const G = (o) => part(Object.assign({ nd: 1 }, o)); // ground: stays
  const box = (x0, y0, z0, x1, y1, z1, c, o) => (x1 - x0 > 0.05 && y1 - y0 > 0.05 && z1 - z0 > 0.05 ? B(Object.assign({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, c }, o || {})) : null);
  let signs = []; // labels on buildings (they go when the map is rebuilt)
  function ladder(x, y0, z, h) {
    if (!ladderTex) ladderTex = makeLadder();
    const m = ladderTex.clone(); m.needsUpdate = true; m.repeat.set(1, Math.max(1, Math.round(h / 2)));
    return B({ x, y: y0 + h / 2, z, sx: 1.6, sy: h, sz: 1.6, c: 0xffffff, map: m, truss: true });
  }
  // a building: floors with a ladder in the back-left corner up to every floor and the roof
  // (the hole beside the ladder is big enough to climb through)
  function building(x, z, w, d, floors, wall, roof, o = {}) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, T = 1, H = 5; // H: the ladder hole
    for (let f = 0; f < floors; f++) {
      const y0 = f * FH, y1 = y0 + FH, col = Array.isArray(wall) ? wall[f % wall.length] : wall;
      box(x0, y0, z0, x1, y1, z0 + T, col); // back
      box(x0, y0, z0 + T, x0 + T, y1, z1 - T, col); // left
      box(x1 - T, y0, z0 + T, x1, y1, z1 - T, col); // right
      if (f === 0) { // the front, with a doorway
        box(x0, y0, z1 - T, x - 2.2, y1, z1, col); box(x + 2.2, y0, z1 - T, x1, y1, z1, col); box(x - 2.2, y0 + 5.2, z1 - T, x + 2.2, y1, z1, col);
      } else { // the front, with a window
        box(x0, y0, z1 - T, x - 2, y1, z1, col); box(x + 2, y0, z1 - T, x1, y1, z1, col); box(x - 2, y0, z1 - T, x + 2, y0 + 2.6, z1, col); box(x - 2, y0 + 5.4, z1 - T, x + 2, y1, z1, col);
      }
      // the floor above (or the roof), leaving a hole for the ladder; it fits inside the walls, so no faces overlap (they'd flicker)
      const top = y1, c2 = f === floors - 1 ? roof : 0xb8a58a;
      box(x0 + T, top - 0.8, z0 + T + H, x1 - T, top, z1 - T, c2);
      box(x0 + T + H, top - 0.8, z0 + T, x1 - T, top, z0 + T + H, c2);
    }
    ladder(x0 + T + 0.8, 0, z0 + T + 0.8, floors * FH + 1); // one ladder all the way up (stacked ones overlapped and flickered)
    if (o.sign) { const s = label(o.sign, { size: 1.6 }); s.position.set(x, floors * FH + 3, z1); place.add(s); signs.push(s); }
  }
  function tree(x, z, y = 0, s = 1) {
    box(x - 0.7, y, z - 0.7, x + 0.7, y + 5 * s, z + 0.7, 0x7c4a1e);
    box(x - 2.6 * s, y + 4.2 * s, z - 2.6 * s, x + 2.6 * s, y + 8.6 * s, z + 2.6 * s, 0x2f9e44);
  }
  function hill(x, z, r, h, c) { for (let k = 0; k < h; k++) { const rr = r * (1 - k / h); G({ x, y: k + 0.5, z, sx: rr * 2, sy: 1, sz: rr * 2, c }); } }

  const MAPS = [
    { name: 'Happy Island', half: 55, sky: ['#5eb8ff', '#d9f2ff'], ground: 0x55a630, flood: 10.5, build() {
      building(-25, -20, 16, 14, 2, 0xf5e6c8, 0xc0392b, { sign: '🏠' });
      building(22, -26, 12, 12, 1, 0xa7c7e7, 0x34495e);
      building(30, 24, 10, 10, 4, [0xffffff, 0xef4444], 0x1f2937, { sign: '🗼 Lighthouse' });
      building(-30, 26, 10, 9, 1, 0x8d6e63, 0x5d4037);
      hill(2, 6, 11, 5, 0x6bbf3a);
      for (const [x, z] of [[-8, -40], [8, -42], [-44, 0], [44, -4], [-12, 40], [12, 44], [40, 44], [-44, -40]]) tree(x, z);
    } },
    { name: 'Big City', half: 55, sky: ['#7ea8d8', '#e3edf7'], ground: 0x8a8f98, flood: 11, build() {
      building(-28, -26, 14, 14, 6, 0x60a5fa, 0x1e3a8a, { sign: '🏢' });
      building(26, -28, 12, 12, 5, 0xa3a3a3, 0x404040);
      building(26, 24, 18, 10, 3, 0xf4a261, 0x9c4a1a, { sign: '🏬 Apartments' });
      building(-28, 26, 14, 10, 1, 0xfde68a, 0xb45309, { sign: '🛒 Shop' });
      for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) tree(x, z, 0, 0.8);
      for (const z of [-48, 48]) G({ x: 0, y: 0.03, z, sx: 110, sy: 0.06, sz: 6, c: 0x3f3f46, solid: false, plain: true });
    } },
    { name: 'Farm Hill', half: 55, sky: ['#7cc6ff', '#fff3d6'], ground: 0x7cb342, flood: 10, build() {
      building(-25, -22, 18, 14, 2, 0xb91c1c, 0xf5f5f4, { sign: '🐄 Barn' });
      building(-2, -32, 10, 10, 5, 0xd6d3d1, 0x78716c, { sign: 'Silo' });
      building(26, -20, 14, 12, 2, 0xfef3c7, 0x15803d, { sign: '🏡' });
      building(28, 28, 10, 10, 4, 0xe7e5e4, 0x57534e, { sign: 'Windmill' });
      for (const a of [0.785, -0.785]) G({ x: 28, y: 3 * FH + 3, z: 33.6, sx: 18, sy: 1.4, sz: 0.4, c: 0xfafaf9, solid: false }).m.rotation.z = a;
      hill(-22, 26, 15, 14, 0x8bc34a);
      for (let i = 0; i < 6; i++) G({ x: 4 + i * 6, y: 1, z: 6, sx: 6, sy: 2, sz: 0.4, c: 0xa16207 });
      for (const [x, z] of [[46, 0], [-46, -2], [8, 46], [40, -46]]) tree(x, z);
    } },
  ];

  /* ---------------- the disasters ---------------- */
  const DIS = {
    flood: { n: '🌊 Flood', d: 'The water is rising! Get up high.', dur: 50 },
    tornado: { n: '🌪️ Tornado', d: 'Stay away from the funnel!', dur: 45 },
    meteor: { n: '☄️ Meteor Shower', d: 'Watch for red circles on the ground!', dur: 45 },
    quake: { n: '🫨 Earthquake', d: 'Buildings are crumbling. Get out in the open!', dur: 35 },
    storm: { n: '⛈️ Thunderstorm', d: 'Lightning strikes! Take cover.', dur: 45 },
    blizzard: { n: '❄️ Blizzard', d: 'It’s freezing outside. Get indoors!', dur: 45 },
    acid: { n: '☢️ Acid Rain', d: 'The rain burns. Get under a roof!', dur: 45 },
    sand: { n: '🏜️ Sandstorm', d: 'Strong winds! Get inside before you’re blown away.', dur: 45 },
    volcano: { n: '🌋 Volcano', d: 'Lava below, lava bombs above!', dur: 50 },
  };
  const KEYS = Object.keys(DIS);
  const CLASH = { flood: 'volcano', volcano: 'flood' };

  const ND = {
    id: 'nds', code: 'nd', genre: 'Survival', rank: 0.7, name: 'Natural Disaster Survival', emoji: '🌪️', max: 12, stat: 'Survived', killY: -14, banner: true,
    land: { theme: 'beach', mode: 'sea', sea: -4.05, holes: [[-450, -450, 450, 450]], water: [0x1f6db3, 0x2273b8, 0x1b68ad], extras: ['boats'] },
    color: 'linear-gradient(135deg,#0ea5e9,#b45309)',
    desc: 'Wait on the lobby, then get dropped onto an island, a city or a farm moments before a disaster: floods, tornadoes, meteors, earthquakes, lightning, blizzards, acid rain, sandstorms or a volcano. Find somewhere safe, keep your health up and survive to win.',
    welcome: 'Survive the disaster!',
    build() {
      this.fx = []; this.mapI = -1; this.mapSeed = null; this.disOn = null; this.dis = [];
      sky(MAPS[0].sky[0], MAPS[0].sky[1]);
      // the lobby, floating far above the sea
      slab(LOBBY[0], LOBBY[1], LOBBY[2], 34, 34, 0xcbd5e1, { sy: 2 });
      for (const [x, z, sx, sz] of [[0, -17, 34, 1], [0, 17, 34, 1], [-17, 0, 1, 34], [17, 0, 1, 34]]) part({ x: LOBBY[0] + x, y: LOBBY[1] + 1.5, z: LOBBY[2] + z, sx, sy: 3, sz, c: 0x94a3b8 });
      const s = label('NATURAL DISASTER\nSURVIVAL', { size: 3 }); s.position.set(LOBBY[0], LOBBY[1] + 14, LOBBY[2] - 16); place.add(s);
      this.board = null;
      this.sea = part({ x: 0, y: -54, z: 0, sx: 900, sy: 100, sz: 900, c: 0x1d70b8, alpha: 0.85, solid: false, plain: true });
    },
    boardText(t) {
      if (this.boardT === t) return;
      this.boardT = t;
      if (this.board) { place.remove(this.board); this.board.material.map.dispose(); this.board.material.dispose(); }
      this.board = label(t, { size: 1.5, bg: 'rgba(15,23,42,.85)' }); this.board.position.set(LOBBY[0], LOBBY[1] + 7, LOBBY[2] - 15); place.add(this.board);
    },
    buildMap(i, seed) {
      this.stopDisaster();
      removeParts((p) => p.nd && p !== this.sea);
      for (const l of signs) { place.remove(l); l.material.map.dispose(); l.material.dispose(); }
      signs = [];
      const M = MAPS[i];
      sky(M.sky[0], M.sky[1]); this.skyNow = M.sky;
      G({ x: 0, y: -1, z: 0, sx: M.half * 2 + 14, sy: 2, sz: M.half * 2 + 14, c: 0xe9d8a6 }); // the beach
      G({ x: 0, y: -0.4, z: 0, sx: M.half * 2, sy: 1, sz: M.half * 2, c: M.ground }); // the ground (top at 0.1)
      M.build();
      this.mapI = i; this.mapSeed = seed; this.M = M;
    },
    pres() { return { inr: 0, out: 0, sv: 0 }; },
    async enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.inr = 0; this.out = 0; this.hp = 100; this.lastPh = ''; this.hurtAt = 0;
      const s = await kvGet('nd'); this.sv = (s && s.sv | 0) || 0; this.rounds = (s && s.rounds | 0) || 0; this.streak = (s && s.streak | 0) || 0; this.best = (s && s.best | 0) || 0;
      send({ sv: this.sv }); questMax('nds.survive', this.sv); questMax('nds.streak', this.best);
      if (!$('#ndHurt')) { const d = document.createElement('div'); d.id = 'ndHurt'; $('#xhud').append(d); }
      if (this.mapI < 0) this.buildMap(0, 0);
    },
    leave() { this.stopDisaster(); this.warn(null); },
    save() { return kvSet('nd', { sv: this.sv, rounds: this.rounds, streak: this.streak, best: this.best }); },
    inRound() { const g = this.g; return !!(g && (g.ph === 'prep' || g.ph === 'play') && this.inr === g.rd && this.out !== g.rd); },
    spawn() {
      if (this.inRound() && this.M) {
        const h = this.M.half - 8, r = Math.random;
        for (let k = 0; k < 30; k++) { const x = (r() - 0.5) * 2 * h, z = (r() - 0.5) * 2 * h, y = groundBelow(x, 200, z); if (y > -2 && y < 2) return [x, y + 0.6, z, r() * 6]; }
        return [0, 8, 0, 0];
      }
      return [LOBBY[0] + (Math.random() - 0.5) * 20, LOBBY[1] + 0.6, LOBBY[2] + (Math.random() - 0.5) * 20, Math.PI];
    },

    /* ---- the round, run by the host ---- */
    adopt() { const g = this.lastG; return g ? Object.assign({}, g, { wn: Object.assign({}, g.wn || {}), dis: (g.dis || []).slice() }) : { ph: 'wait', left: 0, rd: 0, seed: 0, map: 0, dis: [], el: 0, wn: {}, gs: 0 }; },
    pick(H) {
      H.seed = 1 + Math.floor(Math.random() * 1e9);
      H.map = (H.map + 1 + Math.floor(Math.random() * (MAPS.length - 1))) % MAPS.length;
      const a = KEYS[Math.floor(Math.random() * KEYS.length)];
      H.dis = [a];
      if (Math.random() < 0.15) { const b = KEYS.filter((k) => k !== a && CLASH[a] !== k)[Math.floor(Math.random() * (KEYS.length - 2))]; if (b) H.dis.push(b); }
    },
    host(dt) {
      const H = this.H, pl = players(), n = pl.length;
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'wait') { if (n) { H.ph = 'inter'; H.left = 14; this.pick(H); } }
      else if (H.ph === 'inter') { if (!n) H.ph = 'wait'; else if (H.left <= 0) { H.ph = 'prep'; H.left = 10; H.rd = (H.rd | 0) + 1; } }
      else if (H.ph === 'prep') { if (H.left <= 0) { H.ph = 'play'; H.el = 0; H.left = Math.max(...H.dis.map((k) => DIS[k].dur)); } }
      else if (H.ph === 'play') {
        H.el += dt;
        const rd = H.rd, inR = pl.filter((p) => (p.me ? this.inr : p.pr.inr) === rd), alive = inR.filter((p) => (p.me ? this.out : p.pr.out) !== rd);
        const over = H.left <= 0 || (inR.length > 0 && !alive.length && H.el > 2);
        this.overT = over ? (this.overT || 0) + dt : 0;
        if (this.overT > 0.8) {
          this.overT = 0;
          H.ph = 'end'; H.left = 7;
          H.w = alive.map((p) => nameOf(p.peer)).join(', '); H.wps = alive.map((p) => p.peer);
          for (const p of alive) H.wn[p.peer] = (H.wn[p.peer] || 0) + 1;
        }
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n ? 'inter' : 'wait'; H.left = 14; this.pick(H); }
      if (performance.now() - (this.sentAt || 0) > 300) { this.sentAt = performance.now(); hostSend(this); }
    },

    /* ---- what everyone does ---- */
    tick(dt) {
      const g = this.g = roundState(this);
      if (!g) { setBanner('Getting the round…'); return; }
      if (g.seed !== this.mapSeed && g.ph !== 'play' && g.ph !== 'prep') this.buildMap(clamp(g.map | 0, 0, MAPS.length - 1), g.seed);
      if (g.seed !== this.mapSeed && (g.ph === 'play' || g.ph === 'prep') && !this.inRound()) this.buildMap(clamp(g.map | 0, 0, MAPS.length - 1), g.seed); // (joined mid-round)
      const names = (g.dis || []).filter((k) => DIS[k]).map((k) => DIS[k].n).join(' + ');
      // dropped onto the map
      if (g.ph === 'prep' && this.inr !== g.rd && !P.dead && g.left > 1.5) {
        this.inr = g.rd; this.out = 0; this.hp = 100; this.rounds++; send({ inr: g.rd, out: 0 });
        respawn(); sfx('teleport'); toast('Find somewhere safe!', '#fde68a');
      }
      // the disaster starts and stops
      if (g.ph === 'play' && this.disOn !== g.rd) this.startDisaster(g);
      if (g.ph !== 'play' && this.disOn) this.stopDisaster();
      if (g.ph === 'play' && this.disOn) this.runDisaster(g, dt);
      // out of the round (any way you die counts)
      if (P.dead && this.inr === g.rd && this.out !== g.rd && (g.ph === 'prep' || g.ph === 'play')) { this.out = g.rd; this.streak = 0; send({ out: g.rd }); this.save(); }
      if (this.inRound() && !P.dead && P.y < -3.2) { this.hurt(999, '🌊 Swept out to sea'); }
      // health comes back slowly when nothing's hurting you
      if (this.inRound() && !P.dead && performance.now() - this.hurtAt > 4000) this.hp = Math.min(100, this.hp + 5 * dt);
      const hv = $('#ndHurt'); if (hv) hv.style.opacity = performance.now() - this.hurtAt < 350 ? 1 : 0;
      // phase changes
      if (g.ph !== this.lastPh) {
        if (g.ph === 'end' && this.lastPh === 'play') {
          const won = this.inr === g.rd && this.out !== g.rd && !P.dead;
          if (won) {
            this.sv++; this.streak++; this.best = Math.max(this.best, this.streak); send({ sv: this.sv }); this.save();
            questMax('nds.survive', this.sv); questMax('nds.streak', this.streak); if ((g.dis || []).length > 1) quest('nds.double');
            sfx('win'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 50);
            earn(25 + ((g.dis || []).length > 1 ? 15 : 0) + Math.min(20, this.streak * 2), `survived the ${names.replace(/^\S+ /, '').toLowerCase()}`);
            toast(`🏆 You survived!${this.streak > 1 ? ` ${this.streak} in a row!` : ''}`, '#86efac');
          } else sfx('bell');
        }
        if (g.ph === 'inter' && this.lastPh && P.z < LOBBY[2] - 60) respawn(); // back to the lobby
        if (g.ph === 'inter' && (this.lastPh === 'end' || !this.lastPh)) this.warn(null);
        this.lastPh = g.ph;
      }
      if (g.ph === 'prep') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 5) sfx('count'); this.cdS = c; } else this.cdS = null;
      // the banner and the lobby board
      const left = (p) => players().filter((x) => (x.me ? this.inr : x.pr.inr) === g.rd && (x.me ? this.out : x.pr.out) !== g.rd).length;
      const map = MAPS[clamp(g.map | 0, 0, MAPS.length - 1)].name;
      if (g.ph === 'wait') { setBanner('Waiting for players…'); this.boardText('Waiting for players…'); }
      else if (g.ph === 'inter') { setBanner(`Next map: <b>${esc(map)}</b> · in ${Math.ceil(g.left)}s`); this.boardText(`Next map: ${map}\nStarting in ${Math.ceil(g.left)}`); }
      else if (g.ph === 'prep') { setBanner(`⚠️ A disaster is coming… ${Math.ceil(g.left)}`); this.boardText(`${map}\nA disaster is coming…`); }
      else if (g.ph === 'play') { setBanner(`${esc(names)} · ${left()} alive · ${mmss(g.left)}`); this.boardText(`${map}\n${names}`); }
      else { setBanner(g.w ? `🏆 Survivors: ${esc(g.w)}` : '💀 Nobody survived!'); this.boardText(g.w ? `Survivors:\n${g.w}` : 'Nobody survived!'); }
    },
    hurt(n, why) {
      if (!this.inRound() || P.dead) return;
      this.hp -= n; this.hurtAt = performance.now();
      if (performance.now() - (this.ouchAt || 0) > 600) { this.ouchAt = performance.now(); sfx('hurt', { vol: 0.6 }); }
      if (this.hp <= 0) { this.hp = 0; this.why = why; toast(why || '💀 Out!', '#fca5a5'); die(); }
    },
    warn(text, sub) {
      let el = $('#ndWarn');
      if (!text) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'ndWarn'; $('#xhud').append(el); }
      el.innerHTML = `${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
      el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
      clearTimeout(this.warnT); this.warnT = setTimeout(() => this.warn(null), 4500);
    },
    // a roof (anything solid) over your head
    sheltered() {
      for (const p of parts) {
        if (!p.solid || !p.on || p.spin || p === P.ground) continue;
        const b = boxOf(p);
        if (P.x > b[0] && P.x < b[3] && P.z > b[2] && P.z < b[5] && b[1] > P.y + P.h - 0.5 && b[1] < P.y + 40) return true;
      }
      return false;
    },
    // a block gone: a puff of its colour and a crash
    wreck(p, quiet) {
      if (!parts.includes(p)) return;
      puffAt(p.x, p.y, p.z, p.c, 6);
      if (!quiet && performance.now() - (this.crashAt || 0) > 160) { this.crashAt = performance.now(); sfx3('crash', p.x, p.z, 90, { vol: 0.6 }); }
      removeParts((q) => q === p);
    },
    wreckNear(x, y, z, r) { for (const p of parts.slice()) if (p.bld && Math.hypot(p.x - x, p.z - z) < r + Math.max(p.sx, p.sz) / 2 - 1 && Math.abs(p.y - y) < r + p.sy / 2) this.wreck(p, true); },

    startDisaster(g) {
      this.stopDisaster();
      this.disOn = g.rd; this.dis = (g.dis || []).filter((k) => DIS[k]); this.seed = g.seed; this.done = 0;
      const M = this.M, r = mulberry(g.seed ^ 0x5bd1);
      this.fx = []; this.ev = [];
      const names = this.dis.map((k) => DIS[k].n).join(' + ');
      this.warn(names.toUpperCase() + '!', this.dis.map((k) => DIS[k].d).join(' '));
      sfx('alarm'); setTimeout(() => sfx('alarm'), 600);
      for (const k of this.dis) {
        if (k === 'flood' || k === 'volcano') {
          const lava = k === 'volcano';
          this.level = part({ x: 0, y: -60, z: 0, sx: M.half * 2 + 60, sy: 100, sz: M.half * 2 + 60, c: lava ? 0xff4d00 : 0x2b8be6, neon: lava, alpha: lava ? 0.9 : 0.6, solid: false, plain: true, nd: 1 });
          this.levelKind = k;
        }
        if (k === 'volcano') { // a volcano rises at the edge and throws lava bombs
          const vx = -M.half + 4, vz = -M.half + 4; this.vol = [vx, 26, vz];
          for (let i = 0; i < 9; i++) G({ x: vx, y: i * 3 + 1.5, z: vz, sx: 26 - i * 2.6, sy: 3, sz: 26 - i * 2.6, c: i > 6 ? 0x3f3f46 : 0x57534e });
          G({ x: vx, y: 27, z: vz, sx: 4, sy: 0.6, sz: 4, c: 0xff6a00, neon: true, solid: false });
          for (let t = 2; t < DIS.volcano.dur - 2; t += 0.8 + r() * 0.5) this.ev.push({ k: 'bomb', t, x: (r() - 0.5) * 2 * (M.half - 6), z: (r() - 0.5) * 2 * (M.half - 6), fly: 2.2 });
        }
        if (k === 'meteor') for (let t = 1.5; t < DIS.meteor.dur - 2; t += 0.45 + r() * 0.35) this.ev.push({ k: 'meteor', t, x: (r() - 0.5) * 2 * (M.half - 4), z: (r() - 0.5) * 2 * (M.half - 4), big: r() < 0.12, fly: 1.7 });
        if (k === 'storm') for (let t = 1.5; t < DIS.storm.dur - 1; t += 0.8 + r() * 0.8) this.ev.push({ k: 'bolt', t, x: (r() - 0.5) * 2 * (M.half - 4), z: (r() - 0.5) * 2 * (M.half - 4), tall: r() < 0.4, fly: 0.9 });
        if (k === 'quake') for (let t = 1; t < DIS.quake.dur - 1; t += 0.28 + r() * 0.25) this.ev.push({ k: 'crumble', t, pick: r(), fly: 0 });
        if (k === 'tornado') {
          const ph = [r() * 6, r() * 6], w = [0.12 + r() * 0.05, 0.1 + r() * 0.05], A = M.half * 0.72;
          this.twister = { path: (t) => [Math.sin(t * w[0] + ph[0]) * A, Math.sin(t * w[1] + ph[1]) * A], g: new THREE.Group() };
          const mat = new THREE.MeshLambertMaterial({ color: 0x8a8f98, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
          for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(2 + i * 1.6, 1.4 + i * 1.6, 7, 14, 1, true), mat); m.position.y = 3.5 + i * 6.5; this.twister.g.add(m); }
          scene.add(this.twister.g); this.fx.push(this.twister.g);
        }
        if (k === 'storm') sky('#3b4252', '#6b7280');
        if (k === 'blizzard') { sky('#cbd5e1', '#f1f5f9'); scene.fog.near = 8; scene.fog.far = 110; this.weather(0xffffff, 'snow'); }
        if (k === 'acid') { sky('#4d7c0f', '#bef264'); this.weather(0x84cc16, 'rain'); }
        if (k === 'sand') { sky('#b45309', '#fcd34d'); scene.fog.near = 6; scene.fog.far = 80; this.weather(0xd6a35c, 'sand'); this.wind = (r() < 0.5 ? 1 : -1); }
      }
      this.ev.sort((a, b) => a.t - b.t);
    },
    stopDisaster() {
      for (const o of this.fx || []) { scene.remove(o); o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); }
      this.fx = []; this.ev = []; this.twister = null; this.rain = null; this.vol = null; this.disOn = null; this.dis = []; this.wind = 0;
      if (this.level) { removeParts((p) => p === this.level); this.level = null; }
      if (this.skyNow) sky(this.skyNow[0], this.skyNow[1]);
      if (scene.fog) { scene.fog.near = 260; scene.fog.far = 1000; }
      this.inWater = false;
    },
    // rain, snow or sand around you
    weather(color, kind) {
      const N = kind === 'snow' ? 700 : kind === 'sand' ? 900 : 1000, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 80; pos[i * 3 + 1] = Math.random() * 50; pos[i * 3 + 2] = (Math.random() - 0.5) * 80; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: kind === 'snow' ? 0.5 : kind === 'sand' ? 0.35 : 0.25, transparent: true, opacity: 0.85, depthWrite: false }));
      scene.add(pts); this.fx.push(pts); this.rain = { pts, kind };
    },
    runDisaster(g, dt) {
      const el = g.el, M = this.M, alive = this.inRound() && !P.dead, T = performance.now() / 1000;
      // rising water / lava
      if (this.level) {
        const lava = this.levelKind === 'volcano', top = lava ? Math.min(4, -1 + el * 0.16) : Math.min(M.flood, -1 + el * 0.42);
        this.level.y = top - 50; this.level.m.position.y = this.level.y;
        const was = this.inWater; this.inWater = alive && P.y < top - 0.3;
        if (this.inWater && !was) sfx(lava ? 'hiss' : 'splash');
        if (this.inWater && lava) this.hurt(999, '🌋 Burned in the lava');
        if (this.inWater && !lava) {
          if (keys.Space || jumpHeld) P.vy = Math.max(P.vy, 11); // swim up
          P.vy = Math.max(P.vy, -10);
          if (P.y + 4.2 < top) this.hurt(14 * dt, '🌊 Drowned');
        }
      } else this.inWater = false;
      // weather around you
      if (this.rain) {
        const a = this.rain.pts.geometry.attributes.position, arr = a.array, k = this.rain.kind;
        this.rain.pts.position.set(P.x, P.y - 10, P.z);
        for (let i = 0; i < arr.length; i += 3) {
          if (k === 'sand') { arr[i] += (this.wind || 1) * 40 * dt; arr[i + 1] -= 2 * dt; } else { arr[i + 1] -= (k === 'snow' ? 7 : 45) * dt; if (k === 'snow') arr[i] += Math.sin(T + i) * dt; }
          if (arr[i + 1] < 0) arr[i + 1] += 50; if (arr[i] > 40) arr[i] -= 80; if (arr[i] < -40) arr[i] += 80;
        }
        a.needsUpdate = true;
      }
      const roof = alive && (this.dis.includes('blizzard') || this.dis.includes('acid') || this.dis.includes('sand')) ? this.sheltered() : true;
      if (alive && this.dis.includes('blizzard')) { if (!roof) this.hurt(5 * dt, '❄️ Froze in the blizzard'); }
      if (alive && this.dis.includes('acid')) { if (!roof) this.hurt(7 * dt, '☢️ Melted in the acid rain'); }
      if (alive && this.dis.includes('sand') && !roof) {
        const gust = 0.6 + 0.4 * Math.sin(el * 1.3);
        moveP(this.wind * 9 * gust * dt, 0, 0);
        this.hurt(3 * dt, '🏜️ Lost in the sandstorm');
      }
      this.sheltNow = roof;
      // the tornado
      if (this.twister) {
        const [tx, tz] = this.twister.path(el), tw = this.twister.g;
        tw.position.set(tx, 0, tz);
        tw.children.forEach((m, i) => { m.rotation.y += dt * (3 + i * 0.4); });
        for (const p of parts.slice()) if (p.bld && Math.hypot(p.x - tx, p.z - tz) < 6 + Math.max(p.sx, p.sz) / 2 && p.y < 40) this.wreck(p);
        if (Math.random() < dt * 8) puffAt(tx + (Math.random() - 0.5) * 8, 2 + Math.random() * 20, tz + (Math.random() - 0.5) * 8, [0x8a8f98, 0x6b7280, 0x7c4a1e], 2);
        if (performance.now() - (this.whooshAt || 0) > 1600) { this.whooshAt = performance.now(); sfx3('whoosh', tx, tz, 80); }
        const dx = P.x - tx, dz = P.z - tz, d = Math.hypot(dx, dz);
        if (alive && d < 15) {
          const pull = (15 - d) * 1.6 * dt, tg = 10 * dt;
          moveP(-dx / (d || 1) * pull - dz / (d || 1) * tg * (d < 7 ? 2 : 0.5), 0, -dz / (d || 1) * pull + dx / (d || 1) * tg * (d < 7 ? 2 : 0.5));
          if (d < 6.5) { P.vy = Math.max(P.vy, 32); P.ground = null; this.hurt(16 * dt, '🌪️ Blown away by the tornado'); }
        }
      }
      // the earthquake shakes everything
      if (this.dis.includes('quake')) {
        cam.yaw += Math.sin(T * 47) * 0.006; cam.pitch = clamp(cam.pitch + Math.sin(T * 39) * 0.004, -1.35, 0.6);
        if (alive && P.ground && Math.random() < dt * 3) { P.vy = 6 + Math.random() * 6; P.ground = null; }
        if (performance.now() - (this.rumbleAt || 0) > 2200) { this.rumbleAt = performance.now(); sfx('thunder', { vol: 0.35, pitch: 0.5 }); }
      }
      // timed events: meteors, lava bombs, lightning, crumbling buildings
      for (const e of this.ev) {
        if (e.done || e.t > el + 3) continue;
        const since = el - e.t;
        if (since < 0) continue;
        if (!e.mark && e.fly) { // a warning on the ground
          e.y = Math.max(0, groundBelow(e.x, 200, e.z)); if (e.y < -50) e.y = 0;
          const r = e.big ? 9 : e.k === 'bolt' ? 4 : 5.5;
          const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, r, 28), new THREE.MeshBasicMaterial({ color: e.k === 'bolt' ? 0xfde047 : 0xff3b30, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false, ...DECAL }));
          ring.rotation.x = -Math.PI / 2; ring.position.set(e.x, e.y + 0.15, e.z); scene.add(ring); this.fx.push(ring); e.mark = ring;
          if (e.k !== 'bolt') {
            const rock = new THREE.Mesh(new THREE.SphereGeometry(e.big ? 2.6 : e.k === 'bomb' ? 1.1 : 1.6, 10, 8), new THREE.MeshBasicMaterial({ color: e.k === 'bomb' ? 0xff5a00 : 0x9a3412 }));
            scene.add(rock); this.fx.push(rock); e.rock = rock;
          }
        }
        if (e.rock) { // falling (meteors) or flying from the volcano (lava bombs)
          const f = Math.min(1, since / e.fly);
          if (e.k === 'bomb' && this.vol) { const [vx, vy, vz] = this.vol; e.rock.position.set(vx + (e.x - vx) * f, vy + (e.y - vy) * f + Math.sin(f * Math.PI) * 30, vz + (e.z - vz) * f); }
          else e.rock.position.set(e.x + (1 - f) * 25, e.y + (1 - f) * 110, e.z + (1 - f) * 10);
          if (Math.random() < dt * 30) puffAt(e.rock.position.x, e.rock.position.y + 1, e.rock.position.z, [0xff6a00, 0xfbbf24, 0x52525b], 1);
        }
        if (since >= e.fly) { // impact
          e.done = true;
          if (e.mark) { scene.remove(e.mark); e.mark.geometry.dispose(); e.mark.material.dispose(); }
          if (e.rock) { scene.remove(e.rock); e.rock.geometry.dispose(); e.rock.material.dispose(); }
          if (e.k === 'crumble') { this.crumble(e); continue; }
          const R = e.big ? 9 : e.k === 'bolt' ? 4 : e.k === 'bomb' ? 4 : 5.5;
          if (e.k === 'bolt') this.bolt(e);
          else { puffAt(e.x, e.y + 1, e.z, [0xff6a00, 0xfbbf24, 0x52525b, 0x1f2937], e.big ? 30 : 16); sfx3(e.big ? 'boom' : 'explode', e.x, e.z, 120); }
          this.wreckNear(e.x, e.y, e.z, R * 0.8);
          const d = Math.hypot(P.x - e.x, P.z - e.z);
          if (alive && d < R + 1.5 && Math.abs(P.y - e.y) < R + 3) this.hurt((e.k === 'bolt' ? 75 : e.big ? 90 : 55) * (1 - d / (R + 4)), e.k === 'bolt' ? '⚡ Struck by lightning' : e.k === 'bomb' ? '🌋 Hit by a lava bomb' : '☄️ Hit by a meteor');
        }
      }
    },
    bolt(e) {
      const top = e.y + 120, col = new THREE.Mesh(new THREE.BoxGeometry(0.7, top - e.y, 0.7), new THREE.MeshBasicMaterial({ color: 0xfefce8 }));
      col.position.set(e.x, (top + e.y) / 2, e.z); scene.add(col); this.fx.push(col);
      setTimeout(() => { scene.remove(col); col.geometry.dispose(); col.material.dispose(); const i = this.fx.indexOf(col); if (i >= 0) this.fx.splice(i, 1); }, 220);
      sky('#f8fafc', '#e2e8f0'); setTimeout(() => { if (this.dis.includes('storm')) sky('#3b4252', '#6b7280'); }, 90); // a flash
      sfx3('thunder', e.x, e.z, 200); sfx3('zap', e.x, e.z, 60);
      puffAt(e.x, e.y + 1, e.z, [0xfef08a, 0xffffff], 10);
    },
    crumble(e) {
      const list = parts.filter((p) => p.bld && !p.truss);
      if (!list.length) return;
      const p = list[Math.floor(e.pick * list.length)], x = p.x, z = p.z, y0 = p.y;
      this.wreck(p);
      // the bits fall: they hurt anyone underneath
      if (this.inRound() && !P.dead && Math.abs(P.x - x) < p.sx / 2 + 1.5 && Math.abs(P.z - z) < p.sz / 2 + 1.5 && P.y < y0 && y0 - P.y < 20) this.hurt(28, '🫨 Crushed in the earthquake');
    },
    gravity() { return this.inWater ? 55 : GRAV; },
    speed() { return this.inWater ? 10 : 16; },
    statOf(pr, isMe) { return isMe ? this.sv : pr.sv | 0; },
    sortKey(pr, isMe) { return isMe ? this.sv : pr.sv | 0; },
    hud() {
      const g = this.g;
      if (!g) return '';
      if (this.inRound()) {
        const hp = Math.max(0, Math.round(this.hp)), col = hp > 60 ? 'linear-gradient(180deg,#86efac,#22c55e)' : hp > 30 ? 'linear-gradient(180deg,#fde68a,#f59e0b)' : 'linear-gradient(180deg,#fca5a5,#dc2626)';
        const tag = g.ph === 'play' && (this.dis.includes('blizzard') || this.dis.includes('acid') || this.dis.includes('sand')) ? `<span class="nd-tag">${this.sheltNow ? '🏠 Sheltered' : '⚠️ Outside'}</span>` : this.inWater ? '<span class="nd-tag">🏊 Swimming (Space to swim up)</span>' : '';
        return `<span class="nd-hp">❤️ <span class="meter"><i style="width:${hp}%;background:${col}"></i></span> ${hp}</span>${tag}`;
      }
      if (g.ph === 'play' || g.ph === 'prep') return this.inr === g.rd ? `💀 ${esc(this.why || 'Out')} — watching from the lobby` : '👀 Watching — you’re in next round';
      return `🏆 Survived ${this.sv} · best streak ${this.best}`;
    },
  };
  addExp(ND);
  window.__rbND = ND;
})();
