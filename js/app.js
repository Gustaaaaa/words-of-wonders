import { load, save, reset, dateKey, addDays, daysBetween } from './storage.js';
import { CHAPTERS, DAILY_THEME, LEVELS_PER_CHAPTER, chapterOf, applyTheme, setThemeMode } from './themes.js';
import { sfx, unlock, setSfx, setMusic } from './audio.js';
import { haptic } from './haptics.js';
import { Wheel } from './wheel.js';
import { Grid } from './grid.js';

// ---------------------------------------------------------------- regras
const COMBO_WINDOW = 7000; // ms para manter o combo vivo
const COMBO_MAX = 5;
const WORD_COINS = 2;
const BONUS_COINS = 1;
const LEVEL_COINS = 10;
const NO_HINT_COINS = 10;
const JAR_GOAL = 10;
const JAR_REWARD = 25;
const DAILY_COINS = 50;
const PRICES = { light: 25, target: 45, wind: 80 };
const DAILY_EPOCH = '2026-01-01';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let state = load();
let DATA = null;
let game = null;
let shownCoins = state.coins;

setThemeMode(state.theme || 'light');
setSfx(state.sound);
setMusic(state.music);
haptic.set(state.haptics);

// ---------------------------------------------------------------- componentes
const grid = new Grid($('gridWrap'), $('grid'), { onCellTap: onCellTap });
const wheel = new Wheel($('wheel'), {
  onChange: renderPreview,
  onSubmit: submit,
  onAdd: (i) => { sfx.letter(i); haptic.tick(); },
  onRemove: (i) => sfx.unletter(i),
});

// ---------------------------------------------------------------- moedas
function renderCoins(value = shownCoins) {
  shownCoins = value;
  const label = state.infinite ? '∞' : value;
  document.querySelectorAll('[data-coins] b').forEach((b) => (b.textContent = label));
}
const canAfford = (n) => state.infinite || state.coins >= n;
function coinPill() {
  return [...document.querySelectorAll('[data-coins]')].find((el) => el.offsetParent !== null);
}
function bumpCoins() {
  const pill = coinPill();
  if (!pill) return;
  pill.classList.remove('bump');
  void pill.offsetWidth;
  pill.classList.add('bump');
}
function gainCoins(n, fromRect, { flying = Math.min(8, Math.max(1, Math.ceil(n / 3))), delay = 0 } = {}) {
  state.coins += n;
  save(state);
  const target = shownCoins + n;
  if (!fromRect) {
    renderCoins(target);
    return Promise.resolve();
  }
  return flyCoins(fromRect, flying, delay, (i, total) => {
    renderCoins(Math.round(shownCoins + (target - shownCoins) / (total - i)));
  }).then(() => renderCoins(target));
}
function spend(n) {
  if (state.infinite) return true; // modo de teste
  if (state.coins < n) {
    const pill = coinPill();
    pill?.classList.remove('shake');
    void pill?.offsetWidth;
    pill?.classList.add('shake');
    sfx.bad();
    haptic.bad();
    toast('Moedas insuficientes · encha o pote com palavras bônus 🍃');
    return false;
  }
  state.coins -= n;
  renderCoins(state.coins);
  save(state);
  return true;
}

// ---------------------------------------------------------------- efeitos visuais
const fx = $('fx');

function flyCoins(fromRect, count, delay, onArrive) {
  const pill = coinPill();
  const to = pill?.querySelector('.coin-ico')?.getBoundingClientRect();
  if (!to) return Promise.resolve();
  const sx = fromRect.left + fromRect.width / 2;
  const sy = fromRect.top + fromRect.height / 2;
  const tx = to.left + to.width / 2;
  const ty = to.top + to.height / 2;
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'fly-coin';
    c.style.left = tx + 'px';
    c.style.top = ty + 'px';
    fx.appendChild(c);
    const spreadX = (Math.random() - 0.5) * 90;
    const spreadY = (Math.random() - 0.5) * 60 - 20;
    const a = c.animate(
      [
        { transform: `translate(${sx - tx}px, ${sy - ty}px) scale(0.4)`, opacity: 0 },
        { transform: `translate(${sx - tx + spreadX}px, ${sy - ty + spreadY}px) scale(1.1)`, opacity: 1, offset: 0.3 },
        { transform: 'translate(0, 0) scale(0.8)', opacity: 1 },
      ],
      { duration: 750, delay: delay + i * 70, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'backwards' }
    );
    jobs.push(
      a.finished.then(() => {
        c.remove();
        sfx.coin(i);
        bumpCoins();
        onArrive?.(i, count);
      })
    );
  }
  return Promise.all(jobs);
}

function floatText(text, rect, color) {
  const t = document.createElement('div');
  t.className = 'float-text';
  t.textContent = text;
  if (color) t.style.color = color;
  t.style.left = rect.left + rect.width / 2 + 'px';
  t.style.top = rect.top + 'px';
  fx.appendChild(t);
  t.animate(
    [
      { transform: 'translate(-50%, -30%) scale(0.6)', opacity: 0 },
      { transform: 'translate(-50%, -110%) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -220%) scale(1)', opacity: 0 },
    ],
    { duration: 1100, easing: 'ease-out' }
  ).finished.then(() => t.remove());
}

