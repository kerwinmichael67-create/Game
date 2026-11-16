/* ========================================================================
   Cars: models, procedural meshes and the driving model.
   Conventions (y is up):
     forward = (sin yaw, 0, cos yaw)      right = forward × up = (-cos yaw, 0, sin yaw)
     steer > 0 turns RIGHT, so yaw decreases.   lateral speed vr > 0 means sliding to the right.
   ======================================================================== */
const CAR = { len: 4.4, wid: 2.0, radius: 2.3 };

/* side silhouettes run rear-bottom → over the roof → front-bottom; cabin = [deck, roof rear, roof front, cowl] indices */
const CAR_MODELS = [
  {
    id: 'vanta',
    name: 'Vanta S',
    price: 0,
    tag: 'Balanced coupé',
    desc: 'The all-rounder you start with. Honest grip and an easy, catchable slide.',
    mod: { top: 0, accel: 0, grip: 0 },
    body: [
      [-2.2, 0.34],
      [-2.28, 0.6],
      [-2.18, 0.84],
      [-1.5, 0.9],
      [-0.8, 1.22],
      [0.3, 1.27],
      [1.1, 0.9],
      [2.0, 0.74],
      [2.26, 0.58],
      [2.22, 0.34],
    ],
    cabin: [3, 4, 5, 6],
    w: 1.96,
    wb: 1.42,
  },
  {
    id: 'kite',
    name: 'Kite RS',
    price: 3000,
    tag: 'Featherweight hatch',
    desc: 'Corners on rails and stops on a coin, but runs out of breath on long straights.',
    mod: { top: -3.5, accel: 1.2, grip: 3.2, brake: 4 },
    body: [
      [-1.92, 0.34],
      [-2.0, 0.62],
      [-1.97, 0.96],
      [-1.7, 1.34],
      [-0.2, 1.39],
      [0.74, 0.98],
      [1.72, 0.84],
      [1.98, 0.62],
      [1.95, 0.34],
    ],
    cabin: [2, 3, 4, 5],
    w: 1.86,
    wb: 1.3,
  },
  {
    id: 'brute',
    name: 'Brute 427',
    price: 5500,
    tag: 'Big-block muscle',
    desc: 'Savage launch and a tail that steps out if you so much as look at the handbrake.',
    mod: { top: 2, accel: 3.2, grip: -2, nitroPower: 0.1, driftBonus: 0.25 },
    body: [
      [-2.32, 0.36],
      [-2.4, 0.66],
      [-2.32, 0.93],
      [-1.6, 0.97],
      [-1.12, 1.31],
      [0.0, 1.34],
      [0.56, 0.99],
      [2.18, 0.93],
      [2.4, 0.7],
      [2.36, 0.36],
    ],
    cabin: [3, 4, 5, 6],
    w: 2.02,
    wb: 1.5,
  },
  {
    id: 'apex',
    name: 'Apex GT-X',
    price: 12000,
    tag: 'Mid-engine hypercar',
    desc: 'The fastest thing on any grid. Needs commitment, repays it with lap records.',
    mod: { top: 6.5, accel: 2.2, grip: 2.5, nitroCap: 1.2 },
    body: [
      [-2.2, 0.3],
      [-2.3, 0.56],
      [-2.24, 0.8],
      [-1.25, 0.88],
      [-0.55, 1.08],
      [0.45, 1.1],
      [1.45, 0.72],
      [2.2, 0.5],
      [2.3, 0.3],
    ],
    cabin: [3, 4, 5, 6],
    w: 2.04,
    wb: 1.46,
  },
];
const carModel = (id) => CAR_MODELS.find((m) => m.id === id) || CAR_MODELS[0];

const UPGRADES = [
  { id: 'engine', name: 'Engine', icon: '⚙️', desc: 'Raises top speed.', costs: [400, 800, 1400, 2200, 3200] },
  { id: 'turbo', name: 'Turbo', icon: '🌀', desc: 'Sharper acceleration out of corners.', costs: [350, 700, 1200, 1900, 2800] },
  { id: 'tires', name: 'Tyres', icon: '🛞', desc: 'More cornering grip and later braking.', costs: [300, 650, 1100, 1800, 2600] },
  { id: 'nitro', name: 'Nitro', icon: '🔥', desc: 'Bigger tank, harder boost, faster recharge.', costs: [450, 900, 1500, 2300, 3300] },
];
const MAX_LEVEL = 5;
const SLOPE_G = 6.4; /* m/s² per unit of slope: a little under real gravity, so hills are felt but never stall a car */
const DRIFT_TIERS = [0.55, 1.3, 2.3]; /* seconds of quality sliding for each mini-turbo tier */
const TIER_HEX = [0xffffff, 0x4fc3ff, 0xffa13a, 0xd27bff];

/* derive physics stats from upgrade levels (0..5) and the car model */
function carStats(up = {}, modelId = 'vanta') {
  const m = carModel(modelId).mod,
    e = up.engine || 0,
    t = up.turbo || 0,
    g = up.tires || 0,
    n = up.nitro || 0;
  return {
    topSpeed: 52 + e * 4.2 + m.top /* m/s */,
    accel: 13 + t * 2.1 + m.accel /* m/s² at low speed */,
    brake: 27 + g * 1.5 + (m.brake || 0),
    grip: 21 + g * 1.5 + m.grip /* lateral acceleration the tyres can hold, m/s² */,
    steer: 2.2 + g * 0.08 /* rad/s yaw rate at parking speeds */,
    nitroCap: 100 * (1 + n * 0.25) * (m.nitroCap || 1),
    nitroPower: 1.55 + n * 0.09 + (m.nitroPower || 0) /* accel multiplier while boosting */,
    nitroTop: 1.22 + n * 0.03 /* top speed multiplier while boosting */,
    nitroRegen: 4 + n * 1.4 /* units / s */,
    driftBonus: 1 + (m.driftBonus || 0),
    levels: { engine: e, turbo: t, tires: g, nitro: n },
    model: carModel(modelId).id,
  };
}
