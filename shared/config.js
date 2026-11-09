// Shared between server and client. Keep this file dependency-free.

export const CONFIG = {
  TICK_RATE: 20,            // server simulation Hz
  SNAPSHOT_RATE: 15,        // network snapshot Hz
  MAX_PLAYERS_PER_ROOM: 8,  // one plot per player
  PLOT_SIZE: 48,            // plots are PLOT_SIZE x PLOT_SIZE studs
  PLOT_SPACING: 64,
  WORLD_HALF_X: 150,        // world bounds (players are clamped inside)
  WORLD_HALF_Z: 100,
  PLAYER_SPEED: 10,
  JUMP_SPEED: 17,
  GRAVITY: 40,
  PAD_RADIUS: 2.4,          // step on a pad within this radius to trigger it
  INTERACT_SLACK: 4,        // server tolerance for pad distance checks
  RECONNECT_GRACE_MS: 120_000,
  CONVEYOR_SPEED: 6,        // studs per second
  CONVEYOR_Z: -9,           // local z of the conveyor belt
  CONVEYOR_X0: -22,         // belt start (local x)
  COLLECTOR_X: 14,          // local x where cubes are collected
  DROP_HEIGHT: 6.5,         // nozzle height; cubes fall to belt top
  BELT_TOP: 1.0,
  FALL_TIME: 0.55,          // seconds for a cube to fall onto the belt
  REBIRTH_BONUS: 0.5,       // +50% income per rebirth
  CHAT_MAX: 140,
  NAME_MAX: 16,
  POSITION_SEND_HZ: 15,
};

// Two rows of four plots facing each other across a central street.
// Front of a plot is local +z; `rot` rotates local -> world around Y.
export const PLOT_DEFS = (() => {
  const defs = [];
  const xs = [-96, -32, 32, 96];
  for (const x of xs) defs.push({ x, z: -56, rot: 0 });         // north row faces +z (toward street)
  for (const x of xs) defs.push({ x, z: 56, rot: Math.PI });    // south row faces -z
  return defs;
})();

export const HUB = { x: 0, z: 0, radius: 14 };

// Convert plot-local coordinates to world coordinates.
export function plotToWorld(plotIdx, lx, lz) {
  const p = PLOT_DEFS[plotIdx];
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  return { x: p.x + lx * c + lz * s, z: p.z - lx * s + lz * c };
}

export function dist2D(ax, az, bx, bz) {
  const dx = ax - bx, dz = az - bz;
  return Math.hypot(dx, dz);
}

export const PLAYER_COLORS = [
  0xff5e5b, 0x3dd6f5, 0xffd23f, 0x7bed9f, 0xb388ff, 0xff9f43, 0xf78fb3, 0x70a1ff,
];

export function sanitizeName(raw) {
  let s = String(raw ?? '').replace(/[^\w \-]/g, '').trim().slice(0, CONFIG.NAME_MAX);
  if (s.length < 2) s = 'Player' + Math.floor(100 + Math.random() * 900);
  return s;
}

export function formatCash(n) {
  n = Math.floor(n);
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e4) return '$' + (n / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
  return '$' + n.toLocaleString('en-US');
}
