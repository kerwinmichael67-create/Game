// Fake artifact runtime for tests: window.claude.use('room' | 'user' | 'db').
// Faithful where it matters to the game: presence is merged per field and capped at 4 KiB, peers and db
// snapshots are deep-frozen copies, and everything resolves asynchronously.
// Test controls live on window.__mock:
//   __mock.lobby / __mock.room(name)        → room state with .remote(peerId) → { join(presence), update(patch), leave() }
//   __mock.db._store (Map path → document)   → seed or inspect documents
(() => {
  const O = window.__mockOpts || {};
  const ME = O.mePeer || 'peer-m';
  const UID = O.userId || 'u_mocktestuser0000000000';
  const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o)));
  const freeze = (o) => {
    if (o && typeof o === 'object') {
      Object.values(o).forEach(freeze);
      Object.freeze(o);
    }
    return o;
  };
  const rooms = new Map();

  function makeRoom(name) {
    const st = { name, pres: new Map([[ME, {}]]), peersFns: [], topics: new Map(), emitted: [] };
    const mk = (peer, presence) =>
      freeze({
        peer,
        by: null,
        isMe: peer === ME,
        sameTab: peer === ME,
        kind: 'viewer',
        guest: false,
        presence: clone(presence),
        updatedAt: Date.now(),
      });
    const snapshot = () => freeze([...st.pres.entries()].map(([peer, p]) => mk(peer, p)));
    const notify = (kind, peerObj) => {
      const peers = snapshot();
      const change = { peers, joined: [], left: [], updated: [] };
      change[kind] = [peerObj];
      for (const f of st.peersFns.slice()) f(change);
    };
    const merge = (target, patch) => {
      for (const k in patch) {
        if (patch[k] === null) delete target[k];
        else target[k] = clone(patch[k]);
      }
    };
    const api = {
      name,
      emit: async (topic, data) => {
        st.emitted.push({ topic, data });
        for (const f of st.topics.get(topic) || [])
          f(freeze({ topic, data: clone(data), peer: ME, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false }));
      },
      on: (topic, fn) => {
        if (!st.topics.has(topic)) st.topics.set(topic, []);
        st.topics.get(topic).push(fn);
        return () =>
          st.topics.set(
            topic,
            (st.topics.get(topic) || []).filter((x) => x !== fn)
          );
      },
      presence: async (patch) => {
        const next = clone(st.pres.get(ME));
        merge(next, patch);
        if (JSON.stringify(next).length > 4096) throw { code: 'invalid_argument', message: 'presence exceeds 4 KiB' };
        st.pres.set(ME, next);
        queueMicrotask(() => notify('updated', mk(ME, next)));
      },
      peers: () => snapshot(),
      onPeers: (fn) => {
        st.peersFns.push(fn);
        queueMicrotask(() => {
          const peers = snapshot();
          fn({ peers, joined: peers, left: [], updated: [] });
        });
        return () => {
          st.peersFns = st.peersFns.filter((x) => x !== fn);
        };
      },
      connected: () => true,
      onConnection: (fn) => {
        queueMicrotask(() => fn(true));
        return () => {};
      },
      leave: async () => {
        st.peersFns = [];
        st.pres.set(ME, {});
      },
      join: async (n) => room(n).api,
    };
    /* test control for a simulated remote peer */
    const remote = (peer = 'peer-r') => ({
      join(presence = {}) {
        st.pres.set(peer, clone(presence));
        notify('joined', mk(peer, presence));
      },
      update(patch) {
        const next = clone(st.pres.get(peer) || {});
        merge(next, patch);
        st.pres.set(peer, next);
        notify('updated', mk(peer, next));
      },
      leave() {
        const last = mk(peer, st.pres.get(peer) || {});
        st.pres.delete(peer);
        notify('left', last);
      },
    });
    return { api, st, remote, myPresence: () => st.pres.get(ME) };
  }
  function room(name) {
    if (!rooms.has(name)) rooms.set(name, makeRoom(name));
    return rooms.get(name);
  }
  const lobby = makeRoom('lobby');

  /* document store: get() hands out frozen copies, like the real runtime */
  const store = new Map();
  const docRef = (path) => ({
    path,
    id: path.split('/').pop(),
    get: async () => ({
      id: path.split('/').pop(),
      exists: store.has(path),
      data: () => (store.has(path) ? freeze(clone(store.get(path))) : undefined),
      metadata: { fromCache: false, hasPendingWrites: false },
    }),
    set: async (d) => {
      if (!d || typeof d !== 'object') throw { code: 'invalid_argument', message: 'document must be an object' };
      if (JSON.stringify(d).length > 256 * 1024) throw { code: 'invalid_argument', message: 'document over 256 KiB' };
      store.set(path, clone(d));
    },
    update: async (d) => {
      if (!store.has(path)) throw { code: 'invalid_argument', message: 'document does not exist' };
      store.set(path, Object.assign({}, store.get(path), clone(d)));
    },
    delete: async () => {
      store.delete(path);
    },
  });
  const db = {
    doc: docRef,
    collection: (path) => {
      const q = {
        path,
        limit: () => q,
        where: () => q,
        orderBy: () => q,
        doc: (id) => docRef(path + '/' + id),
        get: async () => {
          const docs = [];
          for (const [k, v] of store) {
            const rest = k.startsWith(path + '/') ? k.slice(path.length + 1) : null;
            if (rest && rest.indexOf('/') < 0) docs.push({ id: rest, exists: true, data: () => freeze(clone(v)), metadata: {} });
          }
          return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
        },
      };
      return q;
    },
    _store: store,
  };
  const user = {
    id: async () => UID,
    isOwner: async () => true,
    canEdit: async () => true,
    can: async () => true,
    me: async () => ({ id: UID, name: '', email: null }),
    profiles: async (ids) => Object.fromEntries(ids.map((i) => [i, { name: '', avatar: null }])),
  };

  window.__mock = { lobby, room, rooms, db, ME, UID };
  window.claude = {
    use: async (name) => (O.offline ? null : name === 'room' ? lobby.api : name === 'user' ? user : name === 'db' ? db : null),
  };
})();
