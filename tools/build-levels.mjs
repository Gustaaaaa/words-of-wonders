#!/usr/bin/env node
// Gera os níveis do jogo (data/levels.json) a partir de:
//  - dicionário Hunspell pt-BR (VERO, pacote npm "dictionary-pt") → valida palavras
//  - lista de frequência pt-BR (hermitdave/FrequencyWords) → escolhe palavras comuns
//
// Uso: node tools/build-levels.mjs <dir-com-index.dic-e-index.aff> <pt_br_50k.txt>
// (veja "npm run levels" no package.json, que baixa tudo automaticamente)
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandHunspell } from './hunspell-expand.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [dictDir, freqPath] = process.argv.slice(2);
if (!dictDir || !freqPath) {
  console.error('uso: node tools/build-levels.mjs <dictionary-pt dir> <pt_br_50k.txt>');
  process.exit(1);
}

// ---------------------------------------------------------------- utilidades
let seed = 20261108;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (w) => w.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const keyOf = (w) => [...w].sort().join('');

// Palavras que nunca devem aparecer (nem na grade, nem como bônus).
const BLOCK_EXACT = new Set(`
porra merda merdas caralho caralhos puta putas puto putos putaria foda fodas foder fode fodeu fodido fodida
cu cus buceta bucetas xoxota xota piroca pica picas rola rolas cacete bosta bostas viado viados bicha bichas
tesao transar transa gozar gozo gozou punheta boquete vagabunda vadia vadias safada safado corno cornos cuzao
otario otaria retardado retardada estupro estuprar estupra nazista nazi anal anus penis vagina vaginas
pinto pintos peitos bunda bundas xereca grelo pentelho pentelhos rapariga meretriz prostituta prostituto
`.trim().split(/\s+/));
const BLOCK_PREFIX = ['fod', 'putaria', 'caralh', 'bucet', 'punhet', 'merd', 'cuza', 'estupr', 'masturb', 'porn', 'xoxot'];
// Palavras aceitas como bônus, mas que não combinam com um jogo relaxante na grade.
const AVOID_GRID = new Set(`
sexo sexos sexual drogas droga cocaina heroina maconha crack matar matou morte mortes morto morta mortos mortas
suicidio arma armas sangue cadaver demonio diabo inferno odio guerra bomba bombas assassino assassina crime
`.trim().split(/\s+/));
const blocked = (w) => BLOCK_EXACT.has(w) || BLOCK_PREFIX.some((p) => w.startsWith(p));

// Palavras válidas, mas estranhas demais para a grade (nomes, estrangeirismos, siglas...).
const NOT_GRID = new Set(`
von boo dana mari angus aires are ape opa ops oks
abe abi abu ade adi age agi ahn aja ajo ali alo ana ava chi cia cre csi dai dao der dum ena eta etc eva eve evo
fan far gia gim goa gra han hei ice ima isa jan jar lao lia lie mai mia min moi net noe non ori oro out pat per
pie pop pro psi quo rue set soo sor sta tai tao tau too top una uni uno van aids amir baco bali beto blog brie
caim cali cape cate chat choi cris dali didi diet dino dora eden gage game gate gone gore hari here hola homo
isla jana java joao lala lana lane lena lila lina live luca luis lula luna made maia manu mara mile milo mine
nero nina nine noir olga oque otis paul pete pier pine rafa rafe rana rani reba rice ride rita sage sara sari
sire sora soul spam tate tava tita tori tona zone adama adele anita berta bruno cairo cesar chico clive delia
drago edipo erica irina jeova jonas laura leila lucas maria maris marta maura moira olive paula pedro petra
rambo romeu signe simao sinai tesla trade verne modus drive flash sudao congo paris belem graal orgia semen
fezes urina utero veado teta tetas mouse chile guine israel macau mali ruanda sofia cesare enrico
golias iolaus madonna matilda molina monica nestor ramona raquel renato rosita palace single resort slogan viagra
pascal castro marino peidar mijando obsceno racismo sadico cremado baleada raptada raptou mister demente
`.trim().split(/\s+/));

// ---------------------------------------------------------------- dicionário
console.time('dicionário');
const dict = new Set();
const exactGood = new Set(); // formas acentuadas exatas vindas de radicais "bons" (para a grade)
const proper = new Set(); // nomes próprios (radicais com inicial maiúscula), normalizados
expandHunspell(join(dictDir, 'index.dic'), join(dictDir, 'index.aff'), (w, meta) => {
  if (w === meta.stem && /^\p{Lu}/u.test(w)) proper.add(norm(w));
  if (!/^[a-záàâãéêíóôõúüç]+$/.test(w)) return; // sem nomes próprios, siglas, hífens
  if (!meta.noSuggest) exactGood.add(w);
  const n = norm(w);
  if (n.length >= 3 && n.length <= 8 && !blocked(n)) dict.add(n);
});
console.timeEnd('dicionário');
console.log('palavras válidas:', dict.size);