function flyLetters(fromRects, toRects, { gold = false, letters, stagger = 55 } = {}) {
  return Promise.all(
    toRects.map((to, i) => {
      const from = fromRects[Math.min(i, fromRects.length - 1)];
      if (!from || !to) return Promise.resolve(i);
      const d = document.createElement('div');
      d.className = 'fly-letter' + (gold ? ' gold' : '');
      d.textContent = letters[i];
      d.style.left = to.left + 'px';
      d.style.top = to.top + 'px';
      d.style.width = to.width + 'px';
      d.style.height = to.height + 'px';
      d.style.fontSize = to.height * 0.6 + 'px';
      fx.appendChild(d);
      const s = Math.max(0.4, from.height / to.height);
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      return d
        .animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) scale(${s * 1.15})`, offset: 0.45 },
            { transform: 'translate(0, 0) scale(1)' },
          ],
          { duration: 480, delay: i * stagger, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'backwards' }
        )
        .finished.then(() => {
          d.remove();
          return i;
        });
    })
  );
}

function petals(fromRect, toRect, n = 1) {
  const colors = ['#ffd6e0', '#ffffff', '#ffe7a6', 'var(--accent)'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.background = colors[i % colors.length];
    const tx = toRect.left + toRect.width / 2;
    const ty = toRect.top + toRect.height / 2;
    p.style.left = tx + 'px';
    p.style.top = ty + 'px';
    fx.appendChild(p);
    const dx = fromRect.left + fromRect.width / 2 - tx;
    const dy = fromRect.top + fromRect.height / 2 - ty;
    const cx = (Math.random() - 0.5) * 160;
    p.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(.6)`, opacity: 0 },
        { transform: `translate(${dx * 0.5 + cx}px, ${dy * 0.5 - 40}px) rotate(220deg) scale(1.2)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px) rotate(400deg) scale(.3)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 300, easing: 'ease-in-out', delay: i * 40 }
    ).finished.then(() => p.remove());
  }
}

function confettiBurst() {
  const layer = $('fxBack');
  const colors = ['#ffd6e0', '#ffffff', '#ffe7a6', '#bfe8d8', '#d8ccf5'];
  const W = innerWidth;
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.background = colors[i % colors.length];
    p.style.left = Math.random() * W + 'px';
    p.style.top = '-20px';
    layer.appendChild(p);
    const drift = (Math.random() - 0.5) * 120;
    p.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0.95 },
        { transform: `translate(${drift}px, ${innerHeight * 0.55}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0.9, offset: 0.6 },
        { transform: `translate(${drift * 1.6}px, ${innerHeight + 40}px) rotate(${720 + Math.random() * 360}deg)`, opacity: 0 },
      ],
      { duration: 3200 + Math.random() * 2000, delay: Math.random() * 900, easing: 'cubic-bezier(.3,.2,.6,1)' }
    ).finished.then(() => p.remove());
  }
}

function sparkles(rect, n = 5) {
  if (!rect) return;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < n; i++) {
    const sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.style.left = cx + 'px';
    sp.style.top = cy + 'px';
    fx.appendChild(sp);
    const a = Math.random() * Math.PI * 2;
    const dist = rect.width * (0.6 + Math.random() * 0.6);
    const sc = 0.6 + Math.random() * 0.9;
    sp.animate(
      [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) scale(${sc}) rotate(140deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(a) * dist * 1.2}px, ${Math.sin(a) * dist * 1.2 + 6}px) scale(0) rotate(200deg)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' }
    ).finished.then(() => sp.remove());
  }
}

// Pétalas caindo devagar no fundo (vagalumes subindo no tema escuro)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function ambientLoop() {
  if (reduceMotion) return;
  const layer = $('ambient');
  if (!document.hidden && layer.childElementCount < 9) {
    const d = document.createElement('i');
    d.className = 'drift';
    d.style.left = Math.random() * 100 + '%';
    const dur = 11 + Math.random() * 9;
    d.style.animationDuration = dur + 's';
    d.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
    d.style.scale = (0.6 + Math.random() * 0.8).toFixed(2);
    layer.appendChild(d);
    setTimeout(() => d.remove(), dur * 1000 + 200);
  }
  setTimeout(ambientLoop, 1600 + Math.random() * 2200);
}

// Se o jogador ficar parado um tempo, a lâmpada pede atenção com carinho
let idleTimer = null;
function resetIdle() {
  clearTimeout(idleTimer);
  $('hintLight').classList.remove('nudge');
  if (!game || game.done) return;
  idleTimer = setTimeout(() => game && !game.done && $('hintLight').classList.add('nudge'), 25000);
}

