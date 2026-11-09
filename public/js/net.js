// Thin WebSocket wrapper. Emits events named after message type (`t` field).
export class Net extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.open = false;
    this.rtt = 0;
    this._pingTimer = null;
  }

  connect(join) {
    this.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => {
      this.open = true;
      this.send({ t: 'join', ...join });
      this._pingTimer = setInterval(() => this.send({ t: 'ping', c: performance.now() }), 2000);
      this.dispatchEvent(new CustomEvent('open'));
    };
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.t === 'pong') { this.rtt = performance.now() - msg.c; return; }
      this.dispatchEvent(new CustomEvent(msg.t, { detail: msg }));
    };
    ws.onclose = () => {
      const wasOpen = this.open;
      this.open = false;
      clearInterval(this._pingTimer);
      if (this.ws === ws) this.dispatchEvent(new CustomEvent('close', { detail: { wasOpen } }));
    };
    ws.onerror = () => {};
  }

  send(obj) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
  }

  close() {
    clearInterval(this._pingTimer);
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      try { ws.close(); } catch {}
    }
    this.open = false;
  }
}
