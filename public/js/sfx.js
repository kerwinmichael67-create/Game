// Tiny procedural sound effects (no audio files needed).
let ctx = null;
let enabled = true;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq = 440, to = null, dur = 0.12, type = 'square', gain = 0.08, delay = 0 }) {
  const c = ac();
  if (!c || !enabled) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  unlock() { ac(); },
  setEnabled(v) { enabled = v; },
  buy() { tone({ freq: 520, to: 880, dur: 0.14, type: 'square', gain: 0.06 }); tone({ freq: 1040, dur: 0.12, type: 'triangle', gain: 0.05, delay: 0.1 }); },
  collect() { tone({ freq: 880, to: 1320, dur: 0.1, type: 'triangle', gain: 0.05 }); },
  deny() { tone({ freq: 220, to: 160, dur: 0.18, type: 'sawtooth', gain: 0.04 }); },
  claim() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.16, type: 'triangle', gain: 0.06, delay: i * 0.09 })); },
  rebirth() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'triangle', gain: 0.07, delay: i * 0.08 })); },
  chat() { tone({ freq: 1200, dur: 0.05, type: 'sine', gain: 0.03 }); },
  jump() { tone({ freq: 300, to: 520, dur: 0.1, type: 'sine', gain: 0.03 }); },
};