let toastTimer = null;
function toast(msg, ms = 2400) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ---------------------------------------------------------------- modal
function openModal(html, { onOpen, dismissable = true } = {}) {
  const m = $('modal');
  $('toast').classList.remove('show');
  $('modalCard').innerHTML = html;
  m.hidden = false;
  m.onclick = (e) => {
    if (dismissable && e.target === m) closeModal();
  };
  onOpen?.($('modalCard'));
}
function closeModal() {
  $('modal').hidden = true;
}

// ---------------------------------------------------------------- telas
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function currentStreak() {
  const today = dateKey();
  const d = state.daily;
  if (!d.last) return 0;
  const gap = daysBetween(d.last, today);
  return gap <= 1 ? d.streak : 0;
}

function renderHome() {
  const level = state.level;
  const ch = chapterOf(level);
  applyTheme(ch.theme);
  $('homeChapterLabel').textContent = `Capítulo ${ch.number}`;
  $('homeChapterName').textContent = ch.theme.name;
  $('homeLevelBadge').textContent = level;
  $('btnPlayLevel').textContent = `Nível ${level}`;
  const inChapter = (level - 1) % LEVELS_PER_CHAPTER;
  requestAnimationFrame(() => ($('homeChapterProgress').style.width = (inChapter / LEVELS_PER_CHAPTER) * 100 + '%'));

  const today = dateKey();
  const now = new Date();
  $('dailyDate').textContent = `${now.getDate()} de ${MONTHS[now.getMonth()]}`;
  const streak = currentStreak();
  $('streakCount').textContent = streak;
  $('streakBadge').classList.toggle('off', streak === 0);
  const week = $('weekDots');
  week.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const key = addDays(today, -i);
    const [y, m, d] = key.split('-').map(Number);
    const day = document.createElement('div');
    day.className = 'day' + (state.daily.history[key] ? ' done' : '') + (i === 0 ? ' today' : '');
    day.innerHTML = `<span class="dot"></span>${WEEK[new Date(y, m - 1, d).getDay()]}`;
    week.appendChild(day);
  }
  const doneToday = !!state.daily.history[today];
  const btn = $('btnDaily');
  btn.disabled = doneToday;
  btn.textContent = doneToday ? 'Concluído · volte amanhã 🌙' : state.progress?.daily?.id === 'D' + today ? 'Continuar desafio' : 'Jogar desafio';
  renderCoins(state.coins);
  show('home');
}

// ---------------------------------------------------------------- quebra-cabeça
function buildPuzzle(data) {
  const cells = new Map();
  const words = data.words.map(([w, r, c, dir]) => {
    const keys = [];
    for (let i = 0; i < w.length; i++) {
      const rr = dir === 'v' ? r + i : r;
      const cc = dir === 'h' ? c + i : c;
      const key = rr + ',' + cc;
      keys.push(key);
      cells.set(key, w[i]);
    }
    return { w, cells: keys };
  });
  const sorted = new Map([...cells.entries()].sort((a, b) => {
    const [r1, c1] = a[0].split(',').map(Number);
    const [r2, c2] = b[0].split(',').map(Number);
    return r1 - r2 || c1 - c2;
  }));
  let letters = data.letters.split('');
  const wordSet = new Set(words.map((w) => w.w));
  for (let tries = 0; tries < 20; tries++) {
    letters = letters.sort(() => Math.random() - 0.5);
    if (!wordSet.has(letters.join(''))) break;
  }
  return {
    rows: data.rows,
    cols: data.cols,
    cells: sorted,
    words,
    letters,
    bonus: new Set(data.bonus ? data.bonus.split(' ') : []),
  };
}

function dailyIndex(today) {
  const n = DATA.daily.length;
  return ((daysBetween(DAILY_EPOCH, today) % n) + n) % n;
}

function startLevel() {
  const n = state.level;
  const data = DATA.levels[(n - 1) % DATA.levels.length];
  const ch = chapterOf(n);
  applyTheme(ch.theme);
  openPuzzle({ mode: 'level', id: 'L' + n, data, title: `Nível ${n}`, subtitle: ch.theme.name });
}

function startDaily() {
  const today = dateKey();
  if (state.daily.history[today]) return;
  const data = DATA.daily[dailyIndex(today)];
  applyTheme(DAILY_THEME);
  const now = new Date();
  openPuzzle({ mode: 'daily', id: 'D' + today, data, title: `${now.getDate()} de ${MONTHS[now.getMonth()]}`, subtitle: 'Desafio do dia', today });
}

function openPuzzle({ mode, id, data, title, subtitle, today }) {
  const puzzle = buildPuzzle(data);
  state.progress = state.progress || {};
  let saved = state.progress[mode];
  if (!saved || saved.id !== id) {
    saved = { id, found: [], revealed: [], hinted: [], bonus: [], hints: 0, earned: 0, maxCombo: 0 };
    state.progress[mode] = saved;
  }
  game = {
    mode,
    id,
    today,
    puzzle,
    saved,
    found: new Set(saved.found),
    revealed: new Set(saved.revealed),
    hinted: new Set(saved.hinted),
    bonusFound: new Set(saved.bonus),
    combo: 0,
    lastHit: 0,
    targeting: false,
    done: false,
    busy: false,
  };
  $('gameLevel').textContent = title;
  $('gameChapter').textContent = subtitle;
  show('game');
  hideCombo();
  resetPreview();
  wheel.enabled = true;
  wheel.setLetters(puzzle.letters);
  // espera a tela aparecer para medir a grade
  requestAnimationFrame(() => {
    grid.render(puzzle, game.revealed);
    for (const k of game.hinted) grid.cells.get(k)?.classList.add('hinted');
  });
  renderJar();
  renderCoins(state.coins);
  $('wheelTip').hidden = !(state.tutorial && mode === 'level' && state.level === 1);
  resetIdle();
  save(state);
}

