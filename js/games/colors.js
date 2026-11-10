// Trier les couleurs : poser chaque balle dans le panier de sa couleur.
// Niveaux : 2 paniers avec aide au tap → plus de balles → 3 paniers → 5 balles.

import { Game, div } from '../core/game.js';
import { createSorter, moveItem } from '../core/input.js';
import { ripple, replay, shuffle, clamp } from '../core/effects.js';
import { CLOTH, CLOTH_IDS } from '../data/art.js';

const RULES = {
  1: { baskets: 2, balls: 3, autoTap: true },
  2: { baskets: 2, balls: 4, autoTap: false },
  3: { baskets: 3, balls: 4, autoTap: false },
  4: { baskets: 3, balls: 5, autoTap: false },
};
const NOTES = { rouge: 3, jaune: 5, bleu: 7, vert: 4, violet: 8, orange: 6 };
const IN_SCALE = 0.6;            // taille d'une balle posée dans le panier
const SLOTS = [0, -0.26, 0.26];  // positions dans le panier (fraction de la largeur)
const RIM_Y = 16 / 70;           // hauteur du bord du panier dans son dessin

const ballSvg = (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${c.fill}"/><circle cx="35" cy="34" r="10" fill="#FCF8F2" opacity=".55"/></svg>`;
const backSvg = (c) => `<svg viewBox="0 0 100 70"><ellipse cx="50" cy="16" rx="46" ry="12" fill="${c.dark}"/></svg>`;
const frontSvg = (c) => `<svg viewBox="0 0 100 70"><path d="M4 16 Q50 30 96 16 Q94 68 50 68 Q6 68 4 16 Z" fill="${c.fill}"/></svg>`;

const ICON = `<svg viewBox="0 0 100 100"><circle cx="50" cy="22" r="12" fill="#A6CC9C"/><ellipse cx="50" cy="60" rx="38" ry="9" fill="#83AFCB"/><circle cx="37" cy="55" r="12" fill="#E39189"/><circle cx="62" cy="53" r="12" fill="#F0D67E"/><path d="M12 60 Q50 70 88 60 Q85 92 50 92 Q15 92 12 60 Z" fill="#9EC3DA"/></svg>`;

function box(el, x, y, w, h) {
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`;
}

class Colors extends Game {
  init(root, services) {
    this.setup(root, services, 'couleurs', 4);
    this.items = [];
    this.baskets = [];
    this.audio.preload(CLOTH_IDS.map((c) => `couleur-${c}`));
    createSorter(root, {
      items: () => this.items,
      autoTap: () => this.rules.autoTap,
      onPick: (it) => this.picked(it),
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
    const picks = shuffle(CLOTH_IDS.slice()).slice(0, rules.baskets);
    // Chaque panier reçoit au moins une balle, et au plus 3.
    const counts = picks.map(() => 1);
    while (counts.reduce((a, b) => a + b, 0) < rules.balls) {
      const i = Math.floor(Math.random() * counts.length);
      if (counts[i] < 3) counts[i]++;
    }
    const ballColors = shuffle(picks.flatMap((c, i) => Array(counts[i]).fill(c)));

    this.baskets = picks.map((id) => {
      const color = CLOTH[id];
      const back = div('basket-back', backSvg(color));
      const front = div('basket-front', frontSvg(color));
      front.dataset.color = id;
      this.scene.append(back, front);
      return { id, back, front, x: 0, y: 0, w: 0, h: 0 };
    });
    this.items = ballColors.map((id) => {
      const el = div('ball', ballSvg(CLOTH[id]));
      el.dataset.color = id;
      this.scene.append(el);
      return {
        el, color: id, basket: this.baskets.find((b) => b.id === id), slot: 0,
        size: 0, x: 0, y: 0, reach: 0, magnet: 0, targetScale: IN_SCALE,
        home: { x: 0, y: 0 }, target: { x: 0, y: 0 }, done: false, busy: false, pointer: null,
      };
    });
    this.resize();
  }

  resize() {
    const r = this.layout.playRect();
    const [top, bottom] = this.layout.split(r, 0.5);
    const n = this.baskets.length;
    const grid = this.layout.arrange(top, this.items.length, { fill: 0.8, max: 160 });
    const ball = Math.max(96, grid.size);
    const bw = clamp(Math.min((bottom.w / n) * 0.86, (bottom.h * 0.8) / 0.7), 100, 300);
    const bh = bw * 0.7;

    this.baskets.forEach((b, i) => {
      b.x = bottom.x + (bottom.w * (i + 0.5)) / n;
      b.y = bottom.y + bottom.h * 0.55;
      b.w = bw;
      b.h = bh;
      box(b.back, b.x, b.y, bw, bh);
      box(b.front, b.x, b.y, bw, bh);
    });

    this.items.forEach((it, i) => {
      it.size = ball;
      it.el.style.width = `${ball}px`;
      it.el.style.height = `${ball}px`;
      it.reach = ball * 0.9;
      it.home = grid.points[i];
      const b = it.basket;
      it.magnet = Math.min(Math.max(bw * 0.75, ball * 1.4), Math.hypot(it.home.x - b.x, it.home.y - b.y) * 0.75);
      if (it.pointer !== null) return;
      it.target = this.slotPos(b, it.slot);
      if (it.done) moveItem(it, it.target.x, it.target.y, IN_SCALE, 0);
      else moveItem(it, it.home.x, it.home.y, 1, 0);
    });
  }

  slotPos(b, slot) {
    return { x: b.x + SLOTS[slot] * b.w, y: b.y - b.h / 2 + b.h * RIM_Y + b.h * 0.06 };
  }

  // Quand on attrape une balle, on lui réserve une place libre dans son panier.
  picked(it) {
    const used = this.items
      .filter((o) => o !== it && o.basket === it.basket && (o.done || o.pointer !== null))
      .map((o) => o.slot);
    const free = [0, 1, 2].find((s) => !used.includes(s));
    it.slot = free === undefined ? 0 : free;
    it.target = this.slotPos(it.basket, it.slot);
    this.audio.pick(NOTES[it.color]);
  }

  placed(it) {
    it.el.classList.add('in', 'placed');
    replay(it.basket.front, 'wiggle');
    replay(it.basket.back, 'wiggle');
    this.audio.place(NOTES[it.color]);
    this.audio.say(`couleur-${it.color}`);
    if (this.finished || !this.items.every((i) => i.done)) return;
    this.finished = true;
    this.later(() => {
      this.baskets.forEach((b) => {
        replay(b.front, 'wiggle');
        replay(b.back, 'wiggle');
      });
      this.items.forEach((p, i) => {
        p.el.firstElementChild.style.animationDelay = `${i * 0.12}s`;
        p.el.classList.add('party');
      });
      this.finishRound(() => this.newRound());
    }, 1000);
  }

  hint(it) {
    replay(it.basket.front, 'hint');
    this.audio.say(`couleur-${it.color}`);
  }

  missed(it, x, y) {
    const wrong = this.baskets.find((b) => b !== it.basket && Math.hypot(b.x - x, b.y - y) < b.w * 0.7);
    if (!wrong) return;
    this.levels.miss();
    replay(wrong.front, 'wiggle');
    this.later(() => this.hint(it), 400);
  }
}

export default {
  id: 'couleurs',
  icon: ICON,
  create: () => new Colors(),
};
