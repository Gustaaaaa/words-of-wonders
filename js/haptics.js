// Vibração.
// - Android: navigator.vibrate.
// - iPhone (iOS 18+): o Safari não tem API de vibração, mas um <input type="checkbox" switch>
//   gera o "toque" háptico do sistema quando é alternado. Isso SÓ funciona dentro de um
//   evento de toque real (touchstart/touchend/click). Por isso, no iPhone os pedidos de
//   vibração ficam numa fila e são disparados no próximo evento de toque do usuário.

let enabled = true;
const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
let pending = false;

function iosTick() {
  const label = document.createElement('label');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

function flush() {
  if (!pending) return;
  pending = false;
  try { iosTick(); } catch {}
}

if (!canVibrate && typeof document !== 'undefined') {
  // captura: roda antes de qualquer outro tratador, ainda dentro do gesto
  for (const type of ['touchstart', 'touchend', 'click']) {
    document.addEventListener(type, () => queueMicrotask(flush), { capture: true, passive: true });
  }
  // depois que o jogo trata o toque (pointerup → palavra certa), o touchend ainda vem: dispara aí
  document.addEventListener('touchend', flush, { passive: true });
  document.addEventListener('click', flush, { passive: true });
}

function pulse(pattern) {
  if (!enabled) return;
  if (canVibrate) {
    try { navigator.vibrate(pattern); } catch {}
    return;
  }
  pending = true;
  // se já estamos dentro de um gesto (ex.: clique num botão), tenta na hora
  if (navigator.userActivation?.isActive) flush();
}

export const haptic = {
  set(on) { enabled = on; },
  /** Dispara imediatamente; use dentro de um tratador de clique/toque. */
  now(pattern = 12) {
    if (!enabled) return;
    if (canVibrate) { try { navigator.vibrate(pattern); } catch {} return; }
    try { iosTick(); } catch {}
  },
  tick: () => pulse(8),
  good: () => pulse([14, 50, 14]),
  bad: () => pulse(35),
  win: () => pulse([20, 70, 20, 70, 40]),
};
