// claude.ai artifact backend. Stands in for server.js inside a published artifact and speaks the
// same message protocol, so app.js and games.js run unchanged:
//   - profiles, chats and messages live in the artifact's shared `db`
//   - who's online, typing, game invites and live game state travel over `room` presence
//   - in a game, the challenger's browser is the host: it runs the simulation / validates moves
//     (shared/rules.js, realtime.js) and publishes the state in its presence for the opponent.
(() => {
  const GAMES = {
    snake: { name: 'Snake PvP', kind: 'realtime' },
    chess: { name: 'Chess', kind: 'turn' },
    checkers: { name: 'Checkers', kind: 'turn' },
    tetris: { name: 'Tetris Battle', kind: 'relay' },
    fighter: { name: 'Street Fighter', kind: 'realtime' },
    pong: { name: 'Pong', kind: 'realtime' },
    connect4: { name: 'Connect Four', kind: 'turn' },
    tictactoe: { name: 'Tic-Tac-Toe', kind: 'turn' },
  };
  const MSG_WINDOW = 100; // messages loaded per chat
  const MSG_KEEP = 200; // older messages are pruned
  const MAX_ROOM_SUBS = 50; // db allows 64 live subscriptions per view
  const NAMED_REASONS = ['forfeited', 'disconnected', 'topped out'];

  const rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join('');
  const msgId = () => Date.now().toString(36).padStart(9, '0') + rid(5);
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const copy = (o) => JSON.parse(JSON.stringify(o)); // presence may freeze what it's given; the host keeps mutating its state
  const isColor = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
  const ids = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 100) : []);
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  window.ChatTransport = function ChatTransport(emit) {
    let db = null, room = null, user = null, myId = null, myColor = '#6d5dfc';
    let ready = false, profilesLoaded = false, roomsLoaded = false, creatingProfile = false, readOnly = false;
    const profiles = {}; // id -> profile doc
    const platform = {}; // id -> { name, color } as this viewer's claude.ai sees them
    const rooms = {}; // id -> room doc (not including the built-in global chat)
    const rawMsgs = {}; // room id -> [{ id, ...doc }] oldest first
    const msgSubs = {}; // room id -> unsubscribe
    const sentUser = {}; // id -> JSON of the last user view sent to the UI
    const sentRoom = {}; // room id -> JSON of the last room meta sent
    let sentMe = '';
    let lobbyPeers = [];
    const myPresence = {};
    const typingSeen = {}; // peer -> typingAt
    const invitesIn = {}; // invite id -> invite
    let myInvite = null, myInviteTimer = null;
    const answered = new Set();
    const seenInvites = new Set(); // every invite id shown once, so an accepted one never pops up again
    let pendingOpen = null;
    let game = null;
    const recent = [];

    const GLOBAL = { id: 'global', name: 'Global chat', public: true, dm: false, members: [], owner: null };

    // ------------------------------------------------------------ people
    const pidOf = (p) => p.by || (p.presence && typeof p.presence.uid === 'string' ? p.presence.uid : null);
    const displayName = (id) => (profiles[id] && profiles[id].name) || (platform[id] && platform[id].name) || 'Someone';
    const avatarOf = (id) => (profiles[id] && isColor(profiles[id].avatar) ? profiles[id].avatar : (platform[id] && platform[id].color) || '#6d5dfc');
    function peersOf(id) { return lobbyPeers.filter((p) => pidOf(p) === id); }
    function presenceOf(id) {
      const p = profiles[id];
      if (id === myId) return (p && p.status) || 'online';
      const peers = peersOf(id);
      if (!peers.length) return 'offline';
      const st = peers.map((x) => x.presence.status).find((s) => ['online', 'offline', 'idle'].includes(s));
      return st || (p && p.status) || 'online';
    }
    function inGameOf(id) {
      if (id === myId) return game ? game.type : null;
      const g = peersOf(id).map((x) => x.presence.inGame).find((v) => typeof v === 'string' && GAMES[v]);
      return g || null;
    }
    function publicUser(id) {
      const p = profiles[id] || {};
      const st = p.stats || {};
      return {
        username: id, handle: (platform[id] && platform[id].name) || '', name: displayName(id), bio: str(p.bio, 300),
        avatar: avatarOf(id), favorites: ids(p.favorites).filter((g) => GAMES[g]), presence: presenceOf(id),
        stats: { w: +st.w || 0, l: +st.l || 0, d: +st.d || 0 }, inGame: inGameOf(id),
      };
    }
    function privateUser() {
      const p = profiles[myId] || {};
      return Object.assign(publicUser(myId), {
        status: ['online', 'offline', 'idle'].includes(p.status) ? p.status : 'online',
        bg: ['auto', 'white', 'black', 'custom'].includes(p.bg) ? p.bg : 'auto',
        bgCustom: isColor(p.bgCustom) ? p.bgCustom : '#dbeafe', friends: ids(p.friends),
      });
    }
    function pushUsers() {
      if (!ready) return;
      for (const id of Object.keys(profiles)) {
        const u = publicUser(id), j = JSON.stringify(u);
        if (sentUser[id] !== j) { sentUser[id] = j; emit({ t: 'user', user: u }); }
      }
      const me = privateUser(), j = JSON.stringify(me);
      if (j !== sentMe) { sentMe = j; emit({ t: 'me', me }); }
    }
    async function resolveNames() {
      const all = Object.keys(profiles);
      if (!all.includes(myId)) all.push(myId);
      const ps = await user.profiles(all);
      for (const id of all) if (ps[id]) platform[id] = { name: ps[id].name, color: ps[id].color };
    }

    // ------------------------------------------------------------ rooms + messages
    const visible = (r) => r.id === 'global' || r.public || ids(r.members).includes(myId);
    function roomMeta(id) {
      const r = id === 'global' ? GLOBAL : rooms[id];
      return { id, name: str(r.name, 40) || 'Chat', public: !!r.public, dm: !!r.dm, members: ids(r.members), owner: r.owner || null };
    }
    function sysText(d) {
      const n = displayName, g = (GAMES[d.game] || { name: 'a game' }).name;
      const reason = NAMED_REASONS.includes(d.reason) && d.loser ? `${n(d.loser)} ${d.reason}` : str(d.reason, 80);
      switch (d.sys) {
        case 'created': return `${n(d.by)} created “${str(d.name, 40)}”`;
        case 'challenge': return `🎮 ${n(d.a)} challenged ${n(d.b)} to ${g}`;
        case 'result': return d.winner ? `🏆 ${n(d.winner)} beat ${n(d.loser)} at ${g} (${reason})` : `🤝 ${n(d.a)} and ${n(d.b)} drew at ${g} (${reason})`;
        case 'added': return `${n(d.by)} added ${ids(d.ids).map(n).join(', ')}`;
        case 'left': return `${n(d.by)} left the chat`;
        default: return '';
      }
    }
    function toMsg(d) {
      if (d.sys) return { id: d.id, ts: +d.ts || 0, from: null, sys: true, text: sysText(d), game: d.game };
      return { id: d.id, ts: +d.ts || 0, from: typeof d.from === 'string' ? d.from : null, text: str(d.text, 1000) };
    }
    const roomView = (id) => Object.assign(roomMeta(id), { messages: (rawMsgs[id] || []).map(toMsg) });
    function subscribeMsgs(id) {
      if (msgSubs[id] || Object.keys(msgSubs).length >= MAX_ROOM_SUBS) return;
      msgSubs[id] = db.collection(`rooms/${id}/msgs`).orderBy('ts', 'desc').limit(MSG_WINDOW).onSnapshot((snap) => {
        const had = rawMsgs[id];
        const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).reverse();
        rawMsgs[id] = list;
        if (!ready || !(id === 'global' || rooms[id])) return;
        if (!had) { emit({ t: 'room', room: roomView(id) }); return; }
        const old = new Set(had.map((m) => m.id));
        for (const m of list) if (!old.has(m.id)) emit({ t: 'msg', room: id, msg: toMsg(m) });
      }, dbError);
    }
    function onRooms(snap) {
      const next = {};
      for (const d of snap.docs) if (d.id !== 'global') next[d.id] = Object.assign({ id: d.id }, d.data());
      for (const id of Object.keys(rooms)) {
        if (!next[id] || !visible(next[id])) {
          if (msgSubs[id]) { msgSubs[id](); delete msgSubs[id]; delete rawMsgs[id]; }
          if (ready && sentRoom[id]) { delete sentRoom[id]; emit({ t: 'roomRemoved', id }); }
        }
        delete rooms[id];
      }
      for (const [id, r] of Object.entries(next)) if (visible(r)) { rooms[id] = r; subscribeMsgs(id); }
      roomsLoaded = true;
      maybeHello();
      if (!ready) return;
      for (const id of Object.keys(rooms)) {
        const j = JSON.stringify(roomMeta(id));
        if (sentRoom[id] !== j) { sentRoom[id] = j; emit({ t: 'room', room: roomView(id) }); }
      }
      if (pendingOpen && rooms[pendingOpen]) { emit({ t: 'openRoom', id: pendingOpen }); pendingOpen = null; }
    }
    function post(roomId, data) {
      const coll = db.collection(`rooms/${roomId}/msgs`);
      coll.doc(msgId()).set(Object.assign({}, data, { ts: Date.now() })).catch(writeError);
      if (Math.random() < 0.1) prune(coll);
    }
    async function prune(coll) {
      try {
        const snap = await coll.orderBy('ts', 'desc').limit(MSG_KEEP + 50).get();
        for (const d of snap.docs.slice(MSG_KEEP)) await coll.doc(d.id).delete();
      } catch { /* pruning is best-effort */ }
    }

    // ------------------------------------------------------------ profiles
    function onProfiles(snap) {
      for (const ch of snap.docChanges()) if (ch.type === 'removed') delete profiles[ch.doc.id];
      for (const d of snap.docs) profiles[d.id] = d.data();
      if (!profiles[myId] && !snap.metadata.fromCache && !creatingProfile) {
        creatingProfile = true;
        const fresh = { name: '', bio: '', status: 'online', bg: 'auto', bgCustom: '#dbeafe', avatar: null, favorites: [], friends: [], stats: { w: 0, l: 0, d: 0 }, created: Date.now() };
        db.doc('profiles/' + myId).set(fresh).catch((e) => {
          readOnly = true;
          profiles[myId] = fresh;
          writeError(e);
          finishProfiles();
        });
        return;
      }
      if (profiles[myId]) finishProfiles();
    }
    function finishProfiles() {
      resolveNames().then(() => {
        const first = !profilesLoaded;
        profilesLoaded = true;
        const status = privateUser().status;
        if (myPresence.status !== status) setPresence({ status });
        maybeHello();
        pushUsers();
        // messages that arrived before names resolved get redrawn with real names once
        if (first && ready) for (const id of Object.keys(rawMsgs)) emit({ t: 'room', room: roomView(id) });
      });
    }
    function updateMe(patch) {
      if (readOnly) return emit({ t: 'error', text: 'You can look around, but saving needs Editor access. Ask the owner to invite you as an Editor.' });
      profiles[myId] = Object.assign({}, profiles[myId], patch); // snapshots are frozen: replace, never mutate
      pushUsers();
      db.doc('profiles/' + myId).update(patch).catch(writeError);
    }

    function maybeHello() {
      if (ready || !profilesLoaded || !roomsLoaded || !profiles[myId]) return;
      ready = true;
      const roomIds = ['global'].concat(Object.keys(rooms));
      roomIds.forEach((id) => { if (id !== 'global') sentRoom[id] = JSON.stringify(roomMeta(id)); });
      const users = Object.keys(profiles).map(publicUser);
      users.forEach((u) => { sentUser[u.username] = JSON.stringify(u); });
      const me = privateUser();
      sentMe = JSON.stringify(me);
      emit({ t: 'hello', me, users, rooms: roomIds.map(roomView), games: GAMES });
    }

    function dbError(e) {
      if (e && (e.code === 'revoked' || e.code === 'not_granted')) emit({ t: 'fatal', title: 'Access changed', text: 'Your access to this page changed. Reload it to keep chatting.' });
    }
    function writeError(e) {
      if (!e) return;
      if (e.code === 'invalid_argument') {
        readOnly = true;
        emit({ t: 'error', text: 'You can look around, but posting needs Editor access. Ask the owner to invite you as an Editor.' });
      } else if (e.code === 'quota_exceeded') emit({ t: 'error', text: 'This chat is out of storage. Ask the owner to delete old chats.' });
      else if (e.code === 'resource_exhausted') emit({ t: 'error', text: 'Too many actions at once. Wait a moment and try again.' });
      else emit({ t: 'error', text: 'That didn’t save. Check your connection and try again.' });
    }

    // ------------------------------------------------------------ lobby presence
    function setPresence(patch) {
      Object.assign(myPresence, patch);
      if (room) room.presence(patch).catch(() => {});
    }
    function onLobby(change) {
      lobbyPeers = change.peers;
      for (const p of change.peers) {
        if (p.isMe) continue;
        const pr = p.presence || {}, from = pidOf(p);
        if (!from) continue;
        if (typeof pr.typing === 'string' && pr.typingAt && typingSeen[p.peer] !== pr.typingAt) {
          typingSeen[p.peer] = pr.typingAt;
          if (Date.now() - p.updatedAt < 4000) emit({ t: 'typing', room: pr.typing, from });
        }
        const inv = pr.invite;
        if (inv && typeof inv === 'object' && inv.to === myId && typeof inv.id === 'string' && GAMES[inv.game] && !seenInvites.has(inv.id)) {
          seenInvites.add(inv.id);
          invitesIn[inv.id] = { id: inv.id, from, to: myId, game: inv.game, room: typeof inv.room === 'string' ? inv.room : 'global', expires: Date.now() + 60000 };
          if (ready) emit({ t: 'invite', invite: invitesIn[inv.id] });
        }
        const rep = pr.reply;
        if (myInvite && from === myInvite.to && rep && rep.id === myInvite.id && !answered.has(rep.id)) {
          answered.add(rep.id);
          const inv2 = myInvite;
          clearInvite();
          if (rep.accept) startGame({ id: inv2.id, type: inv2.game, players: [myId, inv2.to], you: 0, room: inv2.room });
          else emit({ t: 'notice', text: `${displayName(from)} declined your ${GAMES[inv2.game].name} challenge` });
        }
      }
      pushUsers();
    }
    function clearInvite() {
      myInvite = null;
      clearTimeout(myInviteTimer);
      setPresence({ invite: null });
    }

    // ------------------------------------------------------------ games
    const playersView = (g) => g.players.map((id) => ({ username: id, name: displayName(id), avatar: avatarOf(id) }));
    function freshState(type) {
      if (GAMES[type].kind === 'turn') return Rules[type].init();
      if (GAMES[type].kind === 'realtime') return Realtime[type].init();
      return { boards: [null, null], scores: [0, 0], lines: [0, 0], sent: [0, 0] };
    }
    async function startGame(opts) {
      if (game) return;
      if (!room) return emit({ t: 'error', text: 'Live games aren’t available in this view.' });
      const g = game = Object.assign({ kind: GAMES[opts.type].kind, over: false, n: 0, lastN: -1, v: 0, lastV: -1, seenSent: 0, mySent: 0, oppSeen: false }, opts);
      g.state = freshState(g.type);
      g.opp = g.players[1 - g.you];
      setPresence({ inGame: g.type, invite: null });
      emit({ t: 'gameStart', id: g.id, game: g.type, players: playersView(g), you: g.you, state: g.state });
      try {
        g.named = await room.join('g-' + g.id);
      } catch {
        return finish(g, { winner: -1, reason: 'couldn’t connect' }, { noStats: true });
      }
      if (g.over) { g.named.leave().catch(() => {}); return; }
      g.named.onPeers((ch) => onGamePeers(g, ch), () => { if (!g.over) finish(g, { winner: -1, reason: 'connection lost' }, { noStats: true }); });
      g.named.presence(Object.assign({ uid: myId }, g.you === 0 ? { s: copy(g.state), v: 0 } : {})).catch(() => {});
      g.joinTimer = setTimeout(() => { if (!g.oppSeen) finish(g, { winner: -1, reason: 'opponent never joined' }, { noStats: true }); }, 30000);
    }
    function onGamePeers(g, ch) {
      if (g.over) return;
      const opp = ch.peers.find((p) => !p.isMe && pidOf(p) === g.opp);
      if (!opp) {
        if (g.oppSeen && !g.dcTimer) g.dcTimer = setTimeout(() => finish(g, { winner: g.you, reason: 'disconnected' }, { post: true }), 20000);
        return;
      }
      g.oppSeen = true;
      clearTimeout(g.dcTimer); g.dcTimer = null;
      clearTimeout(g.joinTimer);
      if (g.you === 0 && g.kind === 'realtime' && !g.timer) startTicking(g);
      onOpponent(g, opp.presence || {});
    }
    function startTicking(g) {
      const sim = Realtime[g.type];
      g.timer = setInterval(() => {
        const res = sim.tick(g.state);
        g.v++;
        g.named.presence({ s: copy(g.state), v: g.v }).catch(() => {});
        emit({ t: 'gameState', id: g.id, state: g.state });
        if (res) finish(g, res, { post: true });
      }, sim.tickMs);
    }
    function publish(g) {
      g.v++;
      g.named.presence({ s: copy(g.state), v: g.v }).catch(() => {});
      emit({ t: 'gameState', id: g.id, state: g.state });
      if (g.state.result) finish(g, g.state.result, { post: true });
    }
    function onOpponent(g, pr) {
      if (pr.result && typeof pr.result === 'object' && g.you === 1) {
        if (pr.s) { g.state = copy(pr.s); emit({ t: 'gameState', id: g.id, state: g.state }); }
        return finish(g, { winner: pr.result.winner, reason: str(pr.result.reason, 80) }, {});
      }
      if (pr.forfeit) return finish(g, { winner: g.you, reason: 'forfeited' }, { post: true });
      if (g.kind === 'relay') {
        const o = 1 - g.you;
        if (typeof pr.board === 'string' && /^[0-8]{200}$/.test(pr.board)) g.state.boards[o] = pr.board;
        g.state.scores[o] = Math.max(0, +pr.score || 0);
        g.state.lines[o] = Math.max(0, +pr.lines || 0);
        const sent = Math.max(0, Math.floor(+pr.sent || 0));
        if (sent > g.seenSent) {
          emit({ t: 'gameEvent', id: g.id, ev: { garbage: Math.min(10, sent - g.seenSent) } });
          g.seenSent = sent;
        }
        g.state.sent[o] = sent;
        emit({ t: 'gameState', id: g.id, state: g.state });
        if (pr.dead) finish(g, { winner: g.you, reason: 'topped out' }, { post: g.you === 0 });
        return;
      }
      if (g.you === 1) {
        if (pr.s && typeof pr.v === 'number' && pr.v !== g.lastV) {
          g.lastV = pr.v;
          g.state = copy(pr.s);
          emit({ t: 'gameState', id: g.id, state: g.state });
        }
        return;
      }
      // host: apply the guest's latest input
      if (g.kind === 'turn') {
        if (pr.mv && typeof pr.n === 'number' && pr.n > g.lastN) {
          g.lastN = pr.n;
          const r = Rules[g.type].move(g.state, 1, pr.mv);
          if (!r.error) { g.state = r.state; publish(g); }
        }
      } else if (g.type === 'snake') {
        if (pr.dir && typeof pr.n === 'number' && pr.n > g.lastN) { g.lastN = pr.n; Realtime.snake.input(g.state, 1, { dir: pr.dir }); }
      } else if (pr.in && typeof pr.in === 'object') {
        Realtime[g.type].input(g.state, 1, pr.in);
      }
    }
    function gameInput(g, input) {
      input = input || {};
      if (g.kind === 'relay') {
        if (input.kind === 'board' && typeof input.board === 'string') {
          g.state.boards[g.you] = input.board;
          g.state.scores[g.you] = +input.score || 0;
          g.state.lines[g.you] = +input.lines || 0;
          g.named && g.named.presence({ board: input.board, score: g.state.scores[g.you], lines: g.state.lines[g.you], sent: g.mySent }).catch(() => {});
          emit({ t: 'gameState', id: g.id, state: g.state });
        } else if (input.kind === 'garbage') {
          g.mySent += Math.max(1, Math.min(4, Math.floor(+input.n || 0)));
          g.state.sent[g.you] = g.mySent;
          g.named && g.named.presence({ sent: g.mySent }).catch(() => {});
        } else if (input.kind === 'dead') {
          g.named && g.named.presence({ dead: true }).catch(() => {});
          finish(g, { winner: 1 - g.you, reason: 'topped out' }, { post: g.you === 0 });
        }
        return;
      }
      if (g.kind === 'turn') {
        const r = Rules[g.type].move(g.state, g.you, input);
        if (r.error) return emit({ t: 'gameError', id: g.id, text: r.error });
        if (g.you === 0) { g.state = r.state; publish(g); }
        else g.named && g.named.presence({ mv: input, n: ++g.n }).catch(() => {});
        return;
      }
      if (g.you === 0) Realtime[g.type].input(g.state, 0, input);
      else if (g.type === 'snake') g.named && g.named.presence({ dir: input.dir, n: ++g.n }).catch(() => {});
      else g.named && g.named.presence({ in: input }).catch(() => {});
    }
    function finish(g, result, opts) {
      if (g.over) return;
      g.over = true;
      clearInterval(g.timer);
      clearTimeout(g.dcTimer);
      clearTimeout(g.joinTimer);
      const winnerId = result.winner === 0 || result.winner === 1 ? g.players[result.winner] : null;
      const loserId = winnerId ? g.players[1 - result.winner] : null;
      if (g.you === 0 && g.named) g.named.presence({ result: { winner: winnerId ? result.winner : -1, reason: result.reason }, s: g.kind === 'relay' ? null : copy(g.state), v: ++g.v }).catch(() => {});
      const reason = NAMED_REASONS.includes(result.reason) && loserId ? `${displayName(loserId)} ${result.reason}` : result.reason;
      emit({ t: 'gameOver', id: g.id, result: { winner: winnerId ? result.winner : -1, reason }, state: g.state });
      if (!opts.noStats && profiles[myId] && !readOnly) {
        const st = Object.assign({ w: 0, l: 0, d: 0 }, profiles[myId].stats);
        if (!winnerId) st.d++; else if (winnerId === myId) st.w++; else st.l++;
        updateMe({ stats: st });
      }
      if (opts.post && !readOnly) post(g.room, { sys: 'result', game: g.type, a: g.players[0], b: g.players[1], winner: winnerId, loser: loserId, reason: result.reason });
      if (game === g) game = null;
      setPresence({ inGame: null });
      pushUsers();
      setTimeout(() => { if (g.named) g.named.leave().catch(() => {}); }, 4000);
    }

    // ------------------------------------------------------------ requests from the UI
    function busyReason(id) {
      if (presenceOf(id) === 'offline') return `${displayName(id)} is offline`;
      if (inGameOf(id)) return `${displayName(id)} is already in a game`;
      if (presenceOf(id) === 'idle') return `${displayName(id)} is set to do not disturb`;
      return null;
    }
    const handlers = {
      msg(m) {
        const text = str(m.text, 1000), r = m.room === 'global' ? GLOBAL : rooms[m.room];
        if (!r || !text) return;
        if (readOnly) return writeError({ code: 'invalid_argument' });
        const now = Date.now();
        while (recent.length && now - recent[0] > 4000) recent.shift();
        if (recent.length >= 8) return emit({ t: 'error', text: 'Slow down a little!' });
        recent.push(now);
        if (r.public && r.id !== 'global' && !ids(r.members).includes(myId)) db.doc('rooms/' + r.id).update({ members: ids(r.members).concat(myId) }).catch(() => {});
        post(r.id, { from: myId, text });
      },
      typing(m) { setPresence({ typing: String(m.room).slice(0, 40), typingAt: Date.now() }); },
      createRoom(m) {
        const name = str(m.name, 40);
        if (!name) return emit({ t: 'error', text: 'Give your chat a name' });
        if (readOnly) return writeError({ code: 'invalid_argument' });
        const id = rid(10);
        const members = [myId].concat(ids(m.members).filter((x) => profiles[x] && x !== myId)).slice(0, 50);
        pendingOpen = id;
        db.doc('rooms/' + id).set({ name, public: !!m.public, dm: false, members, owner: myId, created: Date.now() }).catch(writeError);
        post(id, { sys: 'created', by: myId, name });
      },
      dm(m) {
        const other = m.with;
        if (!profiles[other] || other === myId) return;
        const id = 'dm-' + hash([myId, other].sort().join('|'));
        if (rooms[id]) return emit({ t: 'openRoom', id });
        if (readOnly) return writeError({ code: 'invalid_argument' });
        pendingOpen = id;
        db.doc('rooms/' + id).set({ name: '', public: false, dm: true, members: [myId, other].sort(), owner: null, created: Date.now() }).catch(writeError);
      },
      addMembers(m) {
        const r = rooms[m.room];
        if (!r || r.dm || !ids(r.members).includes(myId)) return;
        const added = ids(m.members).filter((x) => profiles[x] && !ids(r.members).includes(x));
        if (!added.length) return;
        db.doc('rooms/' + r.id).update({ members: ids(r.members).concat(added) }).catch(writeError);
        post(r.id, { sys: 'added', by: myId, ids: added });
      },
      leaveRoom(m) {
        const r = rooms[m.room];
        if (!r || r.dm || !ids(r.members).includes(myId)) return;
        const left = ids(r.members).filter((x) => x !== myId);
        if (!left.length) db.doc('rooms/' + r.id).delete().catch(writeError);
        else {
          db.doc('rooms/' + r.id).update({ members: left }).catch(writeError);
          post(r.id, { sys: 'left', by: myId });
        }
      },
      profile(m) {
        const d = m.data || {}, patch = {};
        if (typeof d.name === 'string' && str(d.name, 30)) patch.name = str(d.name, 30);
        if (typeof d.bio === 'string') patch.bio = str(d.bio, 300);
        if (['online', 'offline', 'idle'].includes(d.status)) { patch.status = d.status; setPresence({ status: d.status }); }
        if (['auto', 'white', 'black', 'custom'].includes(d.bg)) patch.bg = d.bg;
        if (isColor(d.bgCustom)) patch.bgCustom = d.bgCustom;
        if (isColor(d.avatar)) patch.avatar = d.avatar;
        if (Array.isArray(d.favorites)) patch.favorites = d.favorites.filter((g) => GAMES[g]).slice(0, 8);
        if (Object.keys(patch).length) updateMe(patch);
      },
      friend(m) {
        if (!profiles[m.username] || m.username === myId) return;
        const list = ids(profiles[myId].friends).filter((f) => f !== m.username);
        if (m.add) list.push(m.username);
        updateMe({ friends: list });
      },
      gameInvite(m) {
        if (!room) return emit({ t: 'error', text: 'Live games aren’t available in this view.' });
        if (!GAMES[m.game]) return emit({ t: 'error', text: 'Unknown game' });
        if (!profiles[m.to] || m.to === myId) return emit({ t: 'error', text: 'Pick someone to play with' });
        if (game) return emit({ t: 'error', text: 'You are already in a game' });
        const busy = busyReason(m.to);
        if (busy) return emit({ t: 'error', text: busy });
        const roomId = m.room === 'global' || rooms[m.room] ? m.room : 'global';
        myInvite = { id: rid(10), to: m.to, game: m.game, room: roomId };
        setPresence({ invite: myInvite, reply: null });
        clearTimeout(myInviteTimer);
        const mine = myInvite;
        myInviteTimer = setTimeout(() => { if (myInvite === mine) clearInvite(); }, 60000);
        if (!readOnly) post(roomId, { sys: 'challenge', a: myId, b: m.to, game: m.game });
        emit({ t: 'notice', text: `Challenge sent to ${displayName(m.to)}` });
      },
      gameRespond(m) {
        const inv = invitesIn[m.id];
        const still = inv && peersOf(inv.from).some((p) => p.presence.invite && p.presence.invite.id === inv.id);
        if (!inv || !still || Date.now() > inv.expires) return emit({ t: 'error', text: 'That challenge has expired' });
        delete invitesIn[m.id];
        if (m.accept && game) return emit({ t: 'error', text: 'You are already in a game' });
        setPresence({ reply: { id: inv.id, accept: !!m.accept } });
        if (m.accept) startGame({ id: inv.id, type: inv.game, players: [inv.from, myId], you: 1, room: inv.room });
      },
      gameInput(m) { if (game && game.id === m.id && !game.over) gameInput(game, m.input); },
      gameLeave(m) {
        const g = game;
        if (!g || g.id !== m.id || g.over) return;
        if (g.you === 1 && g.named) g.named.presence({ forfeit: true }).catch(() => {});
        finish(g, { winner: 1 - g.you, reason: 'forfeited' }, { post: g.you === 0 });
      },
    };

    // ------------------------------------------------------------ boot
    (async () => {
      const api = window.claude && typeof window.claude.use === 'function' ? window.claude : null;
      if (!api) return emit({ t: 'fatal', title: 'Open this on claude.ai', text: 'Game Chat runs inside claude.ai. Open the artifact link while signed in.' });
      [db, room, user] = await Promise.all(['db', 'room', 'user'].map((n) => api.use(n).catch(() => null)));
      if (!db || !user) return emit({ t: 'fatal', title: 'Sign in to chat', text: 'Open this page while signed in to claude.ai. If someone shared it with you, ask them to invite you by email as an Editor.' });
      const me = await user.me();
      myId = me.id;
      myColor = me.color || myColor;
      if (!myId) return emit({ t: 'fatal', title: 'Sign in to chat', text: 'Open this page while signed in to claude.ai. If someone shared it with you, ask them to invite you by email as an Editor.' });
      platform[myId] = { name: me.name, color: myColor };
      setPresence({ uid: myId, status: 'online', inGame: null, invite: null, reply: null });
      db.collection('profiles').onSnapshot(onProfiles, dbError);
      db.collection('rooms').onSnapshot(onRooms, dbError);
      subscribeMsgs('global');
      if (room) room.onPeers(onLobby, () => { lobbyPeers = []; pushUsers(); });
      setInterval(() => {
        const now = Date.now();
        for (const [id, inv] of Object.entries(invitesIn)) if (now > inv.expires) delete invitesIn[id];
      }, 10000);
    })().catch(() => emit({ t: 'fatal', title: 'Can’t connect', text: 'Something went wrong loading the chat. Reload the page to try again.' }));

    return {
      send(m) {
        if (!m || !handlers[m.t] || !myId) return;
        try { handlers[m.t](m); } catch (e) { console.error(e); emit({ t: 'error', text: 'Something went wrong' }); }
      },
    };
  };
})();
