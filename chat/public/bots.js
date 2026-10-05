// Computer opponents. A bot game runs entirely in this browser with the same rules (shared/rules.js)
// and simulations (realtime.js) the server uses; the bot is always player 1.
(() => {
  const LEVELS = {
    easy: { label: 'Easy', blunder: 0.45, think: 900 },
    medium: { label: 'Medium', blunder: 0.12, think: 650 },
    hard: { label: 'Hard', blunder: 0, think: 450 },
  };
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function bestOf(items, score) {
    let best = -Infinity, out = [];
    for (const it of items) {
      const v = score(it);
      if (v > best) { best = v; out = [it]; } else if (v === best) out.push(it);
    }
    return pick(out);
  }

  // ---------------------------------------------------------------- tic-tac-toe: perfect minimax
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function tttWinner(c) {
    for (const [a, b, d] of LINES) if (c[a] >= 0 && c[a] === c[b] && c[a] === c[d]) return c[a];
    return c.every((v) => v >= 0) ? -1 : null;
  }
  function tttScore(c, turn, me, depth) {
    const w = tttWinner(c);
    if (w === me) return 10 - depth;
    if (w === 1 - me) return depth - 10;
    if (w === -1) return 0;
    let best = turn === me ? -99 : 99;
    for (let i = 0; i < 9; i++) {
      if (c[i] !== -1) continue;
      c[i] = turn;
      const v = tttScore(c, 1 - turn, me, depth + 1);
      c[i] = -1;
      best = turn === me ? Math.max(best, v) : Math.min(best, v);
    }
    return best;
  }
  function tictactoeMove(s, me, lv) {
    const open = s.cells.map((v, i) => (v === -1 ? i : -1)).filter((i) => i >= 0);
    if (Math.random() < lv.blunder) return { cell: pick(open) };
    const c = s.cells.slice();
    return { cell: bestOf(open, (i) => { c[i] = me; const v = tttScore(c, 1 - me, me, 1); c[i] = -1; return v; }) };
  }

  // ---------------------------------------------------------------- connect four: alpha-beta search
  const C4_ORDER = [3, 2, 4, 1, 5, 0, 6];
  const C4_DEPTH = { easy: 2, medium: 4, hard: 7 };
  function c4Drop(g, col, p) {
    for (let r = 5; r >= 0; r--) if (g[r * 7 + col] === -1) { g[r * 7 + col] = p; return r * 7 + col; }
    return -1;
  }
  function c4Wins(g, i, p) {
    const r = Math.floor(i / 7), c = i % 7;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let n = 1;
      for (const sg of [1, -1]) {
        let rr = r + dr * sg, cc = c + dc * sg;
        while (rr >= 0 && rr < 6 && cc >= 0 && cc < 7 && g[rr * 7 + cc] === p) { n++; rr += dr * sg; cc += dc * sg; }
      }
      if (n >= 4) return true;
    }
    return false;
  }
  function c4Eval(g, p) {
    const o = 1 - p;
    let score = 0;
    for (let r = 0; r < 6; r++) score += (g[r * 7 + 3] === p ? 3 : 0) - (g[r * 7 + 3] === o ? 3 : 0);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const er = r + dr * 3, ec = c + dc * 3;
        if (er < 0 || er > 5 || ec < 0 || ec > 6) continue;
        let mine = 0, theirs = 0;
        for (let k = 0; k < 4; k++) { const v = g[(r + dr * k) * 7 + c + dc * k]; if (v === p) mine++; else if (v === o) theirs++; }
        if (mine && theirs) continue;
        if (mine === 3) score += 5; else if (mine === 2) score += 2;
        if (theirs === 3) score -= 4; else if (theirs === 2) score -= 1;
      }
    }
    return score;
  }
  function c4Search(g, depth, a, b, p) {
    let best = -Infinity, any = false;
    for (const col of C4_ORDER) {
      if (g[col] !== -1) continue;
      any = true;
      const i = c4Drop(g, col, p);
      let v;
      if (c4Wins(g, i, p)) v = 100000 + depth;
      else if (depth <= 1) v = c4Eval(g, p);
      else v = -c4Search(g, depth - 1, -b, -a, 1 - p);
      g[i] = -1;
      if (v > best) best = v;
      if (best > a) a = best;
      if (a >= b) break;
    }
    return any ? best : 0;
  }
  function connect4Move(s, me, lv, level) {
    const cols = [0, 1, 2, 3, 4, 5, 6].filter((c) => s.grid[c] === -1);
    if (Math.random() < lv.blunder) return { col: pick(cols) };
    const g = s.grid.slice(), depth = C4_DEPTH[level];
    return {
      col: bestOf(cols, (col) => {
        const i = c4Drop(g, col, me);
        const v = c4Wins(g, i, me) ? 1e6 : depth <= 1 ? c4Eval(g, me) : -c4Search(g, depth - 1, -Infinity, Infinity, 1 - me);
        g[i] = -1;
        return v;
      }),
    };
  }

  // ---------------------------------------------------------------- checkers: minimax (jump chains keep the turn)
  const CK_DEPTH = { easy: 1, medium: 3, hard: 6 };
  function ckApply(s, m) {
    const b = s.board.slice();
    let p = b[m.from];
    b[m.from] = '';
    if (m.cap !== undefined) b[m.cap] = '';
    const row = m.to >> 3;
    let crowned = false;
    if (p === 'r' && row === 0) { p = 'R'; crowned = true; }
    if (p === 'b' && row === 7) { p = 'B'; crowned = true; }
    b[m.to] = p;
    if (m.cap !== undefined && !crowned && Rules.checkers.legal({ board: b, turn: s.turn, chain: m.to, result: null }).length) {
      return { board: b, turn: s.turn, chain: m.to, result: null };
    }
    return { board: b, turn: 1 - s.turn, chain: -1, result: null };
  }
  function ckEval(b, me) {
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p) continue;
      const owner = p.toLowerCase() === 'r' ? 0 : 1, king = p === p.toUpperCase();
      const adv = owner === 0 ? 7 - (i >> 3) : i >> 3;
      const val = king ? 165 : 100 + adv * 3;
      v += owner === me ? val : -val;
    }
    return v;
  }
  function ckSearch(s, depth, a, b, me) {
    const moves = Rules.checkers.legal(s);
    if (!moves.length) return s.turn === me ? -10000 - depth : 10000 + depth;
    if (depth <= 0) return ckEval(s.board, me);
    if (s.turn === me) {
      let v = -Infinity;
      for (const m of moves) { v = Math.max(v, ckSearch(ckApply(s, m), depth - 1, a, b, me)); a = Math.max(a, v); if (a >= b) break; }
      return v;
    }
    let v = Infinity;
    for (const m of moves) { v = Math.min(v, ckSearch(ckApply(s, m), depth - 1, a, b, me)); b = Math.min(b, v); if (a >= b) break; }
    return v;
  }
  function checkersMove(s, me, lv, level) {
    const moves = Rules.checkers.legal(s);
    if (Math.random() < lv.blunder) return pick(moves);
    return bestOf(moves, (m) => ckSearch(ckApply(s, m), CK_DEPTH[level] - 1, -Infinity, Infinity, me));
  }

  // ---------------------------------------------------------------- chess: alpha-beta on material + position
  const CH_DEPTH = { easy: 1, medium: 2, hard: 3 };
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  function chEval(s) {
    // from the side to move's point of view
    const me = s.turn === 0 ? 'w' : 'b';
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const p = s.board[i];
      if (!p) continue;
      const t = p.toLowerCase(), white = p !== t, r = i >> 3, c = i & 7;
      let x = VAL[t];
      const centre = 3.5 - Math.max(Math.abs(3.5 - r), Math.abs(3.5 - c));
      if (t === 'p') x += (white ? 6 - r : r - 1) * 6 + (c >= 2 && c <= 5 ? 4 : 0);
      else if (t === 'n' || t === 'b') x += centre * 8;
      else if (t === 'q') x += centre * 2;
      v += (white ? 'w' : 'b') === me ? x : -x;
    }
    return v;
  }
  function chOrder(s, moves) {
    const gain = (m) => (s.board[m.to] ? VAL[s.board[m.to].toLowerCase()] * 10 - VAL[s.board[m.from].toLowerCase()] : 0) + (m.promo === 'q' ? 800 : 0);
    return moves.sort((a, b) => gain(b) - gain(a));
  }
  function chSearch(s, depth, a, b) {
    if (depth === 0) return chEval(s);
    const moves = Rules.chess.legal(s);
    if (!moves.length) return Rules.chess.inCheck(s) ? -100000 - depth : 0;
    let best = -Infinity;
    for (const m of chOrder(s, moves)) {
      const v = -chSearch(Rules.chess.apply(s, m), depth - 1, -b, -a);
      if (v > best) best = v;
      if (best > a) a = best;
      if (a >= b) break;
    }
    return best;
  }
  function chessMove(s, me, lv, level) {
    const moves = chOrder(s, Rules.chess.legal(s));
    const depth = CH_DEPTH[level];
    const noise = level === 'easy' ? 120 : level === 'medium' ? 25 : 0;
    const m = bestOf(moves, (mv) => -chSearch(Rules.chess.apply(s, mv), depth - 1, -Infinity, Infinity) + Math.random() * noise);
    return { from: m.from, to: m.to, promo: m.promo };
  }

  const TURN_BOTS = { tictactoe: tictactoeMove, connect4: connect4Move, checkers: checkersMove, chess: chessMove };

  // ---------------------------------------------------------------- snake: chase food, keep room to move
  const SDIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const SOPP = { U: 'D', D: 'U', L: 'R', R: 'L' };
  function snakeBot(level) {
    let tick = 0;
    return (s, me) => {
      const sn = s.snakes[me];
      if (!sn.alive || !sn.body.length) return null;
      tick++;
      if (level === 'easy' && tick % 2) return null; // slower reactions
      const W = s.W, H = s.H, blocked = new Uint8Array(W * H);
      for (const o of s.snakes) for (const [x, y] of o.body) if (x >= 0 && y >= 0 && x < W && y < H) blocked[y * W + x] = 1;
      const other = s.snakes[1 - me];
      if (level === 'hard' && other.alive && other.body.length) {
        // stay out of the cells the other head could move into
        const [ox, oy] = other.body[0];
        for (const [dx, dy] of Object.values(SDIRS)) { const x = ox + dx, y = oy + dy; if (x >= 0 && y >= 0 && x < W && y < H) blocked[y * W + x] = 2; }
      }
      const [hx, hy] = sn.body[0];
      const food = new Set(s.food.map(([x, y]) => y * W + x));
      const options = Object.keys(SDIRS).filter((d) => d !== SOPP[sn.dir]).map((d) => {
        const x = hx + SDIRS[d][0], y = hy + SDIRS[d][1];
        if (x < 0 || y < 0 || x >= W || y >= H || blocked[y * W + x] === 1) return null;
        // flood fill (room) and BFS distance to the nearest food from the next cell
        const seen = new Uint8Array(W * H), q = [y * W + x];
        seen[y * W + x] = 1;
        let room = 0, dist = 999, head = 0;
        const depth = new Map([[y * W + x, 0]]);
        while (head < q.length && room < 300) {
          const cell = q[head++];
          room++;
          const dd = depth.get(cell);
          if (food.has(cell) && dd < dist) dist = dd;
          const cx = cell % W, cy = (cell / W) | 0;
          for (const [dx, dy] of Object.values(SDIRS)) {
            const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[n] || blocked[n] === 1) continue;
            seen[n] = 1;
            depth.set(n, dd + 1);
            q.push(n);
          }
        }
        return { d, room, dist, risky: blocked[y * W + x] === 2 };
      }).filter(Boolean);
      if (!options.length) return null;
      if (level === 'easy' && Math.random() < 0.08) return pick(options).d;
      const need = Math.min(sn.body.length + 4, 300);
      return bestOf(options, (o) => (o.room >= need ? 10000 : o.room * 10) - (o.risky ? 5000 : 0) - o.dist * 10).d;
    };
  }

  // ---------------------------------------------------------------- pong: predict where the ball arrives
  function pongBot(level) {
    const cfg = { easy: { err: 70, every: 4, dz: 22 }, medium: { err: 30, every: 2, dz: 12 }, hard: { err: 6, every: 1, dz: 6 } }[level];
    let tick = 0, offset = 0, lastDir = 0, held = { up: false, down: false };
    return (s, me) => {
      if (++tick % cfg.every) return held;
      const b = s.ball, p = s.p[me], x = me === 1 ? s.W - 42 : 42;
      const dir = Math.sign(b.vx);
      if (dir !== lastDir) { lastDir = dir; offset = (Math.random() * 2 - 1) * cfg.err; }
      let target = s.H / 2;
      const coming = me === 1 ? b.vx > 0 : b.vx < 0;
      if (coming && b.vx) {
        const t = (x - b.x) / b.vx, span = s.H - 16, period = span * 2;
        let y = (((b.y - 8 + b.vy * t) % period) + period) % period;
        if (y > span) y = period - y;
        target = y + 8 + offset;
      } else if (level === 'easy') target = b.y;
      const centre = p.y + s.ph / 2;
      held = { up: centre > target + cfg.dz, down: centre < target - cfg.dz };
      return held;
    };
  }

  // ---------------------------------------------------------------- street fighter: approach, attack, block, dodge
  function fighterBot(level) {
    const cfg = {
      easy: { every: 9, attack: 0.35, block: 0.15, dodge: 0.2, fire: 0.04 },
      medium: { every: 5, attack: 0.6, block: 0.45, dodge: 0.5, fire: 0.08 },
      hard: { every: 2, attack: 0.85, block: 0.8, dodge: 0.85, fire: 0.12 },
    }[level];
    let tick = 0, held = {}, blockFor = 0;
    return (s, me) => {
      tick++;
      held.p = held.k = held.s = held.u = false; // attacks and jumps are taps
      if (s.phase !== 'fight') return (held = {});
      if (blockFor > 0) { blockFor--; return held; }
      if (tick % cfg.every) return held;
      const f = s.f[me], o = s.f[1 - me], dist = Math.abs(o.x - f.x);
      const toward = o.x > f.x ? 'r' : 'l', away = toward === 'r' ? 'l' : 'r';
      held = { l: false, r: false, u: false, d: false, p: false, k: false, s: false };
      const incoming = s.proj.find((p) => p.owner !== me && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(f.x - p.x) < 230);
      if (incoming && Math.random() < cfg.dodge) { held.u = true; held[toward] = true; return held; }
      const opAttacking = (o.act === 'punch' || o.act === 'kick') && o.t < 10;
      if (opAttacking && dist < 130 && Math.random() < cfg.block) { held.d = true; blockFor = 8; return held; }
      if (f.en >= 50 && dist > 260 && Math.random() < cfg.fire * cfg.every) { held.s = true; return held; }
      if (dist > 88) { held[toward] = true; return held; }
      if (Math.random() < cfg.attack) { if (dist > 70 || Math.random() < 0.4) held.k = true; else held.p = true; }
      else if (Math.random() < 0.3) held[away] = true;
      return held;
    };
  }

  // ---------------------------------------------------------------- tetris: its own board, scoring each placement
  const TETRO = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };
  const TKEYS = Object.keys(TETRO);
  const rot = (m) => m[0].map((_, c) => m.map((row) => row[c]).reverse());
  function tetrisBot(level, onGarbage, onDead, onChange) {
    const COLS = 10, ROWS = 20;
    const cfg = { easy: { ms: 1150, sloppy: 0.35 }, medium: { ms: 650, sloppy: 0.08 }, hard: { ms: 330, sloppy: 0 } }[level];
    let board = new Array(COLS * ROWS).fill(0), bag = [], pending = 0, score = 0, lines = 0, sent = 0, dead = false;
    const next = () => { if (!bag.length) bag = TKEYS.slice().sort(() => Math.random() - 0.5); return bag.pop(); };
    const fits = (b, m, px, py) => m.every((row, r) => row.every((v, c) => !v || (px + c >= 0 && px + c < COLS && py + r < ROWS && (py + r < 0 || !b[(py + r) * COLS + px + c]))));
    function features(b) {
      const heights = [];
      let holes = 0;
      for (let c = 0; c < COLS; c++) {
        let h = 0, seen = false;
        for (let r = 0; r < ROWS; r++) {
          if (b[r * COLS + c]) { if (!seen) { h = ROWS - r; seen = true; } } else if (seen) holes++;
        }
        heights.push(h);
      }
      let bump = 0;
      for (let c = 1; c < COLS; c++) bump += Math.abs(heights[c] - heights[c - 1]);
      return { agg: heights.reduce((a, b2) => a + b2, 0), holes, bump, max: Math.max(...heights) };
    }
    function place(b, m, x, y, v) {
      const nb = b.slice();
      m.forEach((row, r) => row.forEach((cell, c) => { if (cell && y + r >= 0) nb[(y + r) * COLS + x + c] = v; }));
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (nb.slice(r * COLS, r * COLS + COLS).every(Boolean)) { nb.splice(r * COLS, COLS); nb.unshift(...new Array(COLS).fill(0)); cleared++; r++; }
      }
      return { b: nb, cleared };
    }
    function step() {
      if (dead) return;
      const type = next(), v = TKEYS.indexOf(type) + 1;
      let m = TETRO[type];
      const spawnX = Math.floor((COLS - m[0].length) / 2);
      if (!fits(board, m, spawnX, type === 'I' ? -1 : 0)) return die();
      const options = [];
      for (let r = 0; r < 4; r++, m = rot(m)) {
        for (let x = -2; x < COLS; x++) {
          if (!fits(board, m, x, -2)) continue;
          let y = -2;
          while (fits(board, m, x, y + 1)) y++;
          const res = place(board, m, x, y, v), f = features(res.b);
          const value = -0.51 * f.agg + 0.76 * res.cleared * (res.cleared > 1 ? 1.4 : 1) - 0.36 * f.holes * 2 - 0.18 * f.bump - (f.max > 15 ? 5 : 0);
          options.push({ res, value });
        }
      }
      if (!options.length) return die();
      options.sort((a, b) => b.value - a.value);
      const choice = Math.random() < cfg.sloppy ? options[Math.min(options.length - 1, 1 + rnd(4))] : options[0];
      board = choice.res.b;
      const cleared = choice.res.cleared;
      score += [0, 100, 300, 500, 800][cleared];
      lines += cleared;
      let attack = [0, 0, 1, 2, 4][cleared];
      const cancel = Math.min(attack, pending);
      pending -= cancel; attack -= cancel;
      if (attack > 0) { sent += attack; onGarbage(attack); }
      if (!cleared && pending > 0) {
        const n = Math.min(pending, 10), hole = rnd(COLS);
        pending -= n;
        for (let i = 0; i < n; i++) {
          if (board.slice(0, COLS).some(Boolean)) return die();
          board.splice(0, COLS);
          board.push(...new Array(COLS).fill(8).map((x, c) => (c === hole ? 0 : x)));
        }
      }
      onChange();
    }
    function die() { if (!dead) { dead = true; onDead(); } }
    const timer = setInterval(step, cfg.ms);
    return {
      receive(n) { pending += n; },
      view: () => ({ board: board.join(''), score, lines, sent }),
      stop() { clearInterval(timer); },
    };
  }

  // ---------------------------------------------------------------- bot game session
  const KIND = { snake: 'realtime', pong: 'realtime', fighter: 'realtime', tetris: 'relay', chess: 'turn', checkers: 'turn', connect4: 'turn', tictactoe: 'turn' };
  const REAL_BOTS = { snake: snakeBot, pong: pongBot, fighter: fighterBot };

  function start(game, level, me) {
    level = LEVELS[level] ? level : 'medium';
    const lv = LEVELS[level], kind = KIND[game];
    const id = 'bot-' + Date.now().toString(36);
    const players = [me, { username: '__bot', name: `🤖 Bot (${lv.label})`, avatar: '#64748b' }];
    let state, over = false, timer = null, botTimer = null, tetris = null, humanSent = 0, humanScore = 0, humanLines = 0;
    const push = () => !over && GameDock.state({ id, state });
    function finish(result) {
      if (over) return;
      over = true;
      stop();
      GameDock.over({ id, result, state });
    }
    function stop() {
      clearInterval(timer);
      clearTimeout(botTimer);
      if (tetris) tetris.stop();
    }
    function botTurn() {
      botTimer = setTimeout(() => {
        if (over || state.turn !== 1) return;
        const r = Rules[game].move(state, 1, TURN_BOTS[game](state, 1, lv, level));
        if (r.error) return;
        state = r.state;
        push();
        if (state.result) finish(state.result);
        else if (state.turn === 1) botTurn(); // checkers: keep jumping
      }, lv.think * (0.6 + Math.random() * 0.8));
    }
    const host = {
      send(gid, input) {
        if (over || gid !== id) return;
        if (kind === 'turn') {
          if (state.turn !== 0) return;
          const r = Rules[game].move(state, 0, input || {});
          if (r.error) return;
          state = r.state;
          push();
          if (state.result) finish(state.result);
          else if (state.turn === 1) botTurn();
        } else if (kind === 'realtime') {
          Realtime[game].input(state, 0, input);
        } else if (input) {
          if (input.kind === 'garbage') { const n = Math.max(1, Math.min(4, input.n | 0)); humanSent += n; tetris.receive(n); }
          else if (input.kind === 'board') { humanScore = +input.score || 0; humanLines = +input.lines || 0; }
          else if (input.kind === 'dead') finish({ winner: 1, reason: 'you topped out' });
        }
      },
      leave() { finish({ winner: 1, reason: 'you forfeited' }); },
      rematch() { start(game, level, me); },
    };

    if (kind === 'turn') state = Rules[game].init();
    else if (kind === 'realtime') state = Realtime[game].init();
    else state = { boards: [null, null], scores: [0, 0], lines: [0, 0], sent: [0, 0] };

    GameDock.start({ id, game, players, you: 0, state, host, onClose: () => { over = true; stop(); } });

    if (kind === 'realtime') {
      const bot = REAL_BOTS[game](level), sim = Realtime[game];
      timer = setInterval(() => {
        const input = bot(state, 1);
        if (input) sim.input(state, 1, game === 'snake' ? { dir: input } : input);
        const res = sim.tick(state);
        push();
        if (res) finish(res);
      }, sim.tickMs);
    } else if (kind === 'relay') {
      const refresh = () => {
        const v = tetris.view();
        state = { boards: [null, v.board], scores: [humanScore, v.score], lines: [humanLines, v.lines], sent: [humanSent, v.sent] };
        push();
      };
      tetris = tetrisBot(level, (n) => GameDock.event({ id, ev: { garbage: n } }), () => finish({ winner: 0, reason: 'the bot topped out' }), refresh);
    }
  }

  window.BotPlay = { LEVELS, start, _ai: { TURN_BOTS, snakeBot, pongBot, fighterBot, tetrisBot } }; // _ai: for tests
})();
