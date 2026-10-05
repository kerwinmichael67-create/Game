// Server-authoritative real-time games. Each game exposes:
//   tickMs, init() -> state, input(state, playerIdx, input), tick(state) -> null | {winner: 0|1|-1, reason}
const rnd = (n) => Math.floor(Math.random() * n);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------- SNAKE PvP
// 90 second round. Dying respawns you small after a short delay. Longest snake at the end wins.
const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const OPP = { U: 'D', D: 'U', L: 'R', R: 'L' };

function makeSnake(x, y, dir) {
  const [dx, dy] = DIRS[dir];
  return { body: [[x, y], [x - dx, y - dy], [x - 2 * dx, y - 2 * dy]], dir, queue: [], grow: 0, alive: true, respawn: 0, best: 3, deaths: 0 };
}
function occupied(s, x, y) {
  return s.snakes.some((sn) => sn.body.some((p) => p[0] === x && p[1] === y)) || s.food.some((f) => f[0] === x && f[1] === y);
}
function addFood(s, x, y) {
  if (s.food.length >= 40) return;
  if (x === undefined) {
    for (let tries = 0; tries < 200; tries++) {
      x = rnd(s.W); y = rnd(s.H);
      if (!occupied(s, x, y)) break;
    }
  }
  s.food.push([x, y, Math.random() < 0.1 ? 1 : 0]);
}

const snake = {
  tickMs: 100,
  init() {
    const s = { W: 40, H: 28, ticks: 900, snakes: [makeSnake(6, 8, 'R'), makeSnake(33, 19, 'L')], food: [] };
    for (let i = 0; i < 6; i++) addFood(s);
    return s;
  },
  input(s, i, inp) {
    const sn = s.snakes[i], d = inp && inp.dir;
    if (!sn.alive || !DIRS[d]) return;
    const last = sn.queue.length ? sn.queue[sn.queue.length - 1] : sn.dir;
    if (d === last || OPP[d] === last || sn.queue.length >= 3) return;
    sn.queue.push(d);
  },
  tick(s) {
    s.ticks--;
    for (const sn of s.snakes) {
      if (!sn.alive) {
        if (--sn.respawn <= 0) respawnSnake(s, sn);
        continue;
      }
      if (sn.queue.length) sn.dir = sn.queue.shift();
      const [dx, dy] = DIRS[sn.dir];
      const h = sn.body[0], nh = [h[0] + dx, h[1] + dy];
      sn.body.unshift(nh);
      const fi = s.food.findIndex((f) => f[0] === nh[0] && f[1] === nh[1]);
      if (fi >= 0) {
        sn.grow += s.food[fi][2] ? 3 : 1;
        s.food.splice(fi, 1);
        addFood(s);
      }
      if (sn.grow > 0) sn.grow--;
      else sn.body.pop();
    }
    const dead = s.snakes.map((sn, i) => {
      if (!sn.alive) return false;
      const h = sn.body[0];
      if (h[0] < 0 || h[1] < 0 || h[0] >= s.W || h[1] >= s.H) return true;
      return s.snakes.some((o, j) => o.alive && o.body.some((p, k) => !(i === j && k === 0) && p[0] === h[0] && p[1] === h[1]));
    });
    s.snakes.forEach((sn, i) => {
      if (dead[i]) {
        const body = sn.body.slice(1);
        sn.alive = false; sn.respawn = 15; sn.deaths++; sn.body = []; sn.queue = [];
        body.forEach((p, k) => { if (k % 3 === 0 && p[0] >= 0 && p[1] >= 0 && p[0] < s.W && p[1] < s.H) addFood(s, p[0], p[1]); });
      } else if (sn.alive) sn.best = Math.max(sn.best, sn.body.length);
    });
    if (s.ticks > 0) return null;
    const [a, b] = s.snakes.map((sn) => sn.body.length);
    if (a === b) return { winner: -1, reason: `tied at length ${a}` };
    return { winner: a > b ? 0 : 1, reason: `longest snake (${Math.max(a, b)} vs ${Math.min(a, b)})` };
  },
};
function respawnSnake(s, sn) {
  for (let tries = 0; tries < 200; tries++) {
    const x = 5 + rnd(s.W - 10), y = 3 + rnd(s.H - 6), dir = x < s.W / 2 ? 'R' : 'L';
    const cand = makeSnake(x, y, dir);
    if (cand.body.some((p) => occupied(s, p[0], p[1]))) continue;
    Object.assign(sn, cand, { best: sn.best, deaths: sn.deaths });
    return;
  }
  sn.respawn = 5;
}

