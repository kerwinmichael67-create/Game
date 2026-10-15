// Shared bones for the party games in 🕹️ Games (Trivia Rush, Odd One Out): a server list with
// "Join a random server", a lobby where the host presses Start, and a game that the host runs in
// their browser and shares through live-room presence (claude.ai's rooms, or the website's relay,
// both reached through games/net.js). Players send what they do the same way. If the host leaves,
// the next player picks the game up from the last state everyone saw.
//
//   PartyKit.start({ code, title, emoji, tagline, min, max, servers, el,
//     host: { start(players) -> state, action(state, i, action, now) -> changed, tick(state, now) -> changed },
//     render(view) })     view: { state, me (index or -1), players, isHost, send(action), left(ms deadline) -> s, again(),
//                                  mine(patch) puts my own extra data in my presence, dataOf(peer) reads someone's }
//   (mine/dataOf are for things too big for the host's shared state, like the drawing in Sketch & Guess)
(() => {
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => performance.now();
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#a16207', '#64748b', '#0ea5e9', '#d946ef'];

  // sounds (sfx.js): the games use PartyKit.sfx; every button clicks
  const sfx = (name, opt) => { if (window.Sfx) window.Sfx.play(name, opt); };
  window.PartyKit = { start, esc, sfx };
  document.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && !b.disabled) sfx('click', { gap: 30 }); }, true);

  const CSS = `
  .pk-card{width:min(720px,100%);margin:0 auto;background:var(--pk-card,#fff);color:var(--pk-ink,#1f2937);border-radius:22px;padding:22px;box-shadow:0 18px 50px rgba(0,0,0,.25);display:grid;gap:12px}
  .pk-title{font:800 30px/1.1 var(--pk-font,system-ui);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .pk-srvtag{font-size:14px;padding:4px 10px;border-radius:999px;background:var(--pk-soft,#eef2ff);color:var(--pk-accent,#4f46e5)}
  .pk-tag{margin:0;color:var(--pk-muted,#6b7280);font-size:15px}
  .pk-status{margin:0;padding:8px 12px;border-radius:12px;background:#fef3c7;color:#92400e;font-size:14px}
  .pk-btn{border:0;border-radius:14px;padding:10px 16px;font:700 15px var(--pk-font,system-ui);cursor:pointer;background:var(--pk-accent,#4f46e5);color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.2)}
  .pk-btn:active:not(:disabled){transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.2)}
  .pk-btn:disabled{opacity:.5;cursor:default}
  .pk-big{width:100%;padding:16px;font-size:19px}
  .pk-ghost{background:var(--pk-soft,#eef2ff);color:var(--pk-accent,#4f46e5);box-shadow:none}
  .pk-label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--pk-muted,#6b7280)}
  .pk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .pk-srv{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;border-radius:14px;border:2px solid var(--pk-line,#e5e7eb);background:var(--pk-card,#fff);color:inherit;cursor:pointer;font:inherit;text-align:left}
  .pk-srv:hover:not(:disabled){border-color:var(--pk-accent,#4f46e5)}
  .pk-srv small{color:var(--pk-muted,#6b7280)}
  .pk-note{margin:0;font-size:13px;color:var(--pk-muted,#6b7280)}
  .pk-people{display:flex;flex-wrap:wrap;gap:6px}
  .pk-person{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--pk-soft,#eef2ff);font-weight:600}
  .pk-person.me{outline:2px solid var(--pk-accent,#4f46e5)}
  .pk-person i{width:12px;height:12px;border-radius:50%}
  .pk-row{display:flex;gap:8px;flex-wrap:wrap}
  .pk-rules{font-size:14px;color:var(--pk-muted,#6b7280);border-top:1px solid var(--pk-line,#e5e7eb);padding-top:10px}
  .pk-rules b{color:var(--pk-ink,#1f2937)}`;
  function start(cfg) {
    window.__partyKit = null;
    if (!document.getElementById('pk-css')) { const st = document.createElement('style'); st.id = 'pk-css'; st.textContent = CSS; document.head.append(st); }
    const K = {
      cfg, srv: 0, lobby: null, room: null, lobbyPeers: [], peers: [], name: 'Player', color: COLORS[Math.floor(Math.random() * COLORS.length)],
      t0: 0, joinAt: 0, claimed: false, busy: false, queued: null, out: [], outN: 0, status: '', joining: false,
      hs: null, view: { g: null, lastV: 0, hostPeer: '', offset: 0 }, offs: [], tickTimer: 0, offline: false,
    };
    const el = cfg.el, SERVERS = cfg.servers || 6, MAX = cfg.max || 12;
    const api = () => window.ChatClaude || window.claude;

    // ------------------------------------------------------------ connecting
    let lobbyP = null;
    function lobby() {
      if (!lobbyP) lobbyP = (async () => {
        const c = api();
        const room = c && await c.use('room');
        if (!room) { lobbyP = null; return null; }
        K.lobby = room;
        room.onPeers((ch) => { K.lobbyPeers = ch.peers; if (!K.srv) render(); }, () => {});
        try { const u = await c.use('user'), me = u && await u.me(); if (me && me.name) K.name = String(me.name).slice(0, 20); if (me && me.color) K.color = me.color; } catch (e) {}
        return room;
      })();
      return lobbyP;
    }
    const myPeer = () => { const m = K.peers.find((p) => p.isMe); return m ? m.peer : ''; };
    function crew() {
      return K.peers.filter((p) => p.presence && p.presence.t).map((p) => ({ peer: p.peer, isMe: p.isMe, nm: String(p.presence.nm || 'Player').slice(0, 20),
        c: String(p.presence.c || '#888'), t: +p.presence.t || 0, h: +p.presence.h || 0, pr: p.presence }))
        .sort((a, b) => (b.h ? 1 : 0) - (a.h ? 1 : 0) || a.t - b.t || (a.peer < b.peer ? -1 : 1));
    }
    const hostOf = () => crew()[0] || null;
    const isHost = () => { const h = hostOf(); return !!(h && h.isMe); };
    function send(patch) {
      if (!K.room) return;
      if (K.busy) { K.queued = Object.assign(K.queued || {}, patch); return; }
      K.busy = true;
      const room = K.room;
      room.presence(patch).catch(() => {}).then(() => { K.busy = false; if (K.queued && K.room === room) { const q = K.queued; K.queued = null; send(q); } });
    }
    function counts() {
      const c = new Array(SERVERS + 1).fill(0), playing = new Array(SERVERS + 1).fill(false);
      K.lobbyPeers.forEach((p) => { const n = p.presence && p.presence.srv; if (n >= 1 && n <= SERVERS) { c[n]++; if (p.presence.st === 'play') playing[n] = true; } });
      return { c, playing };
    }
    async function join(n) {
      if (K.joining) return;
      K.joining = true; K.status = `Joining server ${n}…`; render();
      try {
        if (K.srv) await leave(true);
        const lob = await lobby();
        if (!lob) { K.status = 'Live rooms aren’t switched on for your access to this page. The owner can share it with you as a Contributor (Share menu).'; return; }
        const room = await lob.join('srv-' + n);
        Object.assign(K, { room, srv: n, t0: Date.now(), joinAt: now(), claimed: false, peers: [], out: [], outN: 0, hs: null, status: '' });
        K.view = { g: null, lastV: 0, hostPeer: '', offset: 0 };
        K.offs.push(room.onPeers(onPeers, () => {}));
        send({ nm: K.name, c: K.color, t: K.t0 });
        lob.presence({ srv: n, st: 'lobby' }).catch(() => {});
        K.tickTimer = setInterval(tick, 200);
      } catch (e) { K.status = 'Couldn’t reach that server. Try another one.'; K.room = null; K.srv = 0; }
      finally { K.joining = false; render(); }
    }
    function joinRandom() {
      const { c } = counts(), open = [];
      for (let n = 1; n <= SERVERS; n++) if (n !== K.srv && c[n] < MAX) open.push(n);
      if (!open.length) { K.status = 'Every server is full right now.'; render(); return; }
      join(open[Math.floor(Math.random() * open.length)]);
    }
    async function leave(quiet) {
      const room = K.room;
      clearInterval(K.tickTimer);
      K.offs.forEach((f) => { try { f(); } catch (e) {} });
      Object.assign(K, { offs: [], room: null, srv: 0, peers: [], hs: null, busy: false, queued: null });
      K.view = { g: null, lastV: 0, hostPeer: '', offset: 0 };
      if (K.lobby) K.lobby.presence({ srv: null, st: null }).catch(() => {});
      if (room) await room.leave().catch(() => {});
      if (!quiet) render();
    }

    // ------------------------------------------------------------ the room
    function onPeers(ch) {
      K.peers = ch.peers;
      // two people taking the last place at once: whoever came last moves on
      if (now() - K.joinAt < 4000) {
        const byT = crew().sort((a, b) => a.t - b.t || (a.peer < b.peer ? -1 : 1));
        if (byT.findIndex((x) => x.isMe) >= MAX) { const n = K.srv; leave(true).then(() => { K.status = `Server ${n} filled up just as you joined.`; render(); }); return; }
      }
      const h = hostOf();
      if (h && h.peer !== K.view.hostPeer) {
        K.view.hostPeer = h.peer; K.view.lastV = 0;
        // the host changed: if that's me, carry on from the last game everyone saw
        if (h.isMe && K.view.g && K.view.g.st === 'play') adopt(K.view.g);
      }
      tick();
      if (h && !h.isMe && h.pr.g && typeof h.pr.g.v === 'number' && h.pr.g.v !== K.view.lastV) {
        K.view.lastV = h.pr.g.v;
        K.view.offset = (h.pr.g.now || Date.now()) - Date.now();
        K.view.g = h.pr.g;
      }
      render();
    }
    function tick() {
      if (!K.room) return;
      const c = crew();
      if (!K.claimed && now() - K.joinAt > 1500 && !c.some((x) => x.h && !x.isMe) && c[0] && c[0].isMe) { K.claimed = true; send({ h: 1 }); }
      if (isHost()) hostTick(); else K.hs = null;
      if (K.lobby) { const st = K.view.g && K.view.g.st === 'play' ? 'play' : 'lobby'; if (st !== K.lobbySt) { K.lobbySt = st; K.lobby.presence({ st }).catch(() => {}); } }
      if (K.view.g && K.view.g.st === 'play') render(true);
    }

    // ------------------------------------------------------------ the host runs the game
    function hs() { if (!K.hs) K.hs = { g: { v: 0, st: 'lobby' }, lastN: {}, dirty: true, sentAt: 0 }; return K.hs; }
    function adopt(g) { const H = hs(); H.g = JSON.parse(JSON.stringify(g)); H.lastN = {}; H.dirty = true; }
    function hostTick() {
      const H = hs(), g = H.g;
      if (g.st === 'play') {
        const c = crew();
        // what players did
        for (const x of c) {
          const i = g.pl.indexOf(x.peer);
          if (i < 0 || x.isMe) continue;
          for (const e of Array.isArray(x.pr.a) ? x.pr.a : []) {
            if (!Array.isArray(e) || e[0] !== g.id || typeof e[1] !== 'number' || e[1] <= (H.lastN[x.peer] || 0)) continue;
            H.lastN[x.peer] = e[1];
            if (cfg.host.action(g.s, i, e[2], Date.now())) H.dirty = true;
          }
        }
        // who's still here
        const here = new Set(c.map((x) => x.peer));
        g.pl.forEach((p, i) => { if (!here.has(p) && !g.gone[i]) { g.gone[i] = true; if (cfg.host.gone) cfg.host.gone(g.s, i); H.dirty = true; } });
        if (cfg.host.tick(g.s, Date.now())) H.dirty = true;
      }
      publish();
    }
    function publish(force) {
      const H = K.hs;
      if (!H || (!H.dirty && !force) || now() - H.sentAt < 120) return;
      H.dirty = false; H.sentAt = now();
      H.g.v++;
      H.g.now = Date.now();
      K.view.g = H.g; K.view.offset = 0;
      send({ g: H.g });
      render();
    }
    function startGame() {
      if (!isHost()) return;
      const c = crew().slice(0, MAX), H = hs();
      const players = c.map((x) => ({ peer: x.peer, nm: x.nm, c: x.c }));
      H.g = { v: H.g.v, st: 'play', id: Math.random().toString(36).slice(2, 8), pl: players.map((p) => p.peer), nm: players.map((p) => p.nm), cl: players.map((p) => p.c), gone: players.map(() => false), s: cfg.host.start(players, Date.now()) };
      H.lastN = {}; H.dirty = true;
      publish(true);
    }
    function backToLobby() { if (!isHost()) return; const H = hs(); H.g = { v: H.g.v, st: 'lobby' }; H.dirty = true; publish(true); }
    // what I do in the game: straight in if I'm the host, else through my presence
    function act(action) {
      const g = K.view.g;
      if (!g || g.st !== 'play') return;
      const i = g.pl.indexOf(myPeer());
      if (i < 0) return;
      if (isHost() && K.hs) { if (cfg.host.action(K.hs.g.s, i, action, Date.now())) { K.hs.dirty = true; publish(); } return; }
      K.out.push([g.id, ++K.outN, action]);
      if (K.out.length > 16) K.out.shift();
      send({ a: K.out.slice() });
    }

    // ------------------------------------------------------------ screens
    let lastSig = '';
    function render(soft) {
      const g = K.view.g;
      if (K.srv && g && g.st === 'play') {
        const me = g.pl.indexOf(myPeer());
        const view = { v: g.v, id: g.id, state: g.s, me, players: g.pl.map((p, i) => ({ peer: p, name: g.nm[i], color: g.cl[i], gone: g.gone[i] })), isHost: isHost(), send: act,
          left: (deadline) => Math.max(0, Math.ceil((deadline - (Date.now() + K.view.offset)) / 1000)), again: backToLobby, leave: () => leave(), soft,
          mine: (patch) => send(patch), dataOf: (peer) => { const p = K.peers.find((x) => x.peer === peer); return (p && p.presence) || null; } };
        if (el.dataset.screen !== 'game' || K.gameId !== g.id) { K.gameId = g.id; sfx('start'); }
        el.dataset.screen = 'game';
        cfg.render(view, el);
        return;
      }
      if (soft) return;
      const sig = JSON.stringify([K.srv, K.status, K.joining, crew().map((x) => [x.peer, x.nm, x.c]), counts(), isHost()]);
      if (sig === lastSig && el.dataset.screen !== 'game') return;
      lastSig = sig;
      el.dataset.screen = K.srv ? 'lobby' : 'servers';
      el.innerHTML = K.srv ? lobbyHTML() : serversHTML();
    }
    function serversHTML() {
      const { c, playing } = counts();
      let o = `<div class="pk-card"><div class="pk-title">${cfg.emoji} ${esc(cfg.title)}</div><p class="pk-tag">${esc(cfg.tagline || '')}</p>`;
      if (K.status) o += `<p class="pk-status">${esc(K.status)}</p>`;
      o += `<button class="pk-btn pk-big" data-random ${K.joining ? 'disabled' : ''}>🎲 Join a random server</button><div class="pk-label">Or pick a server</div><div class="pk-grid">`;
      for (let n = 1; n <= SERVERS; n++) {
        const full = c[n] >= MAX;
        o += `<button class="pk-srv" data-srv="${n}" ${full || K.joining ? 'disabled' : ''}><b>Server ${n}</b><small>${full ? 'Full' : c[n] ? `${c[n]} here${playing[n] ? ' · playing' : ' · in lobby'}` : 'Empty'}</small></button>`;
      }
      return o + `</div><p class="pk-note">${cfg.min}–${MAX} players. Anyone on a server can join the next game.</p></div>`;
    }
    function lobbyHTML() {
      const c = crew(), host = c[0], me = c.find((x) => x.isMe);
      const enough = c.length >= cfg.min;
      let o = `<div class="pk-card"><div class="pk-title">${cfg.emoji} ${esc(cfg.title)} <span class="pk-srvtag">Server ${K.srv}</span></div>`;
      o += `<div class="pk-people">${c.map((x, i) => `<span class="pk-person${x.isMe ? ' me' : ''}"><i style="background:${esc(x.c)}"></i>${esc(x.nm)}${x.isMe ? ' (you)' : ''}${i === 0 ? ' 👑' : ''}</span>`).join('')}</div>`;
      if (host && host.isMe) o += `<p class="pk-tag">${enough ? 'Everyone in? Press Start.' : `Waiting for players: you need at least ${cfg.min}.`}</p><button class="pk-btn pk-big" data-start ${enough ? '' : 'disabled'}>▶ Start game</button>`;
      else o += `<p class="pk-tag">Waiting for <b>${esc(host ? host.nm : 'the host')}</b> to start the game…</p>`;
      if (!me) o += `<p class="pk-status">Joining…</p>`;
      o += `<div class="pk-row"><button class="pk-btn pk-ghost" data-random>🎲 Random server</button><button class="pk-btn pk-ghost" data-leave>Leave server</button></div>`;
      return o + (cfg.rules ? `<div class="pk-rules">${cfg.rules}</div>` : '') + `</div>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled || el.dataset.screen === 'game') return;
      if (b.dataset.srv) join(+b.dataset.srv);
      else if ('random' in b.dataset) joinRandom();
      else if ('leave' in b.dataset) leave();
      else if ('start' in b.dataset) startGame();
    });

    // ------------------------------------------------------------ go
    if (!api()) { K.status = 'Open this game from 🕹️ Games in the chat to play online.'; render(); return K; }
    K.status = 'Connecting…'; render();
    lobby().then((r) => { K.status = r ? '' : 'Live rooms aren’t switched on for your access to this page. The owner can share it with you as a Contributor (Share menu).'; lastSig = ''; render(); });
    window.__partyKit = K; // for tests
    return Object.assign(K, { join, joinRandom, leave, startGame, backToLobby, act, isHost });
  }
})();
