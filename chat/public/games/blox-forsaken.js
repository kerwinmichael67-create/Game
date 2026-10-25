/* =====================================================================
   BLOXVERSE — FORSAKEN. One player is the Killer, everyone else a
   Survivor, in a ruined town at night. Survivors fix generators (a wire
   puzzle each time) to bring the clock down and hold out until it runs
   out; the killer hunts them. Everyone picks a character with two
   abilities of their own: Noob's Bloxy Cola, Guest 1337's block and
   charge, Elliot's pizza, Chance's coin and gun, the Sword Knight,
   007n7's clone and cloak, the Builder's sentry and dispenser; and the
   killers c00lkidd, John Doe and 1x1x1x1. Whoever's built up the most
   malice is the next killer. The last survivor standing gets one more
   minute. With only a few of you, bots make up the numbers. The host
   runs the round and the bots, and checks every hit.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #fkRole{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:5;background:radial-gradient(circle,rgba(0,0,0,.25),rgba(0,0,0,.75));animation:fkFade 3.8s ease-in forwards}
    #fkRole .card{text-align:center;padding:24px 36px;border-radius:24px;background:linear-gradient(180deg,#1c1917,#0c0a09);border:4px solid var(--rc);box-shadow:0 0 70px var(--rc);animation:fkPop .5s cubic-bezier(.2,1.6,.5,1)}
    #fkRole .card i{display:block;font-style:normal;font-size:70px}
    #fkRole .card b{display:block;font:600 38px var(--fh);color:var(--rc);letter-spacing:.04em}
    #fkRole .card span{display:block;font:700 15px var(--fb);color:#e7e5e4;margin-top:6px;max-width:360px}
    @keyframes fkPop{from{transform:scale(.3);opacity:0}}
    @keyframes fkFade{0%,80%{opacity:1}100%{opacity:0}}
    #fkVig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(153,27,27,.85) 100%);opacity:0;transition:opacity .25s}
    #fkHp{position:absolute;left:50%;top:64px;transform:translateX(-50%);width:min(260px,60vw);height:14px;border-radius:8px;background:rgba(0,0,0,.55);box-shadow:0 0 0 2px rgba(255,255,255,.15);overflow:hidden;pointer-events:none}
    #fkHp i{display:block;height:100%;background:linear-gradient(90deg,#dc2626,#f87171);transition:width .2s}
    #fkHp b{position:absolute;inset:0;font:800 11px var(--fb);color:#fff;text-align:center;line-height:14px;text-shadow:0 1px 2px #000}
    #fkPz{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(360px,90vw);padding:14px 16px 16px;border-radius:18px;background:rgba(12,10,9,.94);border:2px solid #57534e;pointer-events:auto;color:#fff;text-align:center;font-weight:800;z-index:6}
    #fkPz .tt{font-size:16px;margin-bottom:10px}
    #fkPz .wires{position:relative;display:flex;justify-content:space-between;height:220px}
    #fkPz .col{display:flex;flex-direction:column;justify-content:space-around;z-index:1}
    #fkPz .dot{width:40px;height:40px;border-radius:50%;border:3px solid #1c1917;box-shadow:0 0 0 2px #78716c;cursor:pointer;padding:0}
    #fkPz .dot.on{box-shadow:0 0 0 4px #fff}
    #fkPz .dot.done{opacity:.55;cursor:default}
    #fkPz svg{position:absolute;inset:0;width:100%;height:100%}
    #fkPz .bad{animation:fkShake .3s}
    #fkPz .x{margin-top:10px;font:inherit;font-size:14px;padding:8px 18px;border-radius:10px;border:0;background:#44403c;color:#fff;cursor:pointer}
    @keyframes fkShake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
    #fkTag{position:absolute;left:50%;top:84px;transform:translateX(-50%);font:900 22px var(--fh);color:#fca5a5;text-shadow:0 0 12px #7f1d1d;pointer-events:none;letter-spacing:.06em}`;
  document.head.append(style);

  // survivors: two abilities each (Q and F), cooldowns in seconds; a few are unlocked in the shop
  const SURV = [
    { id: 'noob', n: 'Noob', e: '🧑', hp: 100, av: [0, 2, 0, 1, 0], q: { n: 'Bloxy Cola', e: '🥤', cd: 25, d: 'Drink up: 40% faster for 5 seconds' }, f: { n: 'Slateskin', e: '🪨', cd: 30, d: 'Take 60% less damage for 4 seconds (but slower)' } },
    { id: 'guest', n: 'Guest 1337', e: '🛡️', hp: 110, q: { n: 'Block', e: '🛡️', cd: 22, d: 'Block the next hit for 1.5 seconds: the killer is stunned' }, f: { n: 'Charge', e: '👊', cd: 28, d: 'Charge forward: run into the killer to stun them' } },
    { id: 'elliot', n: 'Elliot', e: '🍕', hp: 100, q: { n: 'Pizza Throw', e: '🍕', cd: 20, d: 'Heal the nearest hurt survivor 35 (or yourself)' }, f: { n: 'Rush Hour', e: '🏃', cd: 35, d: 'You and survivors near you run faster for 4 seconds' } },
    { id: 'chance', n: 'Chance', e: '🎲', hp: 90, shop: 'ch_chance', q: { n: 'Flip a Coin', e: '🪙', cd: 4, d: 'Heads: a charge for your gun (up to 3)' }, f: { n: 'One Shot', e: '🔫', cd: 25, d: 'Shoot the killer: stunned longer with more charges (no charges: it might backfire)' } },
    { id: 'knight', n: 'Sword Knight', e: '🗡️', hp: 100, shop: 'ch_knight', q: { n: 'Slash', e: '⚔️', cd: 25, d: 'Slash in front of you: stuns the killer' }, f: { n: 'Fried Chicken', e: '🍗', cd: 40, d: 'Heal yourself 35' } },
    { id: '007', n: '007n7', e: '🕶️', hp: 90, shop: 'ch_007', q: { n: 'Clone', e: '👥', cd: 30, d: 'A clone of you runs off: the killer might chase it' }, f: { n: 'Cloak', e: '👻', cd: 35, d: 'Invisible to the killer for 6 seconds' } },
    { id: 'builder', n: 'Builder', e: '🔧', hp: 100, shop: 'ch_builder', q: { n: 'Sentry', e: '🔫', cd: 40, d: 'A sentry that slows the killer when it comes close' }, f: { n: 'Dispenser', e: '🩹', cd: 45, d: 'A dispenser that heals survivors near it' } },
  ];
  // killers: a swing (click) and two abilities
  const KILL = [
    { id: 'c00l', n: 'c00lkidd', e: '😈', c: 0xdc2626, dmg: 25, q: { n: 'Walkspeed Override', e: '💨', cd: 18, d: 'Dash forward: run into a survivor for 35' }, f: { n: 'Pizza Delivery', e: '🍕', cd: 35, d: 'Two minions chase survivors and blow up on them' } },
    { id: 'john', n: 'John Doe', e: '👤', c: 0x1f2937, dmg: 30, shop: 'kl_john', q: { n: 'Corrupt Energy', e: '⚡', cd: 14, d: 'Spikes burst out where you aim, a moment later' }, f: { n: 'Digital Footprint', e: '👣', cd: 30, d: 'See every survivor through walls for 6 seconds' } },
    { id: '1x', n: '1x1x1x1', e: '🟩', c: 0x16a34a, dmg: 25, shop: 'kl_1x', q: { n: 'Mass Infection', e: '🗡️', cd: 16, d: 'Throw a sword: the first survivor it hits is hurt and slowed' }, f: { n: 'Unstable Eye', e: '👁️', cd: 30, d: 'See everyone through walls and run faster for 6 seconds' } },
  ];
  const ROUND = 180, GEN_NEED = 3, GEN_CUT = 15, BOT_FIX = 13, FREEZE = 6, SWING = 6.5, SWING_CD = 1.4, LMS = 45;
  const GENS = [[-33, -31], [33, -28], [-29, 31], [31, 30], [-46, 2], [46, -1]];
  const WIRE = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'];
  const B = 55; // the map: −B…B both ways
  const MAL = (id, H) => (H.mal && H.mal[id]) || 0;

  const weapon = (k) => { const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: c })); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); }; const K = KILL[k] || KILL[0]; b(0x1c1917, 0.25, 0.25, 0.9, 0, 0, -0.2); b(0x57534e, 0.6, 0.2, 0.2, 0, 0, -0.7); b(k === 2 ? 0x22c55e : k === 1 ? 0x111827 : 0xef4444, 0.12, 0.42, 2.6, 0, 0, -2.1); g.userData.c = K.c; return g; };

  const FK = {
    id: 'forsaken', code: 'fk', genre: 'Horror', rank: 0.0004, name: 'Forsaken', emoji: '🩸', max: 8, stat: 'Wins', killY: -30, banner: true, camDist: 18, respawnDelay: 3000, noReset: true,
    land: { theme: 'night', fence: 'stone', fences: [[-B, -B, B, B]], under: [[-B, -B, B, B]], extras: ['graves', 'pumpkins'] },
    color: 'linear-gradient(135deg,#450a0a,#0c0a09)',
    desc: 'One of you is the Killer, the rest are Survivors, in a ruined town at night. Survivors fix generators (wire puzzles) to bring the clock down and hold out until it runs out; the killer hunts them down. Pick your character: Noob, Guest 1337, Elliot, Chance, the Sword Knight, 007n7 or the Builder, each with two abilities, or kill as c00lkidd, John Doe or 1x1x1x1. Whoever has the most malice is the next killer. With only a few of you, 🤖 bots join in.',
    welcome: 'Fix the generators and survive — or hunt them down…',

    /* ---- the town ---- */
    build() {
      sky('#0b0b12', '#1c1917');
      scene.fog = new THREE.Fog(0x14110f, 18, 95);
      this.walls = [];
      slab(0, 0, 0, 2 * B + 2, 2 * B + 2, 0x283224, { sy: 2 });
      for (const [x, z, sx, sz] of [[0, 0, 7, 2 * B], [0, 0, 2 * B, 7]]) part({ x, y: 0.05, z, sx, sy: 0.1, sz, c: 0x4a3f33, plain: true, solid: false }); // the crossroads
      const wall = (x0, z0, x1, z1, h = 7, c = 0x57534e) => { const p = part({ x: (x0 + x1) / 2, y: h / 2, z: (z0 + z1) / 2, sx: Math.max(0.8, x1 - x0), sy: h, sz: Math.max(0.8, z1 - z0), c }); this.walls.push(p); return p; };
      // a ruined house: four walls with gaps for doors (and a broken one or two), a bit of roof
      const house = (cx, cz, w, d, doors, c) => {
        const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
        const side = (a0, a1, fixed, along, gaps) => { let a = a0; for (const g of gaps.concat([a1 + 2.5])) { if (g - 2.5 > a) { if (along === 'x') wall(a, fixed - 0.4, g - 2.5, fixed + 0.4, 7, c); else wall(fixed - 0.4, a, fixed + 0.4, g - 2.5, 7, c); } a = g + 2.5; } };
        side(x0, x1, z0, 'x', doors.n || []); side(x0, x1, z1, 'x', doors.s || []); side(z0, z1, x0, 'z', doors.w || []); side(z0, z1, x1, 'z', doors.e || []);
        part({ x: cx, y: 0.06, z: cz, sx: w - 1, sy: 0.1, sz: d - 1, c: 0x3f2f22, plain: true, solid: false });
        part({ x: cx - w / 4, y: 7.3, z: cz, sx: w / 2 + 0.8, sy: 0.6, sz: d + 0.8, c: 0x292524 }); // half a roof
      };
      house(-32, -30, 18, 14, { s: [-32], e: [-33] }, 0x6b5b4b);
      house(32, -29, 16, 16, { s: [30], w: [-25] }, 0x57534e);
      house(-30, 31, 16, 14, { n: [-27], e: [33] }, 0x5c4033);
      house(31, 30, 20, 14, { n: [34], w: [27] }, 0x4b5563);
      // the old church in the north, the well in the middle, a graveyard fence, crates, trees
      wall(-9, -52, 9, -51, 9, 0x44403c); wall(-9.5, -52, -8.5, -40, 9, 0x44403c); wall(8.5, -52, 9.5, -40, 9, 0x44403c); wall(-9.5, -40.5, -3, -39.5, 9, 0x44403c); wall(3, -40.5, 9.5, -39.5, 9, 0x44403c);
      part({ x: 0, y: 13.5, z: -46, sx: 3, sy: 9, sz: 3, c: 0x292524 }); part({ x: 0, y: 19, z: -46, sx: 0.6, sy: 3, sz: 0.6, c: 0x78716c }); part({ x: 0, y: 19.6, z: -46, sx: 2, sy: 0.5, sz: 0.5, c: 0x78716c });
      wall(-2, -2, 2, 2, 1.6, 0x78716c); part({ x: 0, y: 1.65, z: 0, sx: 3, sy: 0.1, sz: 3, c: 0x0c4a6e, plain: true, solid: false });
      for (const x of [-1.7, 1.7]) part({ x, y: 3.6, z: 0, sx: 0.4, sy: 4, sz: 0.4, c: 0x44403c });
      part({ x: 0, y: 5.8, z: 0, sx: 4, sy: 0.5, sz: 1.4, c: 0x292524 });
      for (let k = 0; k < 7; k++) wall(14 + k * 4, 49.5, 16 + k * 4, 50.3, 2.4, 0x3f3f46);
      const r = mulberry(6660);
      for (let i = 0; i < 26; i++) {
        const x = (r() - 0.5) * (2 * B - 8), z = (r() - 0.5) * (2 * B - 8);
        if (Math.abs(x) < 6 || Math.abs(z) < 6 || GENS.some((g) => Math.hypot(g[0] - x, g[1] - z) < 7)) continue;
        if (this.walls.some((w) => Math.abs(w.x - x) < w.sx / 2 + 3 && Math.abs(w.z - z) < w.sz / 2 + 3)) continue;
        if (i % 3) { const h = 6 + r() * 5; part({ x, y: h / 2, z, sx: 1.2, sy: h, sz: 1.2, c: 0x292018 }); part({ x, y: h + 1.2, z, sx: 4, sy: 3, sz: 4, c: 0x1a2e1a }); }
        else { const s = 1.6 + r() * 1.4; part({ x, y: s / 2, z, sx: s, sy: s, sz: s, c: 0x5b4636 }); }
      }
      for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { part({ x, y: 4, z, sx: 0.4, sy: 8, sz: 0.4, c: 0x1c1917 }); part({ x, y: 8.2, z, sx: 1, sy: 0.6, sz: 1, c: 0xfbbf24, neon: true, solid: false }); }
      // the generators
      this.genP = GENS.map(([x, z], i) => {
        const p = part({ x, y: 1.3, z, sx: 2.8, sy: 2.6, sz: 1.8, c: 0x3f3f46, gen: i });
        part({ x, y: 2.8, z, sx: 1.2, sy: 0.4, sz: 1.2, c: 0x18181b, gen: i });
        p.lamp = part({ x, y: 3.25, z, sx: 0.6, sy: 0.5, sz: 0.6, c: 0x7f1d1d, neon: true, solid: false, gen: i });
        p.lab = label('⚙️ 0/3', { size: 0.8, bg: 'rgba(12,10,9,.7)' }); p.lab.position.set(x, 4.6, z); place.add(p.lab); p.labT = '';
        return p;
      });
      // the lobby: up on a hill to the south, looking down over the town
      slab(0, 14, B + 20, 44, 20, 0x1c1917, { sy: 2 });
      for (const [x, z, sx, sz] of [[0, B + 30.5, 44, 1], [-22.5, B + 20, 1, 20], [22.5, B + 20, 1, 20]]) part({ x, y: 16.5, z, sx, sy: 5, sz, c: 0x292524 });
      part({ x: 0, y: 15.2, z: B + 10.4, sx: 44, sy: 2.4, sz: 0.8, c: 0x44403c });
      const sg = label('🩸 FORSAKEN', { size: 2.8, color: '#fca5a5' }); sg.position.set(0, 23, B + 29); place.add(sg);
      // where survivors start, and a grid for the bots to find their way
      this.spawns = [[-45, -45], [45, -45], [-45, 45], [45, 45], [-20, -45], [20, 45], [-45, -18], [45, 18], [-20, 45], [20, -45]];
      const boxes = parts.filter((p) => p.solid && p.sy > 1.2 && p.y - p.sy / 2 < 3 && p.sx < 50).map(boxOf), CS = 1.5, NX = Math.ceil((2 * B) / CS), NZ = NX, grid = new Uint8Array(NX * NZ);
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = -B + (i + 0.5) * CS, z = -B + (j + 0.5) * CS; grid[j * NX + i] = boxes.some((b) => x > b[0] - 1 && x < b[3] + 1 && z > b[2] - 1 && z < b[5] + 1) ? 1 : 0; }
      this.nav = { NX, NZ, CS, grid, free: [] };
      for (let k = 0; k < NX * NZ; k++) if (!grid[k]) this.nav.free.push(k);
      this.tall = boxes.filter((b) => b[4] > 3);
    },
    pres() { return { mk: 0, sv: 0, kl: 0, pk: 0 }; },
    async enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.rd = 0; this.evN = null; this.mk = 0; this.seenMk = new Map(); this.T = {}; this.tc = {}; this.obSeq = null; this.marks = []; this.botAv = new Map(); this.held = new Map(); this.obM = new Map(); this.fx = [];
      this.cd = { q: 0, f: 0, a: 0 }; this.loc = {}; this.pz = null; this.charges = 0; this.lastHp = null; this.wasAlive = false;
      const s = await kvGet('fk');
      this.S = Object.assign({ sv: 0, kl: 0, gens: 0, wins: 0, kills: 0 }, s && typeof s === 'object' ? s : {});
      if (!this.ownS(this.S.sv)) this.S.sv = 0; if (!this.ownK(this.S.kl)) this.S.kl = 0;
      questMax('forsaken.gen', this.S.gens | 0); questMax('forsaken.kill', this.S.kills | 0);
      const hud = $('#xhud');
      this.vig = document.createElement('div'); this.vig.id = 'fkVig'; hud.append(this.vig);
      this.hpEl = document.createElement('div'); this.hpEl.id = 'fkHp'; this.hpEl.innerHTML = '<i></i><b></b>'; this.hpEl.hidden = true; hud.append(this.hpEl);
      this.tagEl = document.createElement('div'); this.tagEl.id = 'fkTag'; hud.append(this.tagEl);
      this.sendPick();
    },
    save() { return kvSet('fk', this.S); },
    sendPick() { send({ sv: this.S.sv, kl: this.S.kl, pk: hasItem('kperk') ? 1 : 0 }); },
    ownS(i) { const C = SURV[i]; return !!C && (!C.shop || hasItem(C.shop)); },
    ownK(i) { const C = KILL[i]; return !!C && (!C.shop || hasItem(C.shop)); },
    leave() {
      for (const a of this.botAv.values()) dropAvatar(a); this.botAv = new Map();
      for (const o of this.obM.values()) { if (o.av) dropAvatar(o.av); else scene.remove(o.m); } this.obM = new Map();
      for (const f of this.fx) scene.remove(f.m); this.fx = [];
      for (const h of this.held.values()) if (h.m && h.m.parent) h.m.parent.remove(h.m); this.held = new Map();
      for (const s of this.marks || []) scene.remove(s); this.marks = [];
      if (me) me.g.scale.setScalar(1);
      this.closePuzzle(); P.frozen = false;
      if (this.roleEl) { this.roleEl.remove(); this.roleEl = null; }
      this.save();
    },
    spawn() {
      const g = this.g, mine = myPeer();
      if (g && g.ph === 'play') {
        if (g.k === mine) return [0, 0.5, 6, 0];
        if ((g.al || []).includes(mine)) { const i = Math.max(0, (g.order || []).indexOf(mine)), s = this.spawns[(i + g.rd * 3) % this.spawns.length]; return [s[0], 0.5, s[1], Math.atan2(s[0], s[1])]; }
      }
      return [(Math.random() - 0.5) * 30, 15.5, B + 22, Math.PI]; // the lobby
    },
    adopt() {
      const g = this.lastG;
      this.evSeq = Math.max(this.evSeq || 0, ...((g && g.ev) || []).map((e) => e[0]));
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, el: 0, rd: 0, k: null, al: [], order: [], hp: {}, ch: {}, gens: GENS.map(() => 0), gn: GENS.map(() => -99), buf: {}, st: 0, ob: [], sc: {}, mal: {}, w: '', gs: 0, ev: [], bots: [], bp: [], lms: 0, n0: 0 };
    },

    /* ---- the host: the round, checking every hit, the bots ---- */
    host(dt) {
      const H = this.H, humans = players(), n = humans.length;
      if (!H.bp) { H.bots = []; H.bp = []; }
      if (!this.tc) this.tc = {}; // (a host taking over mid-round)
      if (this.obSeq == null) this.obSeq = Math.max(0, ...(H.ob || []).map((o) => +String(o[0]).slice(3) || 0));
      H.left = Math.max(0, H.left - dt); H.el = (H.el || 0) + dt;
      if (H.ph === 'wait') { if (n >= 1) { H.ph = 'count'; H.left = 12; } }
      else if (H.ph === 'count') { if (n < 1) H.ph = 'wait'; else if (H.left <= 0) this.startRound(humans); }
      else if (H.ph === 'play') {
        H.al = H.al.filter((id) => this.isBot(id) || humans.some((p) => p.peer === id));
        if (!this.isBot(H.k) && !humans.some((p) => p.peer === H.k)) { this.endRound('s'); }
        let pl = this.everyone(humans);
        for (const p of humans) {
          if (p.me) continue;
          const mk = p.pr && Array.isArray(p.pr.mk) ? p.pr.mk : null;
          if (!mk || mk[0] === this.seenMk.get(p.peer)) continue;
          this.seenMk.set(p.peer, mk[0]);
          this.act(p.peer, mk[1], mk[2], mk[3], mk[4], pl);
        }
        if (H.ph === 'play') { this.moveBots(dt, pl); pl = this.everyone(humans); this.objects(dt, pl); }
        this.checkWin();
        if (H.ph === 'play' && H.left <= 0) this.endRound('s');
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n >= 1 ? 'count' : 'wait'; H.left = 12; H.bots = []; H.bp = []; H.ob = []; }
      if (performance.now() - (this.sentAt || 0) > 120) { this.sentAt = performance.now(); hostSend(this, { bp: H.bp.map((b) => [b[0], +b[1].toFixed(1), +b[2].toFixed(1), b[3], b[4]]), ob: H.ob.map((o) => [o[0], o[1], +o[2].toFixed(1), +o[3].toFixed(1), o[4], o[5]]) }); }
    },
    isBot: (id) => typeof id === 'string' && id.startsWith('bot:'),
    nameOfId(id, g) { if (this.isBot(id)) { const b = ((g || this.g || {}).bots || []).find((b) => b[0] === id); return b ? '🤖 ' + b[1] : 'a bot'; } return nameOf(id); },
    everyone(humans) { const H = this.H; return humans.concat(H.bp.map((b) => ({ peer: b[0], x: b[1], y: 0, z: b[2], bot: true }))); },
    ev(e) { const H = this.H; this.evSeq = (this.evSeq || 0) + 1; H.ev = (H.ev || []).concat([[this.evSeq].concat(e)]).slice(-10); },
    startRound(pl) {
      const H = this.H, n = pl.length, nb = Math.max(0, 5 - n), rd = (H.rd | 0) + 1, names = ['Sam', 'Pip', 'Max', 'Ivy', 'Rex', 'Lou', 'Kit'];
      H.bots = []; H.bp = []; H.ob = []; this.T = {}; this.obSeq = 0;
      for (let i = 0; i < nb; i++) H.bots.push([`bot:${rd}:${i}`, names[(i + rd) % names.length], Math.floor(Math.random() * 1e6)]);
      const ids = pl.map((p) => p.peer).concat(H.bots.map((b) => b[0]));
      // the killer: picked by malice (it builds up every round you survive; the Killer Perk builds it twice as fast)
      H.mal = H.mal || {};
      const wt = (id) => 1 + MAL(id, H) * 3;
      let r = Math.random() * ids.reduce((a, id) => a + wt(id), 0), k = ids[ids.length - 1];
      for (const id of ids) { r -= wt(id); if (r <= 0) { k = id; break; } }
      for (const id of ids) { if (id === k) H.mal[id] = 0; else { const p = pl.find((q) => q.peer === id); H.mal[id] = MAL(id, H) + (p && p.pr && p.pr.pk ? 2 : 1); } }
      H.ph = 'play'; H.left = ROUND; H.el = 0; H.rd = rd; H.w = ''; H.k = k; H.st = 0; H.lms = 0; H.buf = {};
      H.al = ids.filter((id) => id !== k); H.n0 = H.al.length; H.order = H.al.slice().sort();
      H.ch = {}; H.hp = {};
      for (const id of ids) {
        const p = pl.find((q) => q.peer === id), pr = (p && p.pr) || {};
        if (id === k) H.ch[id] = this.isBot(id) ? Math.floor(Math.random() * KILL.length) : clamp(pr.kl | 0, 0, KILL.length - 1);
        else { H.ch[id] = this.isBot(id) ? Math.floor(Math.random() * SURV.length) : clamp(pr.sv | 0, 0, SURV.length - 1); H.hp[id] = SURV[H.ch[id]].hp; }
      }
      H.gens = GENS.map(() => 0); H.gn = GENS.map(() => -99); H.gw = {};
      for (const [id] of H.bots) { if (id === k) H.bp.push([id, 0, 6, 0, '']); else { const s = this.spawns[(H.order.indexOf(id) + rd * 3) % this.spawns.length]; H.bp.push([id, s[0], s[1], 0, '']); } }
      for (const p of pl) this.seenMk.set(p.peer, p.pr && Array.isArray(p.pr.mk) ? p.pr.mk[0] : 0); // old presses don't count
      this.tc = {};
    },
    pos(id, pl) { if (typeof id === 'string' && id.startsWith('ob:')) { const o = this.H.ob.find((q) => q[0] === id); return o && { x: o[2], z: o[3], peer: id }; } return pl.find((p) => p.peer === id); },
    buf(id) { const H = this.H; return H.buf[id] || (H.buf[id] = {}); },
    // a survivor or the killer pressed something: is it allowed, and what happens?
    act(by, kind, a, b, c, pl) {
      const H = this.H, me = this.pos(by, pl), el = H.el, now = el;
      if (H.ph !== 'play' || !me) return;
      const killer = by === H.k, alive = H.al.includes(by), K = this.pos(H.k, pl);
      const ok = (key, cd) => { const t = (this.tc[by] || (this.tc[by] = {})); if (now - (t[key] == null ? -99 : t[key]) < cd * 0.8) return false; t[key] = now; return true; };
      const kd = (p) => (K && p ? Math.hypot(K.x - p.x, K.z - p.z) : 1e9);
      if (killer) {
        if (el < FREEZE || H.st > el) return;
        const KC = KILL[H.ch[by]];
        if (kind === 'a' || kind === 'd') { // a swing, or running into someone on a dash
          if (!ok(kind, kind === 'a' ? SWING_CD : 0.5)) return;
          const v = this.pos(a, pl);
          if (!v) return;
          if (typeof a === 'string' && a.startsWith('ob:')) { if (Math.hypot(v.x - me.x, v.z - me.z) < SWING + 3) { H.ob = H.ob.filter((o) => o[0] !== a); this.ev(['pop', +v.x.toFixed(1), +v.z.toFixed(1)]); } return; }
          if (H.al.includes(a) && Math.hypot(v.x - me.x, v.z - me.z) < (kind === 'a' ? SWING + 3 : 6)) this.hurt(a, kind === 'd' ? 35 : KC.dmg, by, pl);
        } else if (kind === 'mn' && H.ch[by] === 0 && ok('f', KC.f.cd)) {
          for (let i = 0; i < 2; i++) H.ob.push([`ob:${++this.obSeq}`, 'minion', me.x + (i ? 1.5 : -1.5), me.z, el + 12, by]);
          this.ev(['mn', +me.x.toFixed(1), +me.z.toFixed(1)]);
        } else if (kind === 'sp' && H.ch[by] === 1 && ok('q', KC.q.cd) && Math.hypot(+b - me.x, +c - me.z) < 40) {
          H.ob.push([`ob:${++this.obSeq}`, 'spike', +b, +c, el + 0.9, by]);
        } else if (kind === 'sw' && H.ch[by] === 2 && ok('q', KC.q.cd)) {
          this.ev(['sw', +me.x.toFixed(1), +me.z.toFixed(1), +b, +c]);
          const v = this.pos(a, pl);
          if (v && H.al.includes(a) && Math.hypot(v.x - me.x, v.z - me.z) < 50) { this.hurt(a, 30, by, pl); this.buf(a).sl = el + 3; }
        }
        return;
      }
      if (!alive) return;
      const C = SURV[H.ch[by]] || SURV[0], bf = this.buf(by);
      if (kind === 'gen') { // a puzzle done at a generator
        const i = a | 0, G = GENS[i];
        if (!G || H.gens[i] >= GEN_NEED || Math.hypot(G[0] - me.x, G[1] - me.z) > 6 || !ok('gen', 2.5)) return;
        this.genStep(i, by);
      } else if (kind === 'ss' && C.id === 'noob' && ok('f', C.f.cd)) bf.ss = el + 4;
      else if (kind === 'bl' && C.id === 'guest' && ok('q', C.q.cd)) bf.bl = el + 1.5;
      else if (kind === 'ch' && C.id === 'guest' && ok('f', 2) && kd(me) < 6) this.stun(2, by);
      else if (kind === 'pz' && C.id === 'elliot' && ok('q', C.q.cd)) {
        let best = null, bd = 25;
        for (const id of H.al) { if (id === by) continue; const p = this.pos(id, pl); if (!p) continue; const d = Math.hypot(p.x - me.x, p.z - me.z); if (d < bd && H.hp[id] < SURV[H.ch[id]].hp) { bd = d; best = id; } }
        const t = best || by; H.hp[t] = Math.min(SURV[H.ch[t]].hp, H.hp[t] + 35); this.ev(['heal', t, by]);
      } else if (kind === 'rh' && C.id === 'elliot' && ok('f', C.f.cd)) {
        for (const id of H.al) { const p = this.pos(id, pl); if (p && Math.hypot(p.x - me.x, p.z - me.z) < 15) this.buf(id).sp = el + 4; }
        this.ev(['rh', by]);
      } else if (kind === 'gun' && C.id === 'chance' && ok('f', C.f.cd)) {
        const ch = clamp(b | 0, 0, 3);
        this.ev(['gun', +me.x.toFixed(1), +me.z.toFixed(1), K ? +K.x.toFixed(1) : +me.x.toFixed(1), K ? +K.z.toFixed(1) : +me.z.toFixed(1), a ? 1 : 0]);
        if (!ch && Math.random() < 0.5) this.hurt(by, 20, by, pl); // it backfired
        else if (a && kd(me) < 60) this.stun(2 + ch * 1.5, by);
      } else if (kind === 'sl' && C.id === 'knight' && ok('q', C.q.cd)) { this.ev(['sl', by]); if (kd(me) < SWING + 2.5) this.stun(2.5, by); }
      else if (kind === 'hc' && C.id === 'knight' && ok('f', C.f.cd)) { H.hp[by] = Math.min(C.hp, H.hp[by] + 35); this.ev(['heal', by, by]); }
      else if (kind === 'cl' && C.id === '007' && ok('q', C.q.cd)) H.ob.push([`ob:${++this.obSeq}`, 'decoy', me.x, me.z, el + 8, by, +b || 0]);
      else if (kind === 'iv' && C.id === '007' && ok('f', C.f.cd)) bf.iv = el + 6;
      else if (kind === 'sn' && C.id === 'builder' && ok('q', C.q.cd)) H.ob.push([`ob:${++this.obSeq}`, 'sentry', me.x, me.z, el + 25, by]);
      else if (kind === 'dp' && C.id === 'builder' && ok('f', C.f.cd)) H.ob.push([`ob:${++this.obSeq}`, 'disp', me.x, me.z, el + 20, by]);
      else if (kind === 'med' && ok('med', 3)) { H.hp[by] = Math.min(C.hp, H.hp[by] + 40); this.ev(['heal', by, by]); }
    },
    genStep(i, by) {
      const H = this.H;
      if (H.gens[i] >= GEN_NEED) return; // (already running)
      H.gens[i]++; H.gn[i] = H.el; H.gw[by] = (H.gw[by] || 0) + 1;
      this.ev(['gp', i, H.gens[i], by]);
      if (H.gens[i] >= GEN_NEED) { H.left = Math.max(10, H.left - GEN_CUT); this.ev(['gd', i]); }
    },
    hurt(victim, dmg, by, pl) {
      const H = this.H, el = H.el, bf = this.buf(victim);
      if (!H.al.includes(victim)) return;
      if (by !== victim && bf.bl > el) { bf.bl = 0; this.stun(3, victim); this.ev(['blk', victim]); return; } // blocked!
      if (bf.ss > el) dmg *= 0.4;
      H.hp[victim] = Math.max(0, (H.hp[victim] || 0) - dmg);
      bf.sp = el + 1.6; // a burst of speed to get away
      this.ev(['hit', victim, Math.round(dmg), by]);
      if (H.hp[victim] <= 0) {
        H.al = H.al.filter((x) => x !== victim);
        this.ev(['die', victim, by]);
        if (H.al.length === 1 && H.n0 >= 2 && !H.lms) { H.lms = 1; H.left = Math.min(H.left, LMS); this.ev(['lms', H.al[0]]); }
      }
    },
    stun(sec, by) { const H = this.H; H.st = Math.max(H.st, H.el + sec); this.ev(['stun', by, sec]); },
    checkWin() { const H = this.H; if (H.ph === 'play' && !H.al.length) this.endRound('k'); },
    endRound(side) {
      const H = this.H;
      if (H.ph !== 'play') return;
      H.ph = 'end'; H.left = 8; H.w = side;
      const winners = side === 'k' ? [H.k] : H.al.slice();
      for (const id of winners) H.sc[id] = (H.sc[id] || 0) + 1;
      H.winners = winners; H.ob = [];
    },
    // sentries, dispensers, minions, spikes and clones
    objects(dt, pl) {
      const H = this.H, el = H.el, K = this.pos(H.k, pl);
      for (let i = H.ob.length - 1; i >= 0; i--) {
        const o = H.ob[i], kind = o[1];
        if (kind === 'spike') { if (el >= o[4]) { for (const id of H.al.slice()) { const p = this.pos(id, pl); if (p && Math.hypot(p.x - o[2], p.z - o[3]) < 4.2) this.hurt(id, 35, o[5], pl); } this.ev(['spk', +o[2].toFixed(1), +o[3].toFixed(1)]); H.ob.splice(i, 1); } continue; }
        if (el > o[4]) { H.ob.splice(i, 1); continue; }
        if (kind === 'minion') {
          let best = null, bd = 60; for (const id of H.al) { const p = this.pos(id, pl); if (!p || this.buf(id).iv > el) continue; const d = Math.hypot(p.x - o[2], p.z - o[3]); if (d < bd) { bd = d; best = p; } }
          if (!best) continue;
          const t = this.T[o[0]] || (this.T[o[0]] = {}), b = [o[0], o[2], o[3]];
          this.walk(b, t, [best.x, best.z], 13, dt); o[2] = b[1]; o[3] = b[2];
          if (bd < 2.2) { this.hurt(best.peer, 20, o[5], pl); this.ev(['pop', +o[2].toFixed(1), +o[3].toFixed(1)]); H.ob.splice(i, 1); }
        } else if (kind === 'decoy') {
          const t = this.T[o[0]] || (this.T[o[0]] = {}), b = [o[0], o[2], o[3]];
          if (!t.goal) { const a = o[6] || 0; t.goal = [clamp(o[2] - Math.sin(a) * 40, -B + 3, B - 3), clamp(o[3] - Math.cos(a) * 40, -B + 3, B - 3)]; }
          if (!this.walk(b, t, t.goal, 14, dt)) t.goal = this.anywhere();
          o[2] = b[1]; o[3] = b[2];
        } else if (kind === 'sentry' && K) {
          const t = this.T[o[0]] || (this.T[o[0]] = {});
          t.cd = (t.cd || 0) - dt;
          if (t.cd <= 0 && Math.hypot(K.x - o[2], K.z - o[3]) < 18 && this.see(o[2], o[3], K.x, K.z)) { t.cd = 1.2; this.buf(H.k).sl = el + 1.4; this.ev(['zap', +o[2].toFixed(1), +o[3].toFixed(1), +K.x.toFixed(1), +K.z.toFixed(1)]); }
        } else if (kind === 'disp') {
          for (const id of H.al) { const p = this.pos(id, pl); if (p && Math.hypot(p.x - o[2], p.z - o[3]) < 7) H.hp[id] = Math.min(SURV[H.ch[id]].hp, H.hp[id] + 5 * dt); }
        }
      }
    },

    /* ---- the bots (run by the host) ---- */
    see(x0, z0, x1, z1) {
      const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0));
      for (let k = 1; k < n; k++) { const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n; for (const b of this.tall) if (x > b[0] && x < b[3] && z > b[2] && z < b[5]) return false; }
      return true;
    },
    cell(x, z) { const N = this.nav; return [clamp(Math.floor((x + B) / N.CS), 0, N.NX - 1), clamp(Math.floor((z + B) / N.CS), 0, N.NZ - 1)]; },
    route(x0, z0, x1, z1) {
      const N = this.nav, { NX, NZ, CS, grid } = N, key = (c) => c[1] * NX + c[0], mid = (k) => [-B + ((k % NX) + 0.5) * CS, -B + (Math.floor(k / NX) + 0.5) * CS];
      const a = key(this.cell(x0, z0)), gc = this.cell(x1, z1);
      let goal = key(gc);
      if (grid[goal]) {
        let best = -1, bd = 1e9;
        for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const i = gc[0] + di, j = gc[1] + dj; if (i < 0 || j < 0 || i >= NX || j >= NZ || grid[j * NX + i]) continue; if (di * di + dj * dj < bd) { bd = di * di + dj * dj; best = j * NX + i; } }
        if (best < 0) return null; goal = best; [x1, z1] = mid(best);
      }
      const prev = new Int32Array(NX * NZ).fill(-1), q = [a]; prev[a] = a;
      for (let h = 0; h < q.length && prev[goal] < 0; h++) {
        const k = q[h], i = k % NX, j = Math.floor(k / NX);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue;
          const nk = nj * NX + ni; if (prev[nk] >= 0 || grid[nk] || (di && dj && (grid[j * NX + ni] || grid[nj * NX + i]))) continue;
          prev[nk] = k; q.push(nk);
        }
      }
      if (prev[goal] < 0) return null;
      const cells = []; for (let k = goal; k !== a; k = prev[k]) cells.push(k); cells.reverse();
      const pts = cells.map(mid); pts.push([x1, z1]);
      const out = []; let from = [x0, z0];
      for (let i = 0; i < pts.length;) { let j = pts.length - 1; while (j > i && !this.walkable(from, pts[j])) j--; out.push(pts[j]); from = pts[j]; i = j + 1; }
      return out;
    },
    walkable(a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.7); for (let k = 1; k <= n; k++) { const c = this.cell(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n); if (this.nav.grid[c[1] * this.nav.NX + c[0]]) return false; } return true; },
    anywhere() { const N = this.nav, k = N.free[Math.floor(Math.random() * N.free.length)]; return [-B + ((k % N.NX) + 0.5) * N.CS, -B + (Math.floor(k / N.NX) + 0.5) * N.CS]; },
    walk(b, t, goal, sp, dt) {
      const gk = Math.round(goal[0] / 3) + ',' + Math.round(goal[1] / 3);
      t.rt = (t.rt || 0) - dt;
      if (t.gk !== gk || t.rt <= 0 || !t.path) { t.path = this.route(b[1], b[2], goal[0], goal[1]); t.gk = gk; t.rt = 0.8; if (!t.path) return false; }
      const w = t.path[0]; if (!w) return false;
      const dx = w[0] - b[1], dz = w[1] - b[2], d = Math.hypot(dx, dz), s = Math.min(d, sp * dt);
      if (d > 0.01) { b[1] += (dx / d) * s; b[2] += (dz / d) * s; }
      if (d < 0.4) t.path.shift();
      return d > 0.05;
    },
    moveBots(dt, all) {
      const H = this.H, el = H.el, K = this.pos(H.k, all);
      for (const b of H.bp) {
        const id = b[0], killer = id === H.k;
        if (!killer && !H.al.includes(id)) continue;
        const t = this.T[id] || (this.T[id] = {}), x = b[1], z = b[2], dist = (p) => Math.hypot(p.x - x, p.z - z), bf = this.buf(id);
        t.look = (t.look || 0) - dt; t.cd = (t.cd || 0) - dt; t.qcd = (t.qcd == null ? 6 : t.qcd) - dt; t.fcd = (t.fcd == null ? 10 : t.fcd) - dt;
        let goal = null, sp = 13.5, hd = '';
        if (killer) {
          if (el < FREEZE || H.st > el) { b[3] = 0; b[4] = H.st > el ? 'st' : ''; continue; }
          const KC = KILL[H.ch[id]];
          if (t.look <= 0) {
            let best = null, bd = 46;
            for (const sid of H.al) { const p = this.pos(sid, all); if (!p || this.buf(sid).iv > el) continue; const d = dist(p); if (d < bd && (d < 8 || this.see(x, z, p.x, p.z))) { bd = d; best = sid; } }
            for (const o of H.ob) if (o[1] === 'decoy') { const d = Math.hypot(o[2] - x, o[3] - z); if (d < bd && this.see(x, z, o[2], o[3])) { bd = d; best = o[0]; } }
            t.prey = best; t.look = 0.3;
          }
          const pr = t.prey && (H.al.includes(t.prey) || String(t.prey).startsWith('ob:')) && this.pos(t.prey, all);
          hd = 'w'; sp = 15.5 * (bf.sl > el ? 0.6 : 1);
          if (pr) {
            const d = dist(pr); goal = [pr.x, pr.z];
            if (t.dash > 0) { t.dash -= dt; sp *= 2.3; if (d < 3.5) { t.dash = 0; this.act(id, 'd', t.prey, 0, 0, all); } }
            if (t.cd <= 0 && d < 4.2) { t.cd = SWING_CD + 0.3; this.act(id, 'a', t.prey, 0, 0, all); }
            else if (t.qcd <= 0 && d > 7 && d < 24 && !String(t.prey).startsWith('ob:')) {
              if (KC.id === 'c00l') { t.dash = 1.6; t.qcd = KC.q.cd; }
              else if (KC.id === 'john') { t.qcd = KC.q.cd; this.act(id, 'sp', 0, pr.x + (Math.random() - 0.5) * 3, pr.z + (Math.random() - 0.5) * 3, all); }
              else { t.qcd = KC.q.cd; const hit = Math.random() < 0.55; this.act(id, 'sw', hit ? t.prey : 0, +pr.x.toFixed(1), +pr.z.toFixed(1), all); }
            }
            if (KC.id === 'c00l' && t.fcd <= 0 && d < 30) { t.fcd = KC.f.cd; this.act(id, 'mn', 0, 0, 0, all); }
          } else {
            // nobody in sight: to the generator that was worked on last, or anywhere
            const g = H.gn.reduce((m, v, i) => (v > H.gn[m] ? i : m), 0);
            if (el - H.gn[g] < 15 && H.gens[g] < GEN_NEED) goal = GENS[g];
            else { if (!t.wander || Math.hypot(t.wander[0] - x, t.wander[1] - z) < 2 || (t.wt = (t.wt || 0) - dt) < 0) { t.wander = this.anywhere(); t.wt = 8; } goal = t.wander; }
          }
        } else {
          const C = SURV[H.ch[id]];
          const near = K && Math.hypot(K.x - x, K.z - z), sees = K && near < 24 && this.see(x, z, K.x, K.z) && el > FREEZE - 1;
          sp = 13 * (bf.sp > el ? 1.35 : 1) * (bf.sl > el ? 0.6 : 1) * (t.cola > el ? 1.4 : 1);
          // abilities, when the killer's close
          if (sees && near < 9 && t.qcd <= 0) {
            t.qcd = C.q.cd;
            if (C.id === 'noob') t.cola = el + 5;
            else if (C.id === 'guest') this.act(id, 'bl', 0, 0, 0, all);
            else if (C.id === 'knight') { if (near < 6 && Math.random() < 0.6) this.act(id, 'sl', 0, 0, 0, all); else t.qcd = 2; }
            else if (C.id === 'chance') { t.ch = Math.min(3, (t.ch || 0) + (Math.random() < 0.5 ? 1 : 0)); t.qcd = 4; }
            else if (C.id === '007') this.act(id, 'cl', 0, Math.atan2(x - K.x, z - K.z), 0, all);
            else if (C.id === 'builder') this.act(id, 'sn', 0, 0, 0, all);
            else t.qcd = 3;
          }
          if (sees && near < 14 && t.fcd <= 0) {
            t.fcd = C.f.cd;
            if (C.id === 'noob' && near < 6) this.act(id, 'ss', 0, 0, 0, all);
            else if (C.id === 'elliot') this.act(id, 'rh', 0, 0, 0, all);
            else if (C.id === 'chance') { if (t.ch) { this.act(id, 'gun', Math.random() < 0.6 ? 1 : 0, t.ch, 0, all); t.ch = 0; } else t.fcd = 3; }
            else if (C.id === '007') this.act(id, 'iv', 0, 0, 0, all);
            else if (C.id === 'guest' && near < 7) { this.act(id, 'ch', 0, 0, 0, all); }
            else t.fcd = 4;
          }
          if (C.id === 'elliot' && t.qcd <= 0 && H.al.some((o) => o !== id && H.hp[o] < SURV[H.ch[o]].hp - 30)) { t.qcd = C.q.cd; this.act(id, 'pz', 0, 0, 0, all); }
          if (C.id === 'knight' && t.fcd <= 0 && H.hp[id] < 55) { t.fcd = C.f.cd; this.act(id, 'hc', 0, 0, 0, all); }
          if (sees && near < 22) { // run!
            if (!t.away || t.re <= 0 || Math.hypot(t.away[0] - K.x, t.away[1] - K.z) < 15) { let best = null, bd = -1; for (let i = 0; i < 8; i++) { const c = this.anywhere(), d = Math.hypot(c[0] - K.x, c[1] - K.z) - Math.hypot(c[0] - x, c[1] - z) * 0.3; if (d > bd) { bd = d; best = c; } } t.away = best; t.re = 2.5; }
            t.re = (t.re || 0) - dt; goal = t.away; t.work = 0;
          } else {
            // fix the nearest generator that isn't done
            let gi = -1, gd = 1e9; GENS.forEach((G, i) => { if (H.gens[i] >= GEN_NEED) return; const d = Math.hypot(G[0] - x, G[1] - z) + (t.gen === i ? -8 : 0); if (d < gd) { gd = d; gi = i; } });
            if (gi >= 0) {
              t.gen = gi; const G = GENS[gi];
              if (Math.hypot(G[0] - x, G[1] - z) < 3.4) { goal = null; hd = 'fix'; t.work = (t.work || 0) + dt; if (t.work > BOT_FIX) { t.work = Math.random() * 2; this.genStep(gi, id); } } // (bots are a lot slower at the wires than people)
              else goal = [G[0] + 2.4, G[1] + 0.5];
            } else { if (!t.wander || Math.hypot(t.wander[0] - x, t.wander[1] - z) < 2) t.wander = this.anywhere(); goal = t.wander; }
          }
          if (bf.iv > el) hd = 'iv';
        }
        b[3] = goal && this.walk(b, t, goal, sp, dt) ? 1 : 0; b[4] = hd;
      }
    },

    /* ---- you ---- */
    me() { return myPeer(); },
    amKiller() { const g = this.g; return !!(g && g.ph === 'play' && g.k === myPeer()); },
    alive() { const g = this.g; return !!(g && g.ph === 'play' && (g.al || []).includes(myPeer())); },
    myChar() { const g = this.g, m = myPeer(); if (!g || g.ph !== 'play') return null; return g.k === m ? KILL[g.ch[m]] || KILL[0] : SURV[(g.ch || {})[m]] || SURV[0]; },
    report(kind, a, b, c) {
      this.mk++;
      send({ mk: [this.mk, kind, a || 0, b == null ? 0 : b, c == null ? 0 : c] });
      if (this.H) this.act(myPeer(), kind, a, b, c, this.everyone(players())); // the host's own go straight in
    },
    // who you could hit (as the killer): survivors you can see where they're drawn, and clones
    targets() {
      const g = this.g, out = [], el = g.el || 0;
      for (const [peer, a] of Net.avatars) if ((g.al || []).includes(peer) && !(((g.buf || {})[peer] || {}).iv > el)) out.push({ peer, x: a.g.position.x, z: a.g.position.z });
      for (const [id, a] of this.botAv) if ((g.al || []).includes(id) && !(((g.buf || {})[id] || {}).iv > el)) out.push({ peer: id, x: a.g.position.x, z: a.g.position.z });
      for (const [id, o] of this.obM) if (o.kind === 'decoy') out.push({ peer: id, x: o.x, z: o.z });
      return out;
    },
    killerAt() { const g = this.g; if (!g || !g.k) return null; if (g.k === myPeer()) return { x: P.x, z: P.z }; const a = Net.avatars.get(g.k) || this.botAv.get(g.k); return a ? { x: a.g.position.x, z: a.g.position.z } : null; },
    clear(x0, z0, x1, z1) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.6); for (let k = 1; k < n; k++) { const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n; for (const b of this.tall) if (x > b[0] && x < b[3] && z > b[2] && z < b[5]) return false; } return true; },
    fwd() { return [-Math.sin(cam.yaw), -Math.cos(cam.yaw)]; },
    swing() {
      if (!this.amKiller() || this.cd.a > 0 || this.frozenK()) return;
      this.cd.a = SWING_CD; this.swingT = 0.3; sfx('swing');
      const [fx, fz] = [-Math.sin(P.yaw), -Math.cos(P.yaw)];
      let best = null, bd = SWING;
      for (const t of this.targets()) { const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.1 && this.clear(P.x, P.z, t.x, t.z)) { bd = d; best = t; } }
      if (best) { this.report('a', best.peer); sfx('hit'); }
    },
    frozenK() { const g = this.g; return this.amKiller() && ((g.el || 0) < FREEZE || g.st > (g.el || 0)); },
    // Q and F
    ability(which) {
      const g = this.g, C = this.myChar(); if (!C || P.dead) return;
      const A = C[which], el = g.el || 0, now = performance.now() / 1000;
      if (this.cd[which] > 0) { toast(`${A.e} ${A.n}: ${Math.ceil(this.cd[which])}s`, '#fca5a5'); sfx('error', { gap: 400 }); return; }
      if (this.amKiller()) {
        if (this.frozenK()) return;
        if (C.id === 'c00l' && which === 'q') { this.loc.dash = now + 1.6; sfx('whoosh'); }
        else if (C.id === 'c00l') { this.report('mn'); sfx('pop'); }
        else if (C.id === 'john' && which === 'q') { const at = this.aimPoint(16); this.report('sp', 0, +at[0].toFixed(1), +at[1].toFixed(1)); this.spikeFx(at[0], at[1], true); sfx('zap'); }
        else if ((C.id === 'john' || C.id === '1x') && which === 'f') { this.loc.eye = now + 6; sfx('magic'); toast(C.id === 'john' ? '👣 You can see every footprint…' : '👁️ You see everything…', '#fca5a5'); }
        else if (C.id === '1x') {
          const [fx, fz] = this.fwd(); let best = null, bt = 45;
          for (const t of this.targets()) { const rx = t.x - P.x, rz = t.z - P.z, along = rx * fx + rz * fz, off = Math.abs(rx * fz - rz * fx); if (along > 0 && along < bt && off < 1.8 && this.clear(P.x, P.z, t.x, t.z)) { bt = along; best = t; } }
          const ex = P.x + fx * bt, ez = P.z + fz * bt; this.report('sw', best && !String(best.peer).startsWith('ob:') ? best.peer : 0, +ex.toFixed(1), +ez.toFixed(1)); this.swordFx(P.x, P.z, ex, ez); sfx('whoosh');
        }
      } else {
        if (!this.alive()) return;
        const id = C.id;
        if (id === 'noob' && which === 'q') { this.loc.cola = now + 5; sfx('powerup'); }
        else if (id === 'noob') { this.loc.ss = now + 4; this.report('ss'); sfx('shield'); }
        else if (id === 'guest' && which === 'q') { this.report('bl'); sfx('shield'); this.loc.block = now + 1.5; }
        else if (id === 'guest') { this.loc.charge = now + 0.9; this.chargeHit = false; sfx('whoosh'); }
        else if (id === 'elliot' && which === 'q') { this.report('pz'); sfx('pop'); }
        else if (id === 'elliot') { this.report('rh'); sfx('powerup'); }
        else if (id === 'chance' && which === 'q') { const heads = Math.random() < 0.5; if (heads) this.charges = Math.min(3, this.charges + 1); toast(heads ? `🪙 Heads! ${this.charges} charge${this.charges === 1 ? '' : 's'}` : '🪙 Tails…', heads ? '#fde68a' : '#d6d3d1'); sfx(heads ? 'coin' : 'click'); }
        else if (id === 'chance') {
          const K = this.killerAt(), [fx, fz] = this.fwd();
          let hit = 0; if (K) { const rx = K.x - P.x, rz = K.z - P.z, along = rx * fx + rz * fz, off = Math.abs(rx * fz - rz * fx); hit = along > 0 && along < 60 && off < 2.4 && this.clear(P.x, P.z, K.x, K.z) ? 1 : 0; }
          this.report('gun', hit, this.charges); this.charges = 0; sfx('gun');
        }
        else if (id === 'knight' && which === 'q') { this.report('sl'); this.swingT = 0.3; sfx('swing'); }
        else if (id === 'knight') { this.report('hc'); sfx('chomp'); }
        else if (id === '007' && which === 'q') { this.report('cl', 0, +P.yaw.toFixed(2)); sfx('magic'); }
        else if (id === '007') { this.report('iv'); this.loc.cloak = now + 6; sfx('magic'); }
        else if (id === 'builder' && which === 'q') { this.report('sn'); sfx('place'); }
        else if (id === 'builder') { this.report('dp'); sfx('place'); }
      }
      this.cd[which] = A.cd;
      this.drawBar();
    },
    aimPoint(d) { const [fx, fz] = this.fwd(); return [clamp(P.x + fx * d, -B + 1, B - 1), clamp(P.z + fz * d, -B + 1, B - 1)]; },
    get drive() { const now = performance.now() / 1000; return (this.loc && ((this.loc.dash || 0) > now || (this.loc.charge || 0) > now)) ? this.dashFn : null; },
    dashFn() { const s = this.loc.dash > performance.now() / 1000 ? 40 : 34, yaw = cam.yaw; return [-Math.sin(yaw) * s, -Math.cos(yaw) * s, yaw]; },
    speed() {
      const g = this.g; if (!g || g.ph !== 'play') return 16;
      const m = myPeer(), el = g.el || 0, now = performance.now() / 1000, bf = (g.buf || {})[m] || {};
      if (g.k === m) { if (el < FREEZE || g.st > el) return 0; let s = 17; if (bf.sl > el) s *= 0.6; if (this.loc.eye > now && this.myChar().id === '1x') s *= 1.2; return s; }
      if (this.pz) return 0;
      let s = 15; if (bf.sp > el) s *= 1.35; if (bf.sl > el) s *= 0.6; if (this.loc.cola > now) s *= 1.4; if (this.loc.ss > now) s *= 0.7; if (this.loc.cloak > now) s *= 0.85;
      return s;
    },
    click(e) {
      if (panelOpen() || this.pz) return;
      if (this.amKiller()) this.swing();
    },
    key(code, down) {
      if (!down) return;
      if (this.pz && code === 'Escape') { this.closePuzzle(); return true; }
      if (code === 'KeyQ') { this.ability('q'); return true; }
      if (code === 'KeyF') { this.ability('f'); return true; }
      if (code === 'KeyC' && itemCount('medkit') && this.alive()) { this.shopUse('medkit') && useItem('medkit'); return true; }
    },
    prompts() {
      const g = this.g; if (!g || g.ph !== 'play' || !this.alive() || this.pz || P.dead) return [];
      const out = [];
      GENS.forEach((G, i) => { if ((g.gens || [])[i] < GEN_NEED) out.push({ x: G[0], z: G[1], r: 4, text: `⚙️ Fix the generator (${g.gens[i]}/${GEN_NEED})`, fn: () => this.openPuzzle(i) }); });
      return out;
    },

    /* ---- the wire puzzle ---- */
    openPuzzle(i) {
      this.closePuzzle();
      const order = WIRE.map((c, k) => k).sort(() => Math.random() - 0.5), right = WIRE.map((c, k) => k).sort(() => Math.random() - 0.5);
      const el = document.createElement('div'); el.id = 'fkPz';
      el.innerHTML = `<div class="tt">⚙️ Connect the wires (${(this.g.gens[i] | 0) + 1}/${GEN_NEED})</div><div class="wires"><svg></svg><div class="col l">${order.map((k) => `<button class="dot" data-l="${k}" style="background:${WIRE[k]}"></button>`).join('')}</div><div class="col r">${right.map((k) => `<button class="dot" data-r="${k}" style="background:${WIRE[k]}"></button>`).join('')}</div></div><button class="x">✕ Stop (Esc)</button>`;
      $('#xhud').append(el);
      this.pz = { i, el, sel: null, done: new Set() };
      el.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        e.preventDefault(); e.stopPropagation();
        if (b.classList.contains('x')) { this.closePuzzle(); return; }
        const Z = this.pz; if (!Z) return;
        if (b.dataset.l != null) { const k = +b.dataset.l; if (Z.done.has(k)) return; Z.sel = k; el.querySelectorAll('[data-l]').forEach((d) => d.classList.toggle('on', d === b)); sfx('click'); return; }
        if (b.dataset.r != null && Z.sel != null) {
          const k = +b.dataset.r;
          if (k !== Z.sel) { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); sfx('error', { gap: 200 }); return; }
          Z.done.add(k); Z.sel = null; sfx('zap', { pitch: 1.5 });
          const L = el.querySelector(`[data-l="${k}"]`), R = b, W = el.querySelector('.wires').getBoundingClientRect(), a = L.getBoundingClientRect(), c = R.getBoundingClientRect();
          L.classList.add('done'); L.classList.remove('on'); R.classList.add('done');
          el.querySelector('svg').insertAdjacentHTML('beforeend', `<line x1="${a.left + a.width / 2 - W.left}" y1="${a.top + a.height / 2 - W.top}" x2="${c.left + c.width / 2 - W.left}" y2="${c.top + c.height / 2 - W.top}" stroke="${WIRE[k]}" stroke-width="8" stroke-linecap="round"/>`);
          if (Z.done.size === WIRE.length) { this.report('gen', Z.i); this.closePuzzle(); this.S.gens = (this.S.gens | 0) + 1; quest('forsaken.gen'); earn(1); this.save(); }
        }
      });
      sfx('open');
    },
    closePuzzle() { if (this.pz) { this.pz.el.remove(); this.pz = null; } },

    /* ---- what everyone sees ---- */
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer(), now = performance.now() / 1000;
      for (const k of ['q', 'f', 'a']) this.cd[k] = Math.max(0, this.cd[k] - dt);
      this.swingT = Math.max(0, (this.swingT || 0) - dt);
      const alive = this.alive(), killer = this.amKiller(), el = g ? g.el || 0 : 0;
      // a new round: to your place, and who you are
      if (g && g.ph === 'play' && g.rd !== this.rd) {
        this.rd = g.rd; this.cd = { q: 0, f: 0, a: 0 }; this.loc = {}; this.charges = 0; this.lastHp = null; this.closePuzzle();
        this.wasAlive = alive; this.inRound = alive || killer;
        respawn(); this.showRole();
      }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 5) sfx('count'); this.cdS = c; } else this.cdS = null;
      if (this.pz && g && ((g.gens || [])[this.pz.i] >= GEN_NEED || !alive)) { this.closePuzzle(); if (alive) toast('⚙️ That generator’s running now', '#fde68a'); }
      P.frozen = !!(this.frozenK() || this.pz);
      // the guest's charge: run into the killer
      if (this.loc.charge > now && !this.chargeHit) { const K = this.killerAt(); if (K && Math.hypot(K.x - P.x, K.z - P.z) < 3.6) { this.chargeHit = true; this.loc.charge = 0; this.report('ch'); sfx('punch'); } }
      // c00lkidd's dash: run into someone
      if (killer && this.loc.dash > now) for (const t of this.targets()) if (Math.hypot(t.x - P.x, t.z - P.z) < 3.4) { this.loc.dash = 0; this.report('d', t.peer); sfx('hit'); break; }
      // what happened
      if (g && this.evN == null) this.evN = Math.max(0, ...(g.ev || []).map((e) => e[0]));
      for (const e of (g && g.ev) || []) {
        if (!(e[0] > this.evN)) continue;
        this.evN = e[0];
        const k = e[1], at = (id) => { const a = id === mine ? me : Net.avatars.get(id) || this.botAv.get(id); return a ? a.g.position : null; };
        if (k === 'hit') { const p = at(e[2]); if (p) puffAt(p.x, p.y + 3, p.z, [0x991b1b, 0xdc2626], 10); if (e[2] === mine) { sfx('hurt'); this.flash = 0.6; this.closePuzzle(); } else sfx3('hit', p ? p.x : 0, p ? p.z : 0, 60); if (e[4] === mine) { this.hits = (this.hits || 0) + 1; } }
        if (k === 'die') { const p = at(e[2]); if (p) puffAt(p.x, p.y + 3, p.z, [0x450a0a, 0x1c1917, 0xffffff], 24); if (e[2] === mine) toast('💀 You were killed…', '#fca5a5'); else say(`💀 ${esc(this.nameOfId(e[2], g))} was killed`, '#fca5a5'); if (e[3] === mine) { this.S.kills = (this.S.kills | 0) + 1; quest('forsaken.kill'); earn(4); this.save(); } sfx('die'); }
        if (k === 'stun') { const p = this.killerAt(); if (p) puffAt(p.x, 5, p.z, [0xfde047, 0xffffff], 14); if (g.k === mine) this.loc.dash = 0; if (g.k === mine) toast(`💫 Stunned for ${(+e[3]).toFixed(1)}s!`, '#fde68a'); if (e[2] === mine && g.k !== mine) { toast('💫 You stunned the killer!', '#86efac'); earn(3); } sfx('zap'); }
        if (k === 'blk') { if (e[2] === mine) toast('🛡️ Blocked!', '#86efac'); sfx('block'); }
        if (k === 'heal') { const p = at(e[2]); if (p) puffAt(p.x, p.y + 3, p.z, [0x22c55e, 0x86efac], 10); if (e[2] === mine && e[3] !== mine) toast(`🍕 ${esc(this.nameOfId(e[3], g))} healed you`, '#86efac'); sfx3('heal', p ? p.x : 0, p ? p.z : 0, 50); }
        if (k === 'rh') { if (e[2] !== mine) toast('🏃 Rush hour!', '#86efac'); sfx('powerup'); }
        if (k === 'gp') { const G = GENS[e[2]]; sfx3('zap', G[0], G[1], 120, { pitch: 1.3 }); }
        if (k === 'gd') { const G = GENS[e[2]]; puffAt(G[0], 4, G[1], [0xfde047, 0xffffff], 30); sfx('unlock'); toast(`⚙️ A generator is running! (−${GEN_CUT}s)`, '#fde68a'); }
        if (k === 'lms') { this.lmsAt = performance.now(); sfx('alarm'); toast(e[2] === mine ? '⚠️ LAST MAN STANDING — hold on!' : `⚠️ Last man standing: ${esc(this.nameOfId(e[2], g))}`, '#fca5a5'); }
        if (k === 'gun') { this.lineFx(e[2], e[3], e[4], e[5], 0xfde047); sfx3('gun', e[2], e[3], 90); }
        if (k === 'sw' && !(Math.abs(e[2] - P.x) < 0.6 && Math.abs(e[3] - P.z) < 0.6)) this.swordFx(e[2], e[3], e[4], e[5]);
        if (k === 'spk') { this.spikeFx(e[2], e[3], false); sfx3('crunch', e[2], e[3], 80); }
        if (k === 'zap') { this.lineFx(e[2], e[3], e[4], e[5], 0x38bdf8); sfx3('laser', e[2], e[3], 60); }
        if (k === 'mn') sfx3('pop', e[2], e[3], 80);
        if (k === 'pop') { puffAt(e[2], 2, e[3], [0xdc2626, 0xfbbf24], 16); sfx3('explode', e[2], e[3], 70, { vol: 0.5 }); }
        if (k === 'sl') { const p = at(e[2]); if (p) puffAt(p.x, 3, p.z, [0xe5e7eb, 0x94a3b8], 8); }
      }
      // knocked out
      // (the last one down ends the round at once: that counts too)
      if (g && this.wasAlive && !alive && !P.dead && (g.ph === 'play' || (g.ph === 'end' && !(g.winners || []).includes(mine)))) die();
      this.wasAlive = alive;
      // the end of a round
      if (g && g.ph !== this.lastPh) {
        if (g.ph === 'end' && this.lastPh === 'play' && this.inRound) {
          const won = (g.winners || []).includes(mine);
          sfx(won ? 'win' : 'lose');
          if (won) { earn(g.w === 'k' ? 20 : 15, g.w === 'k' ? 'the killer wins' : 'you survived'); this.S.wins = (this.S.wins | 0) + 1; if (g.w === 's') quest('forsaken.survive'); this.save(); }
        }
        this.lastPh = g.ph;
      }
      this.drawBots(g, dt); this.drawObjects(g, dt); this.drawGens(g); this.fxTick(dt);
      this.drawBar(); this.drawHp(g);
      // the killer's near: the edges go red and your heart pounds
      const K = !killer && alive ? this.killerAt() : null, d = K ? Math.hypot(K.x - P.x, K.z - P.z) : 99;
      const vig = clamp((28 - d) / 22, 0, 1) * (el > FREEZE - 1 ? 1 : 0) + (this.flash || 0);
      this.flash = Math.max(0, (this.flash || 0) - dt * 1.5);
      if (this.vig) this.vig.style.opacity = vig.toFixed(2);
      if (K && d < 28 && el > FREEZE - 1) { this.beat = (this.beat || 0) - dt; if (this.beat <= 0) { this.beat = 0.35 + d / 40; sfx('land', { vol: 0.35 + (28 - d) / 50, pitch: 0.55 }); /* a heartbeat */ } }
      if (this.tagEl) { const t = g && g.ph === 'play' && g.lms ? '⚠️ LAST MAN STANDING' : ''; if (this.tagEl.textContent !== t) this.tagEl.textContent = t; }
      // the banner
      if (!g) setBanner('Getting the round…');
      else if (g.ph === 'wait') setBanner('Waiting for players…');
      else if (g.ph === 'count') { const m = (g.mal || {})[mine] | 0; setBanner(`Next round in ${Math.ceil(g.left)}… · 🎭 ${SURV[this.S.sv].n} / ${KILL[this.S.kl].n} · malice ${m}`); }
      else if (g.ph === 'play') {
        const gd = (g.gens || []).filter((v) => v >= GEN_NEED).length, tm = mmss(g.left);
        if (killer) setBanner(el < FREEZE ? `🩸 You are the KILLER — you’re let loose in ${Math.ceil(FREEZE - el)}…` : `🩸 ${KILL[g.ch[mine]].n} · kill them all · ${tm} · ${(g.al || []).length} left · ⚙️ ${gd}/${GENS.length}`);
        else if (alive) setBanner(`🏃 Survive · ${tm} · ⚙️ ${gd}/${GENS.length} generators · ${(g.al || []).length} alive`);
        else setBanner(`👻 You’re out — watching · ${tm} · ${(g.al || []).length} still alive`);
      } else setBanner(g.w === 'k' ? `🩸 The killer (${esc(this.nameOfId(g.k, g))}) wins!` : `🏃 The survivors win! ${(g.winners || []).length} made it`);
    },
    showRole() {
      const g = this.g, killer = this.amKiller(), C = this.myChar(); if (!C) return;
      if (this.roleEl) this.roleEl.remove();
      const el = document.createElement('div'); el.id = 'fkRole';
      el.innerHTML = `<div class="card" style="--rc:${killer ? '#dc2626' : '#22c55e'}"><i>${C.e}</i><b>${killer ? 'KILLER' : 'SURVIVOR'}</b><span>${esc(C.n)} · ${killer ? 'Hunt them down before the clock runs out. Click to swing.' : 'Fix generators (E) and survive until the clock runs out.'} Q: ${esc(C.q.n)} · F: ${esc(C.f.n)}</span></div>`;
      $('#xhud').append(el); this.roleEl = el;
      sfx(killer ? 'alarm' : 'reward');
      setTimeout(() => { if (this.roleEl === el) { el.remove(); this.roleEl = null; } }, 3800);
    },
    drawHp(g) {
      if (!this.hpEl) return;
      const m = myPeer(), on = !!(g && g.ph === 'play' && (g.al || []).includes(m));
      // (just under the banner, however tall it is: two lines on a phone)
      const now = performance.now();
      if (now > (this.placeAt || 0)) { this.placeAt = now + 400; const bn = $('#banner').getBoundingClientRect(), top = bn.height ? Math.round(bn.bottom + 6) : 64; this.hpEl.style.top = top + 'px'; if (this.tagEl) this.tagEl.style.top = top + 20 + 'px'; }
      this.hpEl.hidden = !on; if (!on) return;
      const C = SURV[(g.ch || {})[m]] || SURV[0], hp = Math.max(0, (g.hp || {})[m] || 0), w = Math.round((hp / C.hp) * 100) + '%';
      const i = this.hpEl.querySelector('i'), b = this.hpEl.querySelector('b'); if (i.style.width !== w) i.style.width = w; const t = `❤️ ${Math.ceil(hp)} / ${C.hp}`; if (b.textContent !== t) b.textContent = t;
    },
    drawBar() {
      const g = this.g, C = this.myChar(), killer = this.amKiller();
      let html = '';
      if (C && (killer || this.alive())) {
        const slot = (k, A, key) => `<button class="xslot${this.cd[k] > 0 ? ' cd' : ''}" data-k="${k}"><span class="k">${key}</span><span class="e">${A.e}</span>${this.cd[k] > 0 ? Math.ceil(this.cd[k]) + 's' : esc(A.n)}</button>`;
        if (killer) html += `<button class="xslot${this.cd.a > 0 ? ' cd' : ''}" data-k="a"><span class="k">🖱️</span><span class="e">🔪</span>Swing</button>`;
        html += slot('q', C.q, 'Q') + slot('f', C.f, 'F');
        if (C.id === 'chance') html += `<button class="xslot info"><span>🪙 ${this.charges}</span></button>`;
        if (!killer && itemCount('medkit')) html += `<button class="xslot" data-k="med"><span class="k">C</span><span class="e">🩹</span>Medkit ×${itemCount('medkit')}</button>`;
      } else if (g && g.ph !== 'play') html = `<button class="xslot" data-k="pick"><span class="e">🎭</span>Characters</button>`;
      if (html === this.barHtml) return;
      this.barHtml = html;
      setBar(html, (b) => { const k = b.dataset.k; if (k === 'a') this.swing(); else if (k === 'q' || k === 'f') this.ability(k); else if (k === 'pick') this.pickPanel(); else if (k === 'med') { if (this.shopUse('medkit')) useItem('medkit'); } });
    },
    menu() { return [['🎭 Characters', () => this.pickPanel()]]; },
    pickPanel() {
      const card = (C, i, kind) => { const own = kind === 's' ? this.ownS(i) : this.ownK(i), on = (kind === 's' ? this.S.sv : this.S.kl) === i;
        return `<div class="xp-row"><span>${C.e} <b>${esc(C.n)}</b>${kind === 's' ? ` <small style="color:var(--muted)">❤️ ${C.hp}</small>` : ` <small style="color:var(--muted)">🔪 ${C.dmg}</small>`}<br><small style="color:var(--muted)">Q ${C.q.e} ${esc(C.q.n)}: ${esc(C.q.d)}<br>F ${C.f.e} ${esc(C.f.n)}: ${esc(C.f.d)}</small></span>${own ? `<button class="xp-btn${on ? ' purple' : ''}" data-${kind}="${i}">${on ? '✓ Picked' : 'Pick'}</button>` : `<button class="xp-btn" data-shop="1">🛒 In the shop</button>`}</div>`; };
      const html = `<p style="margin:0 0 8px;color:var(--muted)">Pick who you play as a survivor and as the killer (it counts from the next round). The more rounds you survive, the more <b>malice</b> you build up, and the likelier you are to be the killer next.</p><h4 style="margin:8px 0 4px">🏃 Survivors</h4>${SURV.map((C, i) => card(C, i, 's')).join('')}<h4 style="margin:12px 0 4px">🩸 Killers</h4>${KILL.map((C, i) => card(C, i, 'k')).join('')}`;
      openPanel('🎭 Characters', html, (btn) => {
        if (btn.dataset.shop) { closePanel(); openShop(); return; }
        if (btn.dataset.s != null) { const i = +btn.dataset.s; if (this.ownS(i)) this.S.sv = i; }
        if (btn.dataset.k != null) { const i = +btn.dataset.k; if (this.ownK(i)) this.S.kl = i; }
        this.save(); this.sendPick(); sfx('select'); this.pickPanel();
      });
    },
    // the bots, and the killer's look
    drawBots(g, dt) {
      const el = g ? g.el || 0 : 0, mine = myPeer(), seeAll = this.loc.eye > performance.now() / 1000;
      const want = new Map(g && g.ph === 'play' ? (g.bp || []).filter((b) => b[0] === g.k || (g.al || []).includes(b[0])).map((b) => [b[0], b]) : []);
      for (const [id, a] of this.botAv) if (!want.has(id)) { dropAvatar(a); this.botAv.delete(id); const h = this.held.get(id); if (h && h.m && h.m.parent) h.m.parent.remove(h.m); this.held.delete(id); }
      for (const [id, b] of want) {
        let a = this.botAv.get(id);
        const info = (g.bots || []).find((x) => x[0] === id) || [id, 'Bot', 1];
        if (!a) { const r = mulberry(info[2] | 0), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]); a = makeAvatar(av, (id === g.k ? '🩸 ' : '🤖 ') + info[1], false); a.g.position.set(b[1], 0.02, b[2]); scene.add(a.g); this.botAv.set(id, a); }
        const p = a.g.position, k = Math.min(1, dt * 10), dx = b[1] - p.x, dz = b[2] - p.z;
        if (Math.hypot(dx, dz) > 25) p.set(b[1], 0.02, b[2]); else { p.x += dx * k; p.z += dz * k; }
        if (Math.hypot(dx, dz) > 0.05) a.g.rotation.y = Math.atan2(-dx, -dz);
        animateAvatar(a, dt, b[3] === 1, false); placeShadow(a);
        a.g.visible = !(b[4] === 'iv' && g.k === mine) || seeAll;
      }
      // everyone else: cloaked survivors are hidden from the killer (and see-through to everyone else)
      for (const [peer, a] of Net.avatars) {
        const iv = g && g.ph === 'play' && ((g.buf || {})[peer] || {}).iv > el;
        a.g.visible = !(iv && g.k === mine) || seeAll;
        if (a.ivOn !== !!iv) { a.ivOn = !!iv; a.g.traverse((o) => { if (o.isMesh && o.material && !o.material.isSpriteMaterial) { o.material.transparent = !!iv; o.material.opacity = iv ? 0.35 : 1; } }); }
      }
      if (me) { const iv = this.loc.cloak > performance.now() / 1000; if (me.ivOn !== iv) { me.ivOn = iv; me.g.traverse((o) => { if (o.isMesh && o.material) { o.material.transparent = iv; o.material.opacity = iv ? 0.35 : 1; } }); } }
      // John Doe and 1x1x1x1 see everyone through walls for a moment: a red marker over each survivor
      this.marks = this.marks || [];
      const show = seeAll && g && g.ph === 'play' ? this.targets().filter((t) => !String(t.peer).startsWith('ob:')) : [];
      while (this.marks.length < show.length) { const s = label('🔴', { size: 1.2, depthTest: false }); s.renderOrder = 9; scene.add(s); this.marks.push(s); }
      this.marks.forEach((s, i) => { s.visible = i < show.length; if (s.visible) s.position.set(show[i].x, 7.5, show[i].z); });
    },
    drawObjects(g, dt) {
      const list = g && g.ph === 'play' ? g.ob || [] : [], seen = new Set();
      for (const o of list) {
        const [id, kind, x, z] = o; seen.add(id);
        let O = this.obM.get(id);
        if (!O) {
          O = { kind, x, z };
          if (kind === 'decoy') { const owner = Net.peers.find((p) => p.peer === o[5]), av = owner && owner.presence && owner.presence.av ? owner.presence.av : o[5] === myPeer() ? avArr() : null; O.av = makeAvatar(okAv(av || [0, 0, 0, 0, 0, 0, 0, 0, 0]), this.nameOfId(o[5], g), false); O.av.g.position.set(x, 0.02, z); scene.add(O.av.g); O.m = O.av.g; }
          else {
            const m = new THREE.Group(), b = (c, sx, sy, sz, px, py, pz, basic) => { const q = new THREE.Mesh(BOX, basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshLambertMaterial({ color: c })); q.scale.set(sx, sy, sz); q.position.set(px, py, pz); m.add(q); return q; };
            if (kind === 'minion') { b(0xdc2626, 1.2, 1.2, 1.2, 0, 1.2, 0); b(0x111827, 0.9, 0.3, 0.1, 0, 1.4, -0.62); b(0xfbbf24, 1.6, 0.25, 1.6, 0, 0.5, 0); }
            else if (kind === 'sentry') { b(0x475569, 1.6, 0.6, 1.6, 0, 0.3, 0); b(0x64748b, 0.4, 1.6, 0.4, 0, 1.4, 0); const h = b(0x0ea5e9, 0.9, 0.7, 1.4, 0, 2.4, 0); O.head = h; }
            else if (kind === 'disp') { b(0x16a34a, 1.6, 2.2, 1.6, 0, 1.1, 0); b(0xffffff, 1.2, 0.4, 0.2, 0, 1.6, -0.82, true); b(0xef4444, 0.4, 1.2, 0.22, 0, 1.6, -0.82, true); }
            else if (kind === 'spike') { const r = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.2, 24), new THREE.MeshBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.7, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.15; m.add(r); }
            m.position.set(x, 0, z); scene.add(m); O.m = m;
          }
          this.obM.set(id, O);
        }
        const k = Math.min(1, dt * 10); O.x += (x - O.x) * k; O.z += (z - O.z) * k;
        if (O.av) { const p = O.av.g.position, dx = O.x - p.x, dz = O.z - p.z; p.x = O.x; p.z = O.z; if (Math.hypot(dx, dz) > 0.01) O.av.g.rotation.y = Math.atan2(-dx, -dz); animateAvatar(O.av, dt, Math.hypot(dx, dz) > 0.01, false); }
        else { O.m.position.set(O.x, 0, O.z); if (O.head) O.head.rotation.y += dt * 2; if (kind === 'minion') O.m.rotation.y += dt * 6; }
      }
      for (const [id, O] of this.obM) if (!seen.has(id)) { if (O.av) dropAvatar(O.av); else scene.remove(O.m); this.obM.delete(id); }
    },
    drawGens(g) {
      const gens = g && g.ph === 'play' ? g.gens || [] : GENS.map(() => 0);
      this.genP.forEach((p, i) => {
        const v = gens[i] | 0, done = v >= GEN_NEED, t = done ? '⚡ Running' : `⚙️ ${v}/${GEN_NEED}`;
        if (p.labT !== t) { p.labT = t; place.remove(p.lab); p.lab.material.map.dispose(); p.lab = label(t, { size: 0.8, bg: done ? 'rgba(22,101,52,.75)' : 'rgba(12,10,9,.7)' }); p.lab.position.set(p.x, 4.6, p.z); place.add(p.lab); p.lamp.m.material.color.set(done ? 0xfde047 : v ? 0xf97316 : 0x7f1d1d); }
      });
    },
    lineFx(x0, z0, x1, z1, c) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, 3.2, z0), new THREE.Vector3(x1, 3.2, z1)]), m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: c })); scene.add(m); this.fx.push({ m, life: 0.18 }); puffAt(x1, 3, z1, [c, 0xffffff], 5); },
    swordFx(x0, z0, x1, z1) { const m = weapon(2); m.position.set(x0, 3, z0); m.rotation.y = Math.atan2(-(x1 - x0), -(z1 - z0)); scene.add(m); const d = Math.hypot(x1 - x0, z1 - z0); this.fx.push({ m, life: d / 70, k: { x0, z0, x1, z1, t: 0, T: d / 70 } }); },
    spikeFx(x, z, warn) {
      if (warn) return; // (the red ring shows where they'll come up)
      const g = new THREE.Group(); for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.2, 5), new THREE.MeshLambertMaterial({ color: 0x111827, emissive: 0x7f1d1d })); const a = i * 0.7, r = i ? 1 + (i % 3) : 0; s.position.set(Math.cos(a) * r, 1.6, Math.sin(a) * r); g.add(s); }
      g.position.set(x, 0, z); scene.add(g); this.fx.push({ m: g, life: 0.9 }); puffAt(x, 1, z, [0x111827, 0x7f1d1d], 16);
    },
    fxTick(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.life -= dt;
        if (f.k) { f.k.t = Math.min(f.k.T, f.k.t + dt); const q = f.k.T ? f.k.t / f.k.T : 1; f.m.position.set(f.k.x0 + (f.k.x1 - f.k.x0) * q, 3, f.k.z0 + (f.k.z1 - f.k.z0) * q); f.m.rotation.x -= dt * 18; }
        if (f.life <= 0) { scene.remove(f.m); this.fx.splice(i, 1); }
      }
    },
    // the killer's weapon (and a bigger, red-glowing killer); arms up when swinging
    pose() {
      const g = this.g, k = g && g.ph === 'play' ? g.k : null;
      const all = [[me, myPeer()]].concat([...Net.avatars].map(([id, a]) => [a, id]), [...this.botAv].map(([id, a]) => [a, id]));
      for (const [a, id] of all) {
        if (!a) continue;
        const isK = id === k, ki = isK ? (g.ch || {})[id] | 0 : -1;
        let h = this.held.get(id);
        if (!h || h.a !== a || h.k !== ki) { if (h && h.m && h.m.parent) h.m.parent.remove(h.m); h = { a, k: ki, m: isK ? weapon(ki) : null }; if (h.m) { h.m.rotation.x = -Math.PI / 2 + 0.5; h.m.position.set(0, -1.9, 0); a.armR.add(h.m); } this.held.set(id, h); }
        a.g.scale.setScalar(isK ? 1.15 : 1);
        if (isK && id === myPeer() && this.swingT > 0) a.armR.rotation.x = 2.6 - (1 - this.swingT / 0.3) * 2.6;
        if (isK && g.st > (g.el || 0) && !a.dead) { a.armL.rotation.x = a.armR.rotation.x = -0.4; }
      }
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const g = this.g, C = this.myChar(); if (!g || g.ph !== 'play' || !C) return '';
      const killer = this.amKiller(); if (!killer && !this.alive()) return '';
      const cd = (k) => (this.cd[k] > 0 ? `${Math.ceil(this.cd[k])}s` : 'ready');
      return `${killer ? (touchy ? '🔪 tap to swing · ' : '🔪 click to swing · ') : '⚙️ E at a generator · '}Q ${C.q.e} ${esc(C.q.n)} (${cd('q')}) · F ${C.f.e} ${esc(C.f.n)} (${cd('f')})`;
    },
    coinShop: [
      { id: 'ch_chance', e: '🎲', n: 'Chance (survivor)', d: 'Flip a coin for charges, then shoot the killer to stun them', price: 250, kind: 'pass' },
      { id: 'ch_knight', e: '🗡️', n: 'Sword Knight (survivor)', d: 'Slash to stun the killer, and fried chicken to heal', price: 300, kind: 'pass' },
      { id: 'ch_007', e: '🕶️', n: '007n7 (survivor)', d: 'A clone to fool the killer, and a cloak to vanish', price: 300, kind: 'pass' },
      { id: 'ch_builder', e: '🔧', n: 'Builder (survivor)', d: 'A sentry that slows the killer and a dispenser that heals', price: 350, kind: 'pass' },
      { id: 'kl_john', e: '👤', n: 'John Doe (killer)', d: 'Corrupt Energy spikes and the Digital Footprint', price: 400, kind: 'pass' },
      { id: 'kl_1x', e: '🟩', n: '1x1x1x1 (killer)', d: 'Throw infected swords; the Unstable Eye sees all', price: 450, kind: 'pass' },
      { id: 'kperk', e: '🩸', n: 'Killer Perk', d: 'Build up malice twice as fast (be the killer more often), for good', price: 500, kind: 'pass', toggle: true },
      { id: 'medkit', e: '🩹', n: 'Medkits', d: '2 medkits: heal 40 as a survivor (🩹 on your bar, or C)', price: 30, kind: 'use', pack: 2 },
    ],
    shopUse(id) { if (id !== 'medkit' || !this.alive()) return false; this.report('med'); sfx('heal'); return true; },
    onBuy() { this.sendPick(); this.barHtml = null; },
    onToggle() { this.sendPick(); },
  };
  addExp(FK);
  window.__rbFK = FK;
})();
