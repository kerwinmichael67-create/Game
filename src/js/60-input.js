/* ========================================================================
   Input, HUD and the race controller
   ======================================================================== */
const Input = {
  keys: {},
  touch: { left: 0, right: 0, gas: 0, brake: 0, nitro: 0, drift: 0 },
  gamepadIndex: null,
  isTouch: false,
  init() {
    addEventListener('keydown', (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    addEventListener('blur', () => {
      this.keys = {};
    });
    const bind = (id, key) => {
      const b = $(id);
      if (!b) return;
      const on = (e) => {
        e.preventDefault();
        this.touch[key] = 1;
        b.classList.add('on');
      };
      const off = (e) => {
        e.preventDefault();
        this.touch[key] = 0;
        b.classList.remove('on');
      };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    bind('#t-left', 'left');
    bind('#t-right', 'right');
    bind('#t-gas', 'gas');
    bind('#t-brake', 'brake');
    bind('#t-nitro', 'nitro');
    bind('#t-drift', 'drift');
    addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
  },
  /* steer: +1 = right, -1 = left */
  read(out) {
    const k = this.keys,
      t = this.touch;
    let steer = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0) + t.right - t.left;
    let throttle = (k.ArrowUp || k.KeyW ? 1 : 0) || t.gas,
      brake = (k.ArrowDown || k.KeyS ? 1 : 0) || t.brake;
    let nitro = !!(k.ShiftLeft || k.ShiftRight || t.nitro),
      hb = !!(k.Space || t.drift);
    if (this.gamepadIndex != null && navigator.getGamepads) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        const ax = gp.axes[0] || 0;
        if (Math.abs(ax) > 0.12) steer += ax;
        const rt = gp.buttons[7] ? gp.buttons[7].value : 0,
          lt = gp.buttons[6] ? gp.buttons[6].value : 0;
        throttle = Math.max(throttle, rt);
        brake = Math.max(brake, lt);
        if (gp.buttons[0] && gp.buttons[0].pressed) nitro = true;
        if ((gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[2] && gp.buttons[2].pressed)) hb = true;
      }
    }
    out.steer = clamp(steer, -1, 1);
    out.throttle = clamp(throttle, 0, 1);
    out.brake = clamp(brake, 0, 1);
    out.nitro = nitro;
    out.handbrake = hb;
  },
};
