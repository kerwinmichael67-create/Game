import * as THREE from 'three';
import { Label, hexToCss } from './text.js';

// Blocky R6-style character. Position = feet. Height ~5 studs.
const SKIN = 0xf5d26b;
const geo = {
  head: new THREE.BoxGeometry(1.3, 1.3, 1.3),
  torso: new THREE.BoxGeometry(2, 2, 1),
  limb: new THREE.BoxGeometry(0.95, 2, 0.95),
};
let faceTexture = null;

function getFaceTexture() {
  if (faceTexture) return faceTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hexToCss(SKIN);
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(44, 52, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(84, 52, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(64, 72, 20, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  faceTexture = new THREE.CanvasTexture(c);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  return faceTexture;
}

export class Avatar {
  constructor({ name, color, isLocal = false }) {
    this.group = new THREE.Group();
    this.color = color;
    this.name = name;
    this.anim = 0;        // 0 idle, 1 walk, 2 jump
    this.walkPhase = 0;
    this.targetYaw = 0;

    const skin = new THREE.MeshLambertMaterial({ color: SKIN });
    const shirt = new THREE.MeshLambertMaterial({ color });
    const pants = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.45) });
    const face = new THREE.MeshLambertMaterial({ map: getFaceTexture() });

    this.body = new THREE.Group();
    this.group.add(this.body);

    // Head with a face on +z.
    const headMats = [skin, skin, skin, skin, face, skin];
    this.head = new THREE.Mesh(geo.head, headMats);
    this.head.position.y = 4.75;
    this.body.add(this.head);

    this.torso = new THREE.Mesh(geo.torso, shirt);
    this.torso.position.y = 3;
    this.body.add(this.torso);

    const makeLimb = (mat, x, y) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const m = new THREE.Mesh(geo.limb, mat);
      m.position.y = -1;
      pivot.add(m);
      this.body.add(pivot);
      return pivot;
    };
    this.armL = makeLimb(skin, -1.5, 4);
    this.armR = makeLimb(skin, 1.5, 4);
    this.legL = makeLimb(pants, -0.5, 2);
    this.legR = makeLimb(pants, 0.5, 2);

    this.body.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });

    this.label = new Label({ text: name, size: 1.1, font: 'bold 40px "Segoe UI", Roboto, Arial, sans-serif', bg: 'rgba(8,12,22,0.6)', padding: 14 });
    this.label.sprite.position.y = 6.4;
    this.group.add(this.label.sprite);
    this.isLocal = isLocal;
  }

  setName(name) { this.name = name; this.label.set(name); }

  setAway(away) {
    this.label.set(away ? `${this.name} (away)` : this.name);
    this.body.visible = !away;
  }

  update(dt) {
    // Smoothly rotate the body toward the facing direction.
    let d = this.targetYaw - this.body.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.body.rotation.y += d * Math.min(1, dt * 14);

    const speed = this.anim === 1 ? 11 : 0;
    if (speed) this.walkPhase += dt * speed; else this.walkPhase *= Math.max(0, 1 - dt * 10);
    const swing = this.anim === 1 ? Math.sin(this.walkPhase) * 0.9 : 0;

    if (this.anim === 2) {
      // Jump pose: arms up.
      this.armL.rotation.x += (-2.6 - this.armL.rotation.x) * Math.min(1, dt * 10);
      this.armR.rotation.x += (-2.6 - this.armR.rotation.x) * Math.min(1, dt * 10);
      this.legL.rotation.x += (0.5 - this.legL.rotation.x) * Math.min(1, dt * 10);
      this.legR.rotation.x += (-0.3 - this.legR.rotation.x) * Math.min(1, dt * 10);
    } else {
      this.armL.rotation.x += (swing - this.armL.rotation.x) * Math.min(1, dt * 12);
      this.armR.rotation.x += (-swing - this.armR.rotation.x) * Math.min(1, dt * 12);
      this.legL.rotation.x += (-swing - this.legL.rotation.x) * Math.min(1, dt * 12);
      this.legR.rotation.x += (swing - this.legR.rotation.x) * Math.min(1, dt * 12);
    }
  }

  dispose() {
    this.label.dispose();
  }
}
