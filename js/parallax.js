// Parallax do cenário: as camadas (.px com data-depth) se deslocam conforme o celular
// inclina (giroscópio). No computador, segue o mouse. No iPhone o Safari exige pedir
// permissão de movimento dentro de um toque, então pedimos no primeiro toque na tela.

const MAX_X = 28; // px de deslocamento na camada mais próxima
const MAX_Y = 18;

let enabled = true;
let strength = 1; // 1 na tela inicial, menor durante o jogo
let target = { x: 0, y: 0 };
let current = { x: 0, y: 0 };
let base = null; // inclinação "neutra" (como a pessoa segura o celular)
let layers = [];
let running = false;
let listening = false;

function clamp(v) {
  return Math.max(-1, Math.min(1, v));
}

function onOrientation(e) {
  if (e.beta == null || e.gamma == null) return;
  if (!base) base = { beta: e.beta, gamma: e.gamma };
  // a base acompanha devagar a posição de descanso
  base.beta += (e.beta - base.beta) * 0.01;
  base.gamma += (e.gamma - base.gamma) * 0.01;
  target.x = clamp((e.gamma - base.gamma) / 22);
  target.y = clamp((e.beta - base.beta) / 22);
  kick();
}

function onPointer(e) {
  if (e.pointerType !== 'mouse') return;
  target.x = clamp((e.clientX / innerWidth) * 2 - 1);
  target.y = clamp((e.clientY / innerHeight) * 2 - 1);
  kick();
}

function frame() {
  current.x += (target.x - current.x) * 0.08;
  current.y += (target.y - current.y) * 0.08;
  const k = enabled ? strength : 0;
  for (const el of layers) {
    const d = el._depth;
    el.style.transform = `translate3d(${(-current.x * d * MAX_X * k).toFixed(2)}px, ${(-current.y * d * MAX_Y * k).toFixed(2)}px, 0)`;
  }
  if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) requestAnimationFrame(frame);
  else running = false;
}

function kick() {
  if (running) return;
  running = true;
  requestAnimationFrame(frame);
}

function listen() {
  if (listening) return;
  listening = true;
  addEventListener('deviceorientation', onOrientation);
}

/** Pede permissão (iOS 13+) — chame dentro de um toque do usuário. */
export async function requestMotion() {
  const DOE = window.DeviceOrientationEvent;
  if (!DOE) return false;
  if (typeof DOE.requestPermission === 'function') {
    try {
      const r = await DOE.requestPermission();
      if (r !== 'granted') return false;
    } catch {
      return false;
    }
  }
  listen();
  return true;
}

export function initParallax(root) {
  layers = [...root.querySelectorAll('.px')];
  layers.forEach((el) => (el._depth = Number(el.dataset.depth || 0.5)));
  addEventListener('pointermove', onPointer, { passive: true });
  // Android e navegadores sem pedido de permissão já liberam o giroscópio
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') listen();
}

export function setParallax(on) {
  enabled = on;
  kick();
}

export function setParallaxStrength(s) {
  strength = s;
  kick();
}

export const needsMotionPermission = () =>
  !!window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function';
