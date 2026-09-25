/* =========================================================================
   main.js — renderer, game loop, scene switching, boot sequence
   ========================================================================= */
(function () {
  const T = THREE;

  const Game = TD.Game = {
    renderer: null, mode: 'lobby', last: 0, fpsT: 0, frames: 0
  };

  function boot() {
    const stage = document.getElementById('stage');
    const fill = document.getElementById('boot-fill');
    const msg = document.getElementById('boot-msg');
    const step = (p, m) => { fill.style.width = p + '%'; msg.textContent = m; };

    step(10, 'Starting renderer…');
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      msg.textContent = 'This browser could not start WebGL. Try Chrome, Edge or Firefox.';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = T.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    Game.renderer = renderer;

    step(35, 'Building the plaza…');
    TD.Lobby.build();
    TD.Lobby.bindInput(renderer.domElement);
    TD.Battle.bindInput(renderer.domElement);

    step(65, 'Wiring the interface…');
    TD.UI.init();
    TD.UI.refreshHud();

    step(88, 'Warming up models…');
    // Pre-render a handful of thumbnails so the first shop open is instant.
    TD.Save.data.unlocked.slice(0, 6).forEach(id => {
      if (TD.TOWERS[id]) TD.Thumb.render('t:' + id + ':4', () => TD.buildTower(TD.TOWERS[id], 4), -0.75);
    });

    window.addEventListener('resize', onResize);
    onResize();

    step(100, 'Ready');
    setTimeout(() => {
      document.getElementById('boot').classList.add('hidden');
      document.getElementById('lobby-hud').classList.remove('hidden');
      Game.toLobby();
      Game.last = performance.now();
      requestAnimationFrame(loop);
    }, 260);

    /* Audio contexts must be started by a gesture. */
    const kick = () => {
      TD.Audio.resume();
      if (TD.Save.data.settings.music) TD.Audio.startMusic();
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (Game.renderer) Game.renderer.setSize(w, h);
    TD.Lobby.resize(w, h);
    TD.Battle.resize(w, h);
  }

  Game.toLobby = function () {
    if (TD.Battle.active) TD.Battle.stop();
    TD.UI.exitBattle();
    TD.UI.refreshHud();
    this.mode = 'lobby';
    TD.Lobby.enter();
    TD.Audio.setMusicVolume(0.12);
  };

  Game.startMatch = function (mapId, diffId, loadout) {
    TD.UI.close();
    TD.Lobby.exit();
    this.mode = 'battle';
    TD.Battle.start(mapId, diffId, loadout);
    TD.Battle.resize(window.innerWidth, window.innerHeight);
    TD.Audio.setMusicVolume(0.06);
  };

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - Game.last) / 1000);
    Game.last = now;

    if (Game.mode === 'lobby') {
      TD.Lobby.update(dt);
      if (TD.Lobby.scene) Game.renderer.render(TD.Lobby.scene, TD.Lobby.camera);
    } else if (Game.mode === 'battle') {
      TD.Battle.update(dt);
      if (TD.Battle.scene) Game.renderer.render(TD.Battle.scene, TD.Battle.camera);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