// ---------------------------------------------------------------- PONG
const pong = {
  tickMs: 20,
  init() {
    return { W: 800, H: 500, ph: 90, p: [{ y: 205, up: false, down: false }, { y: 205, up: false, down: false }], ball: { x: 400, y: 250, vx: 0, vy: 0 }, score: [0, 0], serve: 75, server: rnd(2), to: 7 };
  },
  input(s, i, inp) {
    s.p[i].up = !!(inp && inp.up);
    s.p[i].down = !!(inp && inp.down);
  },
  tick(s) {
    for (const p of s.p) p.y = clamp(p.y + (p.down ? 9 : 0) - (p.up ? 9 : 0), 0, s.H - s.ph);
    const b = s.ball;
    if (s.serve > 0) {
      s.serve--;
      b.x = s.W / 2; b.y = s.H / 2;
      if (s.serve === 0) { b.vx = s.server === 0 ? 6 : -6; b.vy = Math.random() * 6 - 3; }
      return null;
    }
    b.x += b.vx; b.y += b.vy;
    if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); }
    if (b.y > s.H - 8) { b.y = s.H - 8; b.vy = -Math.abs(b.vy); }
    const hit = (py) => b.y > py - 8 && b.y < py + s.ph + 8;
    if (b.vx < 0 && b.x - 8 <= 42 && b.x > 20 && hit(s.p[0].y)) {
      b.x = 50; b.vx = Math.min(-b.vx * 1.06, 17); b.vy = clamp(b.vy + (b.y - (s.p[0].y + s.ph / 2)) * 0.12, -11, 11);
    }
    if (b.vx > 0 && b.x + 8 >= s.W - 42 && b.x < s.W - 20 && hit(s.p[1].y)) {
      b.x = s.W - 50; b.vx = -Math.min(b.vx * 1.06, 17); b.vy = clamp(b.vy + (b.y - (s.p[1].y + s.ph / 2)) * 0.12, -11, 11);
    }
    if (b.x < -10 || b.x > s.W + 10) {
      const scorer = b.x < 0 ? 1 : 0;
      s.score[scorer]++;
      s.server = 1 - scorer;
      s.serve = 60; b.vx = 0; b.vy = 0;
      if (s.score[scorer] >= s.to) return { winner: scorer, reason: `${s.score[0]} - ${s.score[1]}` };
    }
    return null;
  },
};

