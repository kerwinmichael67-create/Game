/* =========================================================================
   data/waves.js — the 45-wave script plus scaling rules
   Each wave is a list of groups: [enemyId, count, gapSeconds, startDelay]
   Every difficulty plays the first N waves of this script, so each mode
   finishes on a boss:  Rookie 20 · Standard 30 · Molten 35 · Forsaken 40 ·
   Nightmare 45.
   ========================================================================= */
(function () {

  const W = [
    /* 1  */[['grunt', 8, 1.0]],
    /* 2  */[['grunt', 11, 0.8]],
    /* 3  */[['grunt', 10, 0.8], ['runner', 5, 0.7, 5]],
    /* 4  */[['runner', 12, 0.65]],
    /* 5  */[['grunt', 14, 0.65], ['lumberer', 2, 2.0, 8]],
    /* 6  */[['phantom', 4, 1.6], ['grunt', 8, 0.75, 4]],
    /* 7  */[['runner', 14, 0.55], ['lumberer', 3, 2.0, 6]],
    /* 8  */[['drone', 5, 1.3], ['grunt', 11, 0.65, 3]],
    /* 9  */[['sprinter', 6, 1.1], ['phantom', 5, 1.3, 6]],
    /* 10 */[['brute', 1, 1], ['grunt', 16, 0.5, 2], ['runner', 8, 0.6, 12]],
    /* 11 */[['hardhat', 6, 1.3], ['grunt', 16, 0.5, 4]],
    /* 12 */[['ooze', 6, 1.6], ['runner', 14, 0.5, 5]],
    /* 13 */[['phantom', 10, 0.9], ['drone', 8, 1.0, 6]],
    /* 14 */[['detonator', 6, 1.5], ['grunt', 20, 0.45, 4]],
    /* 15 */[['lumberer', 8, 1.3], ['hardhat', 8, 1.1, 6], ['sprinter', 10, 0.7, 12]],
    /* 16 */[['wraith', 5, 1.8], ['runner', 18, 0.45, 3]],
    /* 17 */[['mender', 3, 2.2], ['hardhat', 10, 1.0, 4], ['grunt', 20, 0.4, 8]],
    /* 18 */[['ooze', 10, 1.1], ['detonator', 8, 1.2, 7]],
    /* 19 */[['sprinter', 18, 0.5], ['drone', 12, 0.8, 5], ['phantom', 10, 0.9, 10]],
    /* 20 */[['forsakenGuide', 1, 1], ['brute', 2, 3.0, 6], ['grunt', 22, 0.4, 2]],
    /* 21 */[['jammer', 4, 2.0], ['hardhat', 14, 0.8, 4]],
    /* 22 */[['cinder', 10, 1.0], ['grunt', 24, 0.35, 5]],
    /* 23 */[['skiff', 6, 1.8], ['drone', 14, 0.6, 4]],
    /* 24 */[['shieldbearer', 6, 1.8], ['lumberer', 10, 0.9, 6]],
    /* 25 */[['frostling', 12, 0.8], ['sprinter', 20, 0.4, 5], ['brute', 3, 3.0, 14]],
    /* 26 */[['sludge', 8, 1.5], ['ooze', 12, 0.9, 5]],
    /* 27 */[['wraith', 10, 1.1], ['phantom', 16, 0.6, 5]],
    /* 28 */[['ripper', 8, 1.4], ['hardhat', 16, 0.6, 4]],
    /* 29 */[['brute', 6, 1.8], ['detonator', 12, 0.8, 5], ['mender', 4, 2.5, 10]],
    /* 30 */[['forsakenReaper', 1, 1], ['ripper', 4, 2.5, 8], ['wraith', 8, 1.2, 4]],
    /* 31 */[['magma', 4, 2.4], ['cinder', 16, 0.7, 4]],
    /* 32 */[['revenant', 6, 1.8], ['jammer', 6, 1.6, 6]],
    /* 33 */[['skiff', 10, 1.2], ['wraith', 12, 0.9, 5]],
    /* 34 */[['warbeast', 4, 2.6], ['shieldbearer', 10, 1.0, 6]],
    /* 35 */[['patientNull', 1, 1], ['forsakenHero', 1, 1, 14], ['ooze', 14, 0.7, 4], ['sludge', 8, 1.3, 10]],
    /* 36 */[['rifthound', 8, 1.2], ['ripper', 10, 1.0, 5]],
    /* 37 */[['magma', 8, 1.8], ['warbeast', 6, 2.0, 8]],
    /* 38 */[['riftReaver', 1, 1], ['skiff', 12, 0.9, 5], ['drone', 16, 0.5, 10]],
    /* 39 */[['revenant', 10, 1.2], ['rifthound', 12, 0.8, 6]],
    /* 40 */[['forsakenKing', 1, 1], ['warbeast', 5, 2.2, 10], ['ripper', 12, 0.8, 4], ['magma', 4, 2.5, 18]],
    /* 41 */[['magma', 12, 1.2], ['shieldbearer', 14, 0.8, 5]],
    /* 42 */[['bonelord', 1, 1], ['revenant', 10, 1.1, 6], ['rifthound', 10, 0.9, 12]],
    /* 43 */[['rifthound', 16, 0.7], ['warbeast', 8, 1.8, 6]],
    /* 44 */[['forsakenSwordmaster', 1, 1], ['rifthound', 14, 0.7, 6], ['magma', 8, 1.5, 12]],
    /* 45 */[['umbralTitan', 1, 1], ['forsakenKing', 1, 1, 22], ['warbeast', 10, 1.4, 6], ['rifthound', 14, 0.7, 14]]
  ];

  /* Extra enemies folded in on higher difficulties. */
  const SPICE = {
    molten: { from: 12, add: ['cinder', 'frostling'], every: 3, count: 4 },
    forsaken: { from: 14, add: ['cinder', 'revenant', 'ripper'], every: 2, count: 5 },
    nightmare: { from: 8, add: ['cinder', 'revenant', 'rifthound', 'magma'], every: 2, count: 6 }
  };

  /* Health / reward scaling. Bosses scale much more slowly than trash. */
  TD.hpScale = (diff, n) => diff.hpMul * (1 + (n - 1) * 0.14);
  TD.bossScale = (diff, n) => (1 + (diff.hpMul - 1) * 0.45) * (1 + (n - 1) * 0.025);
  TD.cashScale = (diff, n) => 1.6 * (1 + (n - 1) * 0.06) * (diff.id === 'rookie' ? 1.15 : 1);
  TD.waveBonus = (diff, n) => Math.round((90 + n * 26) * (diff.id === 'rookie' ? 1.2 : 1));
  TD.skipBonus = (diff, n, secsLeft) => Math.round((18 + n * 6) * TD.clamp(secsLeft / 12, 0.2, 1));

  /* Build the ordered spawn list for a wave. */
  TD.buildWave = function (diff, n, pathCount) {
    const script = W[TD.clamp(n, 1, W.length) - 1];
    const groups = script.map(g => ({ id: g[0], count: g[1], gap: g[2], delay: g[3] || 0 }));

    const spice = SPICE[diff.id];
    if (spice && n >= spice.from && n % spice.every === 0) {
      const id = spice.add[(n / spice.every) % spice.add.length | 0];
      groups.push({ id: id, count: spice.count + Math.floor(n / 6), gap: 0.9, delay: 6 });
    }
    if (diff.id === 'nightmare') groups.forEach(g => { if (!TD.ENEMIES[g.id].boss) g.count = Math.ceil(g.count * 1.25); });

    const events = [];
    let pathTurn = 0;
    groups.forEach(g => {
      const def = TD.ENEMIES[g.id];
      if (!def) return;
      for (let i = 0; i < g.count; i++) {
        events.push({
          t: g.delay + i * g.gap,
          id: g.id,
          path: def.boss ? 0 : (pathTurn++ % Math.max(1, pathCount))
        });
      }
    });
    events.sort((a, b) => a.t - b.t);
    return { n: n, events: events, boss: script.some(g => TD.ENEMIES[g[0]] && TD.ENEMIES[g[0]].boss), duration: events.length ? events[events.length - 1].t : 0 };
  };

  /* A short human-readable preview of what is coming, for the wave banner. */
  TD.wavePreview = function (diff, n) {
    const script = W[TD.clamp(n, 1, W.length) - 1];
    const boss = script.filter(g => TD.ENEMIES[g[0]] && TD.ENEMIES[g[0]].boss)[0];
    if (boss) return TD.ENEMIES[boss[0]].name;
    const names = script.slice(0, 2).map(g => TD.ENEMIES[g[0]] ? TD.ENEMIES[g[0]].name : g[0]);
    return names.join(' · ');
  };

  TD.WAVE_SCRIPT = W;
})();
