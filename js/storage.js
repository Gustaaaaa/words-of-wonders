// Estado salvo no aparelho (localStorage), com valores padrão seguros.
const KEY = 'brisa:v1';

const DEFAULTS = {
  coins: 200,
  level: 1,
  sound: true,
  music: true,
  haptics: true,
  jar: 0, // palavras bônus acumuladas no pote (a cada 10, resgata moedas)
  tutorial: true,
  progress: null, // quebra-cabeça em andamento {id, found, revealed, bonus, hinted}
  daily: { last: '', streak: 0, best: 0, history: {} },
  stats: { words: 0, bonus: 0, bestCombo: 0, levels: 0, dailies: 0 },
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  const s = clone(DEFAULTS);
  if (saved && typeof saved === 'object') {
    Object.assign(s, saved);
    s.daily = { ...clone(DEFAULTS.daily), ...(saved.daily || {}) };
    s.stats = { ...clone(DEFAULTS.stats), ...(saved.stats || {}) };
  }
  return s;
}

let pending = null;
export function save(state) {
  clearTimeout(pending);
  pending = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, 120);
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch {}
  return clone(DEFAULTS);
}

// Datas locais no formato AAAA-MM-DD
export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}
export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
