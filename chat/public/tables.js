// Game tables: every Request-a-game game also has servers ("tables") in 🕹️ Games.
// Join a table and the next players in line play while everyone else there watches; after each
// match the winner stays on and the others go to the back of the line. Snake, Light Cycles and
// Tetris Battle seat up to 4 players at once.
//
// It runs on the same live rooms as the other 🕹️ Games (GameNet: claude.ai's rooms, or the
// website's relay). The first person at a table runs its matches in their browser and shares
// them through room presence; everyone else shares their moves the same way.
(() => {
  const TABLES = 6, SEATS = 12; // tables per game, people per table (players + watchers)
  const KIND = {
    chess: 'turn', checkers: 'turn', connect4: 'turn', tictactoe: 'turn', reversi: 'turn', dots: 'turn', mancala: 'turn', gomoku: 'turn',
    pong: 'realtime', hockey: 'realtime', fighter: 'realtime', snake: 'realtime', tron: 'realtime', tetris: 'relay',
  };
  const ORDER = ['chess', 'checkers', 'connect4', 'tictactoe', 'reversi', 'dots', 'mancala', 'gomoku', 'pong', 'hockey', 'fighter', 'snake', 'tron', 'tetris'];
  const MAXP = { snake: 4, tron: 4, tetris: 4 };
  const maxPlayers = (g) => MAXP[g] || 2;
  const SMOOTH = new Set(['pong', 'hockey', 'fighter']);
  const SEND_MS = 50, COUNTDOWN = 4000, COUNTDOWN_MORE = 7000, AFTER = 5000;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
    return el;
  }
  const meta = (g) => (window.GameDock && GameDock.META[g]) || { emoji: '🎮', name: g };
  const copy = (o) => JSON.parse(JSON.stringify(o));
  const now = () => performance.now();

  let api = null;         // the 🕹️ Games window (party.js)
  let lobby = null, lobbyPeers = [], lobbyP = null;
  let T = null;           // the table I'm at
  let pill = null;

  // ---------------------------------------------------------------- lobby: who is at which table
  function getLobby() {
    if (!lobbyP) {
      lobbyP = window.GameNet.pageRoom('lobby').then((r) => {
        lobby = r;
        r.onPeers((ch) => { lobbyPeers = ch.peers; refresh(); }, () => {});
        return r;
      }).catch((e) => { lobbyP = null; throw e; });
    }
    return lobbyP;
  }
  function tableInfo(game, n) {
    const ps = lobbyPeers.filter((p) => p.presence && p.presence.g === game && p.presence.n === n);
    return { people: ps.length, playing: ps.filter((p) => p.presence.p).map((p) => String(p.presence.nm || 'Someone')) };
  }
  const atGame = (game) => lobbyPeers.filter((p) => p.presence && p.presence.g === game).length;

  // ---------------------------------------------------------------- my table
  const myPeer = () => { const m = T && T.peers.find((p) => p.isMe); return m ? m.peer : ''; };
  // everyone at the table, host first (whoever claimed it), then in the order they sat down
  function crew() {
    if (!T) return [];
    return T.peers.filter((p) => p.presence && p.presence.t).map((p) => ({
      peer: p.peer, isMe: p.isMe, nm: String(p.presence.nm || 'Player').slice(0, 24), uid: String(p.presence.uid || p.peer), av: String(p.presence.av || '#888888'),
      t: +p.presence.t || 0, h: +p.presence.h || 0, sit: !!p.presence.sit, pr: p.presence,
    })).sort((a, b) => (b.h ? 1 : 0) - (a.h ? 1 : 0) || a.t - b.t || (a.peer < b.peer ? -1 : 1));
  }
  const hostOf = () => crew()[0] || null;
  const iAmHost = () => { const c = hostOf(); return !!(c && c.isMe); };

  function send(patch) {
    if (!T || !T.room) return;
    if (T.busy) { T.queued = Object.assign(T.queued || {}, patch); return; }
    T.busy = true;
    const t = T;
    t.room.presence(patch).catch(() => {}).then(() => { t.busy = false; if (t.queued && T === t) { const q = t.queued; t.queued = null; send(q); } });
  }

  async function join(game, n) {
    if (T && T.game === game && T.n === n) return;
    if (T) await leave(true);
    const me = api.me();
    const t = T = { game, n, room: null, peers: [], joinAt: now(), t0: Date.now(), claimed: false, sit: false, out: [], outN: 0, busy: false, queued: null, hs: null, view: {}, offs: [] };
    refresh();
    try {
      await getLobby();
      const room = await window.GameNet.pageRoom(`${game}.${n}`);
      if (T !== t) { room.leave().catch(() => {}); return; }
      t.room = room;
      t.offs.push(room.onPeers((ch) => { if (T === t) onPeers(ch); }, () => {}));
      send({ nm: me.name, uid: me.username, av: me.avatar || '#888888', t: t.t0 });
      lobby.presence({ g: game, n, nm: me.name, p: 0 }).catch(() => {});
      t.claimTimer = setTimeout(() => T === t && tick(), 1700);
      t.tickTimer = setInterval(() => T === t && tick(), 100);
    } catch (e) {
      if (T === t) { T = null; api.toast('Couldn’t reach that table. Try another one.'); }
    }
    refresh();
  }
  async function leave(quiet) {
    const t = T;
    if (!t) return;
    T = null;
    clearInterval(t.tickTimer); clearTimeout(t.claimTimer);
    stopHost(t);
    t.offs.forEach((f) => { try { f(); } catch {} });
    if (window.GameDock) {
      const c = GameDock.current && GameDock.current();
      if (c && c.table) GameDock.close(); // the table's match goes with you
    }
    if (lobby) lobby.presence({ g: null, n: null, p: null }).catch(() => {});
    if (t.room) await t.room.leave().catch(() => {});
    if (!quiet) api.toast(`You left ${meta(t.game).name} table ${t.n}`);
    refresh();
  }
  function joinRandom(game) {
    const open = [];
    for (let n = 1; n <= TABLES; n++) if (!(T && T.game === game && T.n === n) && tableInfo(game, n).people < SEATS) open.push(n);
    if (!open.length) return api.toast('Every table is full right now');
    join(game, open[Math.floor(Math.random() * open.length)]);
  }
  function setSit(v) { if (!T) return; T.sit = v; send({ sit: v ? 1 : 0 }); refresh(); }

  function onPeers(ch) {
    T.peers = ch.peers;
    // two people grabbing the last seat at once: whoever came last moves on
    if (now() - T.joinAt < 4000) {
      const byTime = crew().sort((a, b) => a.t - b.t || (a.peer < b.peer ? -1 : 1));
      if (byTime.findIndex((c) => c.isMe) >= SEATS) { const t = T; leave(true).then(() => api.toast(`${meta(t.game).name} table ${t.n} filled up just as you joined`)); return; }
    }
    const hc = hostOf();
    if (hc && hc.peer !== T.view.hostPeer) {
      const v = T.view, had = v.hostPeer;
      v.hostPeer = hc.peer; v.lastV = v.shownV = 0;
      // the match ran in the old host's browser: it ends here, and the new host starts the next one
      if (had && v.dockId && !v.overShown && v.g && v.g.st === 'play') {
        v.overShown = true;
        GameDock.over({ id: v.dockId, result: { winner: -1, reason: 'the table’s host left' }, state: copy(v.g.s) });
      }
    }
    tick();
    if (hc && !hc.isMe && hc.pr.g) watchHost(hc.pr.g);
    refresh();
  }

  // ---------------------------------------------------------------- once a tenth of a second
  function tick() {
    if (!T || !T.room) return;
    // nobody holds the table: the first in line takes it, once it has heard about everyone already here
    const c = crew();
    if (!T.claimed && now() - T.joinAt > 1500 && !c.some((x) => x.h && !x.isMe) && c[0] && c[0].isMe) { T.claimed = true; send({ h: 1 }); }
    if (iAmHost()) hostTick();
    else if (T.hs) { stopHost(T); } // someone else holds the table now
    pillUpdate();
  }

  // ---------------------------------------------------------------- the host runs the matches
  function stopHost(t) {
    const hs = t && t.hs;
    if (!hs) return;
    if (hs.m && hs.m.timer) clearInterval(hs.m.timer);
    t.hs = null;
  }
  function hostTick() {
    if (!T.hs) T.hs = { order: [], m: null, sentAt: 0, v: 0, dirty: true, packing: false };
    const hs = T.hs, c = crew(), here = new Set(c.map((x) => x.peer)), t = now();
    // the line: people who want to play, in the order they came; new arrivals go to the back
    hs.order = hs.order.filter((p) => here.has(p) && !c.find((x) => x.peer === p).sit);
    for (const x of c.slice().sort((a, b) => a.t - b.t)) if (!x.sit && !hs.order.includes(x.peer)) hs.order.push(x.peer);
    const m = hs.m, max = maxPlayers(T.game);
    if (!m) {
      if (hs.order.length >= 2) {
        hs.m = { mid: Math.random().toString(36).slice(2, 9), st: 'cd', cdEnd: t + (hs.order.length < max ? COUNTDOWN_MORE : COUNTDOWN), pl: hs.order.slice(0, max) };
        hs.dirty = true;
      }
    } else if (m.st === 'cd') {
      m.pl = hs.order.slice(0, max);
      if (m.pl.length < 2) { hs.m = null; hs.dirty = true; }
      else if (t >= m.cdEnd) startMatch(hs);
      else hs.dirty = true;
    } else if (m.st === 'play') {
      // players who left the table, or gave up this match
      m.pl.forEach((p, i) => {
        const x = c.find((y) => y.peer === p);
        if (!m.out[i] && (!x || x.pr.ff === m.mid)) playerGone(m, i, x ? 'gave up' : 'left');
      });
      for (const x of c) if (!x.isMe) hostInputs(m, x);
    } else if (m.st === 'over' && t - m.overAt > AFTER) {
      // the winner stays on; everyone who just played goes to the back of the line
      const w = m.res && m.res.winner >= 0 ? m.pl[m.res.winner] : null;
      const played = new Set(m.pl);
      hs.order = (w ? [w] : []).concat(hs.order.filter((p) => !played.has(p)), m.pl.filter((p) => p !== w && hs.order.includes(p)));
      hs.m = null; hs.dirty = true;
    }
    publish(hs);
  }
  function freshState(game, n) {
    if (KIND[game] === 'turn') return Rules[game].init();
    if (KIND[game] === 'realtime') return Realtime[game].init(n);
    return { boards: new Array(n).fill('0'.repeat(200)), scores: new Array(n).fill(0), lines: new Array(n).fill(0), sent: new Array(n).fill(0), dead: new Array(n).fill(false) };
  }
  function startMatch(hs) {
    const m = hs.m, c = crew();
    const info = m.pl.map((p) => c.find((x) => x.peer === p) || { nm: 'Player', uid: p, av: '#888888' });
    Object.assign(m, { st: 'play', state: freshState(T.game, m.pl.length), names: info.map((x) => x.nm), uids: info.map((x) => x.uid), avs: info.map((x) => x.av), out: m.pl.map(() => false), lastN: {}, ev: [], evSeq: 0, res: null });
    if (KIND[T.game] === 'realtime') {
      const sim = Realtime[T.game];
      m.timer = setInterval(() => {
        if (!T || !T.hs || T.hs.m !== m || m.st !== 'play') return clearInterval(m.timer);
        const r = sim.tick(m.state);
        hs.dirty = true;
        if (r) finish(m, r);
        else if (now() - hs.sentAt >= SEND_MS) publish(hs);
      }, sim.tickMs);
    }
    hs.dirty = true;
  }
  function finish(m, res) {
    if (m.st !== 'play') return;
    clearInterval(m.timer);
    const reason = res.reason;
    m.st = 'over'; m.res = { winner: typeof res.winner === 'number' ? res.winner : -1, reason }; m.overAt = now();
    if (T && T.hs) T.hs.dirty = true;
  }
  function playerGone(m, i, how) {
    m.out[i] = true;
    const name = m.names[i], left = m.out.map((o, k) => (o ? -1 : k)).filter((k) => k >= 0);
    if (left.length <= 1) return finish(m, { winner: left.length ? left[0] : -1, reason: `${name} ${how}` });
    if (T.game === 'snake' || T.game === 'tron') Realtime[T.game].remove(m.state, i);
    if (T.game === 'tetris') { m.state.dead[i] = true; tetrisCheck(m); }
  }
  function tetrisCheck(m) {
    const alive = m.state.dead.map((d, k) => (d ? -1 : k)).filter((k) => k >= 0);
    if (alive.length <= 1) finish(m, { winner: alive.length ? alive[0] : -1, reason: alive.length ? 'last one standing' : 'everyone topped out' });
  }
  // a player's moves, keys and boards, applied in the order they made them
  function applyInput(m, i, input) {
    if (!m || m.st !== 'play' || m.out[i] || !input || typeof input !== 'object') return;
    const kind = KIND[T.game];
    if (kind === 'turn') {
      if (m.state.turn !== i) return;
      const r = Rules[T.game].move(m.state, i, input);
      if (r.error) return;
      m.state = r.state;
      T.hs.dirty = true;
      if (m.state.result) finish(m, m.state.result);
    } else if (kind === 'realtime') {
      Realtime[T.game].input(m.state, i, input);
    } else {
      const s = m.state;
      if (input.kind === 'board' && typeof input.board === 'string' && /^[0-8]{200}$/.test(input.board)) {
        s.boards[i] = input.board; s.scores[i] = Math.max(0, +input.score || 0); s.lines[i] = Math.max(0, +input.lines || 0);
      } else if (input.kind === 'garbage') {
        const n = Math.max(1, Math.min(4, Math.floor(+input.n || 0)));
        s.sent[i] += n;
        // junk goes to the next player still in, round the table
        for (let k = 1; k < s.dead.length; k++) {
          const to = (i + k) % s.dead.length;
          if (!s.dead[to]) { m.ev.push([++m.evSeq, to, n]); if (m.ev.length > 20) m.ev.shift(); if (m.pl[to] === myPeer()) deliverGarbage(n); break; }
        }
      } else if (input.kind === 'dead') { s.dead[i] = true; tetrisCheck(m); }
      T.hs.dirty = true;
    }
  }
  function hostInputs(m, x) {
    const i = m.pl.indexOf(x.peer);
    if (i < 0) return;
    const pr = x.pr;
    if (KIND[T.game] === 'relay' && pr.tb && typeof pr.tb === 'object' && pr.tb.m === m.mid) applyInput(m, i, Object.assign({ kind: 'board' }, pr.tb));
    const q = Array.isArray(pr.in) ? pr.in : [];
    for (const e of q) {
      if (!Array.isArray(e) || e[0] !== m.mid || typeof e[1] !== 'number') continue;
      if (e[1] <= (m.lastN[x.peer] || 0)) continue;
      m.lastN[x.peer] = e[1];
      applyInput(m, i, e[2]);
    }
  }
  // what everyone at the table sees: the match, shared through the host's presence
  function packet(hs) {
    const m = hs.m;
    if (!m) return { v: ++hs.v, q: hs.order };
    const g = { v: ++hs.v, q: hs.order, mid: m.mid, game: T.game, st: m.st, pl: m.pl };
    if (m.st === 'cd') g.cd = Math.max(0, Math.ceil((m.cdEnd - now()) / 1000));
    else Object.assign(g, { s: m.state, nm: m.names, uid: m.uids, av: m.avs, res: m.res, ev: m.ev });
    return g;
  }
  async function publish(hs) {
    if (!hs.dirty || hs.packing || now() - hs.sentAt < SEND_MS) return;
    hs.dirty = false; hs.sentAt = now();
    const g = packet(hs);
    showMatch(g); // the host watches / plays its own match too
    const json = JSON.stringify(g);
    if (json.length < 3300 || typeof CompressionStream === 'undefined') { send({ g }); return; }
    // big boards (a long 4-snake game): squeeze them to fit in a presence
    hs.packing = true;
    try { send({ g: { v: g.v, z: await squeeze(json) } }); } catch { send({ g: { v: g.v, q: g.q } }); }
    hs.packing = false;
  }
  async function squeeze(text) {
    const buf = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    let bin = '';
    const b = new Uint8Array(buf);
    for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function unsqueeze(z) {
    const bin = atob(z), b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return JSON.parse(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text());
  }

  // ---------------------------------------------------------------- everyone: show the table's match
  async function watchHost(g) {
    if (!g || typeof g !== 'object' || typeof g.v !== 'number') return;
    const v = T.view;
    if (g.v === v.lastV) return;
    v.lastV = g.v;
    if (g.z) { try { g = await unsqueeze(g.z); } catch { return; } if (!T || T.view !== v || g.v < (v.shownV || 0)) return; }
    showMatch(g);
  }
  function showMatch(g) {
    if (!T) return;
    const v = T.view;
    v.shownV = g.v;
    v.g = g;
    if (lobby) {
      const playing = !!(g.pl && g.st !== 'cd' && g.pl.includes(myPeer()) && g.st === 'play') ? 1 : 0;
      if (playing !== v.lobbyP) { v.lobbyP = playing; lobby.presence({ p: playing }).catch(() => {}); }
    }
    if (!g.mid || g.st === 'cd' || !g.pl) { pillUpdate(); refresh(); return; }
    const id = 'tb-' + g.mid, me = myPeer(), idx = g.pl.indexOf(me), dock = window.GameDock;
    if (v.mid !== g.mid) {
      v.mid = g.mid; v.lastEv = 0; v.overShown = false;
      const c = dock.current && dock.current();
      // don't take over a game you're already playing with someone outside the table
      const busy = c && !c.table && !c.over;
      if (busy || (idx < 0 && v.noWatch)) { v.dockId = null; refresh(); return; }
      const players = g.pl.map((p, i) => ({ username: (g.uid && g.uid[i]) || p, name: (g.nm && g.nm[i]) || 'Player', avatar: (g.av && g.av[i]) || '#888888' }));
      const host = iAmHost();
      v.dockId = id;
      // your match is starting: get the tables window out of the way
      if (idx >= 0 && window.PartyUI && PartyUI.isOpen() && String(PartyUI.openOn()).startsWith('tb:')) api.closeModal();
      dock.start({
        id, game: g.game, players, you: idx < 0 ? 0 : idx, spectate: idx < 0, state: copy(g.s), table: { game: T.game, n: T.n },
        net: { smooth: SMOOTH.has(g.game), predict: idx >= 0 && !host },
        host: {
          send: (gid, input) => sendInput(gid, input),
          leave: (gid) => {
            if (idx < 0) { if (T) T.view.noWatch = true; return; }
            if (T && T.hs && T.hs.m && T.hs.m.mid === g.mid) playerGone(T.hs.m, idx, 'gave up');
            else send({ ff: g.mid });
          },
          rematch() {},
        },
      });
    }
    if (v.dockId !== id) return;
    if (g.st === 'play' || (g.st === 'over' && !v.overShown)) dock.state({ id, state: copy(g.s) });
    if (Array.isArray(g.ev)) for (const e of g.ev) if (e[0] > v.lastEv) { v.lastEv = e[0]; if (e[1] === idx && !iAmHost()) deliverGarbage(e[2]); }
    if (g.st === 'over' && !v.overShown && g.res) {
      v.overShown = true;
      dock.over({ id, result: g.res, state: copy(g.s) });
    }
    refresh();
  }
  function deliverGarbage(n) { const v = T && T.view; if (v && v.dockId) GameDock.event({ id: v.dockId, ev: { garbage: n } }); }
  // my move / keys / board: straight in if I run the table, else through my presence
  function sendInput(gid, input) {
    if (!T || !T.view.g || 'tb-' + T.view.g.mid !== gid) return;
    const g = T.view.g, idx = g.pl.indexOf(myPeer());
    if (idx < 0 || !input) return;
    if (iAmHost() && T.hs && T.hs.m && T.hs.m.mid === g.mid) return applyInput(T.hs.m, idx, input);
    if (KIND[g.game] === 'relay' && input.kind === 'board') return send({ tb: { m: g.mid, board: input.board, score: input.score, lines: input.lines } });
    T.out.push([g.mid, ++T.outN, input]);
    if (T.out.length > 16) T.out.shift();
    send({ in: T.out.slice() });
  }

  // ---------------------------------------------------------------- the "you're at a table" pill
  function pillUpdate() {
    if (!pill) {
      pill = h('button', { class: 'party-pill table-pill hidden', onclick: () => T && api && window.PartyUI.openGames('tb:' + T.game) });
      document.body.append(pill);
    }
    if (!T) { pill.classList.add('hidden'); return; }
    const c = window.GameDock && GameDock.current && GameDock.current();
    pill.classList.toggle('hidden', !!(c && c.table && !c.over && !document.getElementById('gameDock').classList.contains('min')));
    pill.textContent = `${meta(T.game).emoji} ${meta(T.game).name} · table ${T.n} — ${statusLine()}`;
  }
  function statusLine() {
    if (!T || !T.room) return 'joining…';
    const g = T.view.g || (iAmHost() && T.hs ? packet0() : null), me = myPeer();
    if (T.sit) return 'sitting out';
    if (!g || !g.mid) {
      const n = crew().filter((x) => !x.sit).length;
      return n < 2 ? 'waiting for another player' : 'starting soon';
    }
    const inIt = g.pl && g.pl.includes(me);
    if (g.st === 'cd') return inIt ? `you play in ${g.cd}…` : `next match in ${g.cd}`;
    if (g.st === 'over') return 'match over';
    if (inIt) return 'you’re playing';
    const waiting = (g.q || []).filter((p) => !(g.pl || []).includes(p)), pos = waiting.indexOf(me);
    return pos === 0 ? 'watching · you’re next' : pos > 0 ? `watching · ${pos + 1}th in line`.replace('2th', '2nd').replace('3th', '3rd') : 'watching';
  }
  function packet0() { const m = T.hs.m; return m ? { mid: m.mid, st: m.st, pl: m.pl, q: T.hs.order, cd: m.st === 'cd' ? Math.max(0, Math.ceil((m.cdEnd - now()) / 1000)) : 0 } : { q: T.hs.order }; }

  // ---------------------------------------------------------------- the 🕹️ Games window
  let refreshAt = 0, refreshTimer = 0;
  function refresh() {
    pillUpdate();
    if (!(api && window.PartyUI && PartyUI.isOpen() && String(PartyUI.openOn()).startsWith('tb:'))) return;
    const wait = 400 - (now() - refreshAt);
    if (wait <= 0) { refreshAt = now(); api.refreshModal(); return; }
    if (!refreshTimer) refreshTimer = setTimeout(() => { refreshTimer = 0; refresh(); }, wait);
  }
  function cards() {
    if (window.GameNet && GameNet.ready()) getLobby().catch(() => {});
    return ORDER.map((g) => {
      const mt = meta(g), n = atGame(g);
      return h('button', { class: 'party-game-card table-card', style: `--g:${mt.color}`, onclick: () => window.PartyUI.openGames('tb:' + g) },
        h('span', { class: 'pg-emoji' }, mt.emoji), h('b', {}, mt.name), h('small', {}, mt.desc),
        h('span', { class: 'pg-meta' }, `${maxPlayers(g) > 2 ? '2–4 players' : '2 players'} · ${T && T.game === g ? `you’re at table ${T.n}` : n ? `${n} at the tables` : 'Tables open'}`));
    });
  }
  function view(game) {
    const mt = meta(game);
    if (!window.GameNet || !GameNet.ready()) {
      return [api.modalHead(`${mt.emoji} ${mt.name} tables`), h('p', { class: 'muted' }, 'Game tables need a live connection, which isn’t available here.')];
    }
    getLobby().catch(() => {});
    const here = T && T.game === game ? T : null, c = here ? crew() : [], g = here ? here.view.g || (iAmHost() && here.hs ? packet0() : null) : null;
    const back = h('button', { class: 'btn small ghost', onclick: () => window.PartyUI.openGames('pick') }, '‹ Games');
    const head = h('div', { class: 'modal-head' }, back, h('h2', { style: 'flex:1' }, `${mt.emoji} ${mt.name} tables`), h('button', { class: 'close-x', onclick: api.closeModal }, 'X'));
    const out = [head];
    if (here) {
      const q = (g && g.q) || [], pl = (g && g.pl) || [];
      const role = (x) => (x.sit ? 'sitting out' : pl.includes(x.peer) && g.st !== 'cd' ? 'playing' : pl.includes(x.peer) ? 'up next' : q.includes(x.peer) ? `#${q.indexOf(x.peer) + 1} in line` : 'watching');
      out.push(h('div', { class: 'table-here' },
        h('div', { class: 'row', style: 'align-items:center' }, h('b', { style: 'flex:1;font-size:17px' }, `You’re at table ${here.n}`), h('span', { class: 'server-state playing' }, statusLine())),
        h('div', { class: 'table-people' }, c.map((x, i) => h('span', { class: 'table-person' + (x.isMe ? ' me' : '') }, h('i', { style: `background:${x.av}` }), `${x.nm}${x.isMe ? ' (you)' : ''}${i === 0 ? ' 👑' : ''}`, h('small', {}, role(x))))),
        h('p', { class: 'muted', style: 'margin:6px 0' }, `${maxPlayers(game) > 2 ? `Up to ${maxPlayers(game)} play at once` : 'Two play at a time'}; everyone else at the table watches. The winner stays on, everyone else goes to the back of the line.`),
        h('div', { class: 'row' },
          here.sit ? h('button', { class: 'btn primary', onclick: () => setSit(false) }, '🎮 Play') : h('button', { class: 'btn', onclick: () => setSit(true) }, '👀 Just watch'),
          g && g.mid && g.st !== 'cd' && here.view.dockId ? h('button', { class: 'btn', onclick: () => { api.closeModal(); const d = document.getElementById('gameDock'); d.classList.remove('min'); } }, 'Show the match') : '',
          g && g.mid && g.st === 'play' && !here.view.dockId ? h('button', { class: 'btn', onclick: () => { const v = here.view; v.noWatch = false; v.mid = null; api.closeModal(); showMatch(v.g); } }, '👀 Watch the match') : '',
          h('span', { class: 'grow' }), h('button', { class: 'btn danger', onclick: () => leave() }, 'Leave table'))));
    }
    out.push(h('button', { class: 'btn primary', style: 'width:100%;margin:10px 0', onclick: () => joinRandom(game) }, here ? '🎲 Move to a random table' : '🎲 Join a random table'));
    out.push(h('div', { class: 'table-grid' }, Array.from({ length: TABLES }, (_, k) => {
      const n = k + 1, info = tableInfo(game, n), mine = here && here.n === n, full = info.people >= SEATS;
      const people = mine ? Math.max(info.people, c.length) : info.people;
      const line = info.playing.length >= 2 ? `${info.playing.join(' vs ')} playing` : people ? `${people} waiting` : 'Empty';
      return h('button', { class: 'table-card-btn' + (mine ? ' mine' : ''), disabled: mine || full, onclick: () => join(game, n) },
        h('b', {}, `Table ${n}`), h('small', {}, mine ? 'You’re here' : full ? 'Full' : line), h('span', { class: 'muted' }, people ? `${people} at the table` : ''));
    })));
    return out;
  }

  window.Tables = {
    init(a) { api = a; },
    cards,
    view,
    at: () => (T ? { game: T.game, n: T.n } : null),
    _debug: () => (T ? { g: T.view.g, host: iAmHost(), me: myPeer(), send: (input) => T.view.g && sendInput('tb-' + T.view.g.mid, input) } : null), // for tests
    leave,
  };
})();
