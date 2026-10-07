/* =========================================================================
   data/enemies.js — every enemy type that can walk the path
   hp      base health at wave-scale 1
   spd     units per second
   def     flat damage reduction 0..0.9 ("armour")
   cash    money awarded on kill
   leak    base HP lost if it reaches the end
   hidden  only towers with hidden detection can target it
   flying  only towers with flying detection can target it
   boss    shows a health bar and plays the boss fanfare
   ========================================================================= */
(function () {

  const E = {

    /* ------------------------------ basics ------------------------------ */
    grunt: {
      id: 'grunt', name: 'Grunt', hp: 22, spd: 4.2, def: 0, cash: 9, leak: 1, scale: 1,
      desc: 'The rank and file. Harmless alone, lethal in numbers.',
      model: { shirt: 0x6b7390, pants: 0x3c4560, skin: 0xd9a066 }
    },
    runner: {
      id: 'runner', name: 'Runner', hp: 16, spd: 7.0, def: 0, cash: 10, leak: 1, scale: 0.92,
      desc: 'Lightly built and quick on its feet.',
      model: { shirt: 0x3fa96b, pants: 0x2a6b47, skin: 0xd9a066, hat: 'cap', hatColor: 0x2a6b47 }
    },
    sprinter: {
      id: 'sprinter', name: 'Sprinter', hp: 34, spd: 9.5, def: 0, cash: 16, leak: 1, scale: 0.95,
      desc: 'Blisteringly fast. Slow towers will simply miss it.',
      model: { shirt: 0xffc63d, pants: 0x8a6a2a, skin: 0xd9a066, hat: 'visor', hatColor: 0xffc63d, hatColor2: 0xff5d6c }
    },
    lumberer: {
      id: 'lumberer', name: 'Lumberer', hp: 130, spd: 2.4, def: 0.12, cash: 26, leak: 2, scale: 1.3,
      desc: 'Enormous and slow. Soaks up damage meant for its friends.',
      model: { shirt: 0x7a5a3a, pants: 0x4a3a24, skin: 0xc89a6a }
    },
    hardhat: {
      id: 'hardhat', name: 'Hardhat', hp: 210, spd: 3.4, def: 0.3, cash: 34, leak: 2, scale: 1.08,
      desc: 'Armoured. Weak weapons barely scratch the plating.',
      model: { shirt: 0xd8a33a, pants: 0x4a4028, skin: 0xd9a066, hat: 'helmet', hatColor: 0xffc63d, hatColor2: 0x8a6a2a, shield: 0x8a93aa }
    },
    phantom: {
      id: 'phantom', name: 'Phantom', hp: 48, spd: 5.2, def: 0, cash: 22, leak: 2, scale: 1, hidden: true,
      desc: 'Camouflaged. Only towers with detection can see it.',
      model: { shirt: 0x3a3f56, pants: 0x262b3d, skin: 0x8e97b5, hat: 'hood', hatColor: 0x2f3448, face: false }
    },
    wraith: {
      id: 'wraith', name: 'Wraith', hp: 90, spd: 5.8, def: 0.1, cash: 32, leak: 2, scale: 1.05, hidden: true, flying: true,
      desc: 'Hidden and airborne. Needs both detection types.',
      model: { shirt: 0x5a4f8a, pants: 0x3c3466, skin: 0xb9a8ff, hat: 'hood', hatColor: 0x463f74, face: false, wings: 0xa678ff, glow: 0xa678ff, cape: 0x3c3466 }
    },
    drone: {
      id: 'drone', name: 'Drone', hp: 60, spd: 6.4, def: 0, cash: 20, leak: 1, scale: 0.9, flying: true,
      desc: 'Buzzes over the map. Only anti-air can bring it down.',
      model: { shirt: 0x4a5568, pants: 0x39405a, skin: 0x8a93aa, hat: 'antenna', hatColor: 0x8a93aa, hatColor2: 0xff5d6c, wings: 0x6ee7ff, face: false }
    },
    skiff: {
      id: 'skiff', name: 'Sky Skiff', hp: 420, spd: 4.6, def: 0.2, cash: 55, leak: 3, scale: 1.2, flying: true,
      desc: 'An armoured flier. Bring serious anti-air.',
      model: { shirt: 0x3f5a7a, pants: 0x2c3e52, skin: 0x8a93aa, hat: 'visor', hatColor: 0x35506b, hatColor2: 0x6ee7ff, wings: 0x8fd8ff, wingSpan: 3.0, face: false }
    },
    brute: {
      id: 'brute', name: 'Brute', hp: 520, spd: 3.0, def: 0.2, cash: 80, leak: 4, scale: 1.45,
      desc: 'A heavyweight that shrugs off small arms fire.',
      model: { shirt: 0x8a3a3a, pants: 0x4a2424, skin: 0xc07a5a, hat: 'helmet', hatColor: 0x6a2a2a, hatColor2: 0x3a1818 }
    },

    /* ------------------------------ special ----------------------------- */
    ooze: {
      id: 'ooze', name: 'Ooze', hp: 190, spd: 3.6, def: 0, cash: 30, leak: 2, scale: 1.25,
      desc: 'Splits into two Globules when destroyed.',
      split: { into: 'globule', n: 2 },
      model: { blob: true, shirt: 0x5fd88a }
    },
    globule: {
      id: 'globule', name: 'Globule', hp: 55, spd: 5.0, def: 0, cash: 8, leak: 1, scale: 0.8,
      desc: 'What is left when an Ooze is popped.',
      model: { blob: true, shirt: 0x8ff0b0 }
    },
    detonator: {
      id: 'detonator', name: 'Detonator', hp: 160, spd: 4.0, def: 0, cash: 38, leak: 2, scale: 1.12,
      desc: 'Explodes on death and jams nearby towers for 3 seconds.',
      onDeath: { explode: { radius: 11, jam: 3 } },
      model: { shirt: 0xff6b4a, pants: 0x5a2f24, skin: 0xd9a066, hat: 'helmet', hatColor: 0xff8b3a, hatColor2: 0x8a3a22 }
    },
    mender: {
      id: 'mender', name: 'Mender', hp: 240, spd: 3.6, def: 0.1, cash: 45, leak: 2, scale: 1.05,
      desc: 'Heals every nearby enemy. Kill it first.',
      aura: { heal: 0.03, radius: 13 },
      model: { shirt: 0xe8ecf8, pants: 0x3b4460, skin: 0xd9a066, hat: 'halo', hatColor: 0x9ff0ff, aura: 0x6ef0b0 }
    },
    jammer: {
      id: 'jammer', name: 'Jammer', hp: 300, spd: 3.8, def: 0.15, cash: 52, leak: 3, scale: 1.1,
      desc: 'Periodically shuts down towers it walks past.',
      aura: { jam: { every: 6, dur: 2.2, radius: 12 } },
      model: { shirt: 0x6a4fa8, pants: 0x3c2f66, skin: 0x9aa4bf, hat: 'antenna', hatColor: 0xa678ff, hatColor2: 0x6ee7ff, aura: 0xa678ff }
    },
    shieldbearer: {
      id: 'shieldbearer', name: 'Shieldbearer', hp: 700, spd: 2.8, def: 0.45, cash: 95, leak: 4, scale: 1.25,
      desc: 'Heavy armour. Armour-piercing towers strongly recommended.',
      model: { shirt: 0x4a5568, pants: 0x2f3650, skin: 0xb0b8cc, hat: 'helmet', hatColor: 0x6a7080, hatColor2: 0x39405a, shield: 0x9aa4bf }
    },
    cinder: {
      id: 'cinder', name: 'Cinder', hp: 380, spd: 4.4, def: 0.1, cash: 60, leak: 2, scale: 1.1,
      desc: 'Immune to burning and resistant to slows.',
      immune: { burn: true }, resist: { slow: 0.6 },
      model: { shirt: 0xff6b3a, pants: 0x7a2a18, skin: 0xffb04a, hat: 'horns', hatColor: 0xff8b3a, glow: 0xff8b3a }
    },
    magma: {
      id: 'magma', name: 'Magma Hulk', hp: 1900, spd: 2.6, def: 0.25, cash: 190, leak: 6, scale: 1.7,
      desc: 'A walking furnace. Immune to fire and freezing.',
      immune: { burn: true, freeze: true }, resist: { slow: 0.75 },
      model: { shirt: 0xd8402a, pants: 0x5a1f14, skin: 0xff8b3a, hat: 'horns', hatColor: 0xffc63d, glow: 0xff5d2a, aura: 0xff6b3a }
    },
    frostling: {
      id: 'frostling', name: 'Frostling', hp: 340, spd: 5.0, def: 0.05, cash: 52, leak: 2, scale: 1.0,
      desc: 'Immune to freezing and slows.',
      immune: { freeze: true }, resist: { slow: 1.0 },
      model: { shirt: 0x6ee7ff, pants: 0x2f6f96, skin: 0xcdf3ff, hat: 'crown', hatColor: 0x9ff0ff, hatColor2: 0x6ee7ff, glow: 0x9ff0ff }
    },
    sludge: {
      id: 'sludge', name: 'Toxic Sludge', hp: 620, spd: 3.4, def: 0.15, cash: 88, leak: 3, scale: 1.3,
      desc: 'Leaves a corrosive trail that weakens tower damage.',
      aura: { weaken: { pct: 0.2, radius: 10 } },
      model: { blob: true, shirt: 0x8fbf3a }
    },
    ripper: {
      id: 'ripper', name: 'Ripper', hp: 900, spd: 6.6, def: 0.1, cash: 120, leak: 4, scale: 1.15,
      desc: 'Fast and mean. Punches through unprepared defences.',
      model: { shirt: 0x8a2f4a, pants: 0x4a1a2a, skin: 0xc07a8a, hat: 'mask', hatColor: 0x6a2038, hatColor2: 0xff5d6c, weapon: 'sword', weaponColor: 0xd8dcea, face: false }
    },
    revenant: {
      id: 'revenant', name: 'Revenant', hp: 1400, spd: 3.8, def: 0.2, cash: 165, leak: 5, scale: 1.25, hidden: true,
      desc: 'A hidden horror that resurrects once at half health.',
      revive: 0.5,
      model: { shirt: 0x3c2f66, pants: 0x241a45, skin: 0x9a8fc4, hat: 'hood', hatColor: 0x2f2452, face: false, cape: 0x241a45, glow: 0xa678ff }
    },
    warbeast: {
      id: 'warbeast', name: 'Warbeast', hp: 3200, spd: 3.2, def: 0.3, cash: 300, leak: 8, scale: 1.9,
      desc: 'Armoured monstrosity built for breaking through.',
      model: { shirt: 0x5a3a2a, pants: 0x3a2418, skin: 0x8a6a4a, hat: 'horns', hatColor: 0xd8cdb4, shield: 0x6a5a3a }
    },
    rifthound: {
      id: 'rifthound', name: 'Rift Hound', hp: 2100, spd: 7.2, def: 0.15, cash: 240, leak: 5, scale: 1.1, hidden: true,
      desc: 'Hidden, extremely fast and pulled straight out of the rift.',
      model: { shirt: 0x2a1f45, pants: 0x1b1330, skin: 0x7a6ab0, hat: 'horns', hatColor: 0xa678ff, glow: 0xc39bff, face: false }
    },

    /* ------------------------------- bosses ----------------------------- */
    forsakenGuide: {
      id: 'forsakenGuide', name: 'Forsaken Guide', hp: 5200, spd: 3.4, def: 0.25, cash: 700, leak: 12, scale: 2.0, boss: true,
      desc: 'Leads the Forsaken host. Summons Grunts as it advances.',
      summon: { of: 'grunt', n: 3, every: 8 },
      model: { shirt: 0x3c3466, pants: 0x241a45, skin: 0x9a8fc4, hat: 'hood', hatColor: 0x2f2452, cape: 0x1e1638, weapon: 'staff', weaponColor: 0xa678ff, glow: 0xa678ff, face: false }
    },
    forsakenReaper: {
      id: 'forsakenReaper', name: 'Forsaken Reaper', hp: 11000, spd: 4.4, def: 0.3, cash: 1100, leak: 16, scale: 2.1, boss: true, hidden: true,
      desc: 'A hidden boss that cuts down blocking units instantly.',
      model: { shirt: 0x241a35, pants: 0x160f24, skin: 0x8a7fb0, hat: 'hood', hatColor: 0x1c1428, cape: 0x120c1e, weapon: 'scythe', weaponColor: 0xff5d6c, glow: 0xff5d6c, face: false }
    },
    forsakenHero: {
      id: 'forsakenHero', name: 'Forsaken Hero', hp: 24000, spd: 3.8, def: 0.35, cash: 1900, leak: 20, scale: 2.2, boss: true,
      desc: 'Jams nearby towers and shields itself as it takes damage.',
      aura: { jam: { every: 9, dur: 2.5, radius: 15 } },
      model: { shirt: 0x4a3a7a, pants: 0x2f2452, skin: 0xa89ad0, hat: 'crown', hatColor: 0xffc63d, cape: 0x2f2452, weapon: 'sword', weaponColor: 0xa678ff, shield: 0x6a5ab0, glow: 0xc39bff }
    },
    forsakenSwordmaster: {
      id: 'forsakenSwordmaster', name: 'Forsaken Swordmaster', hp: 52000, spd: 5.0, def: 0.4, cash: 3000, leak: 25, scale: 2.2, boss: true, hidden: true,
      desc: 'Hidden, fast and immune to stuns.',
      immune: { stun: true }, resist: { slow: 0.5 },
      model: { shirt: 0x2f2452, pants: 0x1b1330, skin: 0x9a8fc4, hat: 'horns', hatColor: 0xff5d6c, cape: 0x3c1f3a, weapon: 'sword', weaponColor: 0xff8b9c, glow: 0xff5d6c, face: false }
    },
    forsakenKing: {
      id: 'forsakenKing', name: 'Forsaken King', hp: 130000, spd: 3.2, def: 0.45, cash: 6000, leak: 60, scale: 2.8, boss: true,
      desc: 'The end of the road. Summons elites and jams your defence.',
      immune: { stun: true, freeze: true }, resist: { slow: 0.7 },
      summon: { of: 'ripper', n: 2, every: 10 },
      aura: { jam: { every: 12, dur: 3, radius: 18 } },
      model: { shirt: 0x4a2f7a, pants: 0x2a1a4a, skin: 0xb9a8ff, hat: 'crown', hatColor: 0xffc63d, hatColor2: 0xff5d6c, cape: 0x2a1a4a, weapon: 'sword', weaponColor: 0xffd45e, glow: 0xc39bff, aura: 0xa678ff }
    },
    riftReaver: {
      id: 'riftReaver', name: 'Rift Reaver', hp: 78000, spd: 3.6, def: 0.4, cash: 4200, leak: 35, scale: 2.6, boss: true, flying: true,
      desc: 'A flying colossus that tears holes in reality.',
      immune: { freeze: true }, resist: { slow: 0.6 },
      summon: { of: 'rifthound', n: 2, every: 9 },
      model: { shirt: 0x1e1638, pants: 0x140e26, skin: 0x8a7ad0, hat: 'horns', hatColor: 0xc39bff, cape: 0x140e26, wings: 0xa678ff, wingSpan: 3.6, glow: 0xc39bff, aura: 0x6a4fa8, face: false }
    },
    patientNull: {
      id: 'patientNull', name: 'Patient Null', hp: 38000, spd: 4.2, def: 0.3, cash: 2600, leak: 22, scale: 2.1, boss: true,
      desc: 'Spreads infection: everything it summons multiplies.',
      summon: { of: 'ooze', n: 3, every: 7 },
      aura: { heal: 0.02, radius: 16 },
      model: { shirt: 0x6a8f2a, pants: 0x3a5218, skin: 0xb8d86a, hat: 'mask', hatColor: 0x4a6a1a, hatColor2: 0x9ef05e, aura: 0x9ef05e, glow: 0x9ef05e }
    },
    bonelord: {
      id: 'bonelord', name: 'Bonelord', hp: 64000, spd: 3.4, def: 0.35, cash: 3600, leak: 30, scale: 2.4, boss: true, hidden: true,
      desc: 'Hidden necromancer. Revives fallen enemies behind it.',
      immune: { stun: true },
      summon: { of: 'revenant', n: 1, every: 11 },
      model: { shirt: 0x2a2f45, pants: 0x1b1f30, skin: 0xd8d3c0, hat: 'crown', hatColor: 0x8a93aa, cape: 0x1b1f30, weapon: 'staff', weaponColor: 0x9ef05e, glow: 0x9ef05e, face: false }
    },
    umbralTitan: {
      id: 'umbralTitan', name: 'Umbral Titan', hp: 420000, spd: 2.8, def: 0.5, cash: 15000, leak: 200, scale: 3.4, boss: true, hidden: true,
      desc: 'The final nightmare. Hidden, armoured, and immune to nearly everything.',
      immune: { stun: true, freeze: true, burn: true }, resist: { slow: 0.85 },
      summon: { of: 'forsakenReaper', n: 1, every: 16 },
      aura: { jam: { every: 10, dur: 3.5, radius: 22 }, heal: 0.008 },
      model: { shirt: 0x14101f, pants: 0x0d0a16, skin: 0x4a3f6a, hat: 'crown', hatColor: 0xff5d6c, hatColor2: 0xa678ff, cape: 0x0d0a16, weapon: 'scythe', weaponColor: 0xff5d6c, wings: 0x3c2f66, wingSpan: 4.2, glow: 0xff5d6c, aura: 0x6a2f8a, face: false }
    }
  };

  TD.ENEMIES = E;
  TD.ENEMY_IDS = Object.keys(E);
})();
