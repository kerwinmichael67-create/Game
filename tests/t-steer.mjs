// Steering direction as the player sees it: the right key must move the car toward screen-right.
import { open, check, finish, installHelpers } from './harness.mjs';
const { page, close } = await open();
await page.evaluate(installHelpers);
const r = await page.evaluate(() => {
  T.start({ mode: 'drift', trackId: 'alpine' });
  T.run(250);
  T.run(150, { ArrowUp: true });
  const p = Game.player,
    w = Game.world;
  w.updateCamera(p, 0, 0, true);
  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(w.camera.quaternion);
  const f0 = p.forward(),
    v0 = p.speed,
    lat0 = p.lat;
  T.run(45, { ArrowUp: true, ArrowRight: true });
  const fR = p.forward(),
    latR = p.lat;
  const wheelR = p.mesh.userData.wheels[0].hub.rotation.y;
  p.syncMesh(0);
  const wheelR2 = p.mesh.userData.wheels[0].hub.rotation.y;
  T.run(90, { ArrowUp: true, ArrowLeft: true });
  const fL = p.forward();
  /* the same through the touch buttons and the A/D keys */
  T.run(60, { ArrowUp: true });
  const f1 = p.forward();
  Input.touch.right = 1;
  T.run(40, { ArrowUp: true });
  Input.touch.right = 0;
  const fT = p.forward();
  T.run(40, { KeyW: true, KeyA: true });
  const fA = p.forward();
  return {
    state: Game.state,
    v0,
    rightX: fR.clone().sub(f0).dot(camRight),
    leftX: fL.clone().sub(fR).dot(camRight),
    dLat: latR - lat0,
    wheel: wheelR2 || wheelR,
    touchX: fT.clone().sub(f1).dot(camRight),
    aKeyX: fA.clone().sub(fT).dot(camRight),
  };
});
check('race is running', r.state === 'racing', r.state);
check('car accelerates under throttle', r.v0 > 15, r.v0.toFixed(1));
check('right arrow turns toward screen-right', r.rightX > 0.1, r.rightX.toFixed(3));
check('left arrow turns toward screen-left', r.leftX < -0.1, r.leftX.toFixed(3));
check('turning right moves right of the centre line (lat grows)', r.dLat > 0.2, r.dLat.toFixed(2));
check('front wheels swing right (negative hub rotation)', r.wheel < -0.05, r.wheel.toFixed(2));
check('touch right button turns right', r.touchX > 0.05, r.touchX.toFixed(3));
check('A key turns left', r.aKeyX < -0.05, r.aKeyX.toFixed(3));
await close();
finish();
