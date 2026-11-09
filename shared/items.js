// The tycoon build tree. Positions are plot-local (front of plot = +z).
// Every item is bought by stepping on its pad once its `requires` are owned.
//
// type 'dropper'  : { x, value, interval } drops a cube worth `value` every `interval` seconds
// type 'upgrader' : { x, mult } cubes passing through are multiplied
// type 'build'    : cosmetic/structural (walls, roof, lights, sign)
// type 'boost'    : economy modifier (turbo, autocollect)
// type 'rebirth'  : resets the tycoon for a permanent income multiplier

export const ITEMS = [
  { id: 'dropper1', name: 'Dropper', price: 0, type: 'dropper', x: -20, value: 2, interval: 1.5, pad: [-18, 3], requires: [],
    desc: 'Drops $2 cubes onto the conveyor.' },
  { id: 'dropper2', name: 'Dropper II', price: 60, type: 'dropper', x: -16, value: 4, interval: 1.5, pad: [-12, 3], requires: ['dropper1'],
    desc: 'Drops $4 cubes.' },
  { id: 'walls', name: 'Walls', price: 200, type: 'build', build: 'walls', pad: [-6, 3], requires: ['dropper2'],
    desc: 'Build walls around your tycoon.' },
  { id: 'upgrader1', name: 'Upgrader x1.5', price: 350, type: 'upgrader', x: 4, mult: 1.5, pad: [0, 3], requires: ['dropper2'],
    desc: 'Cubes passing through are worth 1.5x.' },
  { id: 'dropper3', name: 'Dropper III', price: 700, type: 'dropper', x: -12, value: 10, interval: 1.5, pad: [6, 3], requires: ['upgrader1'],
    desc: 'Drops $10 cubes.' },
  { id: 'roof', name: 'Roof', price: 1200, type: 'build', build: 'roof', pad: [12, 3], requires: ['walls'],
    desc: 'Put a roof over your factory.' },
  { id: 'dropper4', name: 'Dropper IV', price: 2000, type: 'dropper', x: -8, value: 20, interval: 1.5, pad: [18, 3], requires: ['dropper3'],
    desc: 'Drops $20 cubes.' },
  { id: 'upgrader2', name: 'Upgrader x2', price: 3500, type: 'upgrader', x: 7, mult: 2, pad: [-18, 10], requires: ['upgrader1', 'dropper4'],
    desc: 'Cubes passing through are worth 2x.' },
  { id: 'turbo', name: 'Turbo Droppers', price: 5000, type: 'boost', boost: 'turbo', pad: [-12, 10], requires: ['dropper4'],
    desc: 'All droppers fire 50% faster.' },
  { id: 'dropper5', name: 'Dropper V', price: 8000, type: 'dropper', x: -4, value: 45, interval: 1.5, pad: [-6, 10], requires: ['dropper4'],
    desc: 'Drops $45 cubes.' },
  { id: 'lights', name: 'Neon Lights', price: 10000, type: 'build', build: 'lights', pad: [0, 10], requires: ['roof'],
    desc: 'Light up your tycoon.' },
  { id: 'autocollect', name: 'Auto Collector', price: 15000, type: 'boost', boost: 'autocollect', pad: [6, 10], requires: ['dropper5'],
    desc: 'Cash goes straight to your wallet.' },
  { id: 'upgrader3', name: 'Upgrader x2', price: 20000, type: 'upgrader', x: 10, mult: 2, pad: [12, 10], requires: ['upgrader2', 'dropper5'],
    desc: 'Cubes passing through are worth 2x.' },
  { id: 'sign', name: 'Tycoon Sign', price: 25000, type: 'build', build: 'sign', pad: [18, 10], requires: ['lights'],
    desc: 'A giant sign with your name on it.' },
  { id: 'dropper6', name: 'Golden Dropper', price: 35000, type: 'dropper', x: 0, value: 120, interval: 1.5, pad: [-12, 17], requires: ['upgrader3'],
    desc: 'Drops $120 golden cubes.' },
  { id: 'rebirth', name: 'REBIRTH', price: 100000, type: 'rebirth', pad: [12, 17],
    requires: ['dropper6', 'sign', 'autocollect', 'turbo', 'roof'],
    desc: 'Reset your tycoon for +50% permanent income.' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// Special (non-purchase) pads, plot-local.
export const SPECIAL_PADS = {
  claim: { pad: [0, 21], radius: 3 },       // step here on an unowned plot to claim it
  collect: { pad: [14, -3], radius: 2.6 },  // step here to collect cash from the collector
};

export function isAvailable(item, ownedSet) {
  if (ownedSet.has(item.id)) return false;
  return item.requires.every((r) => ownedSet.has(r));
}

export function incomeMultiplier(ownedSet, rebirths, rebirthBonus) {
  let mult = 1;
  for (const it of ITEMS) {
    if (it.type === 'upgrader' && ownedSet.has(it.id)) mult *= it.mult;
  }
  return mult * (1 + rebirths * rebirthBonus);
}

export function dropperInterval(item, ownedSet) {
  return ownedSet.has('turbo') ? item.interval / 1.5 : item.interval;
}
