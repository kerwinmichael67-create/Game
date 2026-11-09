import * as THREE from 'three';
import { CONFIG, PLOT_DEFS, HUB, plotToWorld, formatCash } from '/shared/config.js';
import { ITEMS, ITEM_BY_ID, SPECIAL_PADS, isAvailable } from '/shared/items.js';
import { Label, Board, roundRect } from './text.js';

const C = CONFIG;

// ---------- shared geometry/material cache ----------
const MAT = {
  base: new THREE.MeshLambertMaterial({ color: 0xd8dde3 }),
  baseTrim: new THREE.MeshLambertMaterial({ color: 0x7e8a99 }),
  belt: null, // created lazily (textured)
  rail: new THREE.MeshLambertMaterial({ color: 0x3b4252 }),
  collector: new THREE.MeshLambertMaterial({ color: 0x2b6cb0 }),
  collectorTop: new THREE.MeshLambertMaterial({ color: 0x1e4e8c }),
  post: new THREE.MeshLambertMaterial({ color: 0x4b5563 }),
  wall: new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }),
  wallTrim: new THREE.MeshLambertMaterial({ color: 0x334155 }),
  roof: new THREE.MeshLambertMaterial({ color: 0xb91c1c, emissive: 0x3b0a0a }),
  pillar: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
  padAvail: new THREE.MeshLambertMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.6 }),
  padPoor: new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.5 }),
  padClaim: new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.7 }),
  padCollect: new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.6 }),
  padRing: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
  neon: new THREE.MeshBasicMaterial({ color: 0xf0abfc }),
  neon2: new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
  gold: new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.3 }),
};
const GEO = {
  pad: new THREE.CylinderGeometry(C.PAD_RADIUS, C.PAD_RADIUS, 0.3, 28),
  padRing: new THREE.RingGeometry(C.PAD_RADIUS + 0.15, C.PAD_RADIUS + 0.45, 32),
  cube: new THREE.BoxGeometry(1, 1, 1),
};
const DROPPER_COLORS = { dropper1: 0x94a3b8, dropper2: 0x4ade80, dropper3: 0x60a5fa, dropper4: 0xa78bfa, dropper5: 0xf87171, dropper6: 0xfbbf24 };
const UPGRADER_COLORS = { upgrader1: 0x22d3ee, upgrader2: 0xa855f7, upgrader3: 0xf43f5e };

