/* =========================================================================
   data/towers.js — the tower catalogue
   Every tower has 5 levels (0 = placement, 1..4 = upgrades).
   Level fields:
     c    upgrade cost (level 0 = placement cost)
     d    damage per hit
     r    range (world units)
     cd   seconds between attacks
     n    upgrade name        t  upgrade description
     x    extra stat bag (merged with the level below it)
   Extras understood by the battle sim:
     splash, pellets, pierce, burn{dps,dur}, poison{dps,dur}, slow{pct,dur},
     stun, chain, income, heal, hidden, flying, units{...}, buff{...},
     minRange, projSpeed, spread, execute, ramp, freeze, fear, cash
   ========================================================================= */
(function () {

  /* Terse level constructor. */
  const L = (c, d, r, cd, n, t, x) => ({ c: c, d: d, r: r, cd: cd, n: n, t: t, x: x || {} });

  const TOWERS = {

    /* ==================== STARTERS / CORE DPS ==================== */
    recruit: {
      id: 'recruit', name: 'Recruit', role: 'Starter', attack: 'bullet',
      desc: 'Cheap all-rounder. Levels up into a fast dual-wielding trooper.',
      price: 0, reqLevel: 1, limit: 12,
      model: { kind: 'humanoid', shirt: 0x3f7bd8, pants: 0x27304d, hat: 'cap', hatColor: 0x2a4f8f, weapon: 'pistol', weaponByLevel: ['pistol', 'pistol', 'smg', 'dual', 'dual'], weaponColor: 0x2c3247, twoHanded: false, tints: [0x3f7bd8, 0x3f7bd8, 0x2f68c0, 0x2454a8, 0x1c4490] },
      lv: [
        L(200, 3, 14, 0.50, 'Recruit', 'Standard sidearm.'),
        L(350, 5, 15, 0.45, 'Field Training', 'Faster, harder hits.'),
        L(900, 8, 16, 0.36, 'Sharp Eyes', 'Sees hidden enemies. Submachine gun.', { hidden: true }),
        L(2200, 9, 17, 0.28, 'Dual Wield', 'Two guns are better than one.'),
        L(5500, 16, 19, 0.20, 'Veteran', 'Blisteringly fast fire rate.')
      ]
    },

    rifleman: {
      id: 'rifleman', name: 'Rifleman', role: 'Starter', attack: 'bullet',
      desc: 'Reliable mid-range damage that stays useful all game.',
      price: 0, reqLevel: 1, limit: 10,
      model: { kind: 'humanoid', shirt: 0x4a5a3a, pants: 0x35422a, hat: 'helmet', hatColor: 0x3c4a2e, hatColor2: 0x2a3320, weapon: 'rifle', weaponColor: 0x2c3247, belt: 0x2a2018, pack: true, packColor: 0x3c4a2e },
      lv: [
        L(500, 8, 16, 0.60, 'Rifleman', 'Service rifle.'),
        L(700, 13, 17, 0.55, 'Better Optics', 'More damage, more range.'),
        L(1500, 20, 18, 0.50, 'Marksmanship', 'Detects hidden enemies.', { hidden: true }),
        L(3500, 24, 19, 0.40, 'Battle Rifle', 'Heavier calibre.'),
        L(8000, 45, 21, 0.32, 'Elite Rifleman', 'Full-auto battle rifle.')
      ]
    },

    militia: {
      id: 'militia', name: 'Militia', role: 'DPS', attack: 'bullet',
      desc: 'Sprays cheap bullets. Excellent against fast, weak swarms.',
      price: 900, reqLevel: 2, limit: 8,
      model: { kind: 'humanoid', shirt: 0x5b5340, pants: 0x3a3527, hat: 'beret', hatColor: 0x6b3030, weapon: 'smg', weaponColor: 0x2a2f42 },
      lv: [
        L(700, 6, 15, 0.25, 'Militia', 'Rapid submachine gun.'),
        L(1100, 9, 16, 0.22, 'Extended Mags', 'Keeps the trigger down longer.'),
        L(2600, 13, 17, 0.19, 'Laser Sight', 'Detects hidden enemies.', { hidden: true }),
        L(6000, 15, 18, 0.15, 'Heavy Rounds', 'Punchier ammunition.'),
        L(14000, 26, 20, 0.12, 'Suppression', 'A wall of lead.')
      ]
    },

    splatter: {
      id: 'splatter', name: 'Splatter', role: 'Starter', attack: 'explosive',
      desc: 'Lobs paint that splashes and gums enemies up.',
      price: 0, reqLevel: 1, limit: 10,
      model: { kind: 'humanoid', shirt: 0xd9553f, pants: 0x2f3650, hat: 'mask', hatColor: 0x2a3048, hatColor2: 0xffd45e, weapon: 'launcher', weaponColor: 0xd9553f },
      lv: [
        L(250, 5, 13, 0.80, 'Splatter', 'Paint splash, small slow.', { splash: 3.0, slow: { pct: 0.10, dur: 1.4 }, projSpeed: 34 }),
        L(400, 8, 14, 0.70, 'Thicker Paint', 'Bigger splash, stickier.', { splash: 3.6, slow: { pct: 0.16, dur: 1.6 } }),
        L(1100, 12, 15, 0.60, 'Pressure Tank', 'Faster, wider bursts.', { splash: 4.2, slow: { pct: 0.22, dur: 1.8 } }),
        L(2800, 14, 16, 0.50, 'Industrial Mix', 'Heavy, clinging paint.', { splash: 5.2, slow: { pct: 0.30, dur: 2.0 } }),
        L(6500, 24, 18, 0.42, 'Colour Bomb', 'Huge splash, strong slow.', { splash: 6.4, slow: { pct: 0.38, dur: 2.4 } })
      ]
    },

    bowman: {
      id: 'bowman', name: 'Bowman', role: 'DPS', attack: 'bullet',
      desc: 'Silent, cheap and sees through camouflage. Arrows pierce.',
      price: 750, reqLevel: 2, limit: 8,
      model: { kind: 'humanoid', shirt: 0x2f6b4a, pants: 0x30422f, hat: 'hood', hatColor: 0x27553c, weapon: 'bow', weaponColor: 0x6b4a2a, weaponScale: 0.9 },
      lv: [
        L(300, 10, 18, 1.00, 'Bowman', 'Longbow. Sees hidden enemies.', { hidden: true, projSpeed: 46 }),
        L(500, 15, 19, 0.90, 'Recurve Bow', 'Snappier draw.'),
        L(1200, 22, 21, 0.80, 'Broadheads', 'Arrows pierce 2 enemies.', { pierce: 2 }),
        L(3000, 30, 23, 0.70, 'Composite Bow', 'Pierces 3 enemies.', { pierce: 3 }),
        L(7000, 55, 26, 0.60, 'Storm Volley', 'Pierces 4 and hits air.', { pierce: 4, flying: true })
      ]
    },

    scattergun: {
      id: 'scattergun', name: 'Scattergun', role: 'DPS', attack: 'shotgun',
      desc: 'Short range, enormous close-quarters burst. Place on corners.',
      price: 1600, reqLevel: 3, limit: 8,
      model: { kind: 'humanoid', shirt: 0x7a4a2a, pants: 0x3a2f24, hat: 'cap', hatColor: 0x5c3820, weapon: 'shotgun', weaponColor: 0x3a2418 },
      lv: [
        L(600, 4, 11, 1.00, 'Scattergun', '5 pellets per shot.', { pellets: 5, spread: 0.30 }),
        L(900, 6, 12, 0.90, 'Choke Barrel', 'Tighter, stronger spread.', { pellets: 5, spread: 0.26 }),
        L(2000, 8, 13, 0.80, 'Double Barrel', '6 pellets, sees hidden.', { pellets: 6, hidden: true }),
        L(4800, 9, 14, 0.70, 'Auto Shotgun', '7 pellets, fast pump.', { pellets: 7 }),
        L(11000, 15, 15, 0.60, 'Dragon Breath', '8 flaming pellets.', { pellets: 8, burn: { dps: 14, dur: 3 } })
      ]
    },

    marksman: {
      id: 'marksman', name: 'Marksman', role: 'DPS', attack: 'bullet',
      desc: 'Enormous range and single-target punch. Slow between shots.',
      price: 1200, reqLevel: 2, limit: 8,
      model: { kind: 'humanoid', shirt: 0x3b4460, pants: 0x2a3048, hat: 'cap', hatColor: 0x222a40, weapon: 'sniper', weaponColor: 0x1e2333 },
      lv: [
        L(900, 38, 30, 2.40, 'Marksman', 'Long-range rifle.', { projSpeed: 120 }),
        L(1400, 65, 33, 2.20, 'Scope Upgrade', 'Sees hidden enemies.', { hidden: true }),
        L(3000, 110, 36, 2.00, 'Magnum Rounds', 'Punches through armour.', { armorPierce: 0.3 }),
        L(7000, 190, 40, 1.80, 'Anti-Materiel', 'Devastating single shots.', { armorPierce: 0.5, flying: true }),
        L(16000, 420, 45, 1.60, 'Deadeye', 'Ignores most armour.', { armorPierce: 0.8 })
      ]
    },

    gunslinger: {
      id: 'gunslinger', name: 'Gunslinger', role: 'Economy', attack: 'bullet',
      desc: 'Fans the hammer fast and shakes loose cash on every hit.',
      price: 4500, reqLevel: 5, limit: 6,
      model: { kind: 'humanoid', shirt: 0x8a5a2a, pants: 0x4a3524, hat: 'cowboy', hatColor: 0x6b4527, weapon: 'pistol', weaponByLevel: ['pistol', 'pistol', 'dual', 'dual', 'dual'], weaponColor: 0x8a8f9f, twoHanded: false },
      lv: [
        L(1200, 8, 16, 0.50, 'Gunslinger', 'Earns $1 per hit.', { cash: 1 }),
        L(1800, 12, 17, 0.42, 'Quickdraw', 'Earns $2 per hit.', { cash: 2 }),
        L(4000, 20, 18, 0.34, 'Twin Revolvers', 'Earns $3. Sees hidden.', { cash: 3, hidden: true }),
        L(9000, 34, 19, 0.26, 'Fan the Hammer', 'Earns $5 per hit.', { cash: 5 }),
        L(20000, 60, 21, 0.20, 'Outlaw Legend', 'Earns $8 per hit.', { cash: 8 })
      ]
    },

    chaingunner: {
      id: 'chaingunner', name: 'Chaingunner', role: 'DPS', attack: 'bullet',
      desc: 'The damage backbone of any late-game defence. Expensive.',
      price: 12000, reqLevel: 8, limit: 6,
      model: { kind: 'humanoid', shirt: 0x4a4f62, pants: 0x2f3444, hat: 'visor', hatColor: 0x353a4c, hatColor2: 0xff5d6c, weapon: 'minigun', weaponColor: 0x6a7080, weaponScale: 1.1, pack: true, packColor: 0x3a3f52 },
      lv: [
        L(2500, 9, 17, 0.12, 'Chaingunner', 'Spins up a wall of bullets.'),
        L(4000, 13, 18, 0.11, 'Bigger Drum', 'Sustained fire.'),
        L(9000, 20, 19, 0.10, 'Thermal Sight', 'Detects hidden enemies.', { hidden: true }),
        L(20000, 32, 20, 0.085, 'Hardened Barrels', 'Melts through armour.', { armorPierce: 0.25 }),
        L(42000, 52, 22, 0.070, 'Devastator', 'Absurd sustained damage.', { armorPierce: 0.4, flying: true })
      ]
    },

    longshot: {
      id: 'longshot', name: 'Longshot', role: 'DPS', attack: 'bullet',
      desc: 'Map-wide railgun whose shots punch through whole lines.',
      price: 15000, reqLevel: 10, limit: 5,
      model: { kind: 'humanoid', shirt: 0x2f4a5a, pants: 0x25333f, hat: 'hood', hatColor: 0x27404f, weapon: 'sniper', weaponColor: 0x39506a, weaponScale: 1.25 },
      lv: [
        L(1800, 40, 34, 1.60, 'Longshot', 'Pierces 3 enemies.', { pierce: 3, hidden: true, projSpeed: 150 }),
        L(2800, 70, 37, 1.50, 'Rail Coils', 'Faster, harder shots.', { pierce: 3 }),
        L(6000, 130, 40, 1.40, 'Tracking Rounds', 'Pierces 4. Hits air.', { pierce: 4, flying: true }),
        L(13000, 250, 44, 1.30, 'Overcharge', 'Pierces 5.', { pierce: 5, armorPierce: 0.4 }),
        L(30000, 520, 50, 1.20, 'Horizon Rail', 'Pierces 6 across the map.', { pierce: 6, armorPierce: 0.6 })
      ]
    },

    sentry: {
      id: 'sentry', name: 'Sentry', role: 'DPS', attack: 'bullet',
      desc: 'Automated gun emplacement. Steady, dependable damage.',
      price: 3000, reqLevel: 4, limit: 8,
      model: { kind: 'turret', c1: 0x556080, c2: 0x2b3350, scale: 0.85 },
      lv: [
        L(1400, 22, 20, 0.60, 'Sentry', 'Auto-targeting turret.'),
        L(2200, 34, 21, 0.55, 'Servo Motors', 'Tracks targets faster.'),
        L(5000, 52, 22, 0.50, 'Radar Dome', 'Detects hidden and air.', { hidden: true, flying: true }),
        L(11000, 75, 23, 0.42, 'Twin Cannons', 'Double the barrels.'),
        L(25000, 140, 25, 0.35, 'Fortress Gun', 'A wall of firepower.', { armorPierce: 0.3 })
      ]
    },

    headsman: {
      id: 'headsman', name: 'Headsman', role: 'DPS', attack: 'bullet',
      desc: 'Heavy axe throws that cause bleeding and execute the weak.',
      price: 6000, reqLevel: 6, limit: 5,
      model: { kind: 'humanoid', shirt: 0x3a2a3f, pants: 0x241a2b, hat: 'hood', hatColor: 0x2a1f31, weapon: 'axe', weaponColor: 0xb8c0d4, face: false },
      lv: [
        L(1600, 30, 18, 1.40, 'Headsman', 'Causes bleeding.', { poison: { dps: 8, dur: 4 }, projSpeed: 40 }),
        L(2400, 50, 19, 1.30, 'Whetstone', 'Deeper cuts.', { poison: { dps: 16, dur: 4 } }),
        L(5200, 90, 20, 1.20, 'Cleaver', 'Sees hidden. Heavier bleed.', { hidden: true, poison: { dps: 30, dur: 4 } }),
        L(12000, 170, 21, 1.10, 'Great Axe', 'Splash on impact.', { splash: 4, poison: { dps: 60, dur: 5 } }),
        L(27000, 340, 23, 1.00, 'Final Verdict', 'Executes enemies under 8% HP.', { splash: 5, poison: { dps: 130, dur: 5 }, execute: 0.08 })
      ]
    },

    /* ==================== EXPLOSIVE ==================== */
    bomber: {
      id: 'bomber', name: 'Bomber', role: 'Explosive', attack: 'explosive',
      desc: 'Sticky bombs with a generous blast radius. Great vs crowds.',
      price: 2000, reqLevel: 3, limit: 8,
      model: { kind: 'humanoid', shirt: 0x6a4a2a, pants: 0x3a2f24, hat: 'helmet', hatColor: 0x4a3a24, hatColor2: 0x2a2018, weapon: 'launcher', weaponColor: 0x3a3f52 },
      lv: [
        L(800, 26, 17, 1.60, 'Bomber', 'Explosive splash damage.', { splash: 5.0, projSpeed: 30 }),
        L(1200, 42, 18, 1.50, 'Bigger Charges', 'Larger blast.', { splash: 5.6 }),
        L(2800, 70, 19, 1.40, 'Shrapnel', 'Wider, hotter blast.', { splash: 6.4, burn: { dps: 10, dur: 3 } }),
        L(6500, 105, 20, 1.30, 'Cluster Bombs', 'Blast leaves fire.', { splash: 7.4, burn: { dps: 28, dur: 3 } }),
        L(15000, 220, 22, 1.20, 'Demolition', 'Enormous detonations.', { splash: 8.6, burn: { dps: 60, dur: 3 }, hidden: true })
      ]
    },

    rocketman: {
      id: 'rocketman', name: 'Rocketman', role: 'Explosive', attack: 'explosive',
      desc: 'Homing rockets that hit ground and air alike.',
      price: 5000, reqLevel: 5, limit: 6,
      model: { kind: 'humanoid', shirt: 0x3f5a7a, pants: 0x2c3e52, hat: 'helmet', hatColor: 0x35506b, hatColor2: 0x22323f, weapon: 'rocket', weaponColor: 0x4a5568, weaponScale: 1.1 },
      lv: [
        L(1500, 35, 24, 2.00, 'Rocketman', 'Homing rockets. Hits air.', { splash: 6, flying: true, homing: true, projSpeed: 40 }),
        L(2300, 60, 26, 1.90, 'Reload Kit', 'Faster rockets.', { splash: 6.5 }),
        L(5000, 110, 28, 1.80, 'Seeker Head', 'Sees hidden enemies.', { splash: 7.2, hidden: true }),
        L(11000, 210, 30, 1.60, 'Twin Tubes', 'Fires two rockets.', { splash: 8, volley: 2 }),
        L(24000, 430, 33, 1.40, 'Warhead', 'Massive detonations.', { splash: 9.5, volley: 2 })
      ]
    },

    howitzer: {
      id: 'howitzer', name: 'Howitzer', role: 'Explosive', attack: 'mortar',
      desc: 'Artillery. Huge range and splash, but blind up close and no air.',
      price: 9000, reqLevel: 7, limit: 5,
      model: { kind: 'mortar', c1: 0x4a5240, c2: 0x2f3648, scale: 0.9 },
      lv: [
        L(2200, 60, 40, 3.20, 'Howitzer', 'Cannot hit close or flying.', { splash: 8, minRange: 12, projSpeed: 26, arc: true }),
        L(3300, 100, 43, 3.00, 'Rifled Barrel', 'Heavier shells.', { splash: 9 }),
        L(7000, 180, 46, 2.80, 'Spotter', 'Sees hidden enemies.', { splash: 10, hidden: true }),
        L(15000, 340, 50, 2.60, 'Heavy Shells', 'Sets the ground alight.', { splash: 11, burn: { dps: 45, dur: 4 } }),
        L(33000, 700, 55, 2.40, 'Bombardment', 'Fires a 3-shell barrage.', { splash: 12, volley: 3, burn: { dps: 90, dur: 4 } })
      ]
    },

    pyrotechnician: {
      id: 'pyrotechnician', name: 'Pyrotechnician', role: 'Explosive', attack: 'explosive',
      desc: 'Firework barrages that burst into burning shrapnel.',
      price: 4000, reqLevel: 5, limit: 6,
      model: { kind: 'humanoid', shirt: 0xc4402f, pants: 0x3a2a2a, hat: 'cap', hatColor: 0x8a2f22, weapon: 'firework', weaponColor: 0xe0533f },
      lv: [
        L(1300, 22, 22, 1.80, 'Pyrotechnician', 'Bursting fireworks.', { splash: 5, burn: { dps: 8, dur: 3 }, projSpeed: 36 }),
        L(2000, 38, 23, 1.70, 'Bigger Shells', 'Hotter bursts.', { splash: 5.6, burn: { dps: 16, dur: 3 } }),
        L(4400, 68, 25, 1.60, 'Star Cluster', 'Fires 2 shells. Hits air.', { splash: 6.2, volley: 2, flying: true, burn: { dps: 28, dur: 3 } }),
        L(9500, 130, 27, 1.50, 'Roman Candle', 'Fires 3 shells.', { splash: 7, volley: 3, burn: { dps: 55, dur: 3 } }),
        L(21000, 270, 30, 1.40, 'Grand Finale', 'A 4-shell spectacular.', { splash: 8, volley: 4, hidden: true, burn: { dps: 110, dur: 4 } })
      ]
    },

    /* ==================== ELEMENTAL ==================== */
    flamecaster: {
      id: 'flamecaster', name: 'Flamecaster', role: 'Elemental', attack: 'flame',
      desc: 'Short cone of fire that hits everything in front and burns.',
      price: 2800, reqLevel: 4, limit: 6,
      model: { kind: 'humanoid', shirt: 0xb4402a, pants: 0x3a2a24, hat: 'mask', hatColor: 0x6a3a24, hatColor2: 0xffb04a, weapon: 'flamer', weaponColor: 0x8a3a24, pack: true, packColor: 0xc8402a },
      lv: [
        L(1000, 6, 12, 0.20, 'Flamecaster', 'Cone of fire, applies burn.', { burn: { dps: 6, dur: 3 }, cone: 0.55 }),
        L(1500, 9, 13, 0.18, 'Pressurised', 'Hotter flames.', { burn: { dps: 12, dur: 3 }, cone: 0.58 }),
        L(3400, 14, 14, 0.16, 'Blue Flame', 'Sees hidden enemies.', { burn: { dps: 22, dur: 3 }, cone: 0.62, hidden: true }),
        L(7500, 24, 15, 0.14, 'Napalm', 'Long-lasting burn.', { burn: { dps: 45, dur: 4 }, cone: 0.68 }),
        L(17000, 42, 17, 0.12, 'Inferno', 'Incinerates whole waves.', { burn: { dps: 95, dur: 4 }, cone: 0.78 })
      ]
    },

    chiller: {
      id: 'chiller', name: 'Chiller', role: 'Elemental', attack: 'freeze',
      desc: 'Barely scratches anything, but slows enemies to a crawl.',
      price: 1400, reqLevel: 2, limit: 8,
      model: { kind: 'humanoid', shirt: 0x3f8fbf, pants: 0x2a4a5f, hat: 'visor', hatColor: 0x2f6f96, hatColor2: 0x9ff0ff, weapon: 'icegun', weaponColor: 0x5fb4d8 },
      lv: [
        L(700, 3, 14, 0.90, 'Chiller', 'Slows enemies by 25%.', { slow: { pct: 0.25, dur: 2.0 }, projSpeed: 38 }),
        L(1100, 6, 15, 0.85, 'Coolant', 'Slows by 32%.', { slow: { pct: 0.32, dur: 2.2 } }),
        L(2500, 10, 16, 0.80, 'Frost Lens', 'Slows by 40%. Sees hidden.', { slow: { pct: 0.40, dur: 2.4 }, hidden: true }),
        L(5500, 12, 17, 0.75, 'Cryo Charge', 'Slows by 50%, splash.', { slow: { pct: 0.50, dur: 2.6 }, splash: 4 }),
        L(12000, 22, 19, 0.70, 'Absolute Zero', 'Slows 60% and briefly freezes.', { slow: { pct: 0.60, dur: 3.0 }, splash: 5, freeze: 0.6 })
      ]
    },

    glacier: {
      id: 'glacier', name: 'Glacier Blaster', role: 'Elemental', attack: 'aoe',
      desc: 'Detonates a freezing shockwave over a wide area.',
      price: 9500, reqLevel: 7, limit: 4,
      model: { kind: 'tesla', c1: 0x5f9fd8, c2: 0x9ff0ff, scale: 0.8 },
      lv: [
        L(2600, 14, 18, 1.50, 'Glacier Blaster', 'Area freeze pulse.', { splash: 7, slow: { pct: 0.35, dur: 2.5 }, flying: true }),
        L(4000, 24, 19, 1.40, 'Deeper Chill', 'Stronger slow.', { splash: 7.5, slow: { pct: 0.42, dur: 2.7 } }),
        L(8500, 44, 20, 1.30, 'Frost Radar', 'Sees hidden enemies.', { splash: 8.2, slow: { pct: 0.48, dur: 2.9 }, hidden: true }),
        L(18000, 85, 22, 1.20, 'Blizzard', 'Huge chilling blasts.', { splash: 9.2, slow: { pct: 0.56, dur: 3.2 } }),
        L(38000, 170, 24, 1.10, 'Ice Age', 'Freezes everything it touches.', { splash: 10.5, slow: { pct: 0.64, dur: 3.5 }, freeze: 0.8 })
      ]
    },

    venom: {
      id: 'venom', name: 'Venom Gunner', role: 'Elemental', attack: 'bullet',
      desc: 'Poison rounds whose damage-over-time ignores armour.',
      price: 5500, reqLevel: 6, limit: 6,
      model: { kind: 'humanoid', shirt: 0x4a7f3a, pants: 0x2f4a2a, hat: 'mask', hatColor: 0x35592a, hatColor2: 0x9ef05e, weapon: 'smg', weaponColor: 0x5c8f3f, pack: true, packColor: 0x6fae4a },
      lv: [
        L(1400, 8, 16, 0.40, 'Venom Gunner', 'Poisons on hit.', { poison: { dps: 6, dur: 4 } }),
        L(2100, 13, 17, 0.36, 'Concentrate', 'Stronger toxin.', { poison: { dps: 12, dur: 4 } }),
        L(4600, 22, 18, 0.32, 'Corrosive', 'Sees hidden enemies.', { poison: { dps: 24, dur: 4 }, hidden: true }),
        L(10000, 38, 19, 0.28, 'Nerve Agent', 'Poison also slows 20%.', { poison: { dps: 48, dur: 5 }, slow: { pct: 0.20, dur: 2 } }),
        L(22000, 70, 21, 0.24, 'Plague Round', 'Devastating toxin cloud.', { poison: { dps: 105, dur: 5 }, slow: { pct: 0.28, dur: 2.5 }, splash: 4 })
      ]
    },

    zapper: {
      id: 'zapper', name: 'Zapper', role: 'Elemental', attack: 'chain',
      desc: 'Arcs lightning between enemies and stuns at max level.',
      price: 3600, reqLevel: 4, limit: 6,
      model: { kind: 'tesla', c1: 0x8a7a5a, c2: 0x6ee7ff, scale: 0.78 },
      lv: [
        L(1100, 20, 16, 1.10, 'Zapper', 'Chains to 3 enemies.', { chain: 3, slow: { pct: 0.15, dur: 1.2 }, flying: true }),
        L(1700, 33, 17, 1.00, 'Bigger Coil', 'Chains to 4.', { chain: 4, slow: { pct: 0.18, dur: 1.4 } }),
        L(3800, 52, 18, 0.95, 'Ion Detector', 'Chains to 5. Sees hidden.', { chain: 5, hidden: true }),
        L(8500, 80, 19, 0.85, 'Overvolt', 'Chains to 6.', { chain: 6, slow: { pct: 0.25, dur: 1.6 } }),
        L(19000, 160, 21, 0.75, 'Thunderstorm', 'Chains to 8 and stuns.', { chain: 8, stun: 0.35, slow: { pct: 0.3, dur: 2 } })
      ]
    },

    elementalist: {
      id: 'elementalist', name: 'Elementalist', role: 'Elemental', attack: 'bullet',
      desc: 'Cycles fire, frost and shock with every bolt it throws.',
      price: 14000, reqLevel: 9, limit: 4,
      model: { kind: 'humanoid', shirt: 0x6a4fa8, pants: 0x3c2f66, hat: 'hood', hatColor: 0x54408a, weapon: 'staff', weaponColor: 0xa678ff, weaponScale: 0.8 },
      lv: [
        L(3000, 30, 20, 1.00, 'Elementalist', 'Random element each shot.', { elemental: true, splash: 4, hidden: true, projSpeed: 40 }),
        L(4600, 55, 22, 0.90, 'Attunement', 'Stronger elements.', { splash: 4.5 }),
        L(10000, 100, 24, 0.80, 'Storm Weaving', 'Hits air. Bigger bursts.', { splash: 5.2, flying: true }),
        L(21000, 200, 25, 0.70, 'Arcane Focus', 'Elements hit far harder.', { splash: 6 }),
        L(45000, 400, 27, 0.60, 'Archmage', 'All three elements at once.', { splash: 7, allElements: true })
      ]
    },

    /* ==================== MELEE ==================== */
    reaper: {
      id: 'reaper', name: 'Reaper', role: 'Melee', attack: 'melee',
      desc: 'Cheap melee that shreds anything that walks past it.',
      price: 2200, reqLevel: 3, limit: 8,
      model: { kind: 'humanoid', shirt: 0x2f2f3f, pants: 0x1f1f2c, hat: 'hood', hatColor: 0x272733, weapon: 'scythe', weaponColor: 0xd8dcea, weaponScale: 0.75, face: false },
      lv: [
        L(900, 17, 6.0, 0.50, 'Reaper', 'Melee. Always sees hidden.', { hidden: true }),
        L(1400, 28, 6.5, 0.45, 'Honed Blade', 'Sharper swings.'),
        L(3200, 46, 7.0, 0.40, 'Twin Scythes', 'Hits 2 enemies per swing.', { meleeTargets: 2 }),
        L(7000, 66, 7.5, 0.34, 'Bloodletting', 'Causes bleeding.', { poison: { dps: 30, dur: 4 }, meleeTargets: 2 }),
        L(16000, 130, 8.0, 0.28, 'Death Dance', 'Hits 4 enemies at once.', { meleeTargets: 4, poison: { dps: 70, dur: 4 } })
      ]
    },

    slammer: {
      id: 'slammer', name: 'Slammer', role: 'Melee', attack: 'slam',
      desc: 'Ground slams that damage and slow every enemy nearby.',
      price: 7000, reqLevel: 6, limit: 5,
      model: { kind: 'humanoid', shirt: 0x5a4a6a, pants: 0x3a2f4a, hat: 'helmet', hatColor: 0x46385c, hatColor2: 0x2a2038, weapon: 'hammer', weaponColor: 0x8a93aa, weaponScale: 0.85, scale: 0.72 },
      lv: [
        L(2000, 40, 8.0, 1.60, 'Slammer', 'Area slam, slows 30%.', { splash: 8, slow: { pct: 0.30, dur: 2 }, hidden: true }),
        L(3000, 70, 8.5, 1.50, 'Heavier Head', 'Bigger shockwaves.', { splash: 8.5, slow: { pct: 0.35, dur: 2.2 } }),
        L(6500, 130, 9.0, 1.40, 'Seismic', 'Wider slam radius.', { splash: 9.5, slow: { pct: 0.42, dur: 2.4 } }),
        L(14000, 250, 9.5, 1.30, 'Earthshaker', 'Cracks the ground open.', { splash: 10.5, slow: { pct: 0.50, dur: 2.6 } }),
        L(31000, 520, 10.0, 1.20, 'Cataclysm', 'Slams also stun.', { splash: 12, slow: { pct: 0.58, dur: 3 }, stun: 0.4 })
      ]
    },

    pugilist: {
      id: 'pugilist', name: 'Pugilist', role: 'Melee', attack: 'melee',
      desc: 'Rapid punches that stagger even heavy enemies.',
      price: 3800, reqLevel: 4, limit: 6,
      model: { kind: 'humanoid', shirt: 0xc45a3a, pants: 0x2f3444, weapon: 'fist', weaponColor: 0xd8533f, hair: 0x2a2018 },
      lv: [
        L(1500, 25, 6.0, 0.70, 'Pugilist', 'Melee with a stagger chance.', { hidden: true, stunChance: 0.12, stun: 0.2 }),
        L(2300, 44, 6.5, 0.65, 'Wraps', 'Harder punches.', { stunChance: 0.16 }),
        L(5000, 80, 7.0, 0.60, 'Combo Training', 'Hits 2 enemies.', { meleeTargets: 2, stunChance: 0.22 }),
        L(11000, 155, 7.5, 0.55, 'Haymaker', 'Heavy staggering blows.', { meleeTargets: 2, stunChance: 0.3, stun: 0.35 }),
        L(24000, 320, 8.0, 0.50, 'Knockout', 'Reliably stuns on hit.', { meleeTargets: 3, stunChance: 0.5, stun: 0.5 })
      ]
    },

    champion: {
      id: 'champion', name: 'Champion', role: 'Melee', attack: 'melee',
      desc: 'A wall of muscle that physically blocks the path.',
      price: 8500, reqLevel: 7, limit: 4, placeOn: 'near-path',
      model: { kind: 'humanoid', shirt: 0xb89a4a, pants: 0x6a4a2a, hat: 'helmet', hatColor: 0xc7a75a, hatColor2: 0x8a6a2a, weapon: 'sword', weaponColor: 0xd8dcea, scale: 0.72 },
      lv: [
        L(2400, 60, 7.0, 1.20, 'Champion', 'Blocks enemies in melee.', { hidden: true, block: 1 }),
        L(3600, 105, 7.5, 1.15, 'Tower Shield', 'Blocks 2 enemies.', { block: 2 }),
        L(7800, 195, 8.0, 1.10, 'Arena Veteran', 'Cleaves 2 targets.', { block: 2, meleeTargets: 2 }),
        L(17000, 380, 8.5, 1.05, 'Gladius Master', 'Blocks 3 enemies.', { block: 3, meleeTargets: 3 }),
        L(37000, 780, 9.0, 1.00, 'Undefeated', 'Cleaves everything nearby.', { block: 4, meleeTargets: 5, stunChance: 0.2, stun: 0.3 })
      ]
    },

    /* ==================== SUPPORT / ECONOMY ==================== */
    homestead: {
      id: 'homestead', name: 'Homestead', role: 'Economy', attack: 'farm',
      desc: 'Pays out cash at the end of every wave. Build these early.',
      price: 0, reqLevel: 1, limit: 8,
      model: { kind: 'farm', c1: 0xc0473a, c2: 0x8a2f26, c3: 0xd8d3c0, scale: 0.72, plateR: 2.0 },
      lv: [
        L(600, 0, 0, 0, 'Homestead', 'Earns $85 each wave.', { income: 85 }),
        L(900, 0, 0, 0, 'Irrigation', 'Earns $150 each wave.', { income: 150 }),
        L(2000, 0, 0, 0, 'Tractor', 'Earns $280 each wave.', { income: 280 }),
        L(4500, 0, 0, 0, 'Grain Silo', 'Earns $520 each wave.', { income: 520 }),
        L(10000, 0, 0, 0, 'Agri-Empire', 'Earns $1,000 each wave.', { income: 1000 })
      ]
    },

    captain: {
      id: 'captain', name: 'Captain', role: 'Support', attack: 'support',
      desc: 'Buffs the fire rate of every tower in range. Has a rally call.',
      price: 6500, reqLevel: 5, limit: 3,
      model: { kind: 'humanoid', shirt: 0x2f4a7f, pants: 0x27304d, hat: 'cap', hatColor: 0x243c66, weapon: 'flag', weaponColor: 0xffc63d, weaponScale: 0.8, twoHanded: false, belt: 0xffc63d },
      lv: [
        L(1800, 0, 18, 0, 'Captain', 'Nearby towers fire 10% faster.', { buff: { rate: 0.10 } }),
        L(2800, 0, 20, 0, 'Chain of Command', '+15% fire rate.', { buff: { rate: 0.15 } }),
        L(6000, 0, 22, 0, 'Rally Horn', '+22% rate. Unlocks Rally.', { buff: { rate: 0.22 }, ability: 'rally' }),
        L(13000, 0, 24, 0, 'War Banner', '+30% rate, +10% damage.', { buff: { rate: 0.30, dmg: 0.10 } }),
        L(28000, 0, 27, 0, 'Supreme Command', '+40% rate, +20% damage.', { buff: { rate: 0.40, dmg: 0.20 } })
      ],
      ability: { id: 'rally', name: 'Rally!', desc: 'All towers fire 60% faster for 10s.', cd: 45, level: 2 }
    },

    boombox: {
      id: 'boombox', name: 'Boombox', role: 'Support', attack: 'support',
      desc: 'Extends the range and damage of nearby towers with loud beats.',
      price: 8000, reqLevel: 6, limit: 3,
      model: { kind: 'speaker', c1: 0x2a2f45, c2: 0x6ee7ff, scale: 0.85, plateR: 2.0 },
      lv: [
        L(2200, 0, 20, 0, 'Boombox', 'Nearby towers gain 12% range.', { buff: { range: 0.12 } }),
        L(3400, 0, 22, 0, 'Bass Boost', '+18% range.', { buff: { range: 0.18 } }),
        L(7200, 0, 24, 0, 'Subwoofer', '+24% range, +10% damage.', { buff: { range: 0.24, dmg: 0.10 } }),
        L(15000, 0, 26, 0, 'Sound System', '+32% range, +18% damage.', { buff: { range: 0.32, dmg: 0.18 } }),
        L(32000, 0, 29, 0, 'Festival Rig', '+42% range, +28% dmg, +15% rate.', { buff: { range: 0.42, dmg: 0.28, rate: 0.15 } })
      ]
    },

    medic: {
      id: 'medic', name: 'Field Medic', role: 'Support', attack: 'heal',
      desc: 'Patches up the base between waves and revives fallen allies.',
      price: 3200, reqLevel: 4, limit: 3,
      model: { kind: 'humanoid', shirt: 0xe8ecf8, pants: 0x3b4460, hat: 'cap', hatColor: 0xffffff, hatColor2: 0xff5d6c, weapon: 'syringe', weaponColor: 0xff5d6c, twoHanded: false },
      lv: [
        L(1000, 0, 16, 0, 'Field Medic', 'Restores 3 base HP each wave.', { heal: 3 }),
        L(1600, 0, 17, 0, 'First Aid', 'Restores 6 HP each wave.', { heal: 6 }),
        L(3600, 0, 18, 0, 'Trauma Kit', 'Restores 11 HP each wave.', { heal: 11 }),
        L(8000, 0, 19, 0, 'Surgery', 'Restores 18 HP, revives units.', { heal: 18, revive: true }),
        L(18000, 0, 21, 0, 'Miracle Worker', 'Restores 30 HP each wave.', { heal: 30, revive: true })
      ],
      ability: { id: 'triage', name: 'Emergency Triage', desc: 'Instantly restore 15 base HP.', cd: 90, level: 2 }
    },

    marshal: {
      id: 'marshal', name: 'Marshal', role: 'Support', attack: 'support',
      desc: 'Reveals hidden enemies for every tower in range and slows them.',
      price: 5000, reqLevel: 5, limit: 3,
      model: { kind: 'humanoid', shirt: 0x3a3f56, pants: 0x262b3d, hat: 'top', hatColor: 0x1e2231, weapon: 'staff', weaponColor: 0xffc63d, weaponScale: 0.7 },
      lv: [
        L(1500, 0, 16, 0, 'Marshal', 'Reveals hidden. Enemies slowed 15%.', { reveal: true, aura: { slow: 0.15 } }),
        L(2400, 0, 18, 0, 'Lantern', 'Larger reveal, 20% slow.', { aura: { slow: 0.20 } }),
        L(5200, 0, 20, 0, 'Iron Will', '25% slow, +10% tower damage.', { aura: { slow: 0.25 }, buff: { dmg: 0.10 } }),
        L(11000, 0, 22, 0, 'Warded Ground', '32% slow, +18% damage.', { aura: { slow: 0.32 }, buff: { dmg: 0.18 } }),
        L(24000, 0, 25, 0, 'Lord Marshal', '40% slow, +28% damage.', { aura: { slow: 0.40 }, buff: { dmg: 0.28 } })
      ]
    },

    syndicate: {
      id: 'syndicate', name: 'Syndicate Boss', role: 'Economy', attack: 'spawn',
      desc: 'Runs a protection racket: steady cash plus armed enforcers.',
      price: 16000, reqLevel: 9, limit: 2,
      model: { kind: 'humanoid', shirt: 0x2a2f45, pants: 0x1e2231, hat: 'top', hatColor: 0x14171f, weapon: 'smg', weaponColor: 0x8a6a2a, belt: 0xffc63d },
      lv: [
        L(3500, 18, 18, 0.6, 'Syndicate Boss', '$120/wave, 2 enforcers.', { income: 120, units: { n: 2, hp: 180, dmg: 22, cd: 0.8, every: 14, speed: 5, hidden: true } }),
        L(5200, 30, 19, 0.55, 'Made Man', '$200/wave, tougher crew.', { income: 200, units: { n: 2, hp: 320, dmg: 40, cd: 0.75, every: 13, speed: 5, hidden: true } }),
        L(11000, 55, 20, 0.5, 'Underboss', '$320/wave, 3 enforcers.', { income: 320, units: { n: 3, hp: 560, dmg: 72, cd: 0.7, every: 12, speed: 5.4, hidden: true } }),
        L(24000, 105, 21, 0.45, 'Kingpin', '$540/wave, 4 enforcers.', { income: 540, units: { n: 4, hp: 1000, dmg: 135, cd: 0.65, every: 11, speed: 5.6, hidden: true } }),
        L(52000, 210, 23, 0.40, 'Don', '$900/wave, 5 elite enforcers.', { income: 900, units: { n: 5, hp: 1900, dmg: 260, cd: 0.6, every: 10, speed: 6, hidden: true } })
      ]
    },

    harlequin: {
      id: 'harlequin', name: 'Harlequin', role: 'Support', attack: 'bullet',
      desc: 'Throws wildly unpredictable bombs. High risk, high reward.',
      price: 7500, reqLevel: 6, limit: 4,
      model: { kind: 'humanoid', shirt: 0xa678ff, pants: 0x4f8cff, hat: 'horns', hatColor: 0xffc63d, weapon: 'pistol', weaponColor: 0xff5d6c, twoHanded: false },
      lv: [
        L(2000, 30, 19, 1.00, 'Harlequin', 'Damage varies wildly.', { chaos: [0.2, 2.5], splash: 4, hidden: true, projSpeed: 34 }),
        L(3100, 55, 20, 0.90, 'Loaded Dice', 'Better odds.', { chaos: [0.3, 2.8], splash: 4.5 }),
        L(6800, 100, 21, 0.80, 'Wild Card', 'Random status effects.', { chaos: [0.4, 3.0], splash: 5, randomStatus: true, flying: true }),
        L(15000, 200, 23, 0.70, 'Jackpot', 'Big swings, big payoffs.', { chaos: [0.5, 3.4], splash: 6, randomStatus: true, cash: 6 }),
        L(33000, 410, 25, 0.60, 'Grand Gamble', 'Occasionally deletes an enemy.', { chaos: [0.6, 4.0], splash: 7, randomStatus: true, cash: 12, execute: 0.05 })
      ]
    },

    spookPunk: {
      id: 'spookPunk', name: 'Spook Punk', role: 'Support', attack: 'bullet',
      desc: 'Frightens enemies into slowing down while pelting them.',
      price: 6800, reqLevel: 6, limit: 4,
      model: { kind: 'humanoid', shirt: 0x5a2f7a, pants: 0x2f1f3f, hat: 'horns', hatColor: 0xff8b3a, weapon: 'staff', weaponColor: 0xff8b3a, weaponScale: 0.75, face: false },
      lv: [
        L(1900, 24, 18, 0.80, 'Spook Punk', 'Nearby enemies slowed 12%.', { aura: { slow: 0.12 }, splash: 3.5, hidden: true }),
        L(2900, 44, 19, 0.74, 'Jack-o-Blast', 'Slows 18%.', { aura: { slow: 0.18 }, splash: 4 }),
        L(6300, 80, 20, 0.68, 'Haunting', 'Slows 24%. Hits air.', { aura: { slow: 0.24 }, splash: 4.6, flying: true }),
        L(14000, 160, 22, 0.60, 'Terror', 'Slows 32%, enemies flinch.', { aura: { slow: 0.32 }, splash: 5.4, fear: 0.25 }),
        L(30000, 330, 24, 0.52, 'Nightmare', 'Slows 40% and terrifies.', { aura: { slow: 0.40 }, splash: 6.2, fear: 0.4 })
      ]
    },

    /* ==================== SPAWNERS ==================== */
    barracks: {
      id: 'barracks', name: 'Barracks', role: 'Spawner', attack: 'spawn',
      desc: 'Deploys soldiers that march down the path and block enemies.',
      price: 4500, reqLevel: 4, limit: 5,
      model: { kind: 'barracks', c1: 0x4a5a3a, c2: 0x35422a, c3: 0x4f8cff, scale: 0.78, plateR: 2.1 },
      lv: [
        L(1800, 0, 16, 0, 'Barracks', '2 soldiers every 9s.', { units: { n: 2, hp: 70, dmg: 7, cd: 0.9, every: 9, speed: 4.6, block: 1 } }),
        L(2700, 0, 17, 0, 'Drill Sergeant', 'Tougher soldiers.', { units: { n: 2, hp: 140, dmg: 14, cd: 0.85, every: 8.5, speed: 4.8, block: 1 } }),
        L(6000, 0, 18, 0, 'Riot Squad', '3 soldiers with shields.', { units: { n: 3, hp: 300, dmg: 28, cd: 0.8, every: 8, speed: 5, block: 1, hidden: true } }),
        L(13000, 0, 19, 0, 'Heavy Weapons', '3 heavies, 2 blockers.', { units: { n: 3, hp: 620, dmg: 62, cd: 0.7, every: 7.5, speed: 5, block: 2, hidden: true } }),
        L(29000, 0, 21, 0, 'Special Forces', '4 elite operators.', { units: { n: 4, hp: 1300, dmg: 130, cd: 0.6, every: 7, speed: 5.4, block: 2, hidden: true } })
      ]
    },

    mercCamp: {
      id: 'mercCamp', name: 'Merc Camp', role: 'Spawner', attack: 'spawn',
      desc: 'Hires expensive mercenaries who hit hard and live long.',
      price: 11000, reqLevel: 7, limit: 4,
      model: { kind: 'campfire', c1: 0xff8b3a, c2: 0x2f6b4a, scale: 0.85, plateR: 2.2 },
      lv: [
        L(3500, 0, 18, 0, 'Merc Camp', '2 mercenaries every 12s.', { units: { n: 2, hp: 380, dmg: 34, cd: 0.7, every: 12, speed: 5, block: 1, ranged: 9, hidden: true } }),
        L(5200, 0, 19, 0, 'Better Contracts', 'Tougher mercenaries.', { units: { n: 2, hp: 720, dmg: 66, cd: 0.65, every: 11.5, speed: 5.2, block: 1, ranged: 10, hidden: true } }),
        L(11500, 0, 20, 0, 'Veteran Crew', '3 mercs with rifles.', { units: { n: 3, hp: 1400, dmg: 125, cd: 0.6, every: 11, speed: 5.4, block: 2, ranged: 11, hidden: true } }),
        L(25000, 0, 21, 0, 'Warband', '3 heavy mercs.', { units: { n: 3, hp: 2800, dmg: 250, cd: 0.55, every: 10.5, speed: 5.4, block: 2, ranged: 12, hidden: true } }),
        L(55000, 0, 23, 0, 'Legends for Hire', '4 legendary mercs.', { units: { n: 4, hp: 5600, dmg: 520, cd: 0.5, every: 10, speed: 5.8, block: 3, ranged: 13, hidden: true, flying: true } })
      ]
    },

    mechBay: {
      id: 'mechBay', name: 'Mech Bay', role: 'Spawner', attack: 'spawn',
      desc: 'Builds a single enormous walker that stomps anything in its way.',
      price: 30000, reqLevel: 11, limit: 2,
      model: { kind: 'mech', c1: 0x556080, c2: 0x8a93aa, scale: 0.8, plateR: 2.3 },
      lv: [
        L(9000, 0, 20, 0, 'Mech Bay', '1 walker every 20s.', { units: { n: 1, hp: 3000, dmg: 200, cd: 1.0, every: 20, speed: 3.6, block: 3, ranged: 10, splash: 5, scale: 1.5, hidden: true, flying: true } }),
        L(14000, 0, 21, 0, 'Reinforced Plate', 'Sturdier walker.', { units: { n: 1, hp: 6500, dmg: 380, cd: 0.95, every: 19, speed: 3.8, block: 3, ranged: 11, splash: 6, scale: 1.6, hidden: true, flying: true } }),
        L(30000, 0, 22, 0, 'Missile Pods', 'Walker gains rockets.', { units: { n: 1, hp: 13000, dmg: 720, cd: 0.9, every: 18, speed: 4, block: 4, ranged: 13, splash: 7, scale: 1.7, hidden: true, flying: true } }),
        L(66000, 0, 24, 0, 'Twin Bay', '2 walkers at once.', { units: { n: 2, hp: 24000, dmg: 1350, cd: 0.85, every: 18, speed: 4, block: 4, ranged: 14, splash: 8, scale: 1.8, hidden: true, flying: true } }),
        L(140000, 0, 26, 0, 'Titan Protocol', '2 colossal titans.', { units: { n: 2, hp: 48000, dmg: 2800, cd: 0.8, every: 17, speed: 4.2, block: 5, ranged: 15, splash: 10, scale: 2.1, hidden: true, flying: true } })
      ]
    },

    yuleCamp: {
      id: 'yuleCamp', name: 'Yule Camp', role: 'Spawner', attack: 'spawn',
      desc: 'Festive helpers swarm out in numbers and move quickly.',
      price: 9000, reqLevel: 6, limit: 4,
      model: { kind: 'campfire', c1: 0x9ff0ff, c2: 0xc0473a, scale: 0.85, plateR: 2.2 },
      lv: [
        L(2600, 0, 17, 0, 'Yule Camp', '3 helpers every 8s.', { units: { n: 3, hp: 120, dmg: 22, cd: 0.5, every: 8, speed: 6.4, block: 1, scale: 0.7 } }),
        L(3900, 0, 18, 0, 'Workshop', '4 helpers.', { units: { n: 4, hp: 230, dmg: 40, cd: 0.48, every: 7.6, speed: 6.6, block: 1, scale: 0.7 } }),
        L(8500, 0, 19, 0, 'Toy Rifles', '4 armed helpers.', { units: { n: 4, hp: 460, dmg: 78, cd: 0.45, every: 7.2, speed: 6.8, block: 1, ranged: 8, hidden: true, scale: 0.72 } }),
        L(18500, 0, 20, 0, 'Sleigh Drop', '5 helpers.', { units: { n: 5, hp: 920, dmg: 155, cd: 0.42, every: 7, speed: 7, block: 2, ranged: 9, hidden: true, scale: 0.75 } }),
        L(40000, 0, 22, 0, 'Grand Workshop', '6 elite helpers.', { units: { n: 6, hp: 1800, dmg: 310, cd: 0.4, every: 6.6, speed: 7.2, block: 2, ranged: 10, hidden: true, flying: true, scale: 0.8 } })
      ]
    },

    mechanic: {
      id: 'mechanic', name: 'Mechanic', role: 'Spawner', attack: 'build',
      desc: 'Bolts together small sentries around itself. They never move.',
      price: 7500, reqLevel: 6, limit: 4,
      model: { kind: 'humanoid', shirt: 0xd8a33a, pants: 0x3a3f52, hat: 'helmet', hatColor: 0xffc63d, hatColor2: 0x8a6a2a, weapon: 'wrench', weaponColor: 0xb8c0d4, twoHanded: false },
      lv: [
        L(2400, 0, 18, 0, 'Mechanic', 'Builds 2 sentries.', { build: { n: 2, dmg: 14, cd: 0.55, range: 14, hp: 999 } }),
        L(3700, 0, 19, 0, 'Better Tools', 'Stronger sentries.', { build: { n: 2, dmg: 26, cd: 0.5, range: 15 } }),
        L(8000, 0, 20, 0, 'Radar Kit', '3 sentries, see hidden.', { build: { n: 3, dmg: 46, cd: 0.45, range: 16, hidden: true } }),
        L(17500, 0, 21, 0, 'Missile Sentries', '3 sentries with rockets.', { build: { n: 3, dmg: 95, cd: 0.42, range: 17, hidden: true, flying: true, splash: 4 } }),
        L(38000, 0, 23, 0, 'Automation', '4 heavy sentries.', { build: { n: 4, dmg: 190, cd: 0.38, range: 18, hidden: true, flying: true, splash: 5 } })
      ]
    },

    bonecaller: {
      id: 'bonecaller', name: 'Bonecaller', role: 'Spawner', attack: 'raise',
      desc: 'Raises slain enemies to fight for you. Scales with the wave.',
      price: 18000, reqLevel: 10, limit: 3,
      model: { kind: 'obelisk', c1: 0x3b2f66, c2: 0xa678ff, scale: 0.75, plateR: 2.0 },
      lv: [
        L(4000, 45, 20, 1.20, 'Bonecaller', 'Raises 1 fallen enemy per 8s.', { raise: { n: 1, every: 8, hpPct: 0.5, dmgPct: 0.6, life: 20 }, hidden: true, splash: 4 }),
        L(6000, 85, 21, 1.10, 'Dark Study', 'Stronger thralls.', { raise: { n: 1, every: 7, hpPct: 0.7, dmgPct: 0.8, life: 24 }, splash: 4.5 }),
        L(13000, 160, 22, 1.00, 'Grave Tide', 'Raises 2 thralls.', { raise: { n: 2, every: 6.5, hpPct: 0.9, dmgPct: 1.0, life: 26 }, splash: 5, flying: true }),
        L(28000, 320, 24, 0.90, 'Lich Rites', 'Raises 3 thralls.', { raise: { n: 3, every: 6, hpPct: 1.1, dmgPct: 1.3, life: 30 }, splash: 6 }),
        L(60000, 660, 26, 0.80, 'Army of the Dead', 'Raises 4 powerful thralls.', { raise: { n: 4, every: 5.5, hpPct: 1.4, dmgPct: 1.7, life: 34 }, splash: 7 })
      ]
    },

    hivemind: {
      id: 'hivemind', name: 'Hivemind', role: 'Spawner', attack: 'drones',
      desc: 'Releases a swarm of drones that chase enemies through the air.',
      price: 10000, reqLevel: 7, limit: 4,
      model: { kind: 'obelisk', c1: 0x2f5a4a, c2: 0x6ef0b0, scale: 0.7, plateR: 2.0 },
      lv: [
        L(3200, 0, 20, 0, 'Hivemind', '3 drones patrol nearby.', { drones: { n: 3, dmg: 16, cd: 0.6, hp: 160, hidden: true, flying: true } }),
        L(4800, 0, 22, 0, 'Bigger Swarm', '4 drones.', { drones: { n: 4, dmg: 30, cd: 0.55, hp: 320 } }),
        L(10500, 0, 24, 0, 'Sting Upgrade', '5 drones with venom.', { drones: { n: 5, dmg: 55, cd: 0.5, hp: 620, poison: { dps: 18, dur: 3 } } }),
        L(23000, 0, 26, 0, 'Queen Protocol', '6 drones.', { drones: { n: 6, dmg: 110, cd: 0.45, hp: 1200, poison: { dps: 40, dur: 3 } } }),
        L(50000, 0, 29, 0, 'Endless Swarm', '8 deadly drones.', { drones: { n: 8, dmg: 220, cd: 0.4, hp: 2400, poison: { dps: 90, dur: 4 } } })
      ]
    },

    /* ==================== AIR ==================== */
    skyAce: {
      id: 'skyAce', name: 'Sky Ace', role: 'Air', attack: 'plane',
      desc: 'A fighter circles the map strafing everything beneath it.',
      price: 13000, reqLevel: 8, limit: 3,
      model: { kind: 'hangar', c1: 0x4a5568, c2: 0xdd4b3e, c3: 0xd8dcea, scale: 0.8, plateR: 2.3 },
      lv: [
        L(4500, 26, 34, 0.24, 'Sky Ace', 'Strafes along its flight path.', { hidden: true, flying: true, planeSpeed: 0.55 }),
        L(6800, 46, 37, 0.22, 'Tuned Engine', 'Flies faster and hits harder.', { planeSpeed: 0.65 }),
        L(15000, 85, 40, 0.20, 'Rocket Pods', 'Adds splash damage.', { splash: 5, planeSpeed: 0.72 }),
        L(32000, 170, 44, 0.18, 'Bomb Bay', 'Drops bombs on the path.', { splash: 6.5, planeSpeed: 0.8, bombs: true }),
        L(70000, 350, 48, 0.16, 'Air Superiority', 'Two aircraft on patrol.', { splash: 8, planeSpeed: 0.9, bombs: true, planes: 2 })
      ],
      ability: { id: 'airstrike', name: 'Airstrike', desc: 'Carpet-bomb the busiest stretch of path.', cd: 60, level: 2 }
    },

    gunship: {
      id: 'gunship', name: 'Gunship', role: 'Air', attack: 'chopper',
      desc: 'A helicopter that hovers over the path laying down suppressive fire.',
      price: 26000, reqLevel: 10, limit: 2,
      model: { kind: 'hangar', c1: 0x3f4a3a, c2: 0x4a5a3a, c3: 0x2f3a24, scale: 0.8, plateR: 2.3 },
      lv: [
        L(8000, 34, 26, 0.14, 'Gunship', 'Hovers and fires miniguns.', { hidden: true, flying: true, hover: 14 }),
        L(12000, 60, 28, 0.13, 'Armour Plating', 'Tougher, deadlier.', { hover: 15 }),
        L(26000, 110, 30, 0.12, 'Rocket Rails', 'Adds splash rockets.', { splash: 5, hover: 16 }),
        L(56000, 220, 32, 0.11, 'Gatling Pods', 'Doubles the guns.', { splash: 6, hover: 17 }),
        L(120000, 450, 35, 0.10, 'Apex Gunship', 'Total air dominance.', { splash: 7.5, hover: 18, stun: 0.15 })
      ]
    },

    /* ==================== SPECIAL ==================== */
    snareSetter: {
      id: 'snareSetter', name: 'Snare Setter', role: 'Trap', attack: 'trap',
      desc: 'Places traps directly on the path. They arm, trigger, and reset.',
      price: 2600, reqLevel: 3, limit: 8, placeOn: 'path',
      model: { kind: 'trap', c1: 0x6a5a3a, c2: 0xb8c0d4, scale: 0.9, noPlate: true },
      lv: [
        L(900, 120, 3.2, 12.0, 'Snare Setter', 'Trap damages and stuns 1s.', { stun: 1.0, hidden: true, flying: false }),
        L(1400, 240, 3.4, 11.0, 'Sharper Teeth', 'More damage.', { stun: 1.1 }),
        L(3100, 500, 3.6, 10.0, 'Bear Trap', 'Splash damage.', { stun: 1.3, splash: 4 }),
        L(6800, 1100, 3.8, 9.0, 'Explosive Trap', 'Detonates violently.', { stun: 1.5, splash: 5.5, burn: { dps: 80, dur: 4 } }),
        L(15000, 2600, 4.2, 8.0, 'Landmine', 'Devastating area blast.', { stun: 2.0, splash: 7, burn: { dps: 180, dur: 4 } })
      ]
    },

    particleLance: {
      id: 'particleLance', name: 'Particle Lance', role: 'DPS', attack: 'beam',
      desc: 'Charges a beam that grows more powerful the longer it fires.',
      price: 45000, reqLevel: 13, limit: 2,
      model: { kind: 'dish', c1: 0xd8dcea, c2: 0x6ee7ff, scale: 0.85, plateR: 2.1 },
      lv: [
        L(12000, 55, 26, 0.10, 'Particle Lance', 'Beam ramps up to 3× damage.', { ramp: { max: 3, rate: 0.35 }, hidden: true, flying: true, pierce: 2 }),
        L(18000, 100, 28, 0.10, 'Focusing Array', 'Faster charge.', { ramp: { max: 3.5, rate: 0.45 }, pierce: 2 }),
        L(40000, 190, 30, 0.09, 'Beam Splitter', 'Pierces 3 enemies.', { ramp: { max: 4, rate: 0.5 }, pierce: 3 }),
        L(85000, 390, 32, 0.09, 'Antimatter Core', 'Melts armour.', { ramp: { max: 4.5, rate: 0.6 }, pierce: 4, armorPierce: 0.6 }),
        L(180000, 800, 35, 0.08, 'Singularity', 'Annihilates everything in line.', { ramp: { max: 5, rate: 0.7 }, pierce: 6, armorPierce: 0.85 })
      ]
    },

    soulHarvester: {
      id: 'soulHarvester', name: 'Soul Harvester', role: 'DPS', attack: 'bullet',
      desc: 'Permanently grows stronger with every enemy it kills.',
      price: 20000, reqLevel: 10, limit: 3,
      model: { kind: 'obelisk', c1: 0x2a2f45, c2: 0x9ef05e, scale: 0.75, plateR: 2.0 },
      lv: [
        L(5000, 50, 22, 1.00, 'Soul Harvester', '+0.6% damage per kill (max +150%).', { harvest: { per: 0.006, max: 1.5 }, hidden: true, splash: 3, projSpeed: 44 }),
        L(7500, 95, 23, 0.92, 'Soul Jar', 'Max +200%.', { harvest: { per: 0.007, max: 2.0 }, splash: 3.5 }),
        L(16000, 180, 24, 0.84, 'Reaping', 'Hits air. Max +260%.', { harvest: { per: 0.008, max: 2.6 }, splash: 4.2, flying: true }),
        L(34000, 360, 26, 0.76, 'Soul Engine', 'Max +330%.', { harvest: { per: 0.010, max: 3.3 }, splash: 5 }),
        L(72000, 740, 28, 0.68, 'Devourer', 'Max +420%, executes the weak.', { harvest: { per: 0.012, max: 4.2 }, splash: 6, execute: 0.06 })
      ]
    }
  };

  /* ------------------------------------------------------------------
     Golden variants — generated from a base tower so they stay in sync.
     ------------------------------------------------------------------ */
  const GOLD_TINT = { shirt: 0xd9b23a, pants: 0x8a6a2a, hatColor: 0xffd45e, weaponColor: 0xffc63d, plate: 0x6a5220 };
  function gild(baseId, gemPrice, reqLevel, dmgMul, cdMul, rangeAdd, blurb) {
    const b = TOWERS[baseId];
    const g = JSON.parse(JSON.stringify(b));
    g.id = 'gilded_' + baseId;
    g.name = 'Gilded ' + b.name;
    g.role = 'Golden';
    g.desc = blurb;
    g.price = gemPrice; g.currency = 'gems'; g.reqLevel = reqLevel;
    g.limit = Math.max(2, Math.floor(b.limit * 0.6));
    g.model = Object.assign({}, b.model, GOLD_TINT, { tints: null });
    g.lv = g.lv.map((l, i) => Object.assign({}, l, {
      c: Math.round(l.c * 1.45),
      d: Math.round(l.d * dmgMul * 10) / 10,
      cd: Math.round(l.cd * cdMul * 1000) / 1000,
      r: l.r + (l.r > 0 ? rangeAdd : 0),
      n: i === 0 ? g.name : l.n
    }));
    TOWERS[g.id] = g;
  }
  gild('recruit', 250, 4, 1.7, 0.85, 2, 'A Recruit plated in gold. Faster, stronger, flashier.');
  gild('scattergun', 400, 6, 1.6, 0.88, 2, 'Golden pellets punch far above their weight.');
  gild('marksman', 450, 7, 1.75, 0.85, 4, 'A gilded rifle that drops bosses in a handful of shots.');
  gild('bomber', 400, 6, 1.65, 0.88, 2, 'Gold-cased charges with a punishing blast radius.');
  gild('chaingunner', 700, 10, 1.6, 0.88, 3, 'The final word in sustained damage.');

  /* ------------------------------------------------------------------
     Derived helpers
     ------------------------------------------------------------------ */
  /* Attack styles that can never reach a flying target, at any level:
     lobbed artillery, anything swung by hand, and ground traps. */
  const GROUNDED = { mortar: 1, melee: 1, slam: 1, trap: 1, flame: 1 };

  /* Flatten a level's stats: extras accumulate from level 0 upward. */
  function statsAt(def, level) {
    const s = { dmg: 0, range: 0, cd: 0 };
    for (let i = 0; i <= level && i < def.lv.length; i++) {
      const l = def.lv[i];
      s.dmg = l.d; s.range = l.r; s.cd = l.cd;
      Object.assign(s, l.x || {});
    }
    s.attack = def.attack;
    /* Any ranged tower learns to lead an airborne target by level 2. Towers
       that list `flying` earlier keep that head start; grounded styles never
       gain it. */
    if (level >= 2 && !GROUNDED[def.attack]) s.flying = true;
    return s;
  }
  function totalCost(def, level) {
    let t = 0;
    for (let i = 0; i <= level; i++) t += def.lv[i].c;
    return t;
  }
  function dpsOf(def, level) {
    const s = statsAt(def, level);
    if (!s.cd || !s.dmg) return 0;
    let d = s.dmg;
    if (s.pellets) d *= s.pellets;
    if (s.volley) d *= s.volley;
    if (s.chain) d *= Math.min(3, s.chain * 0.6);
    if (s.meleeTargets) d *= Math.min(2, s.meleeTargets * 0.7);
    return Math.round(d / s.cd);
  }

  TD.TOWERS = TOWERS;
  TD.TOWER_IDS = Object.keys(TOWERS);
  TD.statsAt = statsAt;
  TD.towerTotalCost = totalCost;
  TD.towerDps = dpsOf;
  TD.ROLES = ['All', 'Starter', 'DPS', 'Explosive', 'Elemental', 'Melee', 'Support', 'Economy', 'Spawner', 'Air', 'Trap', 'Golden'];
})();