function persist() {
  const s = game.saved;
  s.found = [...game.found];
  s.revealed = [...game.revealed];
  s.hinted = [...game.hinted];
  s.bonus = [...game.bonusFound];
  save(state);
}

// ---------------------------------------------------------------- prévia da palavra
const preview = $('preview');
let previewTimer = null;

function resetPreview() {
  clearTimeout(previewTimer);
  preview.className = 'preview';
  preview.innerHTML = '';
}

function renderPreview(word) {
  clearTimeout(previewTimer);
  preview.className = 'preview' + (word ? ' show' : '');
  const spans = preview.children;
  while (spans.length > word.length) preview.lastChild.remove();
  for (let i = spans.length; i < word.length; i++) {
    const s = document.createElement('span');
    s.textContent = word[i];
    preview.appendChild(s);
  }
  if (game?.targeting) cancelTargeting();
}

function previewResult(cls, keep = 500) {
  preview.classList.add(cls);
  previewTimer = setTimeout(() => {
    preview.classList.add('fade');
    previewTimer = setTimeout(resetPreview, 300);
  }, keep);
}

// ---------------------------------------------------------------- combo
let comboTimer = null;
function hitCombo() {
  const now = performance.now();
  game.combo = game.combo > 0 && now - game.lastHit <= COMBO_WINDOW ? game.combo + 1 : 1;
  game.lastHit = now;
  game.saved.maxCombo = Math.max(game.saved.maxCombo, game.combo);
  state.stats.bestCombo = Math.max(state.stats.bestCombo, game.combo);
  const mult = Math.min(game.combo, COMBO_MAX);
  const el = $('combo');
  if (game.combo >= 2) {
    $('comboX').textContent = mult;
    el.classList.add('show');
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
    sfx.combo(game.combo);
    $('comboBar').getAnimations().forEach((a) => a.cancel());
    $('comboBar').animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: COMBO_WINDOW, easing: 'linear', fill: 'forwards' });
    if (!state.seenCombo) {
      state.seenCombo = true;
      toast('Combo! Acerte rápido para multiplicar as moedas ✨', 3200);
    }
  }
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    game.combo = 0;
    hideCombo();
  }, COMBO_WINDOW);
  return mult;
}
function hideCombo() {
  $('combo').classList.remove('show');
}

// ---------------------------------------------------------------- jogadas
function submit(word) {
  if (!game || game.done) return resetPreview();
  if (word.length < 3) {
    if (word.length) previewResult('fade', 0);
    else resetPreview();
    return;
  }
  const w = game.puzzle.words.find((x) => x.w === word);
  if (w) {
    if (game.found.has(word)) {
      previewResult('same');
      sfx.same();
      grid.flash(w.cells);
      return;
    }
    return foundWord(w);
  }
  if (game.puzzle.bonus.has(word)) {
    if (game.bonusFound.has(word)) {
      previewResult('same');
      sfx.same();
      wiggleJar();
      toast('Essa já está no pote 🫙');
      return;
    }
    return foundBonus(word);
  }
  previewResult('bad', 420);
  wheel.no();
  sfx.bad();
  haptic.bad();
}

function foundWord(w) {
  $('wheelTip').hidden = true;
  if (state.tutorial) { state.tutorial = false; }
  game.found.add(w.w);
  state.stats.words++;
  const mult = hitCombo();
  const coins = WORD_COINS * mult;
  game.saved.earned += coins;
  sfx.good(game.combo);
  haptic.good();

  const fromRects = [...preview.children].map((s) => s.getBoundingClientRect());
  const pRect = preview.getBoundingClientRect();
  resetPreview();
  const targets = w.cells.map((k) => grid.rect(k));
  w.cells.forEach((k) => {
    game.revealed.add(k);
    game.hinted.delete(k);
  });
  persist();
  floatText(mult > 1 ? `+${coins}  x${mult}` : `+${coins}`, pRect);
  gainCoins(coins, null);
  bumpCoins();

  flyLetters(fromRects, targets, { letters: w.w.split('') }).then(() => {});
  wheel.hop();
  resetIdle();
  w.cells.forEach((k, i) => {
    setTimeout(() => {
      grid.cells.get(k)?.classList.remove('hinted');
      grid.reveal(k);
      sparkles(grid.rect(k), 3);
    }, 480 + i * 55);
  });
  setTimeout(() => {
    autoComplete();
    checkWin();
  }, 520 + w.cells.length * 55);
}

