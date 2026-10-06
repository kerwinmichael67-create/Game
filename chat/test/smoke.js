// End-to-end smoke test: two players sign up, chat, make a room, and play games.
const assert = require('assert');
const os = require('os');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

process.env.PORT = 0;
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-test-'));
const server = require('../server');
const Rules = require('../shared/rules');
const Realtime = require('../realtime');

function client(port) {
  const ws = new WebSocket(`ws://localhost:${port}/ws`);
  const inbox = [];
  const waiters = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    const i = waiters.findIndex((w) => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(m);
    else inbox.push(m);
  });
  return {
    ws,
    open: new Promise((r) => ws.on('open', r)),
    send: (m) => ws.send(JSON.stringify(m)),
    wait(pred, ms = 3000) {
      const i = inbox.findIndex(pred);
      if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0]);
      return new Promise((resolve, reject) => {
        const w = { pred, resolve };
        waiters.push(w);
        setTimeout(() => reject(new Error('timeout waiting for message')), ms);
      });
    },
  };
}
const is = (t, extra) => (m) => m.t === t && (!extra || extra(m));

function unitTests() {
  // chess: fool's mate
  let s = Rules.chess.init();
  const sq = (n) => (8 - Number(n[1])) * 8 + 'abcdefgh'.indexOf(n[0]);
  const play = (idx, a, b) => { const r = Rules.chess.move(s, idx, { from: sq(a), to: sq(b) }); assert(!r.error, `${a}${b}: ${r.error}`); s = r.state; };
  assert.strictEqual(Rules.chess.legal(s).length, 20);
  play(0, 'f2', 'f3'); play(1, 'e7', 'e5'); play(0, 'g2', 'g4');
  assert(Rules.chess.move(s, 0, { from: sq('a2'), to: sq('a3') }).error, 'out of turn move rejected');
  play(1, 'd8', 'h4');
  assert.deepStrictEqual(s.result, { winner: 1, reason: 'checkmate' });
  // chess: castling + en passant
  s = Rules.chess.init();
  play(0, 'e2', 'e4'); play(1, 'a7', 'a6'); play(0, 'e4', 'e5'); play(1, 'd7', 'd5');
  play(0, 'e5', 'd6'); // en passant
  assert.strictEqual(s.board[sq('d5')], '');
  play(1, 'a6', 'a5'); play(0, 'g1', 'f3'); play(1, 'a5', 'a4'); play(0, 'f1', 'e2'); play(1, 'b7', 'b6');
  play(0, 'e1', 'g1');
  assert.strictEqual(s.board[sq('f1')], 'R');
  assert.strictEqual(s.board[sq('g1')], 'K');

  // checkers: forced capture and multi-jump
  let c = Rules.checkers.init();
  c.board = new Array(64).fill('');
  c.board[5 * 8 + 0] = 'r'; c.board[4 * 8 + 1] = 'b'; c.board[2 * 8 + 3] = 'b'; c.board[0] = 'b';
  const legal = Rules.checkers.legal(c);
  assert.deepStrictEqual(legal, [{ from: 40, to: 26, cap: 33 }]);
  c = Rules.checkers.move(c, 0, { from: 40, to: 26 }).state;
  assert.strictEqual(c.chain, 26);
  assert.strictEqual(c.turn, 0);
  c = Rules.checkers.move(c, 0, { from: 26, to: 12 }).state;
  assert.strictEqual(c.turn, 1);

  // connect four vertical win
  let f = Rules.connect4.init();
  for (const [p, col] of [[0, 0], [1, 1], [0, 0], [1, 1], [0, 0], [1, 1], [0, 0]]) f = Rules.connect4.move(f, p, { col }).state;
  assert.deepStrictEqual(f.result, { winner: 0, reason: 'four in a row' });

  // snake: runs to completion
  let sn = Realtime.snake.init(), res = null;
  Realtime.snake.input(sn, 0, { dir: 'D' });
  for (let i = 0; i < 1000 && !res; i++) res = Realtime.snake.tick(sn);
  assert(res && [0, 1, -1].includes(res.winner));

  // fighter: player 0 punches a passive player 1 until the match ends
  const fg = Realtime.fighter.init();
  res = null;
  for (let i = 0; i < 60000 && !res; i++) {
    Realtime.fighter.input(fg, 0, { r: true, p: i % 4 < 2 });
    res = Realtime.fighter.tick(fg);
  }
  assert.strictEqual(res && res.winner, 0);

  // pong: nobody moves, someone eventually wins
  const pg = Realtime.pong.init();
  res = null;
  for (let i = 0; i < 20000 && !res; i++) res = Realtime.pong.tick(pg);
  assert(res && res.winner >= 0);
  // Tower Defense rules
  const TD = require('../public/td.js');
  const td = TD.create();
  assert.strictEqual(td.money, 350);
  assert.deepStrictEqual(TD.ORDER.map((k) => TD.TOWERS[k].cost), [100, 250, 200, 150, 75]);
  assert.deepStrictEqual(TD.ORDER.map((k) => TD.TOWERS[k].max), [Infinity, 5, 8, 5, 7]);
  for (const k of TD.ORDER) {
    const up = TD.TOWERS[k].up;
    assert.strictEqual(up.length, 5, k + ' has 5 upgrades');
    assert(up.every((c, i) => i === 0 || c > up[i - 1]), k + ' upgrades get dearer');
  }
  assert.strictEqual(TD.TOWERS.farm.lv[0].income, 25);
  assert.strictEqual(TD.TOWERS.farm.lv[5].income, 250);
  assert.strictEqual(TD.place(td, 'pistol', 400, 70), 'Can’t build on the road');
  assert.strictEqual(TD.place(td, 'pistol', 400, 135), null);
  assert.strictEqual(td.money, 250);
  assert.match(TD.place(td, 'sniper', 401, 136), /Too close/);
  td.money = 1e6;
  const spots = [];
  for (let x = 30; x <= 770; x += 40) for (const y of [20, 135, 265, 395, 480]) spots.push([x, y]);
  const tryAll = (st, type) => spots.filter(([x, y]) => !TD.place(st, type, x, y)).length;
  for (const [type, max] of [['machinegun', 5], ['sniper', 8], ['flamethrower', 5], ['farm', 7]]) {
    const fresh = Object.assign(TD.create(), { money: 1e6 });
    assert.strictEqual(tryAll(fresh, type), max, type + ' limit');
  }
  assert.strictEqual(td.towers.length + tryAll(td, 'pistol'), 20, 'pistols only stop at 20 towers');
  assert.match(TD.place(td, 'farm', 30, 480), /only have 20/);
  const gone = td.towers[td.towers.length - 1];
  TD.sell(td, gone.id);
  assert.strictEqual(TD.place(td, 'farm', gone.x, gone.y), null);
  const farm = td.towers.find((t) => t.type === 'farm');
  for (let i = 0; i < 5; i++) assert.strictEqual(TD.upgrade(td, farm.id), null);
  assert.strictEqual(TD.upgrade(td, farm.id), 'Fully upgraded');
  for (const n of [5, 10, 25]) assert(TD.waveList(n).some(([k]) => TD.ENEMIES[k].boss), `boss on wave ${n}`);
  for (const n of [4, 6, 9, 11, 24]) assert(!TD.waveList(n).some(([k]) => TD.ENEMIES[k].boss), `no boss on wave ${n}`);
  // a full game with the hard bot reaches the end
  const tb = TD.create();
  for (let i = 0, ai = 0; i < 30 * 60 * 40 && tb.phase !== 'dead' && tb.phase !== 'won'; i++) {
    TD.step(tb, 1 / 30);
    if (i % 15 === 0) while (TD.ai(tb, 'hard'));
  }
  assert.strictEqual(tb.phase, 'won', `hard bot beats wave 25 (got to ${tb.cleared})`);
  // a browser-moved paddle / mallet may only move a short way per message, and stays in bounds
  const pp = Realtime.pong.init();
  Realtime.pong.input(pp, 1, { y: 9999 });
  assert.strictEqual(pp.p[1].y, 205 + 60);
  Realtime.pong.tick(pp);
  assert.strictEqual(pp.p[1].y, 265, 'a browser-moved paddle is not also moved by keys');
  const hk = Realtime.hockey.init();
  Realtime.hockey.input(hk, 1, { mx: 0, my: -500, vx: 99, vy: 0 });
  assert(hk.m[1].x >= hk.W / 2 + hk.mallet && hk.m[1].y === 240 - 80 && hk.m[1].vx === hk.speed);
  console.log('✓ game rules');
}