// ---------------------------------------------------------------- STREET FIGHTER style brawler
// Best of 3 rounds, 60 seconds each. Punch, kick, block, jump and a fireball special that costs energy.
const GROUND = 400;
const ATTACKS = {
  punch: { dur: 16, a0: 4, a1: 8, range: 78, dmg: 6, kb: 4, stun: 14 },
  kick: { dur: 24, a0: 8, a1: 13, range: 102, dmg: 10, kb: 8, stun: 20 },
  special: { dur: 26 },
};
function makeFighter(x, face) {
  return { x, y: GROUND, vx: 0, vy: 0, face, hp: 100, en: 20, act: 'idle', t: 0, hitDone: false, stun: 0, block: false, flash: 0, in: {}, prev: {} };
}
function damage(s, o, attacker, dmg, kb, stun) {
  const facingAttacker = o.face * (attacker.x - o.x) > 0;
  if (o.block && facingAttacker) {
    o.hp -= dmg * 0.2;
    o.vx = kb * 0.6;
    o.flash = 3;
  } else {
    o.hp -= dmg;
    o.stun = stun;
    o.act = 'hurt';
    o.t = 0;
    o.block = false;
    o.vx = kb;
    if (o.y < GROUND) o.vy = -5;
    o.en = Math.min(100, o.en + 6);
    o.flash = 8;
  }
  o.hp = Math.max(0, Math.round(o.hp * 10) / 10);
}
const fighter = {
  tickMs: 20,
  init() {
    const s = { W: 900, G: GROUND, f: [], proj: [], round: 0, wins: [0, 0], timer: 0, phase: 'intro', pause: 0, msg: '' };
    startRound(s);
    return s;
  },
  input(s, i, inp) {
    inp = inp || {};
    s.f[i].in = { l: !!inp.l, r: !!inp.r, u: !!inp.u, d: !!inp.d, p: !!inp.p, k: !!inp.k, s: !!inp.s };
  },
  tick(s) {
    const [f0, f1] = s.f;
    if (s.phase === 'intro') {
      s.pause--;
      if (s.pause === 35) s.msg = 'FIGHT!';
      if (s.pause <= 0) { s.phase = 'fight'; s.msg = ''; }
    } else if (s.phase === 'fight') {
      s.timer--;
      s.f.forEach((f, i) => updateFighter(s, f, s.f[1 - i], i));
      updateProjectiles(s);
      if (f0.hp <= 0 || f1.hp <= 0 || s.timer <= 0) {
        const ko = f0.hp <= 0 || f1.hp <= 0;
        let w = -1;
        if (f0.hp !== f1.hp) w = f0.hp > f1.hp ? 0 : 1;
        if (w >= 0) s.wins[w]++;
        s.f.forEach((f) => { if (f.hp <= 0) f.act = 'ko'; });
        s.msg = ko ? 'K.O.!' : w < 0 ? 'DRAW' : 'TIME!';
        s.roundWinner = w;
        s.phase = 'ko'; s.pause = 120; s.proj = [];
      }
    } else if (s.phase === 'ko') {
      s.pause--;
      if (s.pause === 60 && s.roundWinner >= 0) s.msg = `P${s.roundWinner + 1} WINS ROUND`;
      if (s.pause <= 0) {
        if (s.wins[0] >= 2 || s.wins[1] >= 2 || s.round >= 5) {
          if (s.wins[0] === s.wins[1]) return { winner: -1, reason: `${s.wins[0]} - ${s.wins[1]} in rounds` };
          const w = s.wins[0] > s.wins[1] ? 0 : 1;
          return { winner: w, reason: `${s.wins[w]} - ${s.wins[1 - w]} in rounds` };
        }
        startRound(s);
      }
    }
    for (const f of s.f) physics(s, f);
    // keep the fighters from overlapping
    const dx = f1.x - f0.x;
    if (Math.abs(dx) < 52 && Math.abs(f0.y - f1.y) < 90) {
      const push = (52 - Math.abs(dx)) / 2, sg = dx >= 0 ? 1 : -1;
      f0.x = clamp(f0.x - push * sg, 30, s.W - 30);
      f1.x = clamp(f1.x + push * sg, 30, s.W - 30);
    }
    return null;
  },
};
function startRound(s) {
  s.round++;
  s.f = [makeFighter(260, 1), makeFighter(640, -1)];
  s.proj = [];
  s.timer = 60 * 50;
  s.phase = 'intro'; s.pause = 100; s.msg = `ROUND ${s.round}`;
}
function updateFighter(s, f, o, i) {
  const inp = f.in || {}, pr = f.prev || {};
  const pressed = (k) => inp[k] && !pr[k];
  f.prev = Object.assign({}, inp);
  const onGround = f.y >= GROUND;
  f.en = Math.min(100, f.en + 0.04);
  if (f.flash > 0) f.flash--;
  if (f.stun > 0) {
    f.stun--;
    if (f.stun === 0) f.act = 'idle';
    return;
  }
  const atk = ATTACKS[f.act];
  if (atk) {
    f.t++;
    if (f.act === 'special' && f.t === 10) {
      s.proj.push({ x: f.x + f.face * 55, y: f.y - 75, vx: f.face * 11, owner: i });
    } else if (f.act !== 'special' && !f.hitDone && f.t >= atk.a0 && f.t <= atk.a1) {
      const reach = (o.x - f.x) * f.face;
      if (reach > 0 && reach < atk.range && Math.abs(o.y - f.y) < 100) {
        f.hitDone = true;
        damage(s, o, f, atk.dmg * (onGround ? 1 : 1.2), atk.kb * f.face, atk.stun);
        f.en = Math.min(100, f.en + 10);
      }
    }
    if (f.t >= atk.dur) { f.act = onGround ? 'idle' : 'jump'; f.t = 0; }
    return;
  }
  const start = (act) => { f.act = act; f.t = 0; f.hitDone = false; f.block = false; if (onGround) f.vx = 0; };
  f.block = !!inp.d && onGround;
  if (pressed('p')) return start('punch');
  if (pressed('k')) return start('kick');
  if (pressed('s') && f.en >= 50 && onGround) { f.en -= 50; return start('special'); }
  if (onGround) f.face = o.x > f.x ? 1 : -1;
  if (f.block) { f.act = 'block'; return; }
  if (onGround) {
    f.vx = ((inp.r ? 1 : 0) - (inp.l ? 1 : 0)) * 5;
    if (inp.u) { f.vy = -17; f.act = 'jump'; return; }
    f.act = f.vx ? 'walk' : 'idle';
  } else f.act = 'jump';
}
function physics(s, f) {
  f.x = clamp(f.x + f.vx, 30, s.W - 30);
  f.vy += 0.9;
  f.y += f.vy;
  if (f.y >= GROUND) {
    f.y = GROUND; f.vy = 0;
    if (f.act !== 'walk') f.vx *= 0.75;
    if (f.act === 'jump') f.act = 'idle';
  }
}
function updateProjectiles(s) {
  for (const p of s.proj) {
    p.x += p.vx;
    const o = s.f[1 - p.owner];
    if (!p.dead && Math.abs(p.x - o.x) < 34 && p.y > o.y - 130 && p.y < o.y + 5) {
      p.dead = true;
      damage(s, o, s.f[p.owner], 14, Math.sign(p.vx) * 7, 22);
    }
  }
  const [a, b] = [s.proj.find((p) => p.owner === 0 && !p.dead), s.proj.find((p) => p.owner === 1 && !p.dead)];
  if (a && b && Math.abs(a.x - b.x) < 24) a.dead = b.dead = true;
  s.proj = s.proj.filter((p) => !p.dead && p.x > -40 && p.x < s.W + 40);
}

