// Turn-based game rules shared by the server (validation) and the browser (move hints).
// Every game exposes: init() -> state, legal(state) -> moves, move(state, playerIdx, mv) -> {state} | {error}
// state.turn is the player index (0 or 1) whose move it is; state.result is null or {winner: 0|1|-1, reason}.
(function (root) {
  const Rules = {};
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------------------------------------------------------------- CHESS
  // Board: 64 squares, index = row*8 + col, row 0 = rank 8 (black's back rank).
  // Uppercase = white (player 0), lowercase = black (player 1), '' = empty.
  const chess = {};
  const colorOf = (p) => (p ? (p === p.toUpperCase() ? 'w' : 'b') : null);
  const on = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const KING = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ORTHO = KING.slice(0, 4);
  const DIAG = KING.slice(4);

  chess.init = function () {
    const back = 'rnbqkbnr';
    const b = new Array(64).fill('');
    for (let c = 0; c < 8; c++) {
      b[c] = back[c];
      b[8 + c] = 'p';
      b[48 + c] = 'P';
      b[56 + c] = back[c].toUpperCase();
    }
    return { board: b, turn: 0, castling: 'KQkq', ep: -1, last: null, check: false, half: 0, captured: [[], []], result: null };
  };

  function attacked(b, sq, by) {
    const r = sq >> 3, c = sq & 7;
    const P = by === 'w' ? 'P' : 'p', N = by === 'w' ? 'N' : 'n', K = by === 'w' ? 'K' : 'k';
    const R = by === 'w' ? 'R' : 'r', B = by === 'w' ? 'B' : 'b', Q = by === 'w' ? 'Q' : 'q';
    const pr = by === 'w' ? r + 1 : r - 1;
    for (const dc of [-1, 1]) if (on(pr, c + dc) && b[pr * 8 + c + dc] === P) return true;
    for (const [dr, dc] of KNIGHT) if (on(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === N) return true;
    for (const [dr, dc] of KING) if (on(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === K) return true;
    const slide = (dirs, a, q) => {
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (on(rr, cc)) {
          const p = b[rr * 8 + cc];
          if (p) { if (p === a || p === q) return true; break; }
          rr += dr; cc += dc;
        }
      }
      return false;
    };
    return slide(ORTHO, R, Q) || slide(DIAG, B, Q);
  }

  function pseudo(s) {
    const b = s.board, me = s.turn === 0 ? 'w' : 'b', opp = me === 'w' ? 'b' : 'w', out = [];
    const add = (from, to, extra) => out.push(Object.assign({ from, to }, extra));
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p || colorOf(p) !== me) continue;
      const r = i >> 3, c = i & 7, t = p.toLowerCase();
      if (t === 'p') {
        const dir = me === 'w' ? -1 : 1, start = me === 'w' ? 6 : 1, last = me === 'w' ? 0 : 7;
        const push = (to, extra) => {
          if (to >> 3 === last) for (const pr of ['q', 'r', 'b', 'n']) add(i, to, Object.assign({ promo: pr }, extra));
          else add(i, to, extra);
        };
        if (on(r + dir, c) && !b[(r + dir) * 8 + c]) {
          push((r + dir) * 8 + c);
          if (r === start && !b[(r + 2 * dir) * 8 + c]) add(i, (r + 2 * dir) * 8 + c, { double: true });
        }
        for (const dc of [-1, 1]) {
          if (!on(r + dir, c + dc)) continue;
          const to = (r + dir) * 8 + c + dc;
          if (b[to] && colorOf(b[to]) === opp) push(to);
          else if (to === s.ep) add(i, to, { ep: true });
        }
      } else if (t === 'n' || t === 'k') {
        for (const [dr, dc] of t === 'n' ? KNIGHT : KING) {
          if (!on(r + dr, c + dc)) continue;
          const to = (r + dr) * 8 + c + dc;
          if (!b[to] || colorOf(b[to]) === opp) add(i, to);
        }
        if (t === 'k') {
          const home = me === 'w' ? 60 : 4;
          const [KS, QS, rook] = me === 'w' ? ['K', 'Q', 'R'] : ['k', 'q', 'r'];
          if (i === home && !attacked(b, home, opp)) {
            if (s.castling.includes(KS) && !b[home + 1] && !b[home + 2] && b[home + 3] === rook &&
                !attacked(b, home + 1, opp) && !attacked(b, home + 2, opp)) add(i, home + 2, { castle: true });
            if (s.castling.includes(QS) && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === rook &&
                !attacked(b, home - 1, opp) && !attacked(b, home - 2, opp)) add(i, home - 2, { castle: true });
          }
        }
      } else {
        const dirs = t === 'r' ? ORTHO : t === 'b' ? DIAG : KING;
        for (const [dr, dc] of dirs) {
          let rr = r + dr, cc = c + dc;
          while (on(rr, cc)) {
            const to = rr * 8 + cc;
            if (b[to]) { if (colorOf(b[to]) === opp) add(i, to); break; }
            add(i, to);
            rr += dr; cc += dc;
          }
        }
      }
    }
    return out;
  }

  function applyChess(s, m) {
    const b = s.board.slice(), me = s.turn === 0 ? 'w' : 'b', p = b[m.from];
    let captured = b[m.to];
    b[m.to] = m.promo ? (me === 'w' ? m.promo.toUpperCase() : m.promo) : p;
    b[m.from] = '';
    if (m.ep) {
      const sq = m.to + (me === 'w' ? 8 : -8);
      captured = b[sq];
      b[sq] = '';
    }
    if (m.castle) {
      if (m.to === 62) { b[61] = b[63]; b[63] = ''; }
      if (m.to === 58) { b[59] = b[56]; b[56] = ''; }
      if (m.to === 6) { b[5] = b[7]; b[7] = ''; }
      if (m.to === 2) { b[3] = b[0]; b[0] = ''; }
    }
    let cs = s.castling;
    if (p === 'K') cs = cs.replace('K', '').replace('Q', '');
    if (p === 'k') cs = cs.replace('k', '').replace('q', '');
    for (const [sq, flag] of [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']]) if (m.from === sq || m.to === sq) cs = cs.replace(flag, '');
    const cap = [s.captured[0].slice(), s.captured[1].slice()];
    if (captured) cap[s.turn].push(captured);
    return {
      board: b, turn: 1 - s.turn, castling: cs, ep: m.double ? (m.from + m.to) / 2 : -1, last: [m.from, m.to],
      check: false, half: captured || p.toLowerCase() === 'p' ? 0 : s.half + 1, captured: cap, result: null,
    };
  }

  const kingSq = (b, color) => b.indexOf(color === 'w' ? 'K' : 'k');

  chess.legal = function (s) {
    const me = s.turn === 0 ? 'w' : 'b', opp = me === 'w' ? 'b' : 'w';
    return pseudo(s).filter((m) => {
      const ns = applyChess(s, m);
      return !attacked(ns.board, kingSq(ns.board, me), opp);
    });
  };

  function insufficient(b) {
    const rest = b.filter((p) => p && p.toLowerCase() !== 'k');
    if (rest.length === 0) return true;
    return rest.length === 1 && 'nb'.includes(rest[0].toLowerCase());
  }

  chess.move = function (s, idx, mv) {
    if (s.result) return { error: 'Game is over' };
    if (s.turn !== idx) return { error: 'Not your turn' };
    const promo = (mv && mv.promo) || 'q';
    const m = chess.legal(s).find((x) => x.from === mv.from && x.to === mv.to && (!x.promo || x.promo === promo));
    if (!m) return { error: 'Illegal move' };
    const ns = applyChess(s, m);
    const color = ns.turn === 0 ? 'w' : 'b';
    ns.check = attacked(ns.board, kingSq(ns.board, color), color === 'w' ? 'b' : 'w');
    const replies = chess.legal(ns).length;
    if (!replies) ns.result = ns.check ? { winner: idx, reason: 'checkmate' } : { winner: -1, reason: 'stalemate' };
    else if (insufficient(ns.board)) ns.result = { winner: -1, reason: 'insufficient material' };
    else if (ns.half >= 100) ns.result = { winner: -1, reason: '50-move rule' };
    return { state: ns };
  };
  Rules.chess = chess;

  // ---------------------------------------------------------------- CHECKERS
  // Player 0 = red ('r', king 'R') starts at the bottom and moves up.
  // Player 1 = black ('b', king 'B') starts at the top and moves down. Captures are mandatory.
  const checkers = {};
  checkers.init = function () {
    const b = new Array(64).fill('');
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue;
      if (r < 3) b[r * 8 + c] = 'b';
      if (r > 4) b[r * 8 + c] = 'r';
    }
    return { board: b, turn: 0, chain: -1, last: null, result: null };
  };
  const ckOwner = (p) => (p ? (p.toLowerCase() === 'r' ? 0 : 1) : -1);
  function ckMovesFrom(b, i, jumpsOnly) {
    const p = b[i], me = ckOwner(p), r = i >> 3, c = i & 7;
    const dirs = p === p.toUpperCase() ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : me === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    const steps = [], jumps = [];
    for (const [dr, dc] of dirs) {
      const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
      if (!on(r1, c1)) continue;
      const mid = b[r1 * 8 + c1];
      if (!mid) { if (!jumpsOnly) steps.push({ from: i, to: r1 * 8 + c1 }); }
      else if (ckOwner(mid) !== me && on(r2, c2) && !b[r2 * 8 + c2]) jumps.push({ from: i, to: r2 * 8 + c2, cap: r1 * 8 + c1 });
    }
    return { steps, jumps };
  }
  checkers.legal = function (s) {
    if (s.result) return [];
    if (s.chain >= 0) return ckMovesFrom(s.board, s.chain, true).jumps;
    let steps = [], jumps = [];
    for (let i = 0; i < 64; i++) {
      if (ckOwner(s.board[i]) !== s.turn) continue;
      const m = ckMovesFrom(s.board, i, false);
      steps = steps.concat(m.steps);
      jumps = jumps.concat(m.jumps);
    }
    return jumps.length ? jumps : steps;
  };
  checkers.move = function (s, idx, mv) {
    if (s.result) return { error: 'Game is over' };
    if (s.turn !== idx) return { error: 'Not your turn' };
    const m = checkers.legal(s).find((x) => x.from === mv.from && x.to === mv.to);
    if (!m) return { error: 'Illegal move' };
    const ns = clone(s);
    const b = ns.board;
    let p = b[m.from];
    b[m.from] = '';
    if (m.cap !== undefined) b[m.cap] = '';
    const row = m.to >> 3;
    let crowned = false;
    if (p === 'r' && row === 0) { p = 'R'; crowned = true; }
    if (p === 'b' && row === 7) { p = 'B'; crowned = true; }
    b[m.to] = p;
    ns.last = [m.from, m.to];
    ns.chain = -1;
    if (m.cap !== undefined && !crowned && ckMovesFrom(b, m.to, true).jumps.length) ns.chain = m.to;
    else ns.turn = 1 - idx;
    if (ns.chain < 0 && !checkers.legal(ns).length) ns.result = { winner: idx, reason: 'no moves left' };
    return { state: ns };
  };
  Rules.checkers = checkers;

  // ---------------------------------------------------------------- CONNECT FOUR
  const connect4 = { COLS: 7, ROWS: 6 };
  connect4.init = () => ({ grid: new Array(42).fill(-1), turn: 0, last: -1, line: null, result: null });
  connect4.legal = (s) => (s.result ? [] : [0, 1, 2, 3, 4, 5, 6].filter((c) => s.grid[c] === -1).map((col) => ({ col })));
  connect4.move = function (s, idx, mv) {
    if (s.result) return { error: 'Game is over' };
    if (s.turn !== idx) return { error: 'Not your turn' };
    const col = mv && mv.col;
    if (!Number.isInteger(col) || col < 0 || col > 6 || s.grid[col] !== -1) return { error: 'Column is full' };
    const ns = clone(s);
    let r = 5;
    while (ns.grid[r * 7 + col] !== -1) r--;
    ns.grid[r * 7 + col] = idx;
    ns.last = r * 7 + col;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const line = [r * 7 + col];
      for (const sgn of [1, -1]) {
        let rr = r + dr * sgn, cc = col + dc * sgn;
        while (rr >= 0 && rr < 6 && cc >= 0 && cc < 7 && ns.grid[rr * 7 + cc] === idx) { line.push(rr * 7 + cc); rr += dr * sgn; cc += dc * sgn; }
      }
      if (line.length >= 4) { ns.line = line; ns.result = { winner: idx, reason: 'four in a row' }; break; }
    }
    if (!ns.result && ns.grid.every((v) => v !== -1)) ns.result = { winner: -1, reason: 'board full' };
    ns.turn = 1 - idx;
    return { state: ns };
  };
  Rules.connect4 = connect4;

  // ---------------------------------------------------------------- TIC-TAC-TOE
  const tictactoe = {};
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  tictactoe.init = () => ({ cells: new Array(9).fill(-1), turn: 0, line: null, result: null });
  tictactoe.legal = (s) => (s.result ? [] : s.cells.map((v, i) => (v === -1 ? { cell: i } : null)).filter(Boolean));
  tictactoe.move = function (s, idx, mv) {
    if (s.result) return { error: 'Game is over' };
    if (s.turn !== idx) return { error: 'Not your turn' };
    const cell = mv && mv.cell;
    if (!Number.isInteger(cell) || cell < 0 || cell > 8 || s.cells[cell] !== -1) return { error: 'Square taken' };
    const ns = clone(s);
    ns.cells[cell] = idx;
    const line = LINES.find((l) => l.every((i) => ns.cells[i] === idx));
    if (line) { ns.line = line; ns.result = { winner: idx, reason: 'three in a row' }; }
    else if (ns.cells.every((v) => v !== -1)) ns.result = { winner: -1, reason: 'board full' };
    ns.turn = 1 - idx;
    return { state: ns };
  };
  Rules.tictactoe = tictactoe;

  if (typeof module !== 'undefined' && module.exports) module.exports = Rules;
  else root.Rules = Rules;
})(typeof window !== 'undefined' ? window : globalThis);
