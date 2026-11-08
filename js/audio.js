// Sons gerados na hora com Web Audio: sininhos pentatônicos, acordes suaves
// e uma trilha ambiente generativa. Nada de arquivos de áudio.

let ctx = null;
let master, sfxBus, musicBus, reverb, reverbSend;
let sfxOn = true;
let musicOn = true;
let musicTimer = null;
let sparkleTimer = null;
let musicStarted = false;

// Escala pentatônica maior (C D E G A) em semitons a partir de C5
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
const C5 = 523.25;
const hz = (semi, base = C5) => base * Math.pow(2, semi / 12);

function makeImpulse(seconds = 2.8, decay = 2.6) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    // "ambient" respeita a chave de silencioso do iPhone e mistura com outras músicas
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
  } catch {}
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);

  reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse();
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  reverb.connect(wet).connect(master);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = sfxOn ? 0.8 : 0;
  sfxBus.connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(master);

  reverbSend = ctx.createGain();
  reverbSend.gain.value = 1;
  reverbSend.connect(reverb);
  return ctx;
}

/** Deve ser chamado num gesto do usuário (toque) para liberar o áudio no iOS. */
export function unlock() {
  if (!init()) return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  if (musicOn && !musicStarted) startMusic();
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
});

export function setSfx(on) {
  sfxOn = on;
  if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.05);
}

export function setMusic(on) {
  musicOn = on;
  if (!ctx) return;
  if (on) startMusic();
  else stopMusic();
}

// ---------------------------------------------------------------- instrumentos
function bell(freq, { t = 0, vol = 0.22, dur = 1.4, wet = 0.35, bus = sfxBus, bright = 1 } = {}) {
  if (!ctx || (bus === sfxBus && !sfxOn)) return;
  const now = ctx.currentTime + t;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = freq;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = freq * 2.756; // parcial "inarmônica", tipo kalimba
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.18 * bright, now);
  g2.gain.exponentialRampToValueAtTime(0.0005, now + dur * 0.35);
  o1.connect(g);
  o2.connect(g2).connect(g);
  g.connect(bus);
  const send = ctx.createGain();
  send.gain.value = wet;
  g.connect(send).connect(reverbSend);
  o1.start(now);
  o2.start(now);
  o1.stop(now + dur + 0.05);
  o2.stop(now + dur + 0.05);
}

function blip(from, to, { t = 0, vol = 0.18, dur = 0.25, type = 'sine' } = {}) {
  if (!ctx || !sfxOn) return;
  const now = ctx.currentTime + t;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, now);
  o.frequency.exponentialRampToValueAtTime(to, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
  o.connect(g).connect(sfxBus);
  const send = ctx.createGain();
  send.gain.value = 0.15;
  g.connect(send).connect(reverbSend);
  o.start(now);
  o.stop(now + dur + 0.05);
}

function whoosh({ t = 0, dur = 0.7, vol = 0.18 } = {}) {
  if (!ctx || !sfxOn) return;
  const now = ctx.currentTime + t;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(400, now);
  f.frequency.exponentialRampToValueAtTime(2400, now + dur * 0.6);
  f.frequency.exponentialRampToValueAtTime(800, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + dur * 0.4);
  g.gain.linearRampToValueAtTime(0, now + dur);
  src.connect(f).connect(g).connect(sfxBus);
  const send = ctx.createGain();
  send.gain.value = 0.4;
  g.connect(send).connect(reverbSend);
  src.start(now);
}