function foundBonus(word) {
  game.bonusFound.add(word);
  state.stats.bonus++;
  const mult = hitCombo();
  const coins = BONUS_COINS * mult;
  game.saved.earned += coins;
  state.jar++;
  sfx.bonus();
  haptic.good();
  const fromRects = [...preview.children].map((s) => s.getBoundingClientRect());
  const pRect = preview.getBoundingClientRect();
  previewResult('bonus', 250);
  floatText(mult > 1 ? `bônus +${coins}  x${mult}` : `bônus +${coins}`, pRect);
  gainCoins(coins, null);
  const jarRect = $('btnJar').getBoundingClientRect();
  const size = 26;
  const target = { left: jarRect.left + jarRect.width / 2 - size / 2, top: jarRect.top + jarRect.height / 2 - size / 2, width: size, height: size };
  flyLetters(fromRects, word.split('').map(() => target), { letters: word.split(''), gold: true, stagger: 40 }).then(() => {
    wiggleJar();
    renderJar();
    sparkles($('btnJar').getBoundingClientRect(), 7);
  });
  resetIdle();
  persist();
  if (!state.seenBonus) {
    state.seenBonus = true;
    toast('Palavra bônus! Ela vai para o pote 🫙', 3200);
  }
}

// Palavras completadas só com dicas também contam como encontradas (sem moedas)
function autoComplete() {
  for (const w of game.puzzle.words) {
    if (!game.found.has(w.w) && w.cells.every((k) => game.revealed.has(k))) {
      game.found.add(w.w);
      grid.flash(w.cells, 'flash', 40);
    }
  }
  persist();
}

function revealCell(key, { animateFrom } = {}) {
  if (game.revealed.has(key)) return;
  game.revealed.add(key);
  game.hinted.add(key);
  const rect = grid.rect(key);
  if (animateFrom && rect) petals(animateFrom, rect, 4);
  setTimeout(() => {
    grid.reveal(key, { hinted: true });
    sparkles(grid.rect(key), 4);
  }, animateFrom ? 380 : 0);
  resetIdle();
}

function unrevealed() {
  return [...game.puzzle.cells.keys()].filter((k) => !game.revealed.has(k));
}

function useHint(kind) {
  if (!game || game.done || game.busy) return;
  if (kind === 'target') {
    if (game.targeting) return cancelTargeting();
    if (!canAfford(PRICES.target)) return spend(PRICES.target);
    game.targeting = true;
    grid.setTargeting(true);
    $('hintTarget').classList.add('active');
    toast('Toque numa casa vazia para revelar 🎯', 2600);
    sfx.tap();
    return;
  }
  const free = unrevealed();
  if (!free.length) return;
  const price = PRICES[kind];
  if (!spend(price)) return;
  game.saved.hints++;
  const btnRect = $(kind === 'light' ? 'hintLight' : 'hintWind').getBoundingClientRect();
  sfx.hint();
  haptic.tick();
  const count = kind === 'wind' ? 5 : 1;
  const picks = pickCells(free, count);
  game.busy = true;
  picks.forEach((k, i) =>
    setTimeout(() => {
      revealCell(k, { animateFrom: btnRect });
      sfx.reveal(i);
    }, i * 160)
  );
  setTimeout(() => {
    game.busy = false;
    autoComplete();
    checkWin();
  }, picks.length * 160 + 500);
  persist();
}

// prefere casas espalhadas entre palavras ainda não encontradas
function pickCells(free, count) {
  const pool = [...free].sort(() => Math.random() - 0.5);
  const picks = [];
  const usedWords = new Set();
  for (const k of pool) {
    if (picks.length >= count) break;
    const w = game.puzzle.words.find((x) => !game.found.has(x.w) && x.cells.includes(k) && !usedWords.has(x.w));
    if (w) {
      usedWords.add(w.w);
      picks.push(k);
    }
  }
  for (const k of pool) {
    if (picks.length >= count) break;
    if (!picks.includes(k)) picks.push(k);
  }
  return picks;
}

function onCellTap(key) {
  if (!game?.targeting || game.revealed.has(key)) return;
  if (!spend(PRICES.target)) return cancelTargeting();
  game.saved.hints++;
  cancelTargeting();
  sfx.hint();
  haptic.tick();
  revealCell(key, { animateFrom: $('hintTarget').getBoundingClientRect() });
  persist();
  setTimeout(() => {
    autoComplete();
    checkWin();
  }, 600);
}

function cancelTargeting() {
  if (!game) return;
  game.targeting = false;
  grid.setTargeting(false);
  $('hintTarget').classList.remove('active');
}

