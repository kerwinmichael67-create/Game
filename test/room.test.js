import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/room.js';
import { CONFIG, plotToWorld } from '../shared/config.js';
import { ITEMS, ITEM_BY_ID, SPECIAL_PADS } from '../shared/items.js';

function fakeWs() { return { readyState: 1, sent: [], send(d) { this.sent.push(JSON.parse(d)); } }; }

function makeRoom() {
  let clock = 1_000_000;
  const room = new Room('TEST', { now: () => clock });
  room.advanceClock = (ms) => { clock += ms; };
  return room;
}

function standOn(player, plotIdx, local) {
  const w = plotToWorld(plotIdx, local[0], local[1]);
  player.pos.x = w.x; player.pos.z = w.z;
}

function runFor(room, seconds) {
  const dt = 1 / CONFIG.TICK_RATE;
  for (let t = 0; t < seconds; t += dt) room.tick(dt);
}

test('player joins, claims a plot, gets the free dropper and earns cash', () => {
  const room = makeRoom();
  const p = room.addPlayer(fakeWs(), { name: 'Alice' });
  assert.equal(p.name, 'Alice');
  assert.equal(p.plotIdx, null);

  // Too far away: denied.
  p.pos.x = 0; p.pos.z = 0;
  assert.equal(room.handlePad(p, { plot: 0, pad: 'claim' }).ok, false);

  standOn(p, 0, SPECIAL_PADS.claim.pad);
  assert.equal(room.handlePad(p, { plot: 0, pad: 'claim' }).ok, true);
  assert.equal(p.plotIdx, 0);
  assert.equal(room.plots[0].ownerId, p.id);

  // Another player cannot claim the same plot.
  const q = room.addPlayer(fakeWs(), { name: 'Bob' });
  standOn(q, 0, SPECIAL_PADS.claim.pad);
  assert.equal(room.handlePad(q, { plot: 0, pad: 'claim' }).reason, 'owned');

  // Buy the free dropper.
  standOn(p, 0, ITEM_BY_ID.dropper1.pad);
  assert.equal(room.handlePad(p, { plot: 0, pad: 'dropper1' }).ok, true);
  assert.ok(room.plots[0].owned.has('dropper1'));

  // Locked item is refused.
  standOn(p, 0, ITEM_BY_ID.dropper3.pad);
  assert.equal(room.handlePad(p, { plot: 0, pad: 'dropper3' }).reason, 'locked');

  // Run the sim: cubes travel to the collector and fill the pool.
  runFor(room, 30);
  assert.ok(room.plots[0].pool > 20, `pool was ${room.plots[0].pool}`);
  assert.ok(room.drops.length > 10);

  // Collect requires standing on the collector pad and owning the plot.
  assert.equal(room.handlePad(p, { plot: 0, pad: 'collect' }).reason, 'too far');
  standOn(p, 0, SPECIAL_PADS.collect.pad);
  const before = room.plots[0].pool;
  const r = room.handlePad(p, { plot: 0, pad: 'collect' });
  assert.equal(r.ok, true);
  assert.equal(p.cash, Math.floor(before));
  assert.equal(room.plots[0].pool < 1, true);

  standOn(q, 0, SPECIAL_PADS.collect.pad);
  assert.equal(room.handlePad(q, { plot: 0, pad: 'collect' }).reason, 'not yours');
});

test('purchases require cash, upgraders multiply income, autocollect pays the wallet directly', () => {
  const room = makeRoom();
  const p = room.addPlayer(fakeWs(), { name: 'Carol' });
  standOn(p, 3, SPECIAL_PADS.claim.pad);
  room.handlePad(p, { plot: 3, pad: 'claim' });
  const plot = room.plots[3];

  standOn(p, 3, ITEM_BY_ID.dropper2.pad);
  assert.equal(room.handlePad(p, { plot: 3, pad: 'dropper2' }).reason, 'locked');
  standOn(p, 3, ITEM_BY_ID.dropper1.pad);
  room.handlePad(p, { plot: 3, pad: 'dropper1' });
  standOn(p, 3, ITEM_BY_ID.dropper2.pad);
  assert.equal(room.handlePad(p, { plot: 3, pad: 'dropper2' }).reason, 'poor');

  p.cash = 1_000_000;
  const order = ['dropper2', 'walls', 'upgrader1', 'dropper3', 'roof', 'dropper4', 'upgrader2', 'turbo', 'dropper5', 'lights', 'autocollect'];
  for (const id of order) {
    standOn(p, 3, ITEM_BY_ID[id].pad);
    const r = room.handlePad(p, { plot: 3, pad: id });
    assert.equal(r.ok, true, `${id}: ${r.reason}`);
  }
  const spent = order.reduce((s, id) => s + ITEM_BY_ID[id].price, 0);
  assert.equal(p.cash, 1_000_000 - spent);

  const cashBefore = p.cash;
  runFor(room, 20);
  assert.equal(Math.floor(plot.pool), 0, 'autocollect keeps the pool empty');
  const earned = p.cash - cashBefore;
  // Expected rate: (2+4+10+20+45) per second (turbo: 1.5s / 1.5) x 1.5 x 2 = 243/s over ~20s minus travel time.
  assert.ok(earned > 243 * 10, `earned ${earned}`);
  assert.ok(earned < 243 * 20, `earned ${earned}`);
});

