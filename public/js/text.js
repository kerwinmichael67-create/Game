import * as THREE from 'three';

// A billboard text label backed by a canvas texture. Call set() to change the text.
export class Label {
  constructor(opts = {}) {
    this.opts = Object.assign({
      text: '', font: 'bold 44px "Segoe UI", Roboto, Arial, sans-serif', color: '#ffffff',
      bg: 'rgba(8, 12, 22, 0.72)', padding: 18, radius: 16, size: 1.4, lineHeight: 1.2, stroke: null,
    }, opts);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.material = new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthWrite: false });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.renderOrder = 10;
    this.set(this.opts.text);
  }

  set(text, patch) {
    if (patch) Object.assign(this.opts, patch);
    if (text === this._text && !patch) return;
    this._text = text;
    const o = this.opts;
    const ctx = this.ctx;
    const lines = String(text).split('\n');
    ctx.font = o.font;
    const fontPx = parseInt(o.font.match(/(\d+)px/)?.[1] ?? '44', 10);
    let w = 0;
    for (const l of lines) w = Math.max(w, ctx.measureText(l).width);
    const lh = fontPx * o.lineHeight;
    // Quantize the canvas size so small text changes (e.g. a growing number) reuse the same texture.
    const textW = Math.ceil(w + o.padding * 2), textH = Math.ceil(lh * lines.length + o.padding * 2);
    const W = Math.max(64, Math.ceil(textW / 64) * 64), H = Math.max(32, Math.ceil(textH / 32) * 32);
    if (this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas.width = W;
      this.canvas.height = H;
      // WebGL textures cannot change size in place: swap in a fresh texture.
      this.texture.dispose();
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.generateMipmaps = false;
      this.material.map = this.texture;
      this.material.needsUpdate = true;
    }
    ctx.clearRect(0, 0, W, H);
    const x0 = (W - textW) / 2, y0 = (H - textH) / 2;
    if (o.bg) {
      ctx.fillStyle = o.bg;
      roundRect(ctx, x0, y0, textW, textH, o.radius);
      ctx.fill();
    }
    ctx.font = o.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const y = y0 + o.padding + lh * (i + 0.5);
      if (o.stroke) { ctx.lineWidth = 6; ctx.strokeStyle = o.stroke; ctx.strokeText(l, W / 2, y); }
      ctx.fillStyle = Array.isArray(o.color) ? (o.color[i] ?? o.color[o.color.length - 1]) : o.color;
      ctx.fillText(l, W / 2, y);
    });
    this.texture.needsUpdate = true;
    this.sprite.scale.set(o.size * (W / H), o.size, 1);
  }

  dispose() {
    this.texture.dispose();
    this.material.dispose();
  }
}

// A flat panel with a canvas texture drawn by a callback. Used for signs and the leaderboard board.
export class Board {
  constructor({ width = 10, height = 5, canvasW = 1024, canvasH = 512, doubleSided = false } = {}) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = canvasW;
    this.canvas.height = canvasH;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
  }
  draw(fn) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fn(ctx, canvas.width, canvas.height);
    this.texture.needsUpdate = true;
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function hexToCss(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}