// ---------------------------------------------------------------- pote de bônus
function renderJar() {
  const filled = Math.min(state.jar, JAR_GOAL);
  $('jarRing').style.strokeDashoffset = 100.5 * (1 - filled / JAR_GOAL);
  $('jarCount').textContent = state.jar >= JAR_GOAL ? '!' : state.jar;
  $('btnJar').classList.toggle('full', state.jar >= JAR_GOAL);
}
function wiggleJar() {
  const j = $('btnJar');
  j.classList.remove('wiggle');
  void j.offsetWidth;
  j.classList.add('wiggle');
}
function openJar() {
  sfx.tap();
  const full = state.jar >= JAR_GOAL;
  const words = game ? [...game.bonusFound].sort() : [];
  openModal(`
    <div class="modal-emoji">🫙</div>
    <h2>Pote de bônus</h2>
    <p>Palavras que existem, mas não estão na grade. A cada ${JAR_GOAL}, ganhe ${JAR_REWARD} moedas.</p>
    <div class="jar-meter"><i style="width:${(Math.min(state.jar, JAR_GOAL) / JAR_GOAL) * 100}%"></i></div>
    <p><b>${Math.min(state.jar, JAR_GOAL)} / ${JAR_GOAL}</b></p>
    ${words.length ? `<div class="bonus-list">${words.map((w) => `<span>${w}</span>`).join('')}</div>` : '<p class="quote">Nenhuma palavra bônus neste nível ainda.</p>'}
    ${full ? `<button class="btn primary" id="claimJar">Resgatar ${JAR_REWARD} moedas</button>` : ''}
    <button class="btn ${full ? 'ghost' : 'soft'}" id="closeJar">Fechar</button>
  `, {
    onOpen: (card) => {
      card.querySelector('#closeJar').onclick = closeModal;
      const claim = card.querySelector('#claimJar');
      if (claim) {
        claim.onclick = () => {
          const r = claim.getBoundingClientRect();
          state.jar -= JAR_GOAL;
          closeModal();
          sfx.jar();
          haptic.win();
          renderJar();
          gainCoins(JAR_REWARD, r, { flying: 10 });
        };
      }
    },
  });
}

// ---------------------------------------------------------------- vitória
const CHEERS = ['Que leveza!', 'Muito bem!', 'Lindo!', 'Mente tranquila!', 'Perfeito!', 'Que fluidez!', 'Sereno e certeiro!'];
const EMOJIS = ['🌸', '🍃', '🌿', '🪷', '🌙', '☁️', '🌼'];

function checkWin() {
  if (!game || game.done || game.found.size < game.puzzle.words.length) return;
  game.done = true;
  wheel.enabled = false;
  resetIdle();
  cancelTargeting();
  clearTimeout(comboTimer);
  hideCombo();
  win();
}

async function win() {
  const g = game;
  const keys = [...g.puzzle.cells.keys()].sort((a, b) => {
    const [r1, c1] = a.split(',').map(Number);
    const [r2, c2] = b.split(',').map(Number);
    return r1 + c1 - (r2 + c2);
  });
  await sleep(350);
  grid.flash(keys, 'wave', 28);
  sfx.win();
  haptic.win();
  confettiBurst();

  const rows = [];
  rows.push(['Palavras e combos', g.saved.earned]);
  let extra = 0;
  if (g.mode === 'level') {
    rows.push(['Nível concluído', LEVEL_COINS]);
    extra += LEVEL_COINS;
  }
  if (!g.saved.hints) {
    rows.push(['Sem dicas', NO_HINT_COINS]);
    extra += NO_HINT_COINS;
  }
  let nextChapter = null;
  let streakInfo = '';
  if (g.mode === 'daily') {
    const today = g.today;
    const d = state.daily;
    if (d.last !== today) {
      d.streak = d.last && daysBetween(d.last, today) === 1 ? d.streak + 1 : 1;
      d.last = today;
      d.best = Math.max(d.best, d.streak);
    }
    d.history[today] = 1;
    // guarda só os últimos ~60 dias
    for (const k of Object.keys(d.history)) if (daysBetween(k, today) > 60) delete d.history[k];
    state.stats.dailies++;
    rows.push(['Desafio do dia', DAILY_COINS]);
    extra += DAILY_COINS;
    const streakBonus = Math.min(d.streak, 7) * 10;
    if (d.streak > 1) {
      rows.push([`Sequência de ${d.streak} dias`, streakBonus]);
      extra += streakBonus;
    }
    streakInfo = `<p>🍃 ${d.streak} ${d.streak === 1 ? 'dia' : 'dias'} seguidos</p>`;
    state.progress.daily = null;
  } else {
    const before = chapterOf(state.level).index;
    state.level++;
    state.stats.levels++;
    state.progress.level = null;
    const after = chapterOf(state.level);
    if (after.index !== before) nextChapter = after;
  }
  state.coins += extra;
  save(state);

  const total = g.saved.earned + extra;
  rows.push(['Total', total]);
  const maxCombo = g.saved.maxCombo;
  const theme = g.mode === 'daily' ? DAILY_THEME : chapterOf(state.level - 1).theme;
  await sleep(1100);
  sfx.coin(0);
  openModal(`
    <div class="modal-emoji">${EMOJIS[Math.floor(Math.random() * EMOJIS.length)]}</div>
    <h2>${CHEERS[Math.floor(Math.random() * CHEERS.length)]}</h2>
    ${streakInfo}
    ${maxCombo >= 2 ? `<p>Maior combo: <b>x${Math.min(maxCombo, COMBO_MAX)}</b>${maxCombo > COMBO_MAX ? ` (${maxCombo} seguidas!)` : ''}</p>` : ''}
    <div class="rewards">
      ${rows.map(([label, v], i) => `<div class="reward-row${label === 'Total' ? ' total' : ''}" style="animation-delay:${i * 0.12}s"><span>${label}</span><b>+${v}<span class="coin-ico"></span></b></div>`).join('')}
    </div>
    ${theme.quote ? `<p class="quote">“${theme.quote}”</p>` : ''}
    <button class="btn primary" id="winNext">${g.mode === 'daily' ? 'Voltar ao início' : 'Próximo nível'}</button>
    ${g.mode === 'level' ? '<button class="btn ghost" id="winHome">Início</button>' : ''}
  `, {
    dismissable: false,
    onOpen: (card) => {
      const go = async (toHome) => {
        const r = card.querySelector('.reward-row.total')?.getBoundingClientRect();
        closeModal();
        if (extra > 0 && r) {
          const target = state.coins;
          await flyCoins(r, 8, 0, (i, n) => renderCoins(Math.round(shownCoins + (target - shownCoins) / (n - i))));
          renderCoins(state.coins);
        }
        renderCoins(state.coins);
        if (toHome || g.mode === 'daily') {
          game = null;
          renderHome();
          return;
        }
        startLevel();
        if (nextChapter) chapterSplash(nextChapter);
      };
      card.querySelector('#winNext').onclick = () => go(false);
      card.querySelector('#winHome')?.addEventListener('click', () => go(true));
    },
  });
}

