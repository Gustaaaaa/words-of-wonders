// Capítulos: cada um é uma paisagem (céu + 3 camadas de colinas + sol/lua),
// com cor de destaque e uma frase para respirar.
export const LEVELS_PER_CHAPTER = 24;

// sky: [topo, horizonte] · hills: [longe, meio, perto] · sun: cor do sol/lua
const C = (name, sky, hills, accent, ink, sun, quote, dark = false) => ({ name, sky, hills, accent, ink, sun, quote, dark });

export const CHAPTERS = [
  C('Amanhecer', ['#FFF6EC', '#FFDCCB'], ['#FBC4B4', '#F4A29A', '#E4818C'], '#F25F7A', '#3B2A45', '#FFE3A3', 'Todo dia começa com uma respiração.'),
  C('Orvalho', ['#EFFCF7', '#C9F1E4'], ['#A6E3D1', '#76CDB8', '#46B19D'], '#14A389', '#183D3A', '#FFFFFF', 'Pequenas gotas também fazem o rio.'),
  C('Bambuzal', ['#F4FCEB', '#D9F2C4'], ['#BCE3A0', '#8DCB7A', '#5EAE5E'], '#3C9A4E', '#1F3A24', '#FFF6C4', 'O bambu se curva, mas não se quebra.'),
  C('Lago Sereno', ['#F0F8FF', '#D3E8FF'], ['#AFD1F7', '#80B2EC', '#5390DC'], '#2F7BEA', '#1B2B4D', '#FFFFFF', 'Águas calmas refletem o céu inteiro.'),
  C('Campo de Lavanda', ['#F8F3FF', '#E6DAFF'], ['#CDBBF7', '#AC95EA', '#8A6DD4'], '#7B52E0', '#2B2150', '#FFE9F4', 'Devagar também se chega.'),
  C('Cerejeiras', ['#FFF4F8', '#FFDAE7'], ['#FBBCD2', '#F396B8', '#E3709D'], '#E64C8C', '#45213A', '#FFFFFF', 'A beleza mora no que é breve.'),
  C('Jardim de Pedras', ['#FAF8F2', '#ECE6D8'], ['#D7CEBB', '#BBAF95', '#978A6E'], '#B6862F', '#342F28', '#FFF3D1', 'No silêncio, as ideias se arrumam.'),
  C('Brisa do Mar', ['#EFFDFF', '#CDF4F8'], ['#9BE3EC', '#63C9D9', '#2EA9C0'], '#0B98B6', '#103844', '#FFF8D6', 'Deixe a onda ir e vir.'),
  C('Pôr do Sol', ['#FFF3DD', '#FFD4AA'], ['#FFB585', '#F78E6B', '#DD6B70'], '#F26B3A', '#43222A', '#FFE08A', 'Terminar bem também é uma arte.'),
  C('Névoa da Montanha', ['#F4F7FA', '#DEE5EE'], ['#C3CEDC', '#A1B1C6', '#7D90AB'], '#4C6CA8', '#232E44', '#FFFFFF', 'Um passo de cada vez, até o topo.'),
  C('Lagoa de Lótus', ['#FDF3FB', '#F4DCF0'], ['#E9BEE0', '#D29ACB', '#B477B4'], '#C2479B', '#3C2440', '#FFFFFF', 'Até do barro nasce uma flor.'),
  C('Céu Estrelado', ['#2A2F6B', '#141737'], ['#2C3274', '#21265C', '#171A45'], '#F5C062', '#141737', '#FFF4D6', 'Olhe para cima de vez em quando.', true),
  C('Floresta Antiga', ['#F1F8EC', '#D3EACB'], ['#A9D1A0', '#76B07A', '#4B8A5C'], '#2F8A57', '#1B3324', '#FFF6C4', 'Raízes fundas, galhos tranquilos.'),
  C('Dunas', ['#FFF8EC', '#FBE6C8'], ['#F3CF9E', '#E6B27A', '#CC8F5A'], '#D27A2C', '#45301F', '#FFF0B8', 'O vento desenha sem pressa.'),
  C('Aurora', ['#EDFBF6', '#D8E6FF'], ['#B7D9F4', '#9DB4EE', '#8C8FE0'], '#5A6FE0', '#232A5A', '#FFFFFF', 'Sempre há uma nova cor no céu.'),
  C('Cachoeira', ['#EFFAFA', '#CFEFEF'], ['#A3DBDD', '#72C0C6', '#46A0AD'], '#178E9E', '#143A42', '#FFFFFF', 'Fluir é mais forte que forçar.'),
  C('Chá da Tarde', ['#FCF6EA', '#F1E2C6'], ['#E2C79C', '#CFA877', '#B28457'], '#B9713A', '#3E2C1E', '#FFE8B0', 'Uma pausa quentinha resolve muito.'),
  C('Vale das Nuvens', ['#F7FAFF', '#E2EAFB'], ['#C9D6F3', '#AEBDEA', '#929FDC'], '#5E6FD8', '#262C58', '#FFFFFF', 'Leve como uma nuvem.'),
  C('Vagalumes', ['#1F3B2E', '#0E1D16'], ['#23402F', '#193126', '#10231A'], '#E6DF70', '#0E1D16', '#F8F3C0', 'Pequenas luzes iluminam a noite.', true),
  C('Neve Suave', ['#FBFDFF', '#E8F0F8'], ['#D6E2EE', '#BCCDE0', '#9EB4CD'], '#4F86C4', '#26364A', '#FFFFFF', 'O mundo fica mais quieto quando neva.'),
  C('Trilha de Musgo', ['#F6FAEC', '#E1EDC6'], ['#C5DA9A', '#A2C274', '#7DA354'], '#5E9631', '#28351C', '#FFF6C4', 'Cada passo deixa o caminho mais macio.'),
  C('Maré Calma', ['#F0F9FD', '#D2ECF6'], ['#A7D6EA', '#78B9D8', '#4E97C2'], '#2479B8', '#163049', '#FFFFFF', 'Tudo volta no seu tempo.'),
  C('Ilha Distante', ['#FFF8E6', '#D8F4EE'], ['#A8E2D4', '#6BC8BA', '#36A59F'], '#F07D3A', '#173F45', '#FFE6A0', 'Às vezes, longe é o lugar certo.'),
  C('Lua Nova', ['#3A3270', '#16122F'], ['#3B3373', '#2A2459', '#1B1740'], '#CBA6F7', '#16122F', '#F1E9FF', 'Recomeçar também é brilhar.', true),
  C('Horizonte', ['#FFF4EC', '#E4DCFA'], ['#D2C6F2', '#B1A8E6', '#8D8AD6'], '#6E66DB', '#2A2858', '#FFE1C2', 'Sempre existe um pouco mais além.'),
];