const lowerStems = new Set(
  readFileSync(join(dictDir, 'index.dic'), 'utf8').split(/\r?\n/).slice(1)
    .map((l) => l.split('/')[0]).filter((s) => /^[a-záàâãéêíóôõúüç]+$/.test(s)).map(norm)
);

const dictByKey = new Map();
for (const w of dict) {
  const k = keyOf(w);
  if (!dictByKey.has(k)) dictByKey.set(k, []);
  dictByKey.get(k).push(w);
}

// ---------------------------------------------------------------- frequência
const rank = new Map();
{
  let r = 0;
  for (const line of readFileSync(freqPath, 'utf8').split(/\r?\n/)) {
    const [raw] = line.split(' ');
    if (!raw) continue;
    r++;
    const w = norm(raw);
    if (!/^[a-z]+$/.test(w) || w.length < 3 || w.length > 8) continue;
    if (!dict.has(w) || blocked(w) || AVOID_GRID.has(w) || NOT_GRID.has(w)) continue;
    if (!exactGood.has(raw.toLowerCase())) continue; // grafia exata precisa existir no dicionário
    if (proper.has(w) && !lowerStems.has(w)) continue; // "ana", "paulo"...
    if (!rank.has(w)) rank.set(w, r);
  }
}
console.log('palavras comuns:', rank.size);

const commonByKey = new Map();
for (const [w] of rank) {
  const k = keyOf(w);
  if (!commonByKey.has(k)) commonByKey.set(k, []);
  commonByKey.get(k).push(w);
}

// Todas as sub-chaves (submulticonjuntos) de tamanho >= 3 de uma chave ordenada.
function subKeys(key) {
  const out = new Set();
  const n = key.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    let s = '';
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s += key[i];
    if (s.length >= 3) out.add(s);
  }
  return out;
}

// ---------------------------------------------------------------- palavras cruzadas
const MAX_COLS = 11;
const MAX_ROWS = 10;

function tryLayout(words) {
  const cells = new Map(); // "r,c" -> {ch, h:bool, v:bool}
  const placed = [];
  const get = (r, c) => cells.get(r + ',' + c);

  function canPlace(w, r, c, dir) {
    const dr = dir === 'v' ? 1 : 0, dc = dir === 'h' ? 1 : 0;
    // extremidades livres
    if (get(r - dr, c - dc) || get(r + dr * w.length, c + dc * w.length)) return -1;
    let crosses = 0;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      const cell = get(rr, cc);
      if (cell) {
        if (cell.ch !== w[i] || cell[dir]) return -1;
        crosses++;
      } else {
        // vizinhos perpendiculares precisam estar vazios
        if (dir === 'h' && (get(rr - 1, cc) || get(rr + 1, cc))) return -1;
        if (dir === 'v' && (get(rr, cc - 1) || get(rr, cc + 1))) return -1;
      }
    }
    return crosses;
  }
  function bounds(extra) {
    let r0 = Infinity, r1 = -Infinity, c0 = Infinity, c1 = -Infinity;
    const add = (r, c) => { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); };
    for (const k of cells.keys()) { const [r, c] = k.split(',').map(Number); add(r, c); }
    if (extra) {
      const { w, r, c, dir } = extra;
      add(r, c);
      add(r + (dir === 'v' ? w.length - 1 : 0), c + (dir === 'h' ? w.length - 1 : 0));
    }
    return { r0, r1, c0, c1, rows: r1 - r0 + 1, cols: c1 - c0 + 1 };
  }
  function place(w, r, c, dir) {
    const dr = dir === 'v' ? 1 : 0, dc = dir === 'h' ? 1 : 0;
    for (let i = 0; i < w.length; i++) {
      const k = (r + dr * i) + ',' + (c + dc * i);
      const cell = cells.get(k) || { ch: w[i], h: false, v: false };
      cell[dir] = true;
      cells.set(k, cell);
    }
    placed.push({ w, r, c, dir });
  }

  place(words[0], 0, 0, rand() < 0.5 ? 'h' : 'v');
  for (const w of words.slice(1)) {
    let best = null;
    for (const p of placed) {
      for (let i = 0; i < p.w.length; i++) {
        for (let j = 0; j < w.length; j++) {
          if (p.w[i] !== w[j]) continue;
          const dir = p.dir === 'h' ? 'v' : 'h';
          const r = p.dir === 'h' ? p.r - j : p.r + i;
          const c = p.dir === 'h' ? p.c + i : p.c - j;
          const crosses = canPlace(w, r, c, dir);
          if (crosses < 1) continue;
          const b = bounds({ w, r, c, dir });
          if (b.cols > MAX_COLS || b.rows > MAX_ROWS) continue;
          // compacto, com cara de "retrato" de celular, e com mais cruzamentos
          const score = crosses * 30 - b.rows * b.cols - Math.abs(b.cols - b.rows * 1.05) * 3 + rand() * 4;
          if (!best || score > best.score) best = { r, c, dir, score };
        }
      }
    }
    if (best) place(w, best.r, best.c, best.dir);
  }
  const b = bounds();
  return {
    words: placed.map((p) => ({ ...p, r: p.r - b.r0, c: p.c - b.c0 })),
    rows: b.rows,
    cols: b.cols,
  };
}