function chapterSplash(ch) {
  return new Promise((resolve) => {
    applyTheme(ch.theme);
    const s = $('chapterSplash');
    $('splashName').textContent = ch.theme.name;
    $('splashQuote').textContent = ch.theme.quote;
    s.hidden = false;
    s.style.animation = 'none';
    void s.offsetWidth;
    s.style.animation = '';
    sfx.jar();
    setTimeout(() => {
      s.hidden = true;
      resolve();
    }, 3000);
  });
}

// ---------------------------------------------------------------- configurações
function openSettings() {
  sfx.tap();
  const st = state.stats;
  const sw = (id, on, label) => `<div class="setting-row"><span>${label}</span><button class="switch ${on ? 'on' : ''}" id="${id}" role="switch" aria-checked="${on}" aria-label="${label.replace(/<[^>]+>/g, ' ')}"></button></div>`;
  openModal(`
    <h2>Ajustes</h2>
    ${sw('swSound', state.sound, 'Efeitos sonoros')}
    ${sw('swMusic', state.music, 'Música ambiente')}
    ${sw('swHaptics', state.haptics, 'Vibração')}
    <div class="setting-row"><span>Tema</span>
      <div class="segmented" id="themeSeg">
        ${[['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Auto']].map(([v, l]) => `<button data-v="${v}" class="${(state.theme || 'light') === v ? 'on' : ''}">${l}</button>`).join('')}
      </div>
    </div>
    ${sw('swInfinite', !!state.infinite, 'Moedas infinitas<span class="test-tag">teste</span>')}
    <div class="stats">
      <div class="stat"><b>${st.levels}</b><small>Níveis</small></div>
      <div class="stat"><b>${st.words}</b><small>Palavras</small></div>
      <div class="stat"><b>${st.bonus}</b><small>Bônus</small></div>
      <div class="stat"><b>x${Math.min(st.bestCombo, COMBO_MAX)}</b><small>Melhor combo</small></div>
      <div class="stat"><b>${state.daily.best}</b><small>Maior sequência</small></div>
      <div class="stat"><b>${st.dailies}</b><small>Desafios</small></div>
    </div>
    <button class="btn soft" id="testHaptic">Testar vibração</button>
    <button class="btn soft" id="howTo">Como jogar</button>
    <button class="btn ghost" id="resetAll">Recomeçar do zero</button>
    <button class="btn primary" id="closeSettings" style="margin-top:8px">Pronto</button>
  `, {
    onOpen: (card) => {
      const toggle = (id, key, apply) => {
        const b = card.querySelector('#' + id);
        b.onclick = () => {
          state[key] = !state[key];
          b.classList.toggle('on', state[key]);
          b.setAttribute('aria-checked', state[key]);
          apply(state[key]);
          save(state);
          sfx.tap();
          if (key === 'haptics' && state[key]) haptic.tick();
        };
      };
      toggle('swSound', 'sound', setSfx);
      toggle('swMusic', 'music', setMusic);
      toggle('swHaptics', 'haptics', (on) => haptic.set(on));
      toggle('swInfinite', 'infinite', () => renderCoins(state.coins));
      card.querySelectorAll('#themeSeg button').forEach((b) => {
        b.onclick = () => {
          state.theme = b.dataset.v;
          card.querySelectorAll('#themeSeg button').forEach((x) => x.classList.toggle('on', x === b));
          setThemeMode(state.theme);
          save(state);
          sfx.tap();
        };
      });
      card.querySelector('#testHaptic').onclick = () => {
        if (!state.haptics) return toast('Ative a vibração primeiro');
        haptic.now([30, 60, 30]);
        if (typeof navigator.vibrate !== 'function') toast('No iPhone a vibração precisa do iOS 18 ou mais novo 📳', 3000);
      };
      card.querySelector('#closeSettings').onclick = closeModal;
      card.querySelector('#howTo').onclick = openHowTo;
      let armed = false;
      const rb = card.querySelector('#resetAll');
      rb.onclick = () => {
        if (!armed) {
          armed = true;
          rb.textContent = 'Toque de novo para confirmar';
          return;
        }
        state = reset();
        closeModal();
        renderHome();
        toast('Tudo novo, como uma manhã 🌅');
      };
    },
  });
}