function beltMaterial() {
  if (MAT.belt) return MAT.belt;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f2430'; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#3a4150';
  ctx.fillRect(0, 0, 10, 64);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(28, 0, 8, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  MAT.belt = new THREE.MeshLambertMaterial({ map: tex });
  MAT.beltTex = tex;
  return MAT.belt;
}

function box(w, h, d, mat, x, y, z, { shadow = true, parent } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// ---------- environment ----------

export function buildEnvironment(scene) {
  scene.background = new THREE.Color(0x9fd3ff);
  scene.fog = new THREE.Fog(0x9fd3ff, 140, 420);

  const hemi = new THREE.HemisphereLight(0xdfefff, 0x5b7a3a, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(60, 120, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 400;
  const S = 70;
  sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
  sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(sun.target);

  // Grass with a subtle grid.
  const gc = document.createElement('canvas');
  gc.width = gc.height = 128;
  const g = gc.getContext('2d');
  g.fillStyle = '#6cbf5c'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#63b454'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
  g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 2; g.strokeRect(1, 1, 126, 126);
  const grassTex = new THREE.CanvasTexture(gc);
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(50, 34);
  grassTex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 272), new THREE.MeshLambertMaterial({ map: grassTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Street between the two rows of plots.
  const street = new THREE.Mesh(new THREE.PlaneGeometry(300, 40), new THREE.MeshLambertMaterial({ color: 0x5b6472 }));
  street.rotation.x = -Math.PI / 2;
  street.position.y = 0.005;
  street.receiveShadow = true;
  scene.add(street);
  for (let x = -140; x <= 140; x += 12) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.01, 0);
    scene.add(dash);
  }

  // Spawn hub.
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(HUB.radius, HUB.radius + 1, 0.6, 48), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
  hub.position.set(HUB.x, 0.0, HUB.z);
  hub.receiveShadow = true;
  scene.add(hub);
  const hubRing = new THREE.Mesh(new THREE.RingGeometry(HUB.radius - 1.2, HUB.radius - 0.4, 64), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  hubRing.rotation.x = -Math.PI / 2;
  hubRing.position.set(HUB.x, 0.32, HUB.z);
  scene.add(hubRing);

  // Leaderboard totems at the north and south edges of the hub, readable from both sides.
  const boards = [];
  const solids = [];
  for (const zSide of [-1, 1]) {
    const tz = HUB.z + zSide * (HUB.radius + 3);
    scene.add(box(1.2, 14, 1.2, MAT.post, HUB.x, 7, tz));
    scene.add(box(12.6, 7.6, 0.6, MAT.wallTrim, HUB.x, 10.5, tz));
    for (const side of [1, -1]) {
      const b = new Board({ width: 12, height: 7, canvasW: 1024, canvasH: 600 });
      b.mesh.position.set(HUB.x, 10.5, tz + side * 0.35);
      if (side < 0) b.mesh.rotation.y = Math.PI;
      scene.add(b.mesh);
      boards.push(b);
    }
    solids.push(new THREE.Box3(new THREE.Vector3(HUB.x - 0.6, 0, tz - 0.6), new THREE.Vector3(HUB.x + 0.6, 14, tz + 0.6)));
    solids.push(new THREE.Box3(new THREE.Vector3(HUB.x - 6.3, 6.7, tz - 0.5), new THREE.Vector3(HUB.x + 6.3, 14.3, tz + 0.5)));
  }

  // Lamp posts along the street.
  for (const x of [-64, 0, 64]) for (const z of [-20, 20]) {
    if (x === 0) continue;
    scene.add(box(0.5, 9, 0.5, MAT.post, x, 4.5, z));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff7cc }));
    lamp.position.set(x, 9.4, z);
    scene.add(lamp);
  }

  // World border fences (visual only, players are clamped by config).
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
  for (const z of [-C.WORLD_HALF_Z, C.WORLD_HALF_Z]) scene.add(box(C.WORLD_HALF_X * 2, 2.5, 0.5, fenceMat, 0, 1.25, z));
  for (const x of [-C.WORLD_HALF_X, C.WORLD_HALF_X]) scene.add(box(0.5, 2.5, C.WORLD_HALF_Z * 2, fenceMat, x, 1.25, 0));

  return { sun, boards, solids };
}

export function drawLeaderboard(board, rows, myId) {
  board.draw((ctx, W, H) => {
    ctx.fillStyle = '#0b1220';
    roundRect(ctx, 0, 0, W, H, 30); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, W, 90);
    ctx.fillStyle = '#fff';
    ctx.font = '900 56px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TOP TYCOONS', W / 2, 46);
    ctx.textAlign = 'left';
    ctx.font = '700 42px "Segoe UI", Roboto, Arial, sans-serif';
    const top = rows.slice(0, 8);
    if (!top.length) {
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('Be the first to claim a tycoon!', W / 2, H / 2 + 30);
      return;
    }
    top.forEach((r, i) => {
      const y = 130 + i * 58;
      ctx.fillStyle = r.id === myId ? '#86efac' : '#e5e7eb';
      ctx.fillText(`${i + 1}.`, 40, y);
      ctx.fillText(r.name.slice(0, 16), 110, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(formatCash(r.cash) + (r.rebirths ? `  ★${r.rebirths}` : ''), W - 40, y);
      ctx.textAlign = 'left';
    });
  });
}

// ---------- a single tycoon plot ----------

export class Plot {
  constructor(idx, scene) {
    this.idx = idx;
    this.def = PLOT_DEFS[idx];
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(this.def.x, 0, this.def.z);
    this.group.rotation.y = this.def.rot;
    scene.add(this.group);

    this.owner = null;        // player id
    this.ownerName = null;
    this.owned = new Set();
    this.pool = 0;
    this.cubes = [];
    this.solids = [];
    this.solidsDirty = true;
    this.time = Math.random() * 10;

    this._buildBase();
    this._buildSpecialPads();
    this._buildConveyor();
    this._buildItems();
    this.refresh();
  }

