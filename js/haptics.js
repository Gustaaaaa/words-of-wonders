// Vibração: navigator.vibrate no Android; no iPhone (Safari 18+) usamos o
// truque do <input type="checkbox" switch>, que gera um "toque" háptico do sistema.
let enabled = true;
let label = null;

function iosTick() {
  if (!label) {
    label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
  }
  label.click();
}

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

function pulse(pattern) {
  if (!enabled) return;
  try {
    if (canVibrate) navigator.vibrate(pattern);
    else {
      const n = Array.isArray(pattern) ? Math.ceil(pattern.length / 2) : 1;
      for (let i = 0; i < n; i++) setTimeout(iosTick, i * 90);
    }
  } catch {}
}

export const haptic = {
  set(on) { enabled = on; },
  tick: () => pulse(8),
  good: () => pulse([14, 50, 14]),
  bad: () => pulse(35),
  win: () => pulse([20, 70, 20, 70, 40]),
};
