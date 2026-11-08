// Grade de palavras cruzadas: desenha as casas e revela letras com animação.

export class Grid {
  constructor(wrap, el, { onCellTap }) {
    this.wrap = wrap;
    this.el = el;
    this.onCellTap = onCellTap;
    this.cells = new Map(); // "r,c" -> elemento
    this.puzzle = null;
    el.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (cell) this.onCellTap?.(cell.dataset.key);
    });
    new ResizeObserver(() => this.layout()).observe(wrap);
  }

  render(puzzle, revealed) {
    this.puzzle = puzzle;
    this.el.innerHTML = '';
    this.cells.clear();
    for (const [key, ch] of puzzle.cells) {
      const d = document.createElement('div');
      d.className = 'cell';
      d.dataset.key = key;
      const s = document.createElement('span');
      s.textContent = ch;
      d.appendChild(s);
      if (revealed.has(key)) d.classList.add('on');
      this.el.appendChild(d);
      this.cells.set(key, d);
    }
    this.layout();
  }

  layout() {
    const p = this.puzzle;
    if (!p) return;
    const W = this.wrap.clientWidth;
    const H = this.wrap.clientHeight - 14;
    const gap = 0.1;
    const size = Math.max(16, Math.min(W / (p.cols + (p.cols - 1) * gap), H / (p.rows + (p.rows - 1) * gap), 64));
    const step = size * (1 + gap);
    this.size = size;
    this.el.style.width = (p.cols * step - size * gap) + 'px';
    this.el.style.height = (p.rows * step - size * gap) + 'px';
    for (const [key, d] of this.cells) {
      const [r, c] = key.split(',').map(Number);
      d.style.left = c * step + 'px';
      d.style.top = r * step + 'px';
      d.style.width = d.style.height = size + 'px';
      d.style.fontSize = size * 0.6 + 'px';
    }
  }

  reveal(key, { pop = true, hinted = false } = {}) {
    const d = this.cells.get(key);
    if (!d) return;
    d.classList.add('on');
    if (hinted) d.classList.add('hinted');
    if (pop) {
      d.classList.remove('pop');
      void d.offsetWidth;
      d.classList.add('pop');
    }
  }

  flash(keys, cls = 'flash', stagger = 50) {
    keys.forEach((k, i) => {
      const d = this.cells.get(k);
      if (!d) return;
      setTimeout(() => {
        d.classList.remove(cls);
        void d.offsetWidth;
        d.classList.add(cls);
        setTimeout(() => d.classList.remove(cls), 900);
      }, i * stagger);
    });
  }

  rect(key) {
    return this.cells.get(key)?.getBoundingClientRect();
  }

  setTargeting(on) {
    this.el.classList.toggle('targeting', on);
  }
}