  // --- construction ---

  _buildBase() {
    const S = C.PLOT_SIZE;
    const base = box(S, 1, S, MAT.base, 0, -0.5, 0, { shadow: false, parent: this.group });
    base.receiveShadow = true;
    // Trim border.
    const t = 0.8;
    box(S + t * 2, 0.6, t, MAT.baseTrim, 0, -0.3, -S / 2 - t / 2, { shadow: false, parent: this.group });
    box(S + t * 2, 0.6, t, MAT.baseTrim, 0, -0.3, S / 2 + t / 2, { shadow: false, parent: this.group });
    box(t, 0.6, S, MAT.baseTrim, -S / 2 - t / 2, -0.3, 0, { shadow: false, parent: this.group });
    box(t, 0.6, S, MAT.baseTrim, S / 2 + t / 2, -0.3, 0, { shadow: false, parent: this.group });

    // Owner label floating above the entrance.
    this.ownerLabel = new Label({ text: 'Unclaimed Tycoon', size: 2.2, color: '#ffffff', font: 'bold 48px "Segoe UI", Roboto, Arial, sans-serif' });
    this.ownerLabel.sprite.position.set(0, 9, S / 2 - 2);
    this.group.add(this.ownerLabel.sprite);
  }

  _buildSpecialPads() {
    // Claim pad.
    const cp = SPECIAL_PADS.claim;
    this.claimPad = new THREE.Group();
    const claimMesh = new THREE.Mesh(new THREE.CylinderGeometry(cp.radius, cp.radius, 0.3, 32), MAT.padClaim);
    claimMesh.position.y = 0.15;
    claimMesh.receiveShadow = true;
    this.claimPad.add(claimMesh);
    this.claimLabel = new Label({ text: 'CLAIM TYCOON', size: 1.6, color: '#fde68a', font: 'bold 48px "Segoe UI", Roboto, Arial, sans-serif' });
    this.claimLabel.sprite.position.y = 3.2;
    this.claimPad.add(this.claimLabel.sprite);
    this.claimPad.position.set(cp.pad[0], 0, cp.pad[1]);
    this.group.add(this.claimPad);

    // Collector box + collect pad.
    this.collectorGroup = new THREE.Group();
    const cx = C.COLLECTOR_X + 2.2, cz = C.CONVEYOR_Z;
    box(4.4, 4.5, 4.4, MAT.collector, cx, 2.25, cz, { parent: this.collectorGroup });
    box(5, 0.6, 5, MAT.collectorTop, cx, 4.8, cz, { parent: this.collectorGroup });
    // Funnel mouth facing the belt (-x).
    box(0.6, 2.4, 3.4, MAT.collectorTop, cx - 2.5, 2.2, cz, { parent: this.collectorGroup });
    this.poolLabel = new Label({ text: '$0', size: 1.5, color: '#86efac', font: 'bold 52px "Segoe UI", Roboto, Arial, sans-serif' });
    this.poolLabel.sprite.position.set(cx, 6.4, cz);
    this.collectorGroup.add(this.poolLabel.sprite);

    const sp = SPECIAL_PADS.collect;
    const collectPad = new THREE.Mesh(new THREE.CylinderGeometry(sp.radius, sp.radius, 0.3, 32), MAT.padCollect);
    collectPad.position.set(sp.pad[0], 0.15, sp.pad[1]);
    collectPad.receiveShadow = true;
    this.collectorGroup.add(collectPad);
    this.collectLabel = new Label({ text: 'COLLECT', size: 1.2, color: '#bae6fd' });
    this.collectLabel.sprite.position.set(sp.pad[0], 2.6, sp.pad[1]);
    this.collectorGroup.add(this.collectLabel.sprite);
    this.group.add(this.collectorGroup);
  }

