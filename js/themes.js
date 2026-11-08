// Capítulos: cada um tem um nome, uma paleta e uma frase para respirar.
export const LEVELS_PER_CHAPTER = 24;

export const CHAPTERS = [
  { name: 'Amanhecer', c: ['#fbe0cf', '#f4b2a6', '#a596cf'], accent: '#e2707a', ink: '#4a3a5c', quote: 'Todo dia começa com uma respiração.' },
  { name: 'Orvalho', c: ['#dcf3ec', '#a3dacd', '#5fa8b5'], accent: '#2a8a8a', ink: '#1f4b52', quote: 'Pequenas gotas também fazem o rio.' },
  { name: 'Bambuzal', c: ['#e8f3d6', '#add39a', '#5d8f6d'], accent: '#4a8a4f', ink: '#27452e', quote: 'O bambu se curva, mas não se quebra.' },
  { name: 'Lago Sereno', c: ['#dcedf8', '#9fc8e4', '#5a86b8'], accent: '#3b6eb0', ink: '#22385c', quote: 'Águas calmas refletem o céu inteiro.' },
  { name: 'Campo de Lavanda', c: ['#efe6f8', '#c5b0e3', '#8a74b8'], accent: '#7a5bb5', ink: '#3b2d5a', quote: 'Devagar também se chega.' },
  { name: 'Cerejeiras', c: ['#fdeaf0', '#f4bfd2', '#c98bb0'], accent: '#d1609a', ink: '#5a2f48', quote: 'A beleza mora no que é breve.' },
  { name: 'Jardim de Pedras', c: ['#efece5', '#cbc4b6', '#8b8579'], accent: '#8a7656', ink: '#3d3830', quote: 'No silêncio, as ideias se arrumam.' },
  { name: 'Brisa do Mar', c: ['#e2f8f6', '#93d8da', '#3f8fa8'], accent: '#1d879e', ink: '#17414d', quote: 'Deixe a onda ir e vir.' },
  { name: 'Pôr do Sol', c: ['#ffe6bd', '#f5aa7f', '#b5667f'], accent: '#dc7448', ink: '#4f2a33', quote: 'Terminar bem também é uma arte.' },
  { name: 'Névoa da Montanha', c: ['#e8edf2', '#b7c3d1', '#6f7f99'], accent: '#56698f', ink: '#2b3445', quote: 'Um passo de cada vez, até o topo.' },
  { name: 'Lagoa de Lótus', c: ['#f5e8f2', '#e2bcd6', '#7fa89a'], accent: '#bf5f9c', ink: '#3b3244', quote: 'Até do barro nasce uma flor.' },
  { name: 'Céu Estrelado', c: ['#3a3f78', '#232856', '#10132f'], accent: '#e9b85a', ink: '#232856', dark: true, quote: 'Olhe para cima de vez em quando.' },
  { name: 'Floresta Antiga', c: ['#dbe8cf', '#86a981', '#3e5e4a'], accent: '#3f7a52', ink: '#22352a', quote: 'Raízes fundas, galhos tranquilos.' },
  { name: 'Dunas', c: ['#f9ead3', '#e8c79e', '#b88d6a'], accent: '#b5733f', ink: '#4a3424', quote: 'O vento desenha sem pressa.' },
  { name: 'Aurora', c: ['#cff3e6', '#94bdea', '#8a6fc4'], accent: '#5a7fd0', ink: '#2c2f5a', quote: 'Sempre há uma nova cor no céu.' },
  { name: 'Cachoeira', c: ['#e2f4f3', '#9dd3d6', '#4f8f9e'], accent: '#2f8494', ink: '#1d3f47', quote: 'Fluir é mais forte que forçar.' },
  { name: 'Chá da Tarde', c: ['#f7efde', '#dcc6a0', '#9c7a5b'], accent: '#a46d3f', ink: '#433023', quote: 'Uma pausa quentinha resolve muito.' },
  { name: 'Vale das Nuvens', c: ['#f2f6fb', '#ccd8ee', '#9aa7d1'], accent: '#6a78c0', ink: '#2e3460', quote: 'Leve como uma nuvem.' },
  { name: 'Vagalumes', c: ['#2c4a37', '#1a3326', '#0c1a14'], accent: '#d9d36a', ink: '#1a3326', dark: true, quote: 'Pequenas luzes iluminam a noite.' },
  { name: 'Neve Suave', c: ['#f6f9fc', '#dde7f0', '#aebfd3'], accent: '#5b86b3', ink: '#2a3a4f', quote: 'O mundo fica mais quieto quando neva.' },
  { name: 'Trilha de Musgo', c: ['#e7eed6', '#b8cc93', '#6f8a56'], accent: '#5f8a3e', ink: '#2c3a22', quote: 'Cada passo deixa o caminho mais macio.' },
  { name: 'Maré Calma', c: ['#d9f0f2', '#91c8d4', '#4a7fa6'], accent: '#2f78a6', ink: '#1c3550', quote: 'Tudo volta no seu tempo.' },
  { name: 'Ilha Distante', c: ['#fff3da', '#a2ded2', '#3d9bb0'], accent: '#e08a4a', ink: '#1d4650', quote: 'Às vezes, longe é o lugar certo.' },
  { name: 'Lua Nova', c: ['#45407a', '#2a2652', '#15122e'], accent: '#c9a6f0', ink: '#2a2652', dark: true, quote: 'Recomeçar também é brilhar.' },
  { name: 'Horizonte', c: ['#fde4d2', '#cab8e3', '#6c8fc7'], accent: '#6a7fd0', ink: '#2e3260', quote: 'Sempre existe um pouco mais além.' },
];

export const DAILY_THEME = { name: 'Desafio do dia', c: ['#fff1d8', '#f7c9a0', '#c47fa0'], accent: '#d9774f', ink: '#4f2a3a', quote: '' };

export function chapterOf(level) {
  const idx = Math.floor((level - 1) / LEVELS_PER_CHAPTER);
  return { index: idx, theme: CHAPTERS[idx % CHAPTERS.length], number: idx + 1 };
}

let activeLayer = 'A';
let currentKey = '';

export function applyTheme(theme, instant = false) {
  const key = theme.name;
  if (key === currentKey) return;
  currentKey = key;
  const root = document.documentElement;
  root.style.setProperty('--bg1', theme.c[0]);
  root.style.setProperty('--bg2', theme.c[1]);
  root.style.setProperty('--bg3', theme.c[2]);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--ink', theme.ink);
  root.style.setProperty('--text', theme.dark ? '#f4f1ff' : theme.ink);
  root.dataset.dark = theme.dark ? '1' : '0';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme.c[0];

  const grad = `radial-gradient(120% 70% at 80% 0%, rgba(255,255,255,.35), transparent 60%),
    linear-gradient(180deg, ${theme.c[0]} 0%, ${theme.c[1]} 55%, ${theme.c[2]} 100%)`;
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
