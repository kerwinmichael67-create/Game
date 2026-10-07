/* =========================================================================
   account.js — profiles and sign-in.

   Two separate things wear the word "login" here, and they are not the same:

   1. PROFILES.  Several people share one browser, each with their own
      coins, unlocks and stats.  A profile may carry a passcode, which stops
      a sibling opening your save by accident.  It is NOT security: the data
      lives in this browser, the check runs in this browser, and anyone who
      can open the devtools can walk straight past it.  The UI says so.

   2. YOUR CLAUDE ACCOUNT.  On the published page the viewer is already
      signed in to claude.ai, and the `user` capability will tell us who
      they are.  That identity is real — the platform vouches for it, not
      the page — so co-op uses it for names when it is available, and a
      profile can adopt it with one click.

   Profiles are stored as an index; each profile's save sits under its own
   key, handled by TD.Save.use().
   ========================================================================= */
(function () {
  const IDX = 'laststand.accounts.v1';

  const Account = TD.Account = {
    users: [],          // [{id, name, pin, created, seen}]
    activeId: null,     // null = the guest profile
    claude: null,       // {id, name, avatarUrl} once the platform answers
    claudeState: 'unknown'   // 'unknown' | 'none' | 'signed-in'
  };

  let usable = true;
  try { localStorage.getItem(IDX); } catch (e) { usable = false; }

  function readIndex() {
    if (!usable) return { active: null, users: [] };
    let raw = null;
    try { raw = localStorage.getItem(IDX); } catch (e) { }
    let d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!d || !Array.isArray(d.users)) return { active: null, users: [] };
    return { active: d.active || null, users: d.users.filter(u => u && u.id) };
  }
  function writeIndex() {
    if (!usable) return;
    try {
      localStorage.setItem(IDX, JSON.stringify({ active: Account.activeId, users: Account.users }));
    } catch (e) { /* storage full or blocked — the session still works */ }
  }

  /* Not a password hash and not pretending to be one: it keeps a passcode
     out of plain sight in localStorage, nothing more. */
  function scramble(pin) {
    const s = String(pin || '');
    if (!s) return '';
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  const cleanName = n => String(n || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().slice(0, 16);

  Account.init = function () {
    const idx = readIndex();
    Account.users = idx.users;
    Account.activeId = idx.active;
    /* A profile that has been deleted elsewhere must not strand us. */
    if (Account.activeId && !Account.users.some(u => u.id === Account.activeId)) Account.activeId = null;
    TD.Save.use(Account.activeId, Account.nameOf(Account.activeId));
  };

  Account.nameOf = function (id) {
    if (!id) return null;
    const u = Account.users.find(x => x.id === id);
    return u ? u.name : null;
  };

  Account.current = function () {
    if (!Account.activeId) return { id: null, name: TD.Save.data.name, guest: true, locked: false };
    const u = Account.users.find(x => x.id === Account.activeId);
    if (!u) return { id: null, name: TD.Save.data.name, guest: true, locked: false };
    return { id: u.id, name: u.name, guest: false, locked: !!u.pin };
  };

  Account.hasPin = id => { const u = Account.users.find(x => x.id === id); return !!(u && u.pin); };

  /* ------------------------------------------------------------------ */
  Account.create = function (name, pin) {
    name = cleanName(name);
    if (!name) return { ok: false, why: 'Pick a name.' };
    if (Account.users.length >= 8) return { ok: false, why: 'That is eight profiles already.' };
    if (Account.users.some(u => u.name.toLowerCase() === name.toLowerCase()))
      return { ok: false, why: 'A profile with that name already exists.' };
    const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    Account.users.push({ id: id, name: name, pin: scramble(pin), created: Date.now(), seen: Date.now() });
    Account.activeId = id;
    writeIndex();
    TD.Save.use(id, name);
    TD.Save.data.name = name;
    TD.Save.save();
    return { ok: true, id: id };
  };

  Account.signIn = function (id, pin) {
    const u = Account.users.find(x => x.id === id);
    if (!u) return { ok: false, why: 'No such profile.' };
    if (u.pin && scramble(pin) !== u.pin) return { ok: false, why: 'Wrong passcode.' };
    u.seen = Date.now();
    Account.activeId = id;
    writeIndex();
    TD.Save.use(id, u.name);
    TD.Save.data.name = u.name;
    TD.Save.save();
    return { ok: true };
  };

  Account.signOut = function () {
    Account.activeId = null;
    writeIndex();
    TD.Save.use(null);
    if (TD.Coop && TD.Coop.active) TD.Coop.leave();
  };

  Account.rename = function (name) {
    name = cleanName(name);
    if (!name) return false;
    const u = Account.users.find(x => x.id === Account.activeId);
    if (u) { u.name = name; writeIndex(); }
    TD.Save.data.name = name;
    TD.Save.save();
    return true;
  };

  Account.setPin = function (pin) {
    const u = Account.users.find(x => x.id === Account.activeId);
    if (!u) return false;
    u.pin = scramble(pin);
    writeIndex();
    return true;
  };

  Account.remove = function (id) {
    const i = Account.users.findIndex(x => x.id === id);
    if (i < 0) return false;
    Account.users.splice(i, 1);
    if (usable) { try { localStorage.removeItem('laststand.save.v1::' + id); } catch (e) { } }
    if (Account.activeId === id) { Account.activeId = null; TD.Save.use(null); }
    writeIndex();
    return true;
  };

  /* ------------------------------------------------------------------
     The real one: who claude.ai says is viewing this page.
     ------------------------------------------------------------------ */
  let asked = null;
  Account.askClaude = function () {
    if (asked) return asked;
    asked = (async () => {
      try {
        if (!window.claude || typeof window.claude.use !== 'function') { Account.claudeState = 'none'; return null; }
        const u = await window.claude.use('user');
        if (!u) { Account.claudeState = 'none'; return null; }
        const me = await u.me();                       // never rejects, never null
        Account.claude = { id: me.id || null, name: me.name || '', avatarUrl: me.avatarUrl || null };
        Account.claudeState = (me.id || me.name) ? 'signed-in' : 'none';
        return Account.claude;
      } catch (e) {
        Account.claudeState = 'none';
        return null;
      }
    })();
    return asked;
  };

  /* Take the claude.ai display name as this profile's name. */
  Account.adoptClaudeName = function () {
    if (!Account.claude || !Account.claude.name) return false;
    return Account.rename(Account.claude.name);
  };
})();