  _buildConveyor() {
    this.conveyor = new THREE.Group();
    const x0 = C.CONVEYOR_X0, x1 = C.COLLECTOR_X;
    const len = x1 - x0;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(len, 1, 3), beltMaterial());
    belt.position.set((x0 + x1) / 2, C.BELT_TOP - 0.5, C.CONVEYOR_Z);
    belt.receiveShadow = true;
    belt.castShadow = true;
    this.conveyor.add(belt);
    // Rails.
    box(len, 1.3, 0.3, MAT.rail, (x0 + x1) / 2, C.BELT_TOP - 0.35, C.CONVEYOR_Z - 1.65, { parent: this.conveyor });
    box(len, 1.3, 0.3, MAT.rail, (x0 + x1) / 2, C.BELT_TOP - 0.35, C.CONVEYOR_Z + 1.65, { parent: this.conveyor });
    this.group.add(this.conveyor);
  }

  _buildItems() {
    this.pads = {};       // id -> { group, mesh, label, item }
    this.itemMeshes = {}; // id -> group
    for (const item of ITEMS) {
      // Purchase pad.
      const g = new THREE.Group();
      g.position.set(item.pad[0], 0, item.pad[1]);
      g.visible = false;
      const mesh = new THREE.Mesh(GEO.pad, MAT.padAvail);
      mesh.position.y = 0.15;
      mesh.receiveShadow = true;
      g.add(mesh);
      const ring = new THREE.Mesh(GEO.padRing, MAT.padRing);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.32;
      g.add(ring);
      const label = new Label({
        text: `${item.name}\n${item.price === 0 ? 'FREE' : formatCash(item.price)}`,
        size: 1.5, color: ['#ffffff', '#86efac'], font: 'bold 40px "Segoe UI", Roboto, Arial, sans-serif',
      });
      label.sprite.position.y = 3;
      g.add(label.sprite);
      this.group.add(g);
      this.pads[item.id] = { group: g, mesh, ring, label, item, state: 'hidden' };

      // The thing you get.
      const built = this._buildItemMesh(item);
      if (built) {
        built.visible = false;
        this.group.add(built);
        this.itemMeshes[item.id] = built;
      }
    }
  }

  _buildItemMesh(item) {
    const g = new THREE.Group();
    const z = C.CONVEYOR_Z;
    if (item.type === 'dropper') {
      const color = DROPPER_COLORS[item.id] ?? 0x94a3b8;
      const mat = new THREE.MeshLambertMaterial({ color });
      const dark = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.6) });
      // Post behind the belt, arm over the belt, nozzle above the belt.
      box(1, C.DROP_HEIGHT + 1.5, 1, MAT.post, item.x, (C.DROP_HEIGHT + 1.5) / 2, z - 3, { parent: g });
      box(1, 0.8, 3.6, dark, item.x, C.DROP_HEIGHT + 1.4, z - 1.3, { parent: g });
      box(2.2, 1.8, 2.2, mat, item.x, C.DROP_HEIGHT + 0.8, z, { parent: g });
      box(1.2, 0.6, 1.2, dark, item.x, C.DROP_HEIGHT - 0.3, z, { parent: g });
      if (item.id === 'dropper6') {
        const crown = box(2.6, 0.4, 2.6, MAT.gold, item.x, C.DROP_HEIGHT + 1.9, z, { parent: g });
        crown.castShadow = false;
      }
      g.userData.solids = [[item.x, (C.DROP_HEIGHT + 1.5) / 2, z - 3, 1, C.DROP_HEIGHT + 1.5, 1]];
    } else if (item.type === 'upgrader') {
      const color = UPGRADER_COLORS[item.id] ?? 0x22d3ee;
      const glow = new THREE.MeshBasicMaterial({ color });
      const mat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
      box(0.8, 5, 0.8, mat, item.x, 2.5, z - 2.3, { parent: g });
      box(0.8, 5, 0.8, mat, item.x, 2.5, z + 2.3, { parent: g });
      box(1, 0.8, 5.4, mat, item.x, 5.2, z, { parent: g });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.18, 10, 32), glow);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(item.x, 2.8, z);
      g.add(ring);
      const lbl = new Label({ text: `x${item.mult}`, size: 1.1, color: '#ffffff', bg: 'rgba(0,0,0,0.5)' });
      lbl.sprite.position.set(item.x, 6.4, z);
      g.add(lbl.sprite);
      g.userData.ring = ring;
      g.userData.solids = [[item.x, 2.5, z - 2.3, 0.8, 5, 0.8], [item.x, 2.5, z + 2.3, 0.8, 5, 0.8]];
    } else if (item.type === 'build') {
      const S = C.PLOT_SIZE, h = 9, t = 1, half = S / 2 - t / 2;
      if (item.build === 'walls') {
        const gap = 14;
        const sideLen = (S - gap) / 2;
        box(S, h, t, MAT.wall, 0, h / 2, -half, { parent: g });                     // back
        box(t, h, S, MAT.wall, -half, h / 2, 0, { parent: g });                      // left
        box(t, h, S, MAT.wall, half, h / 2, 0, { parent: g });                       // right
        box(sideLen, h, t, MAT.wall, -(gap / 2 + sideLen / 2), h / 2, half, { parent: g }); // front left
        box(sideLen, h, t, MAT.wall, gap / 2 + sideLen / 2, h / 2, half, { parent: g });    // front right
        box(gap + 2, 1.2, t + 0.4, MAT.wallTrim, 0, h - 0.6, half, { parent: g });   // lintel over the door
        g.userData.solids = [
          [0, h / 2, -half, S, h, t], [-half, h / 2, 0, t, h, S], [half, h / 2, 0, t, h, S],
          [-(gap / 2 + sideLen / 2), h / 2, half, sideLen, h, t], [gap / 2 + sideLen / 2, h / 2, half, sideLen, h, t],
        ];
      } else if (item.build === 'roof') {
        const roof = box(S + 1, 0.8, S / 2 + 2, MAT.roof, 0, h + 0.4, -S / 4 + 1, { parent: g });
        roof.receiveShadow = true;
        box(S + 1.6, 0.5, 0.6, MAT.wallTrim, 0, h + 0.9, 3.2, { parent: g });
        g.userData.solids = [[0, h + 0.4, -S / 4 + 1, S + 1, 0.8, S / 2 + 2]];
      } else if (item.build === 'lights') {
        const y = h - 0.8;
        for (const [mat, zz] of [[MAT.neon, -half + 0.6], [MAT.neon2, -half + 0.6]]) {
          const strip = box(S - 4, 0.3, 0.3, mat, 0, y, zz, { parent: g, shadow: false });
          strip.position.y = mat === MAT.neon ? y : y - 0.6;
        }
        box(0.3, 0.3, S - 4, MAT.neon2, -half + 0.6, y, 0, { parent: g, shadow: false });
        box(0.3, 0.3, S - 4, MAT.neon2, half - 0.6, y, 0, { parent: g, shadow: false });
        for (const x of [-16, -8, 0, 8, 16]) {
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), MAT.neon);
          bulb.position.set(x, h + 0.1, -S / 4 + 1);
          g.add(bulb);
        }
      } else if (item.build === 'sign') {
        this.signBoard = new Board({ width: 24, height: 7, canvasW: 1024, canvasH: 300 });
        this.signBoard.mesh.position.set(0, h + 5.5, -half + 0.3);
        g.add(this.signBoard.mesh);
        box(25, 8, 0.6, MAT.wallTrim, 0, h + 5.5, -half - 0.2, { parent: g });
        box(0.8, 5, 0.8, MAT.post, -10, h + 1, -half, { parent: g });
        box(0.8, 5, 0.8, MAT.post, 10, h + 1, -half, { parent: g });
        this._drawSign();
      }
    } else {
      // boosts have no mesh of their own; turbo adds spinner fins on the droppers (cosmetic skip).
      return null;
    }
    return g;
  }

  _drawSign() {
    if (!this.signBoard) return;
    const name = this.ownerName ?? 'Tycoon';
    this.signBoard.draw((ctx, W, H) => {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, H - 40, W, 40);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '900 150px "Segoe UI", Roboto, Arial Black, Arial, sans-serif';
      let text = `${name.toUpperCase()}'S TYCOON`;
      while (ctx.measureText(text).width > W - 60) {
        const px = parseInt(ctx.font.match(/(\d+)px/)[1], 10) - 8;
        ctx.font = `900 ${px}px "Segoe UI", Roboto, Arial Black, Arial, sans-serif`;
        if (px < 40) break;
      }
      ctx.fillText(text, W / 2, H / 2 - 10);
    });
  }

  // --- state from server ---

  setState({ owner, owned, pool }) {
    this.owner = owner ?? null;
    this.owned = new Set(owned ?? []);
    this.pool = pool ?? 0;
    this.refresh();
  }

  setOwnerName(name) {
    this.ownerName = name;
    this.ownerLabel.set(name ? `${name}'s Tycoon` : 'Unclaimed Tycoon', { color: name ? '#fde68a' : '#ffffff' });
    this._drawSign();
  }

  addOwned(id) {
    this.owned.add(id);
    this.refresh();
  }

  resetOwned() {
    this.owned.clear();
    this.pool = 0;
    for (const c of this.cubes) this.group.remove(c.mesh);
    this.cubes.length = 0;
    this.refresh();
  }

  refresh() {
    const claimed = this.owner !== null;
    this.claimPad.visible = !claimed;
    this.collectorGroup.visible = claimed;
    this.conveyor.visible = claimed;
    for (const item of ITEMS) {
      const m = this.itemMeshes[item.id];
      if (m) m.visible = this.owned.has(item.id);
    }
    this.solidsDirty = true;
  }

  // Pad visibility and color depend on who is looking (local player's cash and ownership).
  updatePads(localPlayerId, localCash) {
    const mine = this.owner === localPlayerId;
    for (const item of ITEMS) {
      const pad = this.pads[item.id];
      let state = 'hidden';
      if (this.owner !== null && isAvailable(item, this.owned)) {
        state = (!mine) ? 'other' : (localCash >= item.price ? 'avail' : 'poor');
      }
      if (state !== pad.state) {
        pad.state = state;
        pad.group.visible = state !== 'hidden';
        pad.mesh.material = state === 'poor' ? MAT.padPoor : MAT.padAvail;
        pad.label.set(`${item.name}\n${item.price === 0 ? 'FREE' : formatCash(item.price)}`, {
          color: ['#ffffff', state === 'poor' ? '#fca5a5' : '#86efac'],
        });
      }
    }
  }

  // --- cubes ---

  spawnCube(dropperId) {
    const item = ITEM_BY_ID[dropperId];
    if (!item || item.type !== 'dropper') return;
    if (this.cubes.length > 60) { const c = this.cubes.shift(); this.group.remove(c.mesh); }
    const color = new THREE.Color(DROPPER_COLORS[dropperId] ?? 0x94a3b8);
    const mat = new THREE.MeshLambertMaterial({ color, emissive: color.clone().multiplyScalar(0.15) });
    const mesh = new THREE.Mesh(GEO.cube, mat);
    mesh.castShadow = true;
    mesh.position.set(item.x, C.DROP_HEIGHT - 0.6, C.CONVEYOR_Z);
    this.group.add(mesh);
    this.cubes.push({ mesh, x: item.x, y: C.DROP_HEIGHT - 0.6, t: 0, upgraded: new Set(), spin: (Math.random() - 0.5) * 2 });
  }

  _updateCubes(dt) {
    const floorY = C.BELT_TOP + 0.5;
    const g0 = (C.DROP_HEIGHT - 0.6 - floorY) * 2 / (C.FALL_TIME * C.FALL_TIME); // constant accel to land exactly at FALL_TIME
    for (let i = this.cubes.length - 1; i >= 0; i--) {
      const c = this.cubes[i];
      c.t += dt;
      if (c.t < C.FALL_TIME) {
        c.y = C.DROP_HEIGHT - 0.6 - 0.5 * g0 * c.t * c.t;
        c.mesh.rotation.y += dt * c.spin;
      } else {
        c.y = floorY;
        c.mesh.rotation.y = 0;
        c.x += C.CONVEYOR_SPEED * dt;
        // Upgraders: tint + grow when passing through.
        for (const it of ITEMS) {
          if (it.type !== 'upgrader' || !this.owned.has(it.id) || c.upgraded.has(it.id)) continue;
          if (c.x >= it.x) {
            c.upgraded.add(it.id);
            const col = new THREE.Color(UPGRADER_COLORS[it.id]);
            c.mesh.material.color.lerp(col, 0.6);
            c.mesh.material.emissive.copy(c.mesh.material.color).multiplyScalar(0.5);
            c.mesh.scale.multiplyScalar(1.12);
          }
        }
        if (c.x >= C.COLLECTOR_X) {
          this.group.remove(c.mesh);
          c.mesh.material.dispose();
          this.cubes.splice(i, 1);
          continue;
        }
      }
      c.mesh.position.set(c.x, c.y, C.CONVEYOR_Z);
    }
  }

  update(dt) {
    this.time += dt;
    if (this.conveyor.visible) this._updateCubes(dt);
    if (this.collectorGroup.visible) this.poolLabel.set(formatCash(this.pool));
    if (this.claimPad.visible) this.claimLabel.sprite.position.y = 3.2 + Math.sin(this.time * 2) * 0.25;
    for (const id in this.itemMeshes) {
      const m = this.itemMeshes[id];
      if (m.visible && m.userData.ring) m.userData.ring.rotation.x += dt * 2;
    }
  }

  // --- collision ---

  // World-space AABBs of everything solid on this plot.
  getSolids() {
    if (!this.solidsDirty) return this.solids;
    this.solidsDirty = false;
    const out = [];
    const push = (cx, cy, cz, sx, sy, sz) => {
      const w = plotToWorld(this.idx, cx, cz);
      const rot90 = Math.abs(Math.abs(this.def.rot % Math.PI) - Math.PI / 2) < 1e-6;
      const hx = (rot90 ? sz : sx) / 2, hz = (rot90 ? sx : sz) / 2;
      const b = new THREE.Box3(new THREE.Vector3(w.x - hx, cy - sy / 2, w.z - hz), new THREE.Vector3(w.x + hx, cy + sy / 2, w.z + hz));
      out.push(b);
      return b;
    };
    if (this.owner !== null) {
      // Belt (carries players along local +x) and collector.
      const belt = push((C.CONVEYOR_X0 + C.COLLECTOR_X) / 2, C.BELT_TOP - 0.5, C.CONVEYOR_Z, C.COLLECTOR_X - C.CONVEYOR_X0, 1, 3.6);
      belt.conveyor = { x: Math.cos(this.def.rot), z: -Math.sin(this.def.rot) };
      push(C.COLLECTOR_X + 2.2, 2.5, C.CONVEYOR_Z, 5, 5.2, 5);
      for (const id of this.owned) {
        const m = this.itemMeshes[id];
        if (!m || !m.userData.solids) continue;
        for (const s of m.userData.solids) push(...s);
      }
    }
    this.solids = out;
    return out;
  }
}

// Which pad (if any) at this plot is the given world position standing on? Returns { kind, id, local, radius } or null.
export function padAt(plot, x, z) {
  const check = (local, radius) => {
    const w = plotToWorld(plot.idx, local[0], local[1]);
    const dx = x - w.x, dz = z - w.z;
    return dx * dx + dz * dz <= radius * radius;
  };
  if (plot.owner === null) {
    if (check(SPECIAL_PADS.claim.pad, SPECIAL_PADS.claim.radius)) return { kind: 'claim', id: 'claim' };
    return null;
  }
  if (check(SPECIAL_PADS.collect.pad, SPECIAL_PADS.collect.radius)) return { kind: 'collect', id: 'collect' };
  for (const item of ITEMS) {
    const pad = plot.pads[item.id];
    if (pad.state === 'hidden') continue;
    if (check(item.pad, C.PAD_RADIUS)) return { kind: 'item', id: item.id, item };
  }
  return null;
}
