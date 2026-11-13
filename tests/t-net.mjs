// Online multiplayer against the mock runtime: hosting a room, joining someone else's room as a client,
// following the host's bots, auto-joining the next race, and taking over when the host leaves.
import { open, check, finish, installHelpers } from './harness.mjs';

const carState = (t, idx, lap = 0, fin = 0, flags = 0) =>
  `(() => { const t = Game.track, p = t.point(${idx}, 2); return [p.x, p.z, t.yawAt(${idx}), 40, 0, 0, ${lap}, ${idx} / t.n, ${fin}, 0, ${flags}]; })()`;

/* ---- host ---- */
{
  const { page, close } = await open({ mock: true });
  await page.evaluate(installHelpers);
  check(
    'runtime connects',
    await page.evaluate(() => !!Net.room && !Net.unavailable && $('#m-online-status').textContent.trim() === 'Connected')
  );
  await page.click('#b-online');
  await page.evaluate(() => __mock.lobby.remote('peer-r').join({ name: 'Remote Rae', color: 'ice', model: 'brute', room: 'zz1234' }));
  await page.waitForFunction(() => $$('#o-players .pl').length === 2);
  const lobby = await page.evaluate(() => ({ mine: __mock.lobby.myPresence(), rooms: $('#o-rooms').textContent }));
  check(
    'lobby presence carries name, colour and car',
    lobby.mine.name === 'Racer' && lobby.mine.color && lobby.mine.model === 'vanta',
    JSON.stringify(lobby.mine)
  );
  check('open rooms are listed from lobby presence', lobby.rooms.includes('ZZ1234'), lobby.rooms);
  await page.click('#b-create');
  await page.waitForFunction(() => UI.current === 'room' && Net.code);
  await page.evaluate(() =>
    __mock.room(Net.code).remote('peer-r').join({ name: 'Remote Rae', color: 'ice', model: 'brute', ready: false, phase: 'lobby' })
  );
  await page.waitForFunction(() => Net.roomPeers.length === 2);
  check(
    'creator is host and start waits for everyone to be ready',
    await page.evaluate(() => Net.isHost && !Net.allReady() && $('#b-start').disabled && !$('#b-start').hidden)
  );
  await page.evaluate(() => __mock.room(Net.code).remote('peer-r').update({ ready: true }));
  await page.waitForFunction(() => Net.allReady());
  await page.click('#r-track button[data-v="neon"]');
  await page.click('#r-laps button[data-v="1"]');
  check(
    'host settings are published in presence',
    await page.evaluate(() => {
      const s = __mock.room(Net.code).myPresence().settings;
      return s && s.track === 'neon' && s.laps === 1 && s.bots === 2;
    })
  );
  await page.click('#b-start');
  await page.waitForFunction(() => Game.state === 'countdown');
  const started = await page.evaluate(() => {
    const pr = __mock.room(Net.code).myPresence();
    return {
      cars: Game.cars.map((c) => c.id + ':' + c.model),
      meta: pr.botMeta,
      phase: pr.phase,
      seed: typeof pr.seed,
      grid: Game.cars.map((c) => c.trackIdx),
    };
  });
  check(
    'race starts with the remote driver and two host bots',
    started.cars.length === 4 &&
      started.cars.some((c) => c === 'peer:peer-r:brute') &&
      started.meta &&
      started.meta.length === 2 &&
      started.phase === 'countdown',
    JSON.stringify(started)
  );
  const drive = await page.evaluate(`(() => {
    Game.headless = true; T.autopilot(true);
    const r = __mock.room(Net.code).remote('peer-r'), t = Game.track; let idx = t.n - 5, lap = 0, fin = 0, maxPres = 0;
    for (let i = 0; i < 12000 && !Game.results; i++) {
      Game.frame(1 / 60);
      if (i % 3 === 0 && i > 250) { idx += 2; if (idx >= t.n) { idx -= t.n; lap++; } const p = t.point(idx, 2);
        if (lap >= Game.laps && !fin) fin = Math.round(Game.raceTime * 1000);
        r.update({ phase: fin ? 'finished' : 'racing', car: [p.x, p.z, t.yawAt(idx), 40, 0, 0, lap, idx / t.n, fin, 0, 3] }); }
      if (i % 50 === 0) maxPres = Math.max(maxPres, JSON.stringify(__mock.room(Net.code).myPresence()).length);
    }
    const rc = Net.remoteCars.get('peer:peer-r'), pr = __mock.room(Net.code).myPresence();
    return { rows: Game.results && Game.results.rows.map((x) => x.cells[1]), remote: rc && { fin: rc.finished, drifting: rc.drifting, tier: rc.driftTier, model: rc.model }, maxPres, packet: pr.car && pr.car.length, bots: pr.bots && pr.bots.length };
  })()`);
  check(
    'race finishes with all four classified',
    drive.rows && drive.rows.length === 4 && drive.rows.some((n) => n.includes('Remote Rae')),
    JSON.stringify(drive.rows)
  );
  check(
    'remote state is decoded (finish flag, drift flags, model)',
    drive.remote && drive.remote.fin && drive.remote.drifting && drive.remote.tier === 1 && drive.remote.model === 'brute',
    JSON.stringify(drive.remote)
  );
  check('presence stays well under the 4 KiB limit', drive.maxPres > 50 && drive.maxPres < 2500, drive.maxPres);
  check(
    'host broadcasts its own car and both bots',
    drive.packet >= 11 && drive.bots === 2,
    JSON.stringify({ packet: drive.packet, bots: drive.bots })
  );
  await page.waitForSelector('#s-results:not([hidden])');
  check(
    'online results offer a rematch and the room',
    await page.evaluate(
      () => $('#b-res-again').textContent === 'Race again' && $('#b-res-menu').textContent === 'Room' && $('#b-res-garage').hidden
    )
  );
  await page.click('#b-res-menu');
  check(
    'back in the room with a clean slate',
    await page.evaluate(
      () =>
        UI.current === 'room' && Game.state === 'idle' && Net.remoteCars.size === 0 && __mock.room(Net.code).myPresence().phase === 'lobby'
    )
  );
  await page.click('#b-leave');
  await page.waitForFunction(() => UI.current === 'online');
  check(
    'leaving clears the room from lobby presence',
    await page.evaluate(() => !Net.code && !Net.named && !__mock.lobby.myPresence().room)
  );
  await close();
}