export const DAILY_THEME = C('Desafio do dia', ['#FFF6E5', '#FFE0C2'], ['#FFC79E', '#F7A27E', '#E38073'], '#EF6A4C', '#45262B', '#FFE59A', '');

export function chapterOf(level) {
  const idx = Math.floor((level - 1) / LEVELS_PER_CHAPTER);
  return { index: idx, theme: CHAPTERS[idx % CHAPTERS.length], number: idx + 1 };
}

// ---------------------------------------------------------------- cores
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function hex([r, g, b]) {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return hex(A.map((v, i) => Math.round(v + (B[i] - v) * t)));
}
function luminance(h) {
  const [r, g, b] = rgb(h).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------- aplicar
let activeLayer = 'A';
let currentKey = '';
let lastTheme = null;
let mode = 'light'; // 'light' | 'dark' | 'auto'
const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

function isBlack() {
  return mode === 'dark' || (mode === 'auto' && !!darkQuery?.matches);
}

/** Muda entre tema claro (paisagem do capítulo), escuro (noite) ou automático. */
export function setThemeMode(m) {
  mode = m;
  if (lastTheme) {
    currentKey = '';
    applyTheme(lastTheme, true);
  }
}
darkQuery?.addEventListener?.('change', () => mode === 'auto' && setThemeMode('auto'));

export function applyTheme(theme, instant = false) {
  lastTheme = theme;
  const black = isBlack();
  const key = theme.name + (black ? ':black' : '');
  if (key === currentKey) return;
  currentKey = key;
  const root = document.documentElement;
  const dark = black || theme.dark;

  // No tema escuro a paisagem vira noite: céu quase preto e colinas com um toque do destaque
  const accent = black && !theme.dark ? mix(theme.accent, '#ffffff', 0.18) : theme.accent;
  const sky = black && !theme.dark ? ['#15151d', '#0b0b10'] : theme.sky;
  const hills = black && !theme.dark
    ? [mix('#1a1a24', theme.accent, 0.16), mix('#14141c', theme.accent, 0.12), mix('#0e0e14', theme.accent, 0.09)]
    : theme.hills;
  const ink = theme.ink;
  const cellInk = luminance(accent) > 0.45 ? ink : '#ffffff';

  const set = (k, v) => root.style.setProperty(k, v);
  set('--sky1', sky[0]);
  set('--sky2', sky[1]);
  set('--far', hills[0]);
  set('--mid', hills[1]);
  set('--near', hills[2]);
  set('--bg3', hills[2]);
  set('--sun', dark ? '#f3efff' : theme.sun);
  set('--accent', accent);
  set('--accent-soft', mix(accent, '#ffffff', 0.25));
  set('--ink', ink);
  set('--cell-ink', cellInk);
  set('--text', dark ? '#f4f1ff' : ink);
  root.dataset.dark = dark ? '1' : '0';
  root.dataset.black = black ? '1' : '0';
  root.style.background = hills[2];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = sky[0];

  const grad = `radial-gradient(80% 45% at 78% 12%, ${dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.7)'}, transparent 70%),
    linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 70%, ${hills[0]} 100%)`;
  const a = document.getElementById('bgA');
  const b = document.getElementById('bgB');
  if (instant) {
    a.style.background = grad;
    a.style.opacity = 1;
    b.style.opacity = 0;
    activeLayer = 'A';
    return;
  }
  const [show, hide] = activeLayer === 'A' ? [b, a] : [a, b];
  show.style.background = grad;
  show.style.opacity = 1;
  hide.style.opacity = 0;
  activeLayer = activeLayer === 'A' ? 'B' : 'A';
}
