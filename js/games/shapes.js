// Formes dans leur trou : glisser chaque forme vers sa silhouette.
// Niveaux : 3 formes avec aide au tap → sans aide → 4 formes → 4 formes toutes de la même couleur
// (seule la forme compte).

import { Game, div } from '../core/game.js';
import { createSorter, moveItem } from '../core/input.js';
import { ripple, replay, shuffle, clamp } from '../core/effects.js';

const COLORS = ['#F2C6C2', '#F6D5B8', '#F5E6A8', '#C5DDBF', '#BFD8E6', '#D4C8E6'];
const HOLE = '#E6D9C6';
const RULES = {
  1: { count: 3, autoTap: true, pool: 3 },
  2: { count: 3, autoTap: false, pool: 4 },
  3: { count: 4, autoTap: false, pool: 6 },
  4: { count: 4, autoTap: false, pool: 6, sameColor: true },
};
const round = (d, c, w = 10) => `<path d="${d}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;

const SHAPES = [
  { id: 'rond', note: 3, draw: (c) => `<circle cx="50" cy="50" r="46" fill="${c}"/>` },
  { id: 'carre', note: 5, draw: (c) => `<rect x="7" y="7" width="86" height="86" rx="20" fill="${c}"/>` },
  { id: 'triangle', note: 7, draw: (c) => round('M50 12 L89 82 L11 82 Z', c, 14) },
  { id: 'etoile', note: 8, draw: (c) => round('M50 8 L61 37 L93 38 L68 57 L77 89 L50 71 L23 89 L32 57 L7 38 L39 37 Z', c, 8) },
  { id: 'coeur', note: 6, draw: (c) => `<path d="M50 88 C18 66 4 48 9 29 C14 10 38 7 50 25 C62 7 86 10 91 29 C96 48 82 66 50 88 Z" fill="${c}"/>` },
  { id: 'losange', note: 4, draw: (c) => round('M50 8 L88 50 L50 92 L12 50 Z', c, 12) },
];

const svg = (inner) => `<svg viewBox="0 0 100 100">${inner}</svg>`;

const ICON = `<svg viewBox="0 0 100 100"><circle cx="28" cy="32" r="17" fill="#C5DDBF"/><rect x="55" y="15" width="32" height="32" rx="8" fill="#F2C6C2"/><path d="M50 56 L70 86 L30 86 Z" fill="#F5E6A8" stroke="#F5E6A8" stroke-width="9" stroke-linejoin="round"/></svg>`;

function box(el, x, y, size) {
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
}

class Shapes extends Game {
  init(root, services) {
    this.setup(root, services, 'formes', 4);
    this.items = [];
    this.holes = [];
    this.audio.preload(SHAPES.map((s) => `forme-${s.id}`));
    createSorter(root, {
      items: () => this.items,
      autoTap: () => this.rules.autoTap,
      onPick: (it) => this.audio.pick(it.shape.note),
      onPlace: (it) => this.placed(it),
      onHint: (it) => this.hint(it),
      onMiss: (it, x, y) => this.missed(it, x, y),
      onEmpty: (x, y) => {
        ripple(this.scene, x, y);
        this.audio.tap();
      },
    });
    this.newRound();
  }

  get rules() {
    return RULES[this.level];
  }

  newRound() {
    this.levels.begin();
    this.finished = false;
    this.scene.replaceChildren();
    const rules = this.rules;
    const shapes = shuffle(SHAPES.slice(0, rules.pool)).slice(0, rules.count);
    const colors = shuffle(COLORS.slice());

    const holesByShape = shapes.map((shape) => {
      const el = div('hole', svg(shape.draw(HOLE)));
      this.scene.append(el);
      return { el, shape, x: 0, y: 0, size: 0 };
    });
    this.holes = shuffle(holesByShape.slice());
    this.items = shuffle(shapes.map((s, k) => k)).map((k, i) => {
      const shape = shapes[k];
      const el = div('piece', svg(shape.draw(rules.sameColor ? colors[0] : colors[i])));
      el.dataset.shape = shape.id;
      this.scene.append(el);
      return {
        el, shape, hole: holesByShape[k], size: 0, x: 0, y: 0, reach: 0, magnet: 0,
        home: { x: 0, y: 0 }, target: { x: 0, y: 0 }, done: false, busy: false, pointer: null,
      };
    });
    this.resize();
  }

  resize() {
    const r = this.layout.playRect();
    const n = this.items.length;
    const wide = r.w >= r.h;
    // Paysage : silhouettes en haut, formes en bas. Portrait : deux colonnes.
    const cols = wide ? n : 2;
    const rows = wide ? 2 : n;
    const cw = r.w / cols;
    const ch = r.h / rows;
    const size = clamp(Math.min(cw, ch) * 0.66, 96, 190);
    const slot = (line, i) => (wide
      ? { x: r.x + cw * (i + 0.5), y: r.y + ch * (line + 0.5) }
      : { x: r.x + cw * (line + 0.5), y: r.y + ch * (i + 0.5) });

    this.holes.forEach((h, i) => {
      const p = slot(0, i);
      h.x = p.x;
      h.y = p.y;
      h.size = size * 1.08;
      box(h.el, p.x, p.y, h.size);
    });
    this.items.forEach((it, i) => {
      const p = slot(1, i);
      it.size = size;
      it.el.style.width = `${size}px`;
      it.el.style.height = `${size}px`;
      it.reach = size * 0.9;
      it.home = p;
      it.target = { x: it.hole.x, y: it.hole.y };
      // Aimant généreux, mais pas au point d'attirer depuis sa place de départ.
      it.magnet = Math.min(size * 1.5, Math.hypot(p.x - it.hole.x, p.y - it.hole.y) * 0.75);
      if (it.pointer !== null) return;
      if (it.done) moveItem(it, it.target.x, it.target.y, 1, 0);
      else moveItem(it, p.x, p.y, 1, 0);
    });
  }

  placed(it) {
    it.el.classList.add('placed');
    this.audio.place(it.shape.note);
    this.audio.say(`forme-${it.shape.id}`);
    if (this.finished || !this.items.every((i) => i.done)) return;
    this.finished = true;
    this.later(() => {
      this.items.forEach((p, i) => {
        p.el.firstElementChild.style.animationDelay = `${i * 0.15}s`;
        p.el.classList.add('party');
      });
      this.finishRound(() => this.newRound());
    }, 900);
  }

  hint(it) {
    replay(it.hole.el, 'hint');
    this.audio.say(`forme-${it.shape.id}`);
  }

  missed(it, x, y) {
    const wrong = this.holes.find((h) => h !== it.hole && Math.hypot(h.x - x, h.y - y) < h.size * 0.7);
    if (!wrong) return;
    this.levels.miss();
    replay(wrong.el, 'wiggle');
    this.later(() => this.hint(it), 400);
  }
}

export default {
  id: 'formes',
  icon: ICON,
  create: () => new Shapes(),
};
