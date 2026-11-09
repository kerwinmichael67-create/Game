import { formatCash } from '/shared/config.js';
import { hexToCss } from './text.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.join = $('join'); this.nameInput = $('name'); this.roomInput = $('room'); this.playBtn = $('play');
    this.servers = $('servers'); this.joinError = $('join-error');
    this.disconnected = $('disconnected'); this.disconnectedMsg = $('disconnected-msg');
    this.hud = $('hud'); this.cashEl = $('cash'); this.incomeEl = $('income'); this.statusEl = $('status');
    this.roomCode = $('room-code'); this.pingEl = $('ping'); this.rebirthsEl = $('rebirths');
    this.leaderboardEl = $('leaderboard'); this.promptEl = $('prompt'); this.toasts = $('toasts');
    this.chatLog = $('chat-log'); this.chatInput = $('chat-input'); this.chatHint = $('chat-hint');
    this.helpBtn = $('help-btn'); this.help = $('help'); this.helpClose = $('help-close'); this.tpBtn = $('tp-btn');
    this.mobile = $('mobile'); this.joystick = $('joystick'); this.jumpBtn = $('jump-btn');
    this._lastCash = null;
    this._promptText = null;

    this.helpBtn.addEventListener('click', () => this.toggleHelp());
    this.helpClose.addEventListener('click', () => this.toggleHelp(false));
    this.help.addEventListener('click', (e) => { if (e.target === this.help) this.toggleHelp(false); });

    try {
      const saved = localStorage.getItem('bt_name');
      if (saved) this.nameInput.value = saved;
    } catch {}
    const params = new URLSearchParams(location.search);
    if (params.get('room')) this.roomInput.value = params.get('room').toUpperCase();
  }

  // ----- join screen -----
  async refreshServers(onPick) {
    try {
      const res = await fetch('/api/rooms', { cache: 'no-store' });
      const { rooms } = await res.json();
      this.servers.innerHTML = '';
      if (!rooms.length) {
        this.servers.innerHTML = '<div class="empty">No servers running yet. Press PLAY to start one!</div>';
        return;
      }
      for (const r of rooms) {
        const row = document.createElement('div');
        row.className = 'server-row';
        row.innerHTML = `<span>Server <b>${escapeHtml(r.id)}</b></span><span>${r.players | 0}/${r.max | 0} players</span>`;
        const btn = document.createElement('button');
        btn.textContent = r.players >= r.max ? 'FULL' : 'JOIN';
        btn.disabled = r.players >= r.max;
        btn.addEventListener('click', () => onPick(r.id));
        row.appendChild(btn);
        this.servers.appendChild(row);
      }
    } catch {
      this.servers.innerHTML = '<div class="empty">Could not load server list.</div>';
    }
  }

  onPlay(cb) {
    const go = (roomOverride) => {
      const name = this.nameInput.value.trim();
      try { localStorage.setItem('bt_name', name); } catch {}
      const room = (roomOverride ?? this.roomInput.value).trim().toUpperCase();
      this.playBtn.disabled = true;
      this.joinError.textContent = '';
      cb({ name, room });
    };
    this.playBtn.addEventListener('click', () => go());
    this.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    this.roomInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    this.refreshServers((id) => go(id));
    this._serverTimer = setInterval(() => { if (!this.join.classList.contains('hidden')) this.refreshServers((id) => go(id)); }, 5000);
  }

  showJoinError(msg) {
    this.joinError.textContent = msg;
    this.playBtn.disabled = false;
  }

  enterGame() {
    this.join.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.disconnected.classList.add('hidden');
  }

  showDisconnected(msg) {
    this.disconnectedMsg.textContent = msg;
    this.disconnected.classList.remove('hidden');
  }
  hideDisconnected() { this.disconnected.classList.add('hidden'); }

  toggleHelp(force) {
    const show = force ?? this.help.classList.contains('hidden');
    this.help.classList.toggle('hidden', !show);
  }

  // ----- HUD -----
  setCash(cash) {
    if (cash === this._lastCash) return;
    const grew = this._lastCash !== null && cash > this._lastCash;
    this._lastCash = cash;
    this.cashEl.textContent = formatCash(cash);
    if (grew) { this.cashEl.classList.remove('bump'); void this.cashEl.offsetWidth; this.cashEl.classList.add('bump'); }
  }
  setIncome(text) { this.incomeEl.textContent = text; }
  setStatus(text) { if (this.statusEl.textContent !== text) this.statusEl.textContent = text; }
  setRoom(code) { this.roomCode.textContent = `Server ${code}`; }
  setPing(ms) { this.pingEl.textContent = `${Math.round(ms)} ms`; }
  setRebirths(n) { this.rebirthsEl.textContent = `Rebirths ${n}`; }
  setTeleportVisible(v) { this.tpBtn.classList.toggle('hidden', !v); }

  setPrompt(text, kind) {
    const key = text ? text + kind : null;
    if (key === this._promptText) return;
    this._promptText = key;
    if (!text) { this.promptEl.classList.add('hidden'); return; }
    this.promptEl.classList.remove('hidden');
    this.promptEl.className = 'prompt ' + (kind || '');
    this.promptEl.innerHTML = text;
  }

  leaderboard(rows, myId) {
    const html = rows.slice(0, 8).map((r, i) =>
      `<li class="${r.id === myId ? 'me' : ''} ${r.connected === false ? 'away' : ''}">
        <span class="rank">${i + 1}</span>
        <span class="name"><span class="dot" style="background:${hexToCss(r.color)}"></span>${escapeHtml(r.name)}${r.rebirths ? `<span class="rb">★${r.rebirths}</span>` : ''}</span>
        <span class="val">${formatCash(r.cash)}</span>
      </li>`).join('');
    if (html !== this._lbHtml) { this._lbHtml = html; this.leaderboardEl.innerHTML = html; }
  }

  toast(text, kind = '', ms = 3500) {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = text;
    this.toasts.appendChild(el);
    while (this.toasts.children.length > 5) this.toasts.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
  }

  // ----- chat -----
  chatLine(name, text, color) {
    const el = document.createElement('div');
    el.className = 'chat-line';
    if (name === null) { el.classList.add('sys'); el.textContent = text; }
    else el.innerHTML = `<span class="who" style="color:${hexToCss(color ?? 0xffffff)}">${escapeHtml(name)}:</span> ${escapeHtml(text)}`;
    this.chatLog.appendChild(el);
    while (this.chatLog.children.length > 60) this.chatLog.firstChild.remove();
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  openChat() {
    this.chatInput.classList.remove('hidden');
    this.chatHint.classList.add('hidden');
    this.chatInput.focus();
  }
  closeChat() {
    this.chatInput.value = '';
    this.chatInput.classList.add('hidden');
    this.chatHint.classList.remove('hidden');
    this.chatInput.blur();
  }
  get chatOpen() { return !this.chatInput.classList.contains('hidden'); }
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