// ---------------------------------------------------------------- LIGHT CYCLES (Tron)
// Leave a wall behind you; crashing into any wall ends the round. First to 3 rounds.
// The grid travels as a string ('0' empty, '1'/'2' trails) so it stays small enough to stream.
function tronRound(s) {
  s.grid = '0'.repeat(s.W * s.H);
  s.p = [
    { x: 10, y: Math.floor(s.H / 2), dir: 'R', queue: [], alive: true },
    { x: s.W - 11, y: Math.floor(s.H / 2), dir: 'L', queue: [], alive: true },
  ];
  s.p.forEach((p, i) => { s.grid = setCell(s.grid, p.y * s.W + p.x, String(i + 1)); });
  s.pause = 45;
  s.msg = `ROUND ${s.wins[0] + s.wins[1] + s.draws + 1}`;
}
const setCell = (g, i, ch) => g.slice(0, i) + ch + g.slice(i + 1);
const tron = {
  tickMs: 70,
  init() {
    const s = { W: 56, H: 36, wins: [0, 0], draws: 0, to: 3, grid: '', p: [], pause: 0, msg: '', crash: null };
    tronRound(s);
    return s;
  },
  input(s, i, inp) {
    const p = s.p[i], d = inp && inp.dir;
    if (!p.alive || !DIRS[d]) return;
    const last = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
    if (d === last || OPP[d] === last || p.queue.length >= 3) return;
    p.queue.push(d);
  },
  tick(s) {
    if (s.pause > 0) {
      s.pause--;
      if (s.pause === 15) s.msg = 'GO!';
      if (s.pause === 0) {
        s.msg = '';
        if (s.crash) {
          s.crash = null;
          if (s.wins[0] >= s.to || s.wins[1] >= s.to) return { winner: s.wins[0] > s.wins[1] ? 0 : 1, reason: `${Math.max(...s.wins)} - ${Math.min(...s.wins)} in rounds` };
          if (s.wins[0] + s.wins[1] + s.draws >= 9) return { winner: s.wins[0] === s.wins[1] ? -1 : s.wins[0] > s.wins[1] ? 0 : 1, reason: `${s.wins[0]} - ${s.wins[1]} in rounds` };
          tronRound(s);
        }
      }
      return null;
    }
    const next = s.p.map((p) => {
      if (p.queue.length) p.dir = p.queue.shift();
      const [dx, dy] = DIRS[p.dir];
      return { x: p.x + dx, y: p.y + dy };
    });
    const dead = next.map((n) => n.x < 0 || n.y < 0 || n.x >= s.W || n.y >= s.H || s.grid[n.y * s.W + n.x] !== '0');
    if (next[0].x === next[1].x && next[0].y === next[1].y) dead[0] = dead[1] = true; // head-on
    s.p.forEach((p, i) => {
      if (dead[i]) { p.alive = false; return; }
      p.x = next[i].x; p.y = next[i].y;
      s.grid = setCell(s.grid, p.y * s.W + p.x, String(i + 1));
    });
    if (dead[0] || dead[1]) {
      if (dead[0] && dead[1]) { s.draws++; s.msg = 'BOTH CRASHED'; }
      else { const w = dead[0] ? 1 : 0; s.wins[w]++; s.msg = `P${w + 1} SCORES`; }
      s.crash = true;
      s.pause = 40;
    }
    return null;
  },
};

