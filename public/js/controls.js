// Keyboard, mouse and touch input -> a simple state object.
export class Controls {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.keys = new Set();
    this.moveX = 0;   // -1..1 (strafe)
    this.moveZ = 0;   // -1..1 (forward)
    this.jump = false;
    this.lookDX = 0;  // accumulated mouse/touch look delta (pixels)
    this.lookDY = 0;
    this.zoomDelta = 0;
    this.touch = 'ontouchstart' in window && navigator.maxTouchPoints > 0;
    this.onKey = null; // callback(code, event) for UI keys (Enter, H, T, ...)

    window.addEventListener('keydown', (e) => {
      if (this.typing()) return;
      if (this.onKey && this.onKey(e.code, e)) return;
      this.keys.add(e.code);
      if (e.code === 'Space') { this.jump = true; e.preventDefault(); }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    // Mouse look: drag with any button on the canvas.
    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = ''; });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.lookDX += e.clientX - lastX;
      this.lookDY += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { this.zoomDelta += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

    // Touch: joystick on the left, look on the right, jump button.
    if (this.touch) this._setupTouch(ui);
  }

  typing() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  }

  _setupTouch(ui) {
    document.body.classList.add('touch');
    ui.mobile.classList.remove('hidden');
    const joy = ui.joystick, stick = joy.querySelector('.stick');
    let joyId = null, cx = 0, cy = 0;
    const R = 50;
    const setStick = (dx, dy) => { stick.style.transform = `translate(${dx}px, ${dy}px)`; };
    joy.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      joyId = t.identifier;
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });
    const joyMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        let dx = t.clientX - cx, dy = t.clientY - cy;
        const len = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, len / R);
        dx = dx / len * k * R; dy = dy / len * k * R;
        setStick(dx, dy);
        this.touchMoveX = dx / R; this.touchMoveZ = -dy / R;
        e.preventDefault();
      }
    };
    const joyEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        joyId = null; setStick(0, 0); this.touchMoveX = 0; this.touchMoveZ = 0;
      }
    };
    joy.addEventListener('touchmove', joyMove, { passive: false });
    joy.addEventListener('touchend', joyEnd);
    joy.addEventListener('touchcancel', joyEnd);

    ui.jumpBtn.addEventListener('touchstart', (e) => { this.jump = true; e.preventDefault(); }, { passive: false });

    // Look: touches on the canvas.
    let lookId = null, lx = 0, ly = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) { if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; } }
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== lookId) continue;
        this.lookDX += (t.clientX - lx) * 1.6; this.lookDY += (t.clientY - ly) * 1.6;
        lx = t.clientX; ly = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const lookEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; };
    this.canvas.addEventListener('touchend', lookEnd);
    this.canvas.addEventListener('touchcancel', lookEnd);
  }

  // Call once per frame; returns the current state and clears one-shot deltas.
  poll() {
    const k = this.keys;
    let x = 0, z = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) z += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) z -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (this.touchMoveX || this.touchMoveZ) { x = this.touchMoveX; z = this.touchMoveZ; }
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    const out = { moveX: x, moveZ: z, jump: this.jump, lookDX: this.lookDX, lookDY: this.lookDY, zoom: this.zoomDelta };
    this.jump = false; this.lookDX = 0; this.lookDY = 0; this.zoomDelta = 0;
    return out;
  }
}
