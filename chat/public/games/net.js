// Loaded first by every game in 🕹️ Games. When the game runs inside the chat, this gives it a
// window.claude that looks like claude.ai's (live rooms, who you are, saved data) and forwards each
// call to the chat page (gamenet.js). Opened on its own, it does nothing and the game runs as before.
(() => {
  if (window.parent === window || window.claude) return;
  let seq = 0;
  const pending = new Map(), subs = new Map();
  const post = (m) => window.parent.postMessage(Object.assign({ gn: 1 }, m), '*');
  const call = (op, args) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); post({ id, op, args }); });
  addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const m = e.data;
    if (!m || m.gn !== 1) return;
    if (m.re) { const p = pending.get(m.re); if (p) { pending.delete(m.re); if (m.err) p.rej(m.err); else p.res(m.val); } return; }
    if (m.sub) { const fn = subs.get(m.sub); if (fn) fn(m.data); }
  });
  const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };

  // ---------------------------------------------------------------- live rooms
  function makeRoom(info, isLobby) {
    const rid = info.rid;
    let peers = Object.freeze([]), connected = !!info.connected, ended = null;
    const peerH = new Set(), connH = new Set(), errH = new Set(), msgH = new Map();
    const byPeer = new Map();
    subs.set('r' + rid, (d) => {
      if (d.type === 'peers') {
        // keep one frozen object per unchanged peer, as claude.ai does
        const keep = (p) => { const o = byPeer.get(p.peer); if (o && o.updatedAt === p.updatedAt && JSON.stringify(o.presence) === JSON.stringify(p.presence)) return o; const f = deepFreeze(p); byPeer.set(p.peer, f); return f; };
        const ch = d.change;
        peers = Object.freeze(ch.peers.map(keep));
        for (const p of ch.left) byPeer.delete(p.peer);
        const change = Object.freeze({ peers, joined: Object.freeze(ch.joined.map(keep)), left: Object.freeze(ch.left.map(deepFreeze)), updated: Object.freeze(ch.updated.map(keep)) });
        for (const fn of [...peerH]) try { fn(change); } catch (err) { console.error(err); }
      } else if (d.type === 'conn') {
        connected = d.c;
        for (const fn of [...connH]) try { fn(connected); } catch (err) { console.error(err); }
      } else if (d.type === 'msg') {
        const hs = msgH.get(d.topic);
        if (hs) for (const fn of [...hs]) try { fn(deepFreeze(d.msg)); } catch (err) { console.error(err); }
      } else if (d.type === 'err') {
        ended = d.e;
        for (const fn of [...errH]) try { fn(d.e); } catch (err) { console.error(err); }
      }
    });
    const reject = () => Promise.reject(ended || { code: 'invalid_argument', message: 'left this room' });
    let left = false;
    const api = {
      name: info.name,
      presence: (patch) => (left || ended ? reject() : call('pres', { rid, patch })),
      emit: (topic, data) => (left || ended ? reject() : call('emit', { rid, topic, data })),
      on(topic, fn, onErr) {
        if (!msgH.has(topic)) { msgH.set(topic, new Set()); call('listen', { rid, topic }).catch(() => {}); }
        msgH.get(topic).add(fn);
        if (onErr) errH.add(onErr);
        return () => { msgH.get(topic).delete(fn); if (onErr) errH.delete(onErr); };
      },
      peers: () => peers,
      onPeers(fn, onErr) {
        peerH.add(fn);
        if (onErr) errH.add(onErr);
        queueMicrotask(() => { if (peerH.has(fn) && peers.length) fn(Object.freeze({ peers, joined: peers, left: Object.freeze([]), updated: Object.freeze([]) })); });
        return () => { peerH.delete(fn); if (onErr) errH.delete(onErr); };
      },
      connected: () => connected,
      onConnection(fn, onErr) {
        connH.add(fn);
        if (onErr) errH.add(onErr);
        queueMicrotask(() => { if (connH.has(fn)) fn(connected); });
        return () => { connH.delete(fn); if (onErr) errH.delete(onErr); };
      },
    };
    if (isLobby) api.join = async (name) => makeRoom(await call('join', { name: String(name) }), false);
    else api.leave = () => { if (left) return Promise.resolve(); left = true; subs.delete('r' + rid); return call('leave', { rid }); };
    return api;
  }

  // ---------------------------------------------------------------- who you are
  const userNs = {
    me: () => call('user.me'),
    id: () => call('user.id'),
    profiles: (ids) => call('user.profiles', ids),
    isOwner: () => call('user.isOwner').catch(() => false),
    canEdit: () => call('user.canEdit').catch(() => false),
    can: () => Promise.resolve(null),
    search: () => Promise.resolve([]),
  };

  // ---------------------------------------------------------------- saved data (claude.ai only)
  const docSnap = (s) => ({ id: s.id, exists: s.exists, data: () => s.data, metadata: { fromCache: s.fromCache, hasPendingWrites: false } });
  const collSnap = (s) => {
    const docs = s.docs.map((d) => ({ id: d.id, exists: true, data: () => d.data }));
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: s.fromCache, hasPendingWrites: false },
      docChanges: () => s.removed.map((id) => ({ type: 'removed', doc: { id, exists: false, data: () => ({}) } })) };
  };
  function subscribe(args, kind, next, onErr) {
    let id = null, stop = false;
    call('db.sub', args).then((v) => {
      if (stop) { call('db.unsub', v).catch(() => {}); return; }
      id = v;
      subs.set('d' + id, (d) => { if (d.type === 'err') { if (onErr) onErr(d.e); } else next(kind === 'doc' ? docSnap(d.snap) : collSnap(d.snap)); });
    }, (e) => { if (onErr) onErr(e); });
    return () => { stop = true; if (id !== null) { subs.delete('d' + id); call('db.unsub', id).catch(() => {}); } };
  }
  function docRef(path) {
    return {
      id: String(path).split('/').pop(), path,
      get: () => call('db.get', { path }).then(docSnap),
      set: (data) => call('db.set', { path, data }),
      update: (data) => call('db.update', { path, data }),
      delete: () => call('db.delete', { path }),
      onSnapshot: (next, onErr) => subscribe({ path, doc: true }, 'doc', next, onErr),
      collection: (c) => collRef(path + '/' + c),
    };
  }
  function collRef(path, q = []) {
    return {
      path,
      doc: (id) => docRef(path + '/' + (id || Math.random().toString(36).slice(2))),
      orderBy: (f, dir) => collRef(path, q.concat([['orderBy', f, dir]])),
      limit: (n) => collRef(path, q.concat([['limit', n]])),
      where: (a, b, c) => collRef(path, q.concat([['where', a, b, c]])),
      get: () => call('db.query', { path, q }).then(collSnap),
      onSnapshot: (next, onErr) => subscribe({ path, q }, 'coll', next, onErr),
    };
  }
  const dbNs = { doc: docRef, collection: (p) => collRef(p) };

  // ---------------------------------------------------------------- window.claude
  const cache = {};
  window.claude = {
    use(name) {
      if (cache[name]) return cache[name];
      let p;
      if (name === 'room') p = call('room').then((info) => (info ? makeRoom(info, true) : null));
      else if (name === 'user') p = call('user').then((ok) => (ok ? userNs : null));
      else if (name === 'db') p = call('db').then((ok) => (ok ? dbNs : null));
      else p = Promise.resolve(null);
      cache[name] = p.catch(() => null);
      return cache[name];
    },
  };
  window.ChatGame = { inChat: true }; // games can check this to know they're running inside the chat
})();