// ---------------------------------------------------------------- AIR HOCKEY
// Each player steers a mallet in their own half (point at a spot, or use the keys). First to 7.
const HOCKEY = { W: 800, H: 480, goal: 150, mallet: 30, puckR: 18, speed: 13 };
function hockeyServe(s, toward) {
  s.puck = { x: s.W / 2, y: s.H / 2, vx: 0, vy: 0 };
  s.serve = 50;
  s.toward = toward;
}
const hockey = {
  tickMs: 20,
  init() {
    const s = Object.assign({}, HOCKEY, {
      m: [{ x: 120, y: HOCKEY.H / 2, vx: 0, vy: 0, tx: 120, ty: HOCKEY.H / 2 }, { x: HOCKEY.W - 120, y: HOCKEY.H / 2, vx: 0, vy: 0, tx: HOCKEY.W - 120, ty: HOCKEY.H / 2 }],
      score: [0, 0], to: 7, puck: null, serve: 0, toward: 0,
    });
    hockeyServe(s, Math.random() < 0.5 ? 0 : 1);
    return s;
  },
  input(s, i, inp) {
    if (!inp) return;
    const m = s.m[i];
    if (typeof inp.tx === 'number' && typeof inp.ty === 'number') { m.tx = inp.tx; m.ty = inp.ty; m.keys = null; }
    else m.keys = { x: (inp.right ? 1 : 0) - (inp.left ? 1 : 0), y: (inp.down ? 1 : 0) - (inp.up ? 1 : 0) };
  },
  tick(s) {
    s.m.forEach((m, i) => {
      if (m.keys) { m.tx = m.x + m.keys.x * 40; m.ty = m.y + m.keys.y * 40; }
      const minX = i === 0 ? s.mallet : s.W / 2 + s.mallet, maxX = i === 0 ? s.W / 2 - s.mallet : s.W - s.mallet;
      const tx = clamp(m.tx, minX, maxX), ty = clamp(m.ty, s.mallet, s.H - s.mallet);
      let dx = tx - m.x, dy = ty - m.y;
      const d = Math.hypot(dx, dy);
      if (d > s.speed) { dx = (dx / d) * s.speed; dy = (dy / d) * s.speed; }
      m.vx = dx; m.vy = dy; m.x += dx; m.y += dy;
    });
    const p = s.puck;
    if (s.serve > 0) {
      s.serve--;
      if (s.serve === 0) { p.vx = s.toward === 0 ? -4 : 4; p.vy = Math.random() * 4 - 2; }
    }
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.996; p.vy *= 0.996;
    // a puck left sitting still for 4 seconds goes to the other player
    s.still = s.serve === 0 && Math.hypot(p.vx, p.vy) < 0.2 ? (s.still || 0) + 1 : 0;
    if (s.still > 200) { s.still = 0; hockeyServe(s, p.x < s.W / 2 ? 1 : 0); return null; }
    const r = HOCKEY.puckR;
    if (p.y < r) { p.y = r; p.vy = Math.abs(p.vy); }
    if (p.y > s.H - r) { p.y = s.H - r; p.vy = -Math.abs(p.vy); }
    const inGoal = Math.abs(p.y - s.H / 2) < s.goal / 2;
    if (p.x < r && !inGoal) { p.x = r; p.vx = Math.abs(p.vx); }
    if (p.x > s.W - r && !inGoal) { p.x = s.W - r; p.vx = -Math.abs(p.vx); }
    if (p.x < -r || p.x > s.W + r) {
      const scorer = p.x < 0 ? 1 : 0;
      s.score[scorer]++;
      if (s.score[scorer] >= s.to) return { winner: scorer, reason: `${s.score[0]} - ${s.score[1]}` };
      hockeyServe(s, 1 - scorer);
      return null;
    }
    for (const m of s.m) {
      const dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy), min = s.mallet + r;
      if (dist < min && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        p.x = m.x + nx * min; p.y = m.y + ny * min;
        const rel = (p.vx - m.vx) * nx + (p.vy - m.vy) * ny;
        if (rel < 0) { p.vx -= 1.9 * rel * nx; p.vy -= 1.9 * rel * ny; }
        p.vx += m.vx * 0.5; p.vy += m.vy * 0.5;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 22) { p.vx *= 22 / sp; p.vy *= 22 / sp; }
      }
    }
    return null;
  },
};

const Realtime = { snake, pong, fighter, tron, hockey };
if (typeof module !== 'undefined' && module.exports) module.exports = Realtime;
else globalThis.Realtime = Realtime;