test('rebirth resets the tycoon and boosts income', () => {
  const room = makeRoom();
  const p = room.addPlayer(fakeWs(), { name: 'Dave' });
  standOn(p, 5, SPECIAL_PADS.claim.pad);
  room.handlePad(p, { plot: 5, pad: 'claim' });
  p.cash = 10_000_000;
  for (const it of ITEMS) {
    standOn(p, 5, it.pad);
    const r = room.handlePad(p, { plot: 5, pad: it.id });
    assert.equal(r.ok, true, `${it.id}: ${r.reason}`);
  }
  assert.equal(p.rebirths, 1);
  assert.equal(p.cash, 0);
  assert.equal(room.plots[5].owned.size, 0);
  assert.equal(room.plots[5].ownerId, p.id);
  // Free dropper again, now 1.5x income.
  standOn(p, 5, ITEM_BY_ID.dropper1.pad);
  room.handlePad(p, { plot: 5, pad: 'dropper1' });
  runFor(room, 30);
  const base = new Room('B', { now: () => 0 });
  const q = base.addPlayer(fakeWs(), { name: 'Eve' });
  standOn(q, 5, SPECIAL_PADS.claim.pad); base.handlePad(q, { plot: 5, pad: 'claim' });
  standOn(q, 5, ITEM_BY_ID.dropper1.pad); base.handlePad(q, { plot: 5, pad: 'dropper1' });
  runFor(base, 30);
  assert.ok(Math.abs(room.plots[5].pool - base.plots[5].pool * 1.5) < 1e-6);
});

test('disconnected players keep their tycoon during the grace period, then are removed', () => {
  const room = makeRoom();
  const ws = fakeWs();
  const p = room.addPlayer(ws, { name: 'Frank' });
  standOn(p, 1, SPECIAL_PADS.claim.pad);
  room.handlePad(p, { plot: 1, pad: 'claim' });
  room.disconnectPlayer(p);
  room.advanceClock(CONFIG.RECONNECT_GRACE_MS / 2);
  room.reapDisconnected();
  assert.equal(room.players.size, 1);

  // Reconnect with the same token resumes the player.
  const ws2 = fakeWs();
  const again = room.addPlayer(ws2, { name: 'Other', token: p.token });
  assert.equal(again, p);
  assert.equal(p.connected, true);
  assert.equal(p.plotIdx, 1);

  room.disconnectPlayer(p);
  room.advanceClock(CONFIG.RECONNECT_GRACE_MS + 1);
  let emptied = false;
  room.onEmpty = () => { emptied = true; };
  room.reapDisconnected();
  assert.equal(room.players.size, 0);
  assert.equal(room.plots[1].ownerId, null);
  assert.equal(emptied, true);
});

test('room capacity and snapshot format', () => {
  const room = makeRoom();
  for (let i = 0; i < CONFIG.MAX_PLAYERS_PER_ROOM; i++) assert.ok(room.addPlayer(fakeWs(), { name: 'P' + i }));
  assert.equal(room.addPlayer(fakeWs(), { name: 'Extra' }), null);
  const snap = room.snapshot();
  assert.equal(snap.t, 's');
  assert.equal(snap.p.length, CONFIG.MAX_PLAYERS_PER_ROOM);
  assert.equal(snap.k.length, 8);
  assert.equal(snap.e.length, CONFIG.MAX_PLAYERS_PER_ROOM); // join events
  assert.equal(room.snapshot().e, undefined);
});

test('chat is sanitized and rate limited', () => {
  const room = makeRoom();
  const p = room.addPlayer(fakeWs(), { name: '<script>x' });
  assert.equal(p.name, 'scriptx');
  room.events.length = 0;
  room.handleChat(p, '  hello\u0000 world  ' + 'x'.repeat(500));
  room.handleChat(p, 'spam');
  assert.equal(room.events.length, 1);
  assert.equal(room.events[0].text.length, CONFIG.CHAT_MAX);
  assert.ok(room.events[0].text.startsWith('hello world'));
});