/* ---- client: someone else hosts ---- */
{
  const { page, close } = await open({ mock: true, mockOpts: { mePeer: 'peer-z' } });
  await page.evaluate(installHelpers);
  await page.click('#b-online');
  await page.fill('#joincode', 'abcd12');
  await page.click('#b-join');
  await page.waitForFunction(() => UI.current === 'room');
  await page.evaluate(() =>
    __mock
      .room('abcd12')
      .remote('peer-a')
      .join({ name: 'Hosty', color: 'ice', model: 'apex', ready: false, phase: 'lobby', settings: { track: 'neon', laps: 1, bots: 2 } })
  );
  await page.waitForFunction(() => Net.roomPeers.length === 2);
  check(
    'joiner is not host and adopts the host settings',
    await page.evaluate(
      () =>
        !Net.isHost &&
        Net.hostPeer.peer === 'peer-a' &&
        Net.settings.track === 'neon' &&
        Net.settings.laps === 1 &&
        $('#b-start').hidden &&
        $('#r-track').dataset.locked === '1'
    )
  );
  await page.click('#b-ready');
  check('ready state is published', await page.evaluate(() => __mock.room('abcd12').myPresence().ready === true && Net.ready));
  /* malformed settings from a hostile host must not break the client */
  await page.evaluate(() =>
    __mock
      .room('abcd12')
      .remote('peer-a')
      .update({ settings: { track: '<img>', laps: 999, bots: -4 } })
  );
  check(
    'bad host settings are sanitised',
    await page.evaluate(() => Net.settings.track === 'bay' && Net.settings.laps === 3 && Net.settings.bots === 2)
  );
  await page.evaluate(() =>
    __mock
      .room('abcd12')
      .remote('peer-a')
      .update({ settings: { track: 'neon', laps: 1, bots: 2 } })
  );
  await page.evaluate(() =>
    __mock
      .room('abcd12')
      .remote('peer-a')
      .update({
        phase: 'countdown',
        seed: 777,
        startedAt: Date.now(),
        ready: false,
        botMeta: [
          ['Vega', 'gold', 'kite'],
          ['Okafor', 'lime', 'brute'],
        ],
      })
  );
  await page.waitForFunction(() => Game.state === 'countdown');
  const st = await page.evaluate(() => ({
    mode: Game.mode,
    track: Game.track.id,
    laps: Game.laps,
    localBots: Game.bots.length,
    cars: Game.cars.map((c) => c.id + ':' + c.model),
    mine: __mock.room('abcd12').myPresence().phase,
  }));
  check(
    'client follows the host into the race without simulating bots',
    st.mode === 'online' &&
      st.track === 'neon' &&
      st.laps === 1 &&
      st.localBots === 0 &&
      st.cars.includes('peer:peer-a:apex') &&
      st.mine === 'countdown',
    JSON.stringify(st)
  );
  await page.evaluate(
    `__mock.room('abcd12').remote('peer-a').update({ phase: 'racing', car: ${carState('t', 30)}, bots: [${carState('t', 20)}, ${carState('t', 10, 0, 0, 1)}] })`
  );
  await page.waitForFunction(() => Net.remoteCars.size === 3);
  const bots = await page.evaluate(() =>
    ['bot:0', 'bot:1'].map((k) => {
      const c = Net.remoteCars.get(k);
      return c && { name: c.name, model: c.model, drifting: c.drifting, hex: c.hex };
    })
  );
  check(
    'host bots appear with the names, paint and cars the host announced',
    bots[0] &&
      bots[0].name === 'Vega' &&
      bots[0].model === 'kite' &&
      bots[1].name === 'Okafor' &&
      bots[1].model === 'brute' &&
      bots[1].drifting,
    JSON.stringify(bots)
  );
  /* host leaves mid-race: the remaining driver takes over the bots */
  await page.evaluate(() => {
    Game.headless = true;
    T.run(300);
    __mock.room('abcd12').remote('peer-a').leave();
  });
  await page.waitForFunction(() => Net.isHost);
  const takeover = await page.evaluate(() => {
    T.run(120, { ArrowUp: true });
    return {
      host: Net.isHost,
      bots: Game.bots.map((b) => ({ name: b.name, ai: !!b.ai, remote: b.remote, v: b.speed })),
      remotes: [...Net.remoteCars.keys()],
      cars: Game.cars.length,
    };
  });
  check(
    'host migration adopts the bots as locally driven cars',
    takeover.host &&
      takeover.bots.length === 2 &&
      takeover.bots.every((b) => b.ai && !b.remote) &&
      takeover.remotes.length === 0 &&
      takeover.cars === 3,
    JSON.stringify(takeover)
  );
  check(
    'adopted bots drive on',
    takeover.bots.some((b) => b.v > 3),
    JSON.stringify(takeover.bots.map((b) => +b.v.toFixed(1)))
  );
  const done = await page.evaluate(() => {
    T.autopilot(true);
    T.finishRace();
    return { rows: Game.results && Game.results.rows.length, title: Game.results && Game.results.title };
  });
  check('race still finishes after the takeover', done.rows === 3, JSON.stringify(done));
  await close();
}