function layoutFor(base, candidates, target, minWords) {
  let best = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    // a palavra-base sempre entra; as demais em ordem aleatória ponderada por tamanho
    const others = shuffle(candidates.filter((w) => w !== base))
      .sort((a, b) => b.length - a.length + (rand() - 0.5) * 2.2);
    const lay = tryLayout([base, ...others]);
    if (lay.words.length > target) {
      // corta o excesso mantendo conectividade: refaz só com as N primeiras colocadas
      const keep = lay.words.slice(0, target).map((p) => p.w);
      const again = tryLayout(keep);
      if (again.words.length === target) Object.assign(lay, again);
      else continue;
    }
    if (lay.words.length < minWords) continue;
    const crosses = lay.words.reduce((s, p) => s + p.w.length, 0);
    const score = lay.words.length * 100 + crosses * 2 - lay.rows * lay.cols - Math.abs(lay.cols - lay.rows) * 4;
    if (!best || score > best.score) best = { ...lay, score };
  }
  return best;
}

// ---------------------------------------------------------------- níveis
// Curva de dificuldade: [até o nível, letras, mín palavras, alvo, rank máx da base, rank máx das palavras]
const CURVE = [
  [6, 4, 3, 4, 2500, 6000],
  [15, 4, 3, 5, 4000, 9000],
  [35, 5, 4, 5, 5000, 11000],
  [70, 5, 5, 6, 7000, 14000],
  [120, 6, 5, 7, 8000, 16000],
  [200, 6, 6, 8, 11000, 20000],
  [300, 7, 6, 8, 13000, 22000],
  [420, 7, 7, 9, 16000, 25000],
  [600, 7, 7, 10, 20000, 30000],
];
const TOTAL_LEVELS = 600;
const DAILY_COUNT = 400;

const usedKeys = new Set();
const usedBases = new Set();

function makeLevel(nLetters, minWords, target, baseRank, wordRank) {
  const bases = shuffle(
    [...rank.entries()].filter(([w, r]) => w.length === nLetters && r <= baseRank && !usedKeys.has(keyOf(w)))
  );
  for (const [base] of bases) {
    const key = keyOf(base);
    const subs = subKeys(key);
    const candidates = [];
    const all = new Set();
    for (const s of subs) {
      for (const w of commonByKey.get(s) || []) if (rank.get(w) <= wordRank) candidates.push(w);
      for (const w of dictByKey.get(s) || []) all.add(w);
    }
    if (candidates.length < minWords) continue;
    // evita grades dominadas por palavras de 3 letras
    const long = candidates.filter((w) => w.length >= 4).length;
    if (long < Math.ceil(minWords / 2)) continue;
    const lay = layoutFor(base, candidates, target, minWords);
    if (!lay) continue;
    usedKeys.add(key);
    usedBases.add(base);
    const gridWords = new Set(lay.words.map((p) => p.w));
    const bonus = [...all].filter((w) => !gridWords.has(w)).sort();
    return {
      letters: base.toUpperCase(),
      rows: lay.rows,
      cols: lay.cols,
      words: lay.words.map((p) => [p.w.toUpperCase(), p.r, p.c, p.dir]),
      bonus: bonus.join(' ').toUpperCase(),
    };
  }
  throw new Error(`sem base para ${nLetters} letras`);
}

console.time('níveis');
const levels = [];
for (let i = 1; i <= TOTAL_LEVELS; i++) {
  const [, n, min, target, br, wr] = CURVE.find((c) => i <= c[0]);
  levels.push(makeLevel(n, min, target, br, wr));
  if (i % 100 === 0) console.log('  nível', i);
}
const daily = [];
for (let i = 0; i < DAILY_COUNT; i++) {
  daily.push(makeLevel(6, 6, 8, 16000, 24000));
}
console.timeEnd('níveis');

const out = { version: 1, levels, daily };
const json = JSON.stringify(out);
writeFileSync(join(ROOT, 'data', 'levels.json'), json);
console.log(`ok: ${levels.length} níveis + ${daily.length} diários → data/levels.json (${(json.length / 1024).toFixed(0)} KB)`);

if (process.env.DEBUG_WORDS) {
  const used = new Set();
  for (const L of [...levels, ...daily]) for (const [w] of L.words) used.add(w.toLowerCase());
  console.log('na grade e também nome próprio:', [...used].filter((w) => proper.has(w)).sort().join(' '));
  console.log('6+ letras com rank > 12000:', [...used].filter((w) => w.length >= 6 && rank.get(w) > 12000).sort().join(' '));
}
