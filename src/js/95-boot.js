/* ---------------- boot ---------------- */
function start() {
  Profile.load();
  Input.init();
  HUD.init();
  Input.isTouch = matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window;
  if (!Profile.data.quality) Profile.data.quality = Input.isTouch ? 'low' : 'high';
  const world = new World($('#gl'), Profile.data.quality);
  Game.world = world;
  world.setupPost();
  UI.init();
  Game.track = new Track(TRACKS[0]);
  world.load(Game.track, hashStr('bay'));
  /* a few cars lapping behind the menu for life */
  const demo = [];
  CAR_MODELS.forEach((m, i) => {
    const c = new Car({
      id: 'demo' + i,
      name: 'demo',
      hex: PAINTS[(i * 2 + 1) % PAINTS.length].hex,
      model: m.id,
      levels: DIFFICULTY[2].levels,
      number: 7 + i * 11,
    });
    c.ai = new AIDriver(c, Game.track, DIFFICULTY[2], 100 + i);
    demo.push(c);
  });
  const placeDemo = () =>
    demo.forEach((c, i) => {
      const g = Game.track.gridPose(i);
      c.place(g, g.idx);
      world.add(c.mesh);
    });
  placeDemo();
  let demoOn = true;
  UI.show('menu');
  $('#loading').hidden = true;
  Net.init().then(() => {
    if (window.claude && window.claude.use) claude.use('db').then((db) => Profile.connect(db, Net.user));
  });
  let last = performance.now(),
    t = 0,
    acc = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    if (Game.state !== 'idle') {
      if (demoOn) {
        demoOn = false;
        for (const c of demo) world.remove(c.mesh);
      }
      Game.frame(dt);
    } else {
      if (!demoOn && world.track === Game.track && Game.track.id === 'bay') {
        demoOn = true;
        placeDemo();
      }
      if (demoOn) {
        acc += dt;
        const h = 1 / 60;
        while (acc >= h) {
          for (const c of demo) {
            c.ai.update(h, demo, null);
            c.step(h, Game.track, null);
          }
          for (let i = 0; i < demo.length; i++) for (let j = i + 1; j < demo.length; j++) demo[i].collide(demo[j], null);
          acc -= h;
        }
        for (const c of demo) c.syncMesh(dt);
        /* TV-style camera trailing the lead car */
        const lead = demo[0],
          look = lead.pos;
        const camT = lead.pos
          .clone()
          .addScaledVector(lead.forward(), -22)
          .add(new THREE.Vector3(Math.sin(t * 0.3) * 10, 9, Math.cos(t * 0.3) * 10));
        world.camPos.lerp(camT, 1 - Math.exp(-2 * dt));
        world.camera.position.copy(world.camPos);
        world.camera.lookAt(look.x, 1, look.z);
        world.camera.fov = 50;
        world.camera.updateProjectionMatrix();
        world._followSun(look);
        world.streaks.visible = false;
        world.effects(demo, dt);
      } else world.orbitCamera(t, new THREE.Vector3(-10, 0, 20));
      world.render();
    }
    Garage.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
window.claude && window.claude.hot && window.claude.hot.ready ? window.claude.hot.ready(start) : start();