async function e2e(port) {
  const a = client(port), b = client(port);
  await Promise.all([a.open, b.open]);
  a.send({ t: 'register', username: 'Bob', password: '12345', name: 'Bob' });
  const helloA = await a.wait(is('hello'));
  assert.strictEqual(helloA.me.username, 'Bob');
  assert(!('hash' in helloA.me) && !('salt' in helloA.me), 'no secrets leaked');
  b.send({ t: 'register', username: 'bob', password: 'x1234' });
  assert.strictEqual((await b.wait(is('error'))).text, 'That username is taken');
  b.send({ t: 'register', username: 'Jerry', password: 'abcd' });
  await b.wait(is('hello'));
  await a.wait(is('user', (m) => m.user.username === 'Jerry' && m.user.presence === 'online'));

  // global chat
  a.send({ t: 'msg', room: 'global', text: 'Hello everyone' });
  const got = await b.wait(is('msg', (m) => m.msg.text === 'Hello everyone'));
  assert.strictEqual(got.msg.from, 'Bob');

  // replies and edits
  b.send({ t: 'msg', room: 'global', text: 'nice one', replyTo: got.msg.id });
  const rep = await a.wait(is('msg', (m) => m.msg.text === 'nice one'));
  assert.deepStrictEqual(rep.msg.replyTo, { id: got.msg.id, from: 'Bob', text: 'Hello everyone', file: null });
  b.send({ t: 'msg', room: 'global', text: 'fake quote', replyTo: 'nope' });
  assert.strictEqual((await a.wait(is('msg', (m) => m.msg.text === 'fake quote'))).msg.replyTo, undefined);
  b.send({ t: 'edit', room: 'global', id: got.msg.id, text: 'hacked' });
  assert.strictEqual((await b.wait(is('error'))).text, 'You can only edit your own messages');
  a.send({ t: 'edit', room: 'global', id: got.msg.id, text: 'Hello everyone!!' });
  const ed = await b.wait(is('msgEdit', (m) => m.msg.id === got.msg.id));
  assert.strictEqual(ed.msg.text, 'Hello everyone!!');
  assert.strictEqual(ed.msg.history[0].text, 'Hello everyone');
  assert(ed.msg.editedAt >= ed.msg.ts);

  // reactions, polls, delete
  b.send({ t: 'react', room: 'global', id: got.msg.id, emoji: '🔥' });
  a.send({ t: 'react', room: 'global', id: got.msg.id, emoji: '🔥' });
  await a.wait(is('msgEdit', (m) => m.msg.reactions && m.msg.reactions['🔥'] && m.msg.reactions['🔥'].length === 2));
  b.send({ t: 'react', room: 'global', id: got.msg.id, emoji: '🔥' });
  assert.deepStrictEqual((await a.wait(is('msgEdit', (m) => m.msg.reactions && m.msg.reactions['🔥'].join() === 'Bob'))).msg.reactions, { '🔥': ['Bob'] });
  b.send({ t: 'react', room: 'global', id: got.msg.id, emoji: '<b>' }); // not one of the reactions: ignored
  a.send({ t: 'msg', room: 'global', text: '', poll: { q: 'Play what?', options: ['Chess', '', 'Snake', 'Pong'] } });
  const pm = await b.wait(is('msg', (m) => m.msg.poll));
  assert.deepStrictEqual(pm.msg.poll.options.map((o) => o.text), ['Chess', 'Snake', 'Pong']);
  b.send({ t: 'vote', room: 'global', id: pm.msg.id, option: 1 });
  a.send({ t: 'vote', room: 'global', id: pm.msg.id, option: 1 });
  await b.wait(is('msgEdit', (m) => m.msg.id === pm.msg.id && m.msg.poll.options[1].votes.length === 2));
  b.send({ t: 'vote', room: 'global', id: pm.msg.id, option: 0 }); // change vote
  const pv = await a.wait(is('msgEdit', (m) => m.msg.id === pm.msg.id && m.msg.poll.options[0].votes.length === 1));
  assert.deepStrictEqual(pv.msg.poll.options.map((o) => o.votes), [['Jerry'], ['Bob'], []]);
  a.send({ t: 'edit', room: 'global', id: pm.msg.id, text: 'x' });
  assert.strictEqual((await a.wait(is('error'))).text, 'Polls can’t be edited');
  a.send({ t: 'msg', room: 'global', text: '', poll: { q: 'Only one?', options: ['a'] } }); // needs two options: dropped
  a.send({ t: 'msg', room: 'global', text: 'delete me' });
  const dmsg = await b.wait(is('msg', (m) => m.msg.text === 'delete me'));
  b.send({ t: 'del', room: 'global', id: dmsg.msg.id });
  assert.strictEqual((await b.wait(is('error'))).text, 'You can only delete your own messages');
  a.send({ t: 'del', room: 'global', id: dmsg.msg.id });
  const gone = await b.wait(is('msgEdit', (m) => m.msg.id === dmsg.msg.id));
  assert.deepStrictEqual(gone.msg, { id: dmsg.msg.id, ts: dmsg.msg.ts, from: 'Bob', text: '', deleted: true });
  b.send({ t: 'msg', room: 'global', text: 'reply to gone', replyTo: dmsg.msg.id });
  assert.strictEqual((await a.wait(is('msg', (m) => m.msg.text === 'reply to gone'))).msg.replyTo, undefined);

  // private room
  a.send({ t: 'createRoom', name: 'Secret club', members: ['Jerry'] });
  const opened = await a.wait(is('openRoom'));
  await b.wait(is('room', (m) => m.room.id === opened.id));
  b.send({ t: 'msg', room: opened.id, text: 'hi bob' });
  await a.wait(is('msg', (m) => m.room === opened.id && m.msg.text === 'hi bob'));

  // DM
  b.send({ t: 'dm', with: 'Bob' });
  const dm = await b.wait(is('openRoom'));
  await a.wait(is('room', (m) => m.room.id === dm.id && m.room.dm));

  // profile
  a.send({ t: 'profile', data: { bio: 'Hello guys', status: 'online', bg: 'black', avatar: '#ff00ff', favorites: ['snake', 'chess', 'nope'] } });
  const me = await a.wait(is('me'));
  assert.deepStrictEqual(me.me.favorites, ['snake', 'chess']);
  assert.strictEqual(me.me.bg, 'black');
  a.send({ t: 'friend', username: 'Jerry', add: true });
  assert.deepStrictEqual((await a.wait(is('me', (m) => m.me.friends.length))).me.friends, ['Jerry']);

  // chess challenge -> fool's mate, Jerry (black) wins
  a.send({ t: 'gameInvite', game: 'chess', to: 'Jerry', room: 'global' });
  const inv = await b.wait(is('invite'));
  b.send({ t: 'gameRespond', id: inv.invite.id, accept: true });
  const startA = await a.wait(is('gameStart'));
  await b.wait(is('gameStart'));
  assert.strictEqual(startA.you, 0);
  const sq = (n) => (8 - Number(n[1])) * 8 + 'abcdefgh'.indexOf(n[0]);
  const mv = (c, x, y) => c.send({ t: 'gameInput', id: startA.id, input: { from: sq(x), to: sq(y) } });
  mv(a, 'f2', 'f3'); await b.wait(is('gameState'));
  mv(b, 'e7', 'e5'); await a.wait(is('gameState', (m) => m.state.turn === 0 && m.state.last));
  mv(b, 'a7', 'a6');
  assert.strictEqual((await b.wait(is('gameError'))).text, 'Not your turn');
  mv(a, 'g2', 'g4'); await b.wait(is('gameState', (m) => m.state.turn === 1 && m.state.board[sq('g4')] === 'P'));
  mv(b, 'd8', 'h4');
  const over = await a.wait(is('gameOver'));
  assert.deepStrictEqual(over.result, { winner: 1, reason: 'checkmate' });
  await a.wait(is('msg', (m) => m.msg.sys && m.msg.text.includes('Jerry beat Bob at Chess')));

  // tetris relay: garbage goes to the opponent, topping out ends the game
  b.send({ t: 'gameInvite', game: 'tetris', to: 'Bob' });
  const inv2 = await a.wait(is('invite'));
  a.send({ t: 'gameRespond', id: inv2.invite.id, accept: true });
  const t = await b.wait(is('gameStart'));
  await a.wait(is('gameStart'));
  b.send({ t: 'gameInput', id: t.id, input: { kind: 'garbage', n: 4 } });
  assert.strictEqual((await a.wait(is('gameEvent'))).ev.garbage, 4);
  a.send({ t: 'gameInput', id: t.id, input: { kind: 'dead' } });
  assert.strictEqual((await b.wait(is('gameOver', (m) => m.id === t.id))).result.winner, 0);

  // snake: realtime state streams and forfeit ends it
  a.send({ t: 'gameInvite', game: 'snake', to: 'Jerry' });
  const inv3 = await b.wait(is('invite'));
  b.send({ t: 'gameRespond', id: inv3.invite.id, accept: true });
  const sn = await a.wait(is('gameStart'));
  a.send({ t: 'gameInput', id: sn.id, input: { dir: 'D' } });
  await a.wait(is('gameState', (m) => m.id === sn.id && m.state.snakes[0].dir === 'D'));
  a.send({ t: 'gameLeave', id: sn.id });
  assert.strictEqual((await b.wait(is('gameOver', (m) => m.id === sn.id))).result.winner, 1);

  // do-not-disturb blocks challenges
  b.send({ t: 'profile', data: { status: 'idle' } });
  await b.wait(is('me', (m) => m.me.status === 'idle'));
  a.send({ t: 'gameInvite', game: 'pong', to: 'Jerry' });
  assert.match((await a.wait(is('error'))).text, /do not disturb/);

  // new games work online: reversi move, light cycles steering, air hockey aiming
  const playOnline = async (game) => {
    a.send({ t: 'gameInvite', game, to: 'Jerry', room: 'global' });
    const iv = await b.wait(is('invite', (m) => m.invite.game === game));
    b.send({ t: 'gameRespond', id: iv.invite.id, accept: true });
    const st = await a.wait(is('gameStart', (m) => m.game === game));
    await b.wait(is('gameStart', (m) => m.game === game));
    return st;
  };
  b.send({ t: 'profile', data: { status: 'online' } });
  await b.wait(is('me', (m) => m.me.status === 'online'));
  let g = await playOnline('reversi');
  a.send({ t: 'gameInput', id: g.id, input: { cell: 19 } });
  const rv = await b.wait(is('gameState', (m) => m.id === g.id));
  assert.strictEqual(rv.state.board[19], 0);
  assert.strictEqual(rv.state.board[27], 0); // flipped
  a.send({ t: 'gameLeave', id: g.id });
  await b.wait(is('gameOver', (m) => m.id === g.id));
  g = await playOnline('tron');
  b.send({ t: 'gameInput', id: g.id, input: { dir: 'U' } });
  await a.wait(is('gameState', (m) => m.id === g.id && m.state.p[1].dir === 'U'), 5000);
  a.send({ t: 'gameLeave', id: g.id });
  await b.wait(is('gameOver', (m) => m.id === g.id));
  g = await playOnline('hockey');
  b.send({ t: 'gameInput', id: g.id, input: { tx: 700, ty: 100 } });
  await a.wait(is('gameState', (m) => m.id === g.id && m.state.m[1].y < 200), 5000);
  a.send({ t: 'gameLeave', id: g.id });
  await b.wait(is('gameOver', (m) => m.id === g.id));

  // calls: ring, answer, relay connection details both ways, hang up
  assert(Array.isArray(helloA.calls.iceServers) && helloA.calls.iceServers.length);
  a.send({ t: 'call', to: 'Jerry', video: true });
  const ringing = await a.wait(is('callRinging'));
  const inc = await b.wait(is('callIncoming'));
  assert.strictEqual(inc.from, 'Bob');
  assert.strictEqual(inc.video, true);
  b.send({ t: 'call', to: 'Bob' });
  assert.strictEqual((await b.wait(is('error'))).text, 'You’re already in a call');
  b.send({ t: 'callAnswer', id: inc.id, accept: true });
  await a.wait(is('callAccepted', (m) => m.id === ringing.id));
  a.send({ t: 'callSignal', id: ringing.id, data: { description: { type: 'offer', sdp: 'v=0' } } });
  assert.strictEqual((await b.wait(is('callSignal'))).data.description.type, 'offer');
  b.send({ t: 'callSignal', id: inc.id, data: { cam: false } });
  assert.strictEqual((await a.wait(is('callSignal'))).data.cam, false);
  a.send({ t: 'callEnd', id: ringing.id });
  const ended = await b.wait(is('callEnded'));
  assert.strictEqual(ended.reason, 'ended');
  assert.strictEqual(ended.by, 'Bob');
  await a.wait(is('callEnded'));
  b.send({ t: 'call', to: 'Bob' });
  const inc2 = await a.wait(is('callIncoming'));
  a.send({ t: 'callAnswer', id: inc2.id, accept: false });
  assert.strictEqual((await b.wait(is('callEnded', (m) => m.id === inc2.id))).reason, 'declined');
  await a.wait(is('callEnded', (m) => m.id === inc2.id));

  // apex rush: car updates and events pass straight through; the reported result ends the game
  g = await playOnline('apex');
  a.send({ t: 'gameInput', id: g.id, input: { kind: 'msg', data: { k: 's', x: 10, y: 20 } } });
  assert.deepStrictEqual((await b.wait(is('gameEvent', (m) => m.id === g.id))).ev.msg, { k: 's', x: 10, y: 20 });
  b.send({ t: 'gameInput', id: g.id, input: { kind: 'msg', data: { k: 'jolt' } } });
  assert.strictEqual((await a.wait(is('gameEvent', (m) => m.id === g.id))).ev.msg.k, 'jolt');
  a.send({ t: 'gameInput', id: g.id, input: { kind: 'msg', data: { k: 's', junk: 'x'.repeat(3000) } } }); // too big: dropped
  a.send({ t: 'gameInput', id: g.id, input: { kind: 'result', winner: 1, reason: '1:02.345 vs 1:03.001' } });
  const apexOver = await b.wait(is('gameOver', (m) => m.id === g.id));
  assert.deepStrictEqual(apexOver.result, { winner: 1, reason: '1:02.345 vs 1:03.001' });
  await a.wait(is('msg', (m) => m.msg.sys && m.msg.text.includes('Jerry beat Bob at Apex Rush 3D')));
  // tower defense: progress reports are passed along, the result ends the game
  a.send({ t: 'gameInvite', game: 'td', to: 'Jerry', room: 'global' });
  const tdInv = await b.wait(is('invite', (m) => m.invite.game === 'td'));
  b.send({ t: 'gameRespond', id: tdInv.invite.id, accept: true });
  const tdStart = await a.wait(is('gameStart', (m) => m.game === 'td'));
  await b.wait(is('gameStart', (m) => m.game === 'td'));
  a.send({ t: 'gameInput', id: tdStart.id, input: { kind: 'msg', data: { k: 's', t: 1, w: 3, c: 2, l: 90, tw: [[0, 400, 135, 1]] } } });
  assert.strictEqual((await b.wait(is('gameEvent', (m) => m.id === tdStart.id))).ev.msg.c, 2);
  b.send({ t: 'gameInput', id: tdStart.id, input: { kind: 'result', winner: 0, reason: 'survived 2 waves vs 1' } });
  assert.strictEqual((await a.wait(is('gameOver', (m) => m.id === tdStart.id))).result.winner, 0);
  await b.wait(is('msg', (m) => m.msg.sys && m.msg.text.includes('Bob beat Jerry at Tower Defense')));

  // file uploads: upload, send, receive; only your own uploads can be attached; served safely
  const base = `http://localhost:${port}`;
  const up = (token, name, type, body) => fetch(base + '/upload', { method: 'POST', body, headers: { 'X-Token': token, 'X-File-Name': encodeURIComponent(name), 'Content-Type': type } });
  assert.strictEqual((await up('nope', 'a.txt', 'text/plain', 'hi')).status, 401);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000502027fa3a3c6f20000000049454e44ae426082', 'hex');
  const res = await up(helloA.token, 'cat photo.png', 'image/png', png);
  assert.strictEqual(res.status, 200);
  const meta = await res.json();
  assert.match(meta.url, /^\/files\/[A-Za-z0-9_-]{16}$/);
  a.send({ t: 'msg', room: 'global', text: '', file: meta });
  const fm = await b.wait(is('msg', (m) => m.msg.file));
  assert.deepStrictEqual(fm.msg.file, { url: meta.url, name: 'cat photo.png', type: 'image/png', size: png.length });
  b.send({ t: 'msg', room: 'global', text: 'stolen', file: meta }); // Jerry can't attach Bob's upload
  const plain = await a.wait(is('msg', (m) => m.msg.text === 'stolen'));
  assert.strictEqual(plain.msg.file, undefined);
  const served = await fetch(base + meta.url);
  assert.strictEqual(served.headers.get("content-type"), "image/png");
  assert.match(served.headers.get("content-security-policy"), /sandbox/);
  assert.deepStrictEqual(Buffer.from(await served.arrayBuffer()), png);
  const part = await fetch(base + meta.url, { headers: { Range: 'bytes=0-7' } });
  assert.strictEqual(part.status, 206);
  assert.strictEqual((await part.arrayBuffer()).byteLength, 8);
  const html = await (await up(helloA.token, 'x.html', 'text/html', '<script>alert(1)</script>')).json();
  const h = await fetch(base + html.url);
  assert.strictEqual(h.headers.get('content-type'), 'application/octet-stream');
  assert.match(h.headers.get('content-disposition'), /^attachment/);
  assert.strictEqual((await up(helloA.token, 'big.bin', 'application/octet-stream', Buffer.alloc(10 * 1024 * 1024 + 1))).status, 413);
  assert.strictEqual((await fetch(base + '/files/../../server.js')).status, 404);

  // profile photo: only your own image upload
  b.send({ t: 'profile', data: { photo: meta } }); // Bob's upload
  await b.wait(is('me'));
  assert.strictEqual((await b.wait(is('user', (m) => m.user.username === 'Jerry'))).user.photo, null);
  a.send({ t: 'profile', data: { photo: html } }); // not an image
  assert.strictEqual((await a.wait(is('me'))).me.photo, null);
  a.send({ t: 'profile', data: { photo: meta } });
  assert.strictEqual((await b.wait(is('user', (m) => m.user.username === 'Bob' && m.user.photo))).user.photo, meta.url);
  a.send({ t: 'profile', data: { photo: null } });
  assert.strictEqual((await b.wait(is('user', (m) => m.user.username === 'Bob' && !m.user.photo))).user.photo, null);

  // resume with token
  const c = client(port);
  await c.open;
  c.send({ t: 'resume', token: helloA.token });
  assert.strictEqual((await c.wait(is('hello'))).me.username, 'Bob');
  c.send({ t: 'login', username: 'bob', password: 'wrong' });
  a.ws.close(); b.ws.close(); c.ws.close();
  console.log('✓ chat + multiplayer end-to-end');
}

(async () => {
  unitTests();
  await new Promise((r) => (server.listening ? r() : server.once('listening', r)));
  await e2e(server.address().port);
  fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
