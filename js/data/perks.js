/* =========================================================================
   data/perks.js — the between-wave draft

   Every fifth wave each player picks one of three perks.  A perk is a bag
   of numbers that is added to the picker's own bag, so two players on the
   same server build in different directions and a run is never the same
   twice.  Everything here is per-player and applies to the towers that
   player owns; the handful that touch the shared base say so in the text.

   `once: true` marks a perk that cannot be offered again once taken.
   `w` is the draw weight — the plain stat boosts come up more often than
   the swingy ones.
   ========================================================================= */
(function () {

  /* Every field a perk can contribute to.  Keeping them all here means the
     battle code can read any of them without a guard. */
  TD.perkBag = function () {
    return {
      dmg: 0,        // +% tower damage
      rate: 0,       // +% fire rate
      range: 0,      // +% range
      cash: 0,       // +% cash from kills
      waveCash: 0,   // flat $ at the end of each wave
      crit: 0,       // chance a hit crits
      critMul: 2.2,  // crit multiplier
      pierce: 0,     // armour ignored
      slow: 0,       // slow applied by your hits
      burn: 0,       // burn damage/s applied by your hits, as a % of the hit
      firstHit: 0,   // +% damage to enemies still at full health
      exec: 0,       // finish off non-boss enemies under this fraction
      bounty: 0,     // chance a kill pays triple
      discount: 0,   // -% tower cost
      sellFull: 0,   // >0 sells at full price
      cdr: 0,        // -% ability cooldown
      regen: 0       // base HP restored after each wave
    };
  };

  const P = [
    /* --- the bread and butter ------------------------------------- */
    { id: 'power', name: 'Live Fire', icon: '✸', w: 10, col: '#ff8b3a',
      desc: '+12% damage from your towers.', add: { dmg: 0.12 } },
    { id: 'tempo', name: 'Tempo', icon: '⏩', w: 10, col: '#6ee7ff',
      desc: '+12% fire rate on your towers.', add: { rate: 0.12 } },
    { id: 'optics', name: 'Long Optics', icon: '◎', w: 9, col: '#4f8cff',
      desc: '+12% range on your towers.', add: { range: 0.12 } },
    { id: 'payroll', name: 'Payroll', icon: '◆', w: 9, col: '#ffc63d',
      desc: '+15% cash from your kills.', add: { cash: 0.15 } },
    { id: 'scrap', name: 'Scrap Runner', icon: '⚙', w: 8, col: '#ffc63d',
      desc: '+$120 at the end of every wave.', add: { waveCash: 120 } },
    { id: 'plating', name: 'Plating', icon: '❤', w: 8, col: '#51d88a',
      desc: '+20 max base HP, repaired now.', add: {}, hp: 20 },

    /* --- shape the build ------------------------------------------ */
    { id: 'marksman', name: 'Marksman', icon: '✦', w: 7, col: '#ffc63d',
      desc: '15% of your hits crit for 2.2×.', add: { crit: 0.15 } },
    { id: 'shatter', name: 'Shatter Rounds', icon: '◈', w: 6, col: '#9fb2e6',
      desc: 'Your hits ignore 22% of armour.', add: { pierce: 0.22 } },
    { id: 'cryo', name: 'Cryo Coating', icon: '❄', w: 6, col: '#7fe6ff',
      desc: 'Your hits slow enemies 18% for 1.2s.', add: { slow: 0.18 } },
    { id: 'incend', name: 'Incendiary', icon: '🔥', w: 6, col: '#ff8b3a',
      desc: 'Your hits set a burn worth 25% of the hit.', add: { burn: 0.25 } },
    { id: 'ambush', name: 'Ambush', icon: '⇲', w: 6, col: '#a678ff',
      desc: '+35% damage to enemies still at full health.', add: { firstHit: 0.35 } },
    { id: 'bounty', name: 'Bounty Board', icon: '★', w: 6, col: '#ffc63d',
      desc: '12% of your kills pay triple.', add: { bounty: 0.12 } },
    { id: 'adrenaline', name: 'Adrenaline', icon: '⟳', w: 6, col: '#a678ff',
      desc: 'Your tower abilities recharge 25% faster.', add: { cdr: 0.25 } },
    { id: 'logistics', name: 'Logistics', icon: '▣', w: 6, col: '#51d88a',
      desc: 'Your towers cost 10% less.', add: { discount: 0.10 } },
    { id: 'medic', name: 'Field Medic', icon: '✚', w: 6, col: '#51d88a',
      desc: 'Repair 6 base HP after every wave.', add: { regen: 6 } },
    { id: 'executioner', name: 'Executioner', icon: '☠', w: 5, col: '#ff5d6c',
      desc: 'Your hits finish off non-boss enemies under 8% HP.', add: { exec: 0.08 } },

    /* --- unique ----------------------------------------------------- */
    { id: 'salvage', name: 'Salvage Rights', icon: '♻', w: 5, col: '#51d88a', once: true,
      desc: 'Sell your towers back for the full price.', add: { sellFull: 1 } },

    /* --- deals with a cost ------------------------------------------ */
    { id: 'overcharge', name: 'Overcharge', icon: '⚡', w: 5, col: '#ff8b3a',
      desc: '+28% damage, but your towers cost 15% more.',
      add: { dmg: 0.28, discount: -0.15 } },
    { id: 'swarm', name: 'Swarm Tactics', icon: '⋮⋮', w: 5, col: '#6ee7ff',
      desc: '+22% fire rate, but −10% range.', add: { rate: 0.22, range: -0.10 } },
    { id: 'glass', name: 'Glass Cannon', icon: '✹', w: 4, col: '#ff5d6c',
      desc: '+45% damage, but −25 max base HP.', add: { dmg: 0.45 }, hp: -25 }
  ];

  TD.PERKS = P;
  TD.perkById = id => P.filter(p => p.id === id)[0] || null;

  /* Three to choose from.  Uniques already taken drop out of the pool; if
     the pool ever runs dry we top up with repeats of the plain boosts so
     the draft always has something to offer. */
  TD.rollPerks = function (taken, n) {
    n = n || 3;
    const used = {};
    (taken || []).forEach(id => { used[id] = (used[id] || 0) + 1; });

    const pool = P.filter(p => !(p.once && used[p.id]));
    const out = [];
    const picked = {};
    while (out.length < n && pool.length) {
      let total = 0;
      pool.forEach(p => { if (!picked[p.id]) total += p.w; });
      if (total <= 0) break;
      let r = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (picked[p.id]) continue;
        r -= p.w;
        if (r <= 0) { picked[p.id] = 1; out.push(p); break; }
      }
    }
    while (out.length < n) out.push(P[out.length % P.length]);
    return out;
  };

  /* Fold a perk into a bag.  Returns the base-HP change, which the caller
     applies, because that one is shared rather than per-player. */
  TD.applyPerk = function (bag, perk) {
    if (!perk) return 0;
    Object.keys(perk.add).forEach(k => { bag[k] = (bag[k] || 0) + perk.add[k]; });
    if (bag.discount > 0.45) bag.discount = 0.45;   // never free
    if (bag.crit > 0.75) bag.crit = 0.75;
    if (bag.cdr > 0.6) bag.cdr = 0.6;
    return perk.hp || 0;
  };

  /* Waves on which a draft happens. */
  TD.DRAFT_EVERY = 5;
})();
