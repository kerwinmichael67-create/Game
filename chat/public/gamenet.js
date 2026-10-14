// The chat page's side of the games in 🕹️ Games. Each game runs in its own frame and talks to
// claude.ai's live rooms through games/net.js, which forwards every call here by postMessage:
//   - on claude.ai we pass the calls to the real room / user / db capabilities, with each game's
//     room names and saved data kept apart from the chat's own (and from other games');
//   - on the website we play the part of claude.ai's rooms over the chat's WebSocket (server.js "nr").
(() => {
  const rid = (n = 12) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join('');
  let backend = null; // { room: { join(name) }, user, db, me() }
  const frames = new Map(); // window -> session

  // ---------------------------------------------------------------- website: rooms over the chat socket
  function wsRooms(send, myId) {
    const peer = rid(14);
    const kvWait = new Map();
    let kvN = 0;
    const kvCall = (m) => new Promise((res, rej) => { const id = ++kvN; kvWait.set(id, { res, rej }); send(Object.assign({ t: 'nrkv', id }, m)); setTimeout(() => { if (kvWait.delete(id)) rej({ code: 'timeout', message: 'no answer' }); }, 15000); });
    const rooms = new Map(); // name -> state
    let online = true;
    function freezePeer(p, prevAt) {
      return Object.freeze({ peer: p.peer, by: p.by, isMe: p.peer === peer, sameTab: p.peer === peer, kind: 'viewer', guest: false,
        presence: Object.freeze(p.presence || {}), updatedAt: prevAt });
    }
    function make(name) {
      const R = { name, peers: Object.freeze([]), peerH: new Set(), msgH: new Map(), connH: new Set(), mine: {}, pending: null, timer: 0, left: false };
      const api = {
        name,
        presence(patch) {
          if (R.left) return Promise.reject({ code: 'invalid_argument', message: 'left this room' });
          for (const [k, v] of Object.entries(patch || {})) { if (v === null) delete R.mine[k]; else R.mine[k] = v; }
          R.pending = Object.assign(R.pending || {}, patch);
          if (!R.timer) R.timer = setTimeout(() => { R.timer = 0; const p = R.pending; R.pending = null; if (p && !R.left) send({ t: 'nr', op: 'pres', room: name, peer, patch: p }); }, 33);
          return Promise.resolve();
        },
        emit(topic, data) {
          if (R.left) return Promise.reject({ code: 'invalid_argument', message: 'left this room' });
          send({ t: 'nr', op: 'emit', room: name, peer, topic: String(topic), data: data === undefined ? null : data });
          return Promise.resolve();
        },
        on(topic, fn) { if (!R.msgH.has(topic)) R.msgH.set(topic, new Set()); R.msgH.get(topic).add(fn); return () => R.msgH.get(topic).delete(fn); },
        peers: () => R.peers,
        onPeers(fn) {
          R.peerH.add(fn);
          queueMicrotask(() => { if (R.peerH.has(fn) && R.peers.length) fn({ peers: R.peers, joined: R.peers, left: [], updated: [] }); });
          return () => R.peerH.delete(fn);
        },
        connected: () => online,
        onConnection(fn) { R.connH.add(fn); queueMicrotask(() => { if (R.connH.has(fn)) fn(online); }); return () => R.connH.delete(fn); },
        leave() { if (!R.left) { R.left = true; send({ t: 'nr', op: 'leave', room: name, peer }); rooms.delete(name); } return Promise.resolve(); },
      };
      R.api = api;
      return R;
    }
    return {
      join(name) {
        let R = rooms.get(name);
        if (!R) { R = make(name); rooms.set(name, R); send({ t: 'nr', op: 'join', room: name, peer }); }
        return Promise.resolve(R.api);
      },
      event(m) {
        const R = rooms.get(m.room);
        if (!R || R.left) return;
        if (m.op === 'peers') {
          const old = new Map(R.peers.map((p) => [p.peer, p]));
          const next = (m.peers || []).map((p) => {
            const o = old.get(p.peer);
            return o && JSON.stringify(o.presence) === JSON.stringify(p.presence || {}) ? o : freezePeer(p, p.at || Date.now());
          });
          const joined = next.filter((p) => !old.has(p.peer)), left = [...old.values()].filter((p) => !next.some((q) => q.peer === p.peer));
          const updated = next.filter((p) => old.has(p.peer) && old.get(p.peer) !== p);
          R.peers = Object.freeze(next);
          if (joined.length || left.length || updated.length) for (const fn of [...R.peerH]) fn({ peers: R.peers, joined, left, updated });
        } else if (m.op === 'msg') {
          const hs = R.msgH.get(m.topic);
          if (!hs) return;
          const msg = Object.freeze({ peer: m.peer, by: m.by, isMe: m.peer === peer, sameTab: m.peer === peer, kind: 'viewer', guest: false, topic: m.topic, data: m.data });
          for (const fn of [...hs]) fn(msg);
        }
      },
      reconnected() {
        online = true;
        for (const R of rooms.values()) {
          send({ t: 'nr', op: 'join', room: R.name, peer });
          if (Object.keys(R.mine).length) send({ t: 'nr', op: 'pres', room: R.name, peer, patch: R.mine });
          for (const fn of R.connH) fn(true);
        }
      },
      dropped() { online = false; for (const R of rooms.values()) for (const fn of R.connH) fn(false); },
      // a game's saved data, kept by the chat server
      kvGet: (key) => kvCall({ op: 'get', key }),
      kvSet: (key, val) => kvCall({ op: 'set', key, val }),
      kvReply(m) { const p = kvWait.get(m.id); if (!p) return; kvWait.delete(m.id); if (m.err) p.rej({ code: 'failed', message: m.err }); else p.res(m.val === undefined ? true : m.val); },
    };
  }

  // ---------------------------------------------------------------- one game frame
  const ROOM_OK = /^[a-z0-9][a-z0-9_.-]{0,47}$/;
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function session(win, game, code) {
    const S = { win, game, rooms: new Map(), subs: new Map(), next: 1 };
    // each game's rooms live under its own prefix, so games never meet each other (or the chat)
    const roomName = (n) => {
      const full = `${code}.${String(n).toLowerCase()}`;
      return ROOM_OK.test(full) ? full : `${code}.h${hash(full)}`;
    };
    const post = (m) => { try { win.postMessage(Object.assign({ gn: 1 }, m), '*'); } catch {} };
    const byName = new Map(); // joining a room you're already in gives back the same one
    const leaving = new Map(); // rooms still on their way out: joining one again waits for that to finish
    function openRoom(name) {
      const key = String(name).toLowerCase();
      if (!byName.has(key)) byName.set(key, Promise.resolve(leaving.get(key)).then(() => openRoomNow(name)).catch((e) => { byName.delete(key); throw e; }));
      return byName.get(key);
    }
    async function openRoomNow(name) {
      const named = await backend.room.join(roomName(name));
      const id = S.next++, R = { named, unsubs: [], topics: new Set(), key: String(name).toLowerCase() };
      S.rooms.set(id, R);
      R.unsubs.push(named.onPeers((ch) => post({ sub: 'r' + id, data: { type: 'peers', change: { peers: ch.peers, joined: ch.joined, left: ch.left, updated: ch.updated } } }),
        (e) => post({ sub: 'r' + id, data: { type: 'err', e: { code: e && e.code, message: e && e.message } } })));
      if (named.onConnection) R.unsubs.push(named.onConnection((c) => post({ sub: 'r' + id, data: { type: 'conn', c } }), () => {}));
      return { rid: id, name: String(name), connected: named.connected ? named.connected() : true };
    }
    // the chat may still be connecting when a game asks: wait up to 20 seconds for it
    async function connected(what) {
      for (let i = 0; i < 80; i++) {
        if (backend && (what ? backend[what] || backend.room : backend.room)) return true;
        await new Promise((r) => setTimeout(r, 250));
      }
      return !!backend;
    }
    const room = (a) => { const R = S.rooms.get(a && a.rid); if (!R) throw { code: 'invalid_argument', message: 'no such room' }; return R; };
    const dbPath = (p) => `games/${code}/${String(p).replace(/^\/+/, '')}`;
    const kvKey = (k) => { const s = String(k || 'save').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'save'; return `${code}.${s}`; };
    function query(a) {
      let q = backend.db.collection(dbPath(a.path));
      for (const [op, x, y, z] of a.q || []) {
        if (op === 'orderBy') q = q.orderBy(x, y);
        else if (op === 'limit') q = q.limit(x);
        else if (op === 'where') q = q.where(x, y, z);
      }
      return q;
    }
    const snapDoc = (d) => ({ id: d.id, exists: !!d.exists, data: d.exists ? d.data() : undefined, fromCache: !!(d.metadata && d.metadata.fromCache) });
    const snapColl = (s) => ({ docs: s.docs.map((d) => ({ id: d.id, data: d.data() })), removed: (s.docChanges ? s.docChanges() : []).filter((c) => c.type === 'removed').map((c) => c.doc.id), fromCache: !!(s.metadata && s.metadata.fromCache) });
    const OPS = {
      room: async () => {
        if (!(await connected())) return null;
        return openRoom('lobby');
      },
      join: (a) => openRoom(a.name),
      leave: async (a) => {
        const R = S.rooms.get(a.rid); if (!R) return;
        S.rooms.delete(a.rid); byName.delete(R.key); R.unsubs.forEach((f) => f());
        const p = R.named.leave().catch(() => {}).then(() => { if (leaving.get(R.key) === p) leaving.delete(R.key); });
        leaving.set(R.key, p);
        await p;
      },
      pres: (a) => room(a).named.presence(a.patch),
      emit: (a) => room(a).named.emit(a.topic, a.data),
      listen: (a) => {
        const R = room(a);
        if (R.topics.has(a.topic)) return;
        R.topics.add(a.topic);
        R.unsubs.push(R.named.on(a.topic, (msg) => post({ sub: 'r' + a.rid, data: { type: 'msg', topic: a.topic, msg: { peer: msg.peer, by: msg.by, isMe: msg.isMe, sameTab: msg.sameTab, kind: msg.kind, guest: msg.guest, topic: msg.topic, data: msg.data } } }), () => {}));
      },
      user: async () => (await connected('user')) && !!backend.user,
      'user.me': () => backend.user.me(),
      'user.id': () => backend.user.id(),
      'user.profiles': (ids) => backend.user.profiles(ids),
      'user.isOwner': () => backend.user.isOwner(),
      'user.canEdit': () => backend.user.canEdit(),
      db: async () => (await connected('db')) && !!backend.db,
      'db.get': async (a) => snapDoc(await backend.db.doc(dbPath(a.path)).get()),
      'db.query': async (a) => snapColl(await query(a).get()),
      'db.set': (a) => backend.db.doc(dbPath(a.path)).set(a.data),
      'db.update': (a) => backend.db.doc(dbPath(a.path)).update(a.data),
      'db.delete': (a) => backend.db.doc(dbPath(a.path)).delete(),
      'kv.get': async (a) => {
        const key = kvKey(a && a.key);
        if (!(await connected())) return null;
        if (backend.kv) return backend.kv.get(key);
        if (backend.db) { const d = await backend.db.doc(dbPath('kv/' + key)).get(); return d.exists ? (d.data() || {}).v || null : null; }
        return null;
      },
      'kv.set': async (a) => {
        const key = kvKey(a && a.key), val = String((a && a.val) || '');
        if (val.length > 512 * 1024) throw { code: 'too_big', message: 'save is too big' };
        if (!(await connected())) throw { code: 'unavailable', message: 'no saves here' };
        if (backend.kv) return backend.kv.set(key, val);
        if (backend.db) { await backend.db.doc(dbPath('kv/' + key)).set({ v: val, at: Date.now() }); return true; }
        throw { code: 'unavailable', message: 'no saves here' };
      },
      'db.sub': (a) => {
        const id = S.next++;
        const onErr = (e) => post({ sub: 'd' + id, data: { type: 'err', e: { code: e && e.code, message: e && e.message } } });
        const un = a.doc ? backend.db.doc(dbPath(a.path)).onSnapshot((d) => post({ sub: 'd' + id, data: { type: 'doc', snap: snapDoc(d) } }), onErr)
          : query(a).onSnapshot((s) => post({ sub: 'd' + id, data: { type: 'coll', snap: snapColl(s) } }), onErr);
        S.subs.set(id, un);
        return id;
      },
      'db.unsub': (id) => { const un = S.subs.get(id); if (un) { S.subs.delete(id); un(); } },
    };
    S.handle = async (m) => {
      const fn = OPS[m.op];
      try {
        if (!fn) throw { code: 'invalid_argument', message: 'unknown call ' + m.op };
        post({ re: m.id, val: await fn(m.args) });
      } catch (e) {
        post({ re: m.id, err: { code: (e && e.code) || 'upstream_error', message: (e && e.message) || String(e) } });
      }
    };
    S.close = () => {
      for (const R of S.rooms.values()) { R.unsubs.forEach((f) => { try { f(); } catch {} }); R.named.leave().catch(() => {}); }
      S.rooms.clear();
      for (const un of S.subs.values()) try { un(); } catch {}
      S.subs.clear();
    };
    return S;
  }
  addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.gn !== 1 || !m.op) return;
    const S = frames.get(e.source);
    if (S) S.handle(m);
  });

  let ws = null;
  window.GameNet = {
    // claude.ai: the page's own capabilities
    useClaude(caps) { backend = caps && caps.room ? { room: caps.room, user: caps.user || null, db: caps.db || null } : null; },
    // website: rooms over the chat socket, and the chat's idea of who you are
    useSocket(send, who) {
      ws = wsRooms(send);
      backend = {
        room: ws,
        user: {
          me: async () => { const u = who.me(); return { id: u.username, name: u.name, color: u.avatar, avatarUrl: u.photo || '', email: null, isOwner: false, canEdit: true }; },
          id: async () => who.me().username,
          profiles: async (ids) => Object.fromEntries([].concat(ids).map((id) => { const u = who.user(id); return [id, { id, name: u ? u.name : '', color: u ? u.avatar : '#888', avatarUrl: (u && u.photo) || '', guest: false, isMe: id === who.me().username }]; })),
          isOwner: async () => false,
          canEdit: async () => true,
        },
        db: null,
        kv: { get: (key) => ws.kvGet(key), set: (key, val) => ws.kvSet(key, val) },
      };
    },
    socketEvent(m) { if (ws) ws.event(m); },
    socketKv(m) { if (ws) ws.kvReply(m); },
    socketUp() { if (ws) ws.reconnected(); },
    socketDown() { if (ws) ws.dropped(); },
    // the chat page's own game tables (tables.js): a live room under the "tb." prefix, or null when there are none here
    ready: () => !!(backend && backend.room),
    // 'ready', 'connecting' (the chat hasn't been handed its live rooms yet) or 'none' (this view has none)
    status: () => (backend && backend.room ? 'ready' : backend || ws ? 'none' : 'connecting'),
    pageRoom: (name) => (backend && backend.room ? backend.room.join('tb.' + String(name).toLowerCase()) : Promise.reject({ code: 'unavailable', message: 'no live rooms here' })),
    // a game frame was opened / closed
    attach(frame, game, code) { const S = session(frame.contentWindow, game, code); frames.set(frame.contentWindow, S); return () => { frames.delete(frame.contentWindow); S.close(); }; },
  };
})();
