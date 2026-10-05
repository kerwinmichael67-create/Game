// Voice and video calls (WebRTC). The chat server relays ringing and connection details;
// audio and video go directly between the two browsers. Uses "perfect negotiation", so either side
// can add a camera mid-call: the person who answered is the polite peer.
(() => {
  let host = null, cur = null, incoming = null, panel = null, tone = null, ticker = null;
  let iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const els = {};

  const supported = () => !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection);
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
    return el;
  }
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

  // ---------------------------------------------------------------- tones (quiet beeps made with Web Audio)
  function playTone(kind) {
    stopTone();
    let ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const beep = (freq, start, len) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; g.gain.value = 0.06;
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + len);
    };
    const pattern = kind === 'ring' ? () => { beep(480, 0, 0.35); beep(620, 0.4, 0.35); } : () => beep(440, 0, 1);
    pattern();
    tone = { ctx, timer: setInterval(pattern, kind === 'ring' ? 2000 : 3000) };
  }
  function stopTone() {
    if (!tone) return;
    clearInterval(tone.timer);
    tone.ctx.close().catch(() => {});
    tone = null;
  }

  // ---------------------------------------------------------------- media
  async function getMedia(video) {
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    try {
      return await navigator.mediaDevices.getUserMedia({ audio, video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false });
    } catch (e) {
      if (video) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio });
          host.toast('Your camera isn’t available, so you’re on voice only.', 'err');
          return s;
        } catch { /* fall through to the original error */ }
      }
      throw e;
    }
  }
  const mediaError = (e) => (e && e.name === 'NotAllowedError'
    ? 'Allow microphone and camera access for this site in your browser, then try again.'
    : e && e.name === 'NotFoundError' ? 'No microphone was found on this device.' : 'Couldn’t start your microphone or camera.');

  // ---------------------------------------------------------------- connection
  const signal = (data) => cur && cur.id && host.send({ t: 'callSignal', id: cur.id, data });
  function connect(polite) {
    const c = cur, pc = new RTCPeerConnection({ iceServers });
    c.pc = pc; c.polite = polite; c.makingOffer = false; c.ignoreOffer = false;
    c.remote = new MediaStream();
    els.remote.srcObject = c.remote;
    c.local.getTracks().forEach((t) => pc.addTrack(t, c.local));
    pc.ontrack = ({ track }) => {
      c.remote.addTrack(track);
      track.onunmute = track.onmute = track.onended = update;
      els.remote.play().catch(() => {});
      update();
    };
    pc.onnegotiationneeded = async () => {
      try {
        c.makingOffer = true;
        await pc.setLocalDescription();
        signal({ description: pc.localDescription.toJSON() });
      } catch (e) { console.error(e); } finally { c.makingOffer = false; }
    };
    pc.onicecandidate = ({ candidate }) => { if (candidate) signal({ candidate: candidate.toJSON() }); };
    pc.onconnectionstatechange = () => {
      if (cur !== c) return;
      const st = pc.connectionState;
      if (st === 'connected') {
        c.state = 'active';
        if (!c.started) c.started = Date.now();
        signal({ cam: c.camOn, mic: c.micOn });
      } else if (st === 'disconnected') c.state = 'reconnecting';
      else if (st === 'failed') {
        host.toast('The call couldn’t connect. One of your networks may be blocking calls.', 'err');
        hangUp();
        return;
      }
      update();
    };
  }
  async function onSignal(data) {
    const c = cur;
    if (!c || !c.pc) return;
    if (typeof data.cam === 'boolean') c.remoteCam = data.cam;
    if (typeof data.mic === 'boolean') c.remoteMic = data.mic;
    try {
      if (data.description) {
        const offer = data.description.type === 'offer';
        const collision = offer && (c.makingOffer || c.pc.signalingState !== 'stable');
        c.ignoreOffer = !c.polite && collision;
        if (c.ignoreOffer) return;
        await c.pc.setRemoteDescription(data.description);
        if (offer) {
          await c.pc.setLocalDescription();
          signal({ description: c.pc.localDescription.toJSON() });
        }
      } else if (data.candidate) {
        try { await c.pc.addIceCandidate(data.candidate); } catch (e) { if (!c.ignoreOffer) console.error(e); }
      }
    } catch (e) { console.error(e); }
    update();
  }

  // ---------------------------------------------------------------- actions
  async function start(to, video) {
    if (!supported()) return host.toast('Calls need a browser with camera and microphone support, on a secure (https) page.', 'err');
    if (cur || incoming) return host.toast('You’re already in a call.', 'err');
    cur = { id: null, peer: to, video, role: 'caller', state: 'starting', micOn: true, camOn: false, remoteCam: true, remoteMic: true };
    buildPanel();
    const c = cur;
    let stream;
    try {
      stream = await getMedia(video);
    } catch (e) {
      host.toast(mediaError(e), 'err');
      if (cur === c) cleanup();
      return;
    }
    if (cur !== c) { stream.getTracks().forEach((t) => t.stop()); return; } // hung up while the browser was asking
    cur.local = stream;
    cur.camOn = cur.local.getVideoTracks().length > 0;
    els.local.srcObject = cur.local;
    cur.state = 'calling';
    update();
    host.send({ t: 'call', to, video });
  }
  async function accept(withVideo) {
    const inv = incoming;
    if (!inv) return;
    incoming = null;
    stopTone();
    cur = { id: inv.id, peer: inv.from, video: withVideo, role: 'callee', state: 'connecting', micOn: true, camOn: false, remoteCam: true, remoteMic: true };
    buildPanel();
    const c = cur;
    let stream;
    try {
      stream = await getMedia(withVideo);
    } catch (e) {
      host.toast(mediaError(e), 'err');
      host.send({ t: 'callAnswer', id: inv.id, accept: false });
      if (cur === c) cleanup();
      return;
    }
    if (cur !== c) { stream.getTracks().forEach((t) => t.stop()); host.send({ t: 'callAnswer', id: inv.id, accept: false }); return; }
    cur.local = stream;
    cur.camOn = cur.local.getVideoTracks().length > 0;
    els.local.srcObject = cur.local;
    host.send({ t: 'callAnswer', id: inv.id, accept: true });
    connect(true);
    update();
  }
  function decline() {
    if (!incoming) return;
    host.send({ t: 'callAnswer', id: incoming.id, accept: false });
    incoming = null;
    stopTone();
    closePanel();
  }
  function toggleMic() {
    if (!cur || !cur.local) return;
    cur.micOn = !cur.micOn;
    cur.local.getAudioTracks().forEach((t) => { t.enabled = cur.micOn; });
    signal({ mic: cur.micOn });
    update();
  }
  async function toggleCam() {
    if (!cur || !cur.local) return;
    const tracks = cur.local.getVideoTracks();
    if (tracks.length) {
      cur.camOn = !cur.camOn;
      tracks.forEach((t) => { t.enabled = cur.camOn; });
    } else {
      // voice call: add a camera now (the connection renegotiates by itself)
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
        const track = cam.getVideoTracks()[0];
        cur.local.addTrack(track);
        if (cur.pc) cur.pc.addTrack(track, cur.local);
        els.local.srcObject = cur.local;
        cur.camOn = true;
      } catch (e) {
        host.toast(e && e.name === 'NotAllowedError' ? 'Allow camera access in your browser to turn on video.' : 'Your camera isn’t available.', 'err');
        return;
      }
    }
    signal({ cam: cur.camOn });
    update();
  }
  function hangUp() {
    if (cur && cur.id) host.send({ t: 'callEnd', id: cur.id });
    cleanup();
  }
  function cleanup() {
    stopTone();
    if (cur) {
      if (cur.local) cur.local.getTracks().forEach((t) => t.stop());
      if (cur.pc) cur.pc.close();
    }
    cur = null;
    closePanel();
  }

  // ---------------------------------------------------------------- server events
  const ENDED = { declined: 'declined the call', 'no answer': 'didn’t answer', disconnected: 'got disconnected' };
  function event(m) {
    if (m.t === 'callRinging') {
      if (cur && cur.role === 'caller' && !cur.id) { cur.id = m.id; cur.state = 'ringing'; playTone('ringback'); update(); }
    } else if (m.t === 'callIncoming') {
      if (cur || incoming) return;
      incoming = m;
      showIncoming();
      playTone('ring');
    } else if (m.t === 'callAccepted') {
      if (!cur || cur.id !== m.id) return;
      stopTone();
      cur.state = 'connecting';
      connect(false);
      update();
    } else if (m.t === 'callSignal') {
      if (cur && cur.id === m.id) onSignal(m.data || {});
    } else if (m.t === 'callEnded') {
      if (incoming && incoming.id === m.id) {
        if (m.reason === 'no answer' || m.reason === 'disconnected' || m.reason === 'ended') host.toast(`Missed call from ${host.nameOf(incoming.from)}`);
        incoming = null;
        stopTone();
        closePanel();
      }
      if (cur && cur.id === m.id) {
        const who = host.nameOf(cur.peer);
        const me = host.me();
        if (ENDED[m.reason] && m.by !== me) host.toast(`${who} ${ENDED[m.reason]}`);
        else if (m.reason === 'no answer') host.toast(`${who} didn’t answer`);
        else if (m.by && m.by !== me) host.toast(`${who} ended the call${m.duration ? ` · ${fmt(m.duration)}` : ''}`);
        else if (m.reason === 'answered in another tab') host.toast('You answered in another tab');
        cleanup();
      }
    }
  }

  // ---------------------------------------------------------------- UI
  const ICON = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>',
    micOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 4.9 2.3M19 10a7 7 0 0 1-1.2 3.9M5 10a7 7 0 0 0 10.7 5.9M12 17v5M3 3l18 18"/></svg>',
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-4v12l-6-4"/></svg>',
    camOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h4a2 2 0 0 1 2 2v3.3l1 .7 5-3.4v10.7M2 2l20 20"/></svg>',
    end: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  };
  const iconBtn = (cls, label, svg, onclick) => {
    const b = h('button', { class: 'call-btn ' + cls, type: 'button', title: label, 'aria-label': label, onclick });
    b.innerHTML = svg;
    return b;
  };
  function ensurePanel() {
    if (!panel) { panel = h('div', { class: 'call-panel', role: 'dialog', 'aria-live': 'polite' }); document.body.append(panel); }
    panel.className = 'call-panel';
    return panel;
  }
  function showIncoming() {
    const p = ensurePanel(), from = incoming.from;
    p.classList.add('incoming');
    p.replaceChildren(
      h('div', { class: 'call-ring' }, host.avatarEl(from)),
      h('div', { class: 'call-who' }, h('b', {}, host.nameOf(from)), h('span', {}, incoming.video ? 'Video call…' : 'Voice call…')),
      h('div', { class: 'call-controls' },
        iconBtn('danger', 'Decline', ICON.end, decline),
        iconBtn('accept', 'Answer with voice', ICON.phone, () => accept(false)),
        iconBtn('accept', 'Answer with video', ICON.cam, () => accept(true))));
  }
  function buildPanel() {
    const p = ensurePanel(), peer = cur.peer;
    els.remote = h('video', { class: 'call-remote', autoplay: true, playsinline: true });
    els.local = h('video', { class: 'call-local', autoplay: true, playsinline: true, muted: true });
    els.local.muted = true;
    els.status = h('span', { class: 'call-status' });
    els.peerMuted = h('span', { class: 'call-flag hidden' }, '🔇 muted');
    els.mic = iconBtn('', 'Mute', ICON.mic, toggleMic);
    els.cam = iconBtn('', 'Turn camera on', ICON.cam, toggleCam);
    p.replaceChildren(
      h('div', { class: 'call-stage' },
        els.remote,
        h('div', { class: 'call-avatar' }, host.avatarEl(peer), h('b', {}, host.nameOf(peer))),
        els.local,
        h('div', { class: 'call-top' }, h('b', {}, host.nameOf(peer)), els.status, els.peerMuted)),
      h('div', { class: 'call-controls' },
        els.mic, els.cam,
        iconBtn('', 'Bigger', ICON.full, () => p.classList.toggle('big')),
        iconBtn('danger', 'Hang up', ICON.end, hangUp)));
    clearInterval(ticker);
    ticker = setInterval(update, 1000);
    update();
  }
  function update() {
    if (!cur || !panel) return;
    const label = { starting: 'Starting…', calling: 'Calling…', ringing: 'Ringing…', connecting: 'Connecting…', reconnecting: 'Reconnecting…' }[cur.state];
    els.status.textContent = cur.state === 'active' ? fmt(Date.now() - cur.started) : label || '';
    const remoteVideo = cur.remote && cur.remote.getVideoTracks().some((t) => t.readyState === 'live' && !t.muted) && cur.remoteCam;
    panel.classList.toggle('has-video', !!remoteVideo);
    panel.classList.toggle('self-video', cur.camOn);
    els.peerMuted.classList.toggle('hidden', cur.remoteMic !== false);
    els.mic.innerHTML = cur.micOn ? ICON.mic : ICON.micOff;
    els.mic.classList.toggle('off', !cur.micOn);
    els.mic.title = cur.micOn ? 'Mute' : 'Unmute';
    els.cam.innerHTML = cur.camOn ? ICON.cam : ICON.camOff;
    els.cam.classList.toggle('off', !cur.camOn);
    els.cam.title = cur.camOn ? 'Turn camera off' : 'Turn camera on';
  }
  function closePanel() {
    clearInterval(ticker);
    if (panel) { panel.remove(); panel = null; }
  }

  window.Calls = {
    init(api) { host = api; },
    configure(cfg) { if (cfg && Array.isArray(cfg.iceServers) && cfg.iceServers.length) iceServers = cfg.iceServers; },
    supported,
    start,
    event,
    hangUp: () => { if (incoming) decline(); if (cur) hangUp(); },
    busy: () => !!(cur || incoming),
  };
})();
