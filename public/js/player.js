import * as THREE from 'three';
import { CONFIG } from '/shared/config.js';

const C = CONFIG;
const HALF = 0.8;       // player half-width
const HEIGHT = 5;       // player height
const STEP_UP = 1.3;    // auto step height (lets you walk onto the conveyor)

// Local player: movement, gravity, AABB collision and a third-person orbit camera.
export class LocalPlayer {
  constructor(avatar, camera) {
    this.avatar = avatar;
    this.camera = camera;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vy = 0;
    this.onGround = true;
    this.standingOn = null;
    this.yaw = 0;             // camera yaw
    this.pitch = 0.45;        // camera pitch
    this.dist = 18;           // camera distance
    this.anim = 0;
    this.box = new THREE.Box3();
    this._camPos = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    this._ray = new THREE.Ray();
    this._hit = new THREE.Vector3();
    this.camSnap = true;
  }

  teleport(x, y, z) {
    this.pos.set(x, y, z);
    this.vy = 0;
    this.camSnap = true;
  }

  _updateBox() {
    this.box.min.set(this.pos.x - HALF, this.pos.y, this.pos.z - HALF);
    this.box.max.set(this.pos.x + HALF, this.pos.y + HEIGHT, this.pos.z + HALF);
  }

  _moveAxis(axis, delta, solids) {
    if (delta === 0) return;
    this.pos[axis] += delta;
    this._updateBox();
    for (const b of solids) {
      if (!this.box.intersectsBox(b)) continue;
      if (axis === 'y') {
        if (delta < 0) { this.pos.y = b.max.y; this.vy = 0; this.onGround = true; this.standingOn = b; }
        else { this.pos.y = b.min.y - HEIGHT - 0.001; this.vy = 0; }
      } else {
        // Ignore boxes we are standing on top of, or that are above our head (touching faces count as intersecting).
        if (b.max.y <= this.pos.y + 0.02 || b.min.y >= this.pos.y + HEIGHT - 0.02) continue;
        // Step up onto low obstacles.
        const stepH = b.max.y - this.pos.y;
        if (stepH > 0 && stepH <= STEP_UP && this.onGround) {
          const save = this.pos.y;
          this.pos.y = b.max.y + 0.001;
          this._updateBox();
          let blocked = false;
          for (const o of solids) if (this.box.intersectsBox(o)) { blocked = true; break; }
          if (!blocked) continue;
          this.pos.y = save;
        }
        if (delta > 0) this.pos[axis] = b.min[axis] - HALF - 0.001;
        else this.pos[axis] = b.max[axis] + HALF + 0.001;
      }
      this._updateBox();
    }
  }

  update(dt, input, solids, sfx) {
    // Camera orbit.
    this.yaw -= input.lookDX * 0.0045;
    this.pitch = Math.max(-0.15, Math.min(1.35, this.pitch + input.lookDY * 0.004));
    this.dist = Math.max(6, Math.min(45, this.dist + input.zoom * 2));

    // Movement relative to camera yaw.
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // Camera looks along -(sin, cos) when placed behind; forward on screen is toward where the camera faces.
    const fx = -sin, fz = -cos;
    const rx = cos, rz = -sin;
    let dx = (fx * input.moveZ + rx * input.moveX);
    let dz = (fz * input.moveZ + rz * input.moveX);
    const moving = Math.hypot(dx, dz) > 0.01;

    if (input.jump && this.onGround) { this.vy = C.JUMP_SPEED; this.onGround = false; sfx?.jump(); }
    this.vy -= C.GRAVITY * dt;
    this.vy = Math.max(this.vy, -60);

    // Only test nearby solids.
    const near = [];
    for (const b of solids) {
      if (Math.abs((b.min.x + b.max.x) / 2 - this.pos.x) < 50 + (b.max.x - b.min.x) / 2 &&
          Math.abs((b.min.z + b.max.z) / 2 - this.pos.z) < 50 + (b.max.z - b.min.z) / 2) near.push(b);
    }

    // Conveyor belts carry whoever stands on them.
    if (this.onGround && this.standingOn?.conveyor) {
      dx += this.standingOn.conveyor.x * C.CONVEYOR_SPEED / C.PLAYER_SPEED;
      dz += this.standingOn.conveyor.z * C.CONVEYOR_SPEED / C.PLAYER_SPEED;
    }
    // Horizontal pass first (onGround still reflects last frame so stepping up works), then vertical.
    this._moveAxis('x', dx * C.PLAYER_SPEED * dt, near);
    this._moveAxis('z', dz * C.PLAYER_SPEED * dt, near);
    this.onGround = false;
    this.standingOn = null;
    this._moveAxis('y', this.vy * dt, near);
    if (this.pos.y <= 0) { this.pos.y = 0; this.vy = 0; this.onGround = true; }

    // World bounds.
    this.pos.x = Math.max(-C.WORLD_HALF_X + 1, Math.min(C.WORLD_HALF_X - 1, this.pos.x));
    this.pos.z = Math.max(-C.WORLD_HALF_Z + 1, Math.min(C.WORLD_HALF_Z - 1, this.pos.z));

    // Animation state and facing.
    this.anim = !this.onGround ? 2 : (moving ? 1 : 0);
    if (moving) this.avatar.targetYaw = Math.atan2(dx, dz);
    this.avatar.anim = this.anim;
    this.avatar.group.position.copy(this.pos);

    // Camera.
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    this._camTarget.set(this.pos.x, this.pos.y + 4, this.pos.z);
    this._camPos.set(
      this._camTarget.x + sin * cp * this.dist,
      this._camTarget.y + sp * this.dist,
      this._camTarget.z + cos * cp * this.dist,
    );
    // Pull the camera in when a wall, roof or machine sits between it and the player.
    this._ray.origin.copy(this._camTarget);
    this._ray.direction.copy(this._camPos).sub(this._camTarget).normalize();
    let camDist = this._camPos.distanceTo(this._camTarget);
    for (const b of near) {
      if (b.containsPoint(this._camTarget)) continue;
      if (this._ray.intersectBox(b, this._hit)) {
        const d = this._hit.distanceTo(this._camTarget) - 0.7;
        if (d < camDist) camDist = d;
      }
    }
    camDist = Math.max(2.5, camDist);
    this._camPos.copy(this._camTarget).addScaledVector(this._ray.direction, camDist);
    if (this._camPos.y < 0.8) this._camPos.y = 0.8;
    if (this.camSnap) { this.camera.position.copy(this._camPos); this.camSnap = false; }
    else this.camera.position.lerp(this._camPos, Math.min(1, dt * 14));
    this.camera.lookAt(this._camTarget);
  }

  get facing() {
    return this.avatar.body.rotation.y;
  }
}