/* ---- client auto-joins the host's next race from the results screen ---- */
{
  const { page, close } = await open({ mock: true, mockOpts: { mePeer: 'peer-z' } });
  await page.evaluate(installHelpers);
  await page.click('#b-online');
  await page.fill('#joincode', 'next01');
  await page.click('#b-join');
  await page.waitForFunction(() => UI.current === 'room');
  await page.evaluate(() => {
    const r = __mock.room('next01').remote('peer-a');
    r.join({ name: 'Hosty', color: 'ice', model: 'vanta', phase: 'lobby', settings: { track: 'bay', laps: 1, bots: 0 } });
    r.update({ phase: 'countdown', seed: 11, startedAt: Date.now() });
  });
  await page.waitForFunction(() => Game.state === 'countdown');
  await page.evaluate(() => {
    Game.headless = true;
    T.autopilot(true);
    T.finishRace();
    Game.autopilot = false;
  });
  await page.waitForSelector('#s-results:not([hidden])');
  check('client sees results and a way back to the room', await page.evaluate(() => $('#b-res-again').textContent === 'Back to room'));
  await page.evaluate(() => {
    const r = __mock.room('next01').remote('peer-a');
    r.update({ phase: 'lobby', car: null });
    r.update({ phase: 'countdown', seed: 12, startedAt: Date.now() });
  });
  await page.waitForFunction(() => Game.state === 'countdown' && Net.seed === 12 && !Game.results);
  check('next race starts straight from the results screen', await page.evaluate(() => $('#s-results').hidden && UI.current === null));
  await close();
}
finish();