// ---------------------------------------------------------------- efeitos do jogo
export const sfx = {
  letter(i) {
    bell(hz(PENTA[Math.min(i, PENTA.length - 1)]), { vol: 0.16, dur: 0.9, wet: 0.25 });
  },
  unletter(i) {
    bell(hz(PENTA[Math.min(i, PENTA.length - 1)] - 12), { vol: 0.08, dur: 0.4, wet: 0.1 });
  },
  good(combo = 1) {
    const up = Math.min(combo - 1, 4) * 2;
    [0, 4, 7, 12].forEach((s, i) => bell(hz(s + up), { t: i * 0.07, vol: 0.18, dur: 1.6 }));
  },
  bonus() {
    [12, 16, 19, 24, 28].forEach((s, i) => bell(hz(s), { t: i * 0.05, vol: 0.12, dur: 1, bright: 1.6 }));
  },
  same() {
    bell(hz(7), { vol: 0.12, dur: 0.4 });
    bell(hz(7), { t: 0.12, vol: 0.09, dur: 0.4 });
  },
  bad() {
    blip(240, 150, { vol: 0.16, dur: 0.3 });
  },
  tap() {
    blip(900, 700, { vol: 0.05, dur: 0.06 });
  },
  shuffle() {
    whoosh({ dur: 0.45, vol: 0.12 });
  },
  coin(i = 0) {
    bell(hz(24 + (i % 5) * 2), { vol: 0.07, dur: 0.35, wet: 0.15, bright: 2 });
  },
  hint() {
    whoosh({ dur: 0.6, vol: 0.14 });
    bell(hz(19), { t: 0.25, vol: 0.14, dur: 1.4 });
  },
  reveal(i = 0) {
    bell(hz(PENTA[(i + 3) % PENTA.length]), { vol: 0.1, dur: 0.8 });
  },
  combo(n) {
    bell(hz(12 + Math.min(n, 6) * 2), { vol: 0.12, dur: 0.7, bright: 1.5 });
  },
  win() {
    const chord = [0, 4, 7, 11, 14, 19, 24];
    chord.forEach((s, i) => bell(hz(s - 12), { t: i * 0.11, vol: 0.2, dur: 2.6, wet: 0.5 }));
    pad([hz(-24), hz(-17), hz(-12), hz(-8)], { dur: 4, vol: 0.05, bus: sfxBus });
  },
  jar() {
    [19, 24, 28, 31, 36].forEach((s, i) => bell(hz(s - 12), { t: i * 0.08, vol: 0.14, dur: 1.2, bright: 1.4 }));
  },
};

// ---------------------------------------------------------------- trilha ambiente
function pad(freqs, { t = 0, dur = 9, vol = 0.035, bus = musicBus } = {}) {
  if (!ctx) return;
  const now = ctx.currentTime + t;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(500, now);
  f.frequency.linearRampToValueAtTime(1100, now + dur * 0.5);
  f.frequency.linearRampToValueAtTime(600, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + dur * 0.35);
  g.gain.linearRampToValueAtTime(vol * 0.8, now + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, now + dur);
  f.connect(g).connect(bus);
  const send = ctx.createGain();
  send.gain.value = 0.6;
  g.connect(send).connect(reverbSend);
  for (const freq of freqs) {
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(f);
      o.start(now);
      o.stop(now + dur + 0.1);
    }
  }
}

// Fmaj7 → Em7 → Am9 → G6sus (em C3/C4), bem leve
const PROGRESSION = [
  [-19, -12, -8, -5, 0],
  [-20, -13, -8, -5, -1],
  [-15, -12, -8, -1, 2],
  [-17, -10, -7, -3, 0],
].map((ch) => ch.map((s) => hz(s, 261.63)));
let chordIdx = 0;

function startMusic() {
  if (!ctx || musicStarted) return;
  musicStarted = true;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setTargetAtTime(0.9, ctx.currentTime, 1.5);
  const step = () => {
    pad(PROGRESSION[chordIdx % PROGRESSION.length], { dur: 10 });
    chordIdx++;
    musicTimer = setTimeout(step, 8000);
  };
  step();
  const sparkle = () => {
    const s = PENTA[Math.floor(Math.random() * 8)];
    bell(hz(s), { vol: 0.03 + Math.random() * 0.02, dur: 2.4, wet: 0.8, bus: musicBus });
    sparkleTimer = setTimeout(sparkle, 1800 + Math.random() * 4200);
  };
  sparkleTimer = setTimeout(sparkle, 2500);
}

function stopMusic() {
  if (!ctx || !musicStarted) return;
  musicStarted = false;
  clearTimeout(musicTimer);
  clearTimeout(sparkleTimer);
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
}
