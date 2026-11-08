// Roda de letras: arraste o dedo pelas letras para formar uma palavra.
// Voltar para a letra anterior desfaz a última escolha.

export class Wheel {
  constructor(el, { onChange, onSubmit, onAdd, onRemove }) {
    this.el = el;
    this.svg = el.querySelector('.wheel-lines');
    this.line = el.querySelector('polyline');
    this.onChange = onChange;
    this.onSubmit = onSubmit;
    this.onAdd = onAdd;
    this.onRemove = onRemove;
    this.letters = [];
    this.nodes = [];
    this.order = []; // order[slot] = índice da letra naquele lugar
    this.sel = [];
    this.pointerId = null;
    this.pointer = null;
    this.enabled = true;

    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.up(e));
    // evita rolagem/zoom no iOS durante o gesto
    el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    new ResizeObserver(() => this.layout()).observe(el);
  }

  setLetters(letters) {
    this.nodes.forEach((n) => n.remove());
    this.letters = letters;
    this.order = letters.map((_, i) => i);
    this.nodes = letters.map((ch) => {
      const d = document.createElement('div');
      d.className = 'wl';
      d.textContent = ch;
      d.style.transition = 'none';
      this.el.appendChild(d);
      return d;
    });
    this.sel = [];
    this.layout();
    requestAnimationFrame(() => this.nodes.forEach((n) => (n.style.transition = '')));
  }

  layout() {
    const size = this.el.clientWidth;
    if (!size) return;
    const n = this.letters.length;
    const R = size * (n <= 4 ? 0.3 : n <= 6 ? 0.33 : n === 7 ? 0.345 : 0.355);
    const d = size * (n <= 4 ? 0.25 : n <= 5 ? 0.23 : n <= 6 ? 0.21 : n === 7 ? 0.19 : 0.175);
    this.radius = d / 2;
    this.centers = [];
    this.order.forEach((li, slot) => {
      const a = -Math.PI / 2 + (slot / n) * Math.PI * 2;
      const x = size / 2 + Math.cos(a) * R;
      const y = size / 2 + Math.sin(a) * R;
      this.centers[li] = { x, y };
      const node = this.nodes[li];
      node.style.left = x + 'px';
      node.style.top = y + 'px';
      node.style.width = node.style.height = d + 'px';
      node.style.fontSize = d * 0.56 + 'px';
    });
    this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    this.line.style.strokeWidth = Math.max(8, d * 0.16) + 'px';
    this.draw();
  }

  shuffle() {
    const n = this.order.length;
    if (n < 2) return;
    let next;
    do {
      next = [...this.order];
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
    } while (next.every((v, i) => v === this.order[i]));
    this.order = next;
    this.layout();
  }

  local(e) {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  hit(p, generous = 1) {
    let best = -1;
    let bestD = Infinity;
    this.centers.forEach((c, i) => {
      const dist = Math.hypot(c.x - p.x, c.y - p.y);
      if (dist < this.radius * generous && dist < bestD) {
        best = i;
        bestD = dist;
      }
    });
    return best;
  }

  down(e) {
    if (!this.enabled || this.pointerId !== null) return;
    const p = this.local(e);
    const i = this.hit(p, 1.15);
    if (i < 0) return;
    this.ripple(this.centers[i]);
    this.pointerId = e.pointerId;
    try { this.el.setPointerCapture(e.pointerId); } catch {}
    this.sel = [];
    this.add(i);
    this.pointer = p;
    this.draw();
  }

  move(e) {
    if (e.pointerId !== this.pointerId) return;
    const p = this.local(e);
    this.pointer = p;
    const i = this.hit(p, 0.9);
    if (i >= 0) {
      const prev = this.sel[this.sel.length - 2];
      if (i === prev) this.remove();
      else if (!this.sel.includes(i)) this.add(i);
    }
    this.draw();
  }

  up(e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.pointer = null;
    const word = this.word();
    this.sel.forEach((i) => this.nodes[i].classList.remove('sel'));
    this.sel = [];
    this.draw();
    this.onSubmit?.(word);
  }

  add(i) {
    this.sel.push(i);
    this.nodes[i].classList.add('sel');
    this.onAdd?.(this.sel.length - 1);
    this.onChange?.(this.word());
  }

  remove() {
    const i = this.sel.pop();
    this.nodes[i].classList.remove('sel');
    this.onRemove?.(this.sel.length);
    this.onChange?.(this.word());
  }

  ripple(p) {
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = p.x + 'px';
    r.style.top = p.y + 'px';
    this.el.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }

  /** Todas as letras dão um pulinho (palavra certa). */
  hop() {
    this.order.forEach((li, slot) => {
      const n = this.nodes[li];
      n.classList.remove('hop');
      void n.offsetWidth;
      n.style.setProperty('--d', slot * 0.04 + 's');
      n.classList.add('hop');
      setTimeout(() => n.classList.remove('hop'), 800);
    });
  }

  /** A roda balança (palavra que não existe). */
  no() {
    this.el.classList.remove('no');
    void this.el.offsetWidth;
    this.el.classList.add('no');
    setTimeout(() => this.el.classList.remove('no'), 500);
  }

  word() {
    return this.sel.map((i) => this.letters[i]).join('');
  }

  draw() {
    const pts = this.sel.map((i) => this.centers[i]);
    if (this.pointer && pts.length) pts.push(this.pointer);
    this.line.setAttribute('points', pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  }
}