function openHowTo() {
  openModal(`
    <h2>Como jogar</h2>
    <div class="rewards" style="text-align:left">
      <div class="reward-row" style="animation-delay:0s"><span>✍️ Deslize pelas letras da roda para formar palavras e preencher a grade.</span></div>
      <div class="reward-row" style="animation-delay:.08s"><span>⚡ Acerte rápido, uma atrás da outra, para fazer <b>combo</b>: x2, x3… até x5 nas moedas.</span></div>
      <div class="reward-row" style="animation-delay:.16s"><span>🫙 Palavras que existem, mas não estão na grade, vão para o <b>pote</b>. Encha para ganhar moedas.</span></div>
      <div class="reward-row" style="animation-delay:.24s"><span>💡 Luz revela 1 letra, 🎯 Alvo revela a casa que você escolher e 🌬️ Vento revela 5 letras.</span></div>
      <div class="reward-row" style="animation-delay:.32s"><span>🍃 Jogue o desafio do dia todo dia para manter sua sequência.</span></div>
    </div>
    <p class="quote">Os acentos não contam: “PÃO” vira PAO, “CAFÉ” vira CAFE.</p>
    <button class="btn primary" id="howOk">Entendi</button>
  `, { onOpen: (card) => (card.querySelector('#howOk').onclick = closeModal) });
}

// ---------------------------------------------------------------- eventos
function bind() {
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.modal-card, .bonus-list')) e.preventDefault();
  }, { passive: false });
  addEventListener('scroll', () => scrollY && scrollTo(0, 0));
  document.addEventListener('dblclick', (e) => e.preventDefault());

  $('btnPlay').onclick = () => { sfx.tap(); startLevel(); };
  $('btnDaily').onclick = () => { sfx.tap(); startDaily(); };
  $('btnSettings').onclick = openSettings;
  $('btnBack').onclick = () => {
    sfx.tap();
    cancelTargeting();
    if (game && !game.done) persist();
    game = null;
    resetIdle();
    renderHome();
  };
  $('btnShuffle').onclick = () => {
    const b = $('btnShuffle');
    b.classList.remove('spin');
    void b.offsetWidth;
    b.classList.add('spin');
    sfx.shuffle();
    haptic.tick();
    wheel.shuffle();
  };
  $('btnJar').onclick = openJar;
  $('hintLight').onclick = () => useHint('light');
  $('hintTarget').onclick = () => useHint('target');
  $('hintWind').onclick = () => useHint('wind');
  document.querySelectorAll('[data-price]').forEach((el) => (el.textContent = PRICES[el.dataset.price]));
}

// No app da Tela de Início do iPhone (barra de status translúcida) o iOS às vezes informa
// uma janela mais baixa que a tela, sobrando uma faixa embaixo. Aqui o jogo passa a ter a
// altura real da tela; fora do modo app, usa a janela normal.
function fitStandalone() {
  const root = document.documentElement;
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  let h = 0;
  if (standalone && innerHeight >= innerWidth) {
    const full = Math.max(screen.height, screen.width);
    const gap = full - innerHeight;
    if (gap > 0 && gap <= 80) h = full;
  }
  if (h) root.style.setProperty('--app-h', h + 'px');
  else root.style.removeProperty('--app-h');
  if (scrollY) scrollTo(0, 0);
}

async function boot() {
  fitStandalone();
  addEventListener('resize', fitStandalone);
  addEventListener('orientationchange', () => setTimeout(fitStandalone, 300));
  bind();
  applyTheme(chapterOf(state.level).theme, true);
  try {
    const res = await fetch('data/levels.json');
    DATA = await res.json();
  } catch (e) {
    $('loading').innerHTML = '<p style="font-weight:800;color:#fff;text-align:center;padding:24px">Não foi possível carregar os níveis.<br>Verifique sua conexão e abra de novo.</p>';
    return;
  }
  renderHome();
  ambientLoop();
  $('loading').classList.add('done');
  setTimeout(() => $('loading').remove(), 700);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();

// usado nos testes automatizados
window.__brisa = { get state() { return state; }, get game() { return game; }, CHAPTERS };
