// Coucou caché : un animal se cache derrière un buisson ; on touche le bon buisson
// pour le retrouver. Plus loin : plus de cachettes, les oreilles ne dépassent plus,
// et les cachettes se déplacent doucement une fois l'animal caché.

import { Game, div } from '../core/game.js';
import { createPointerField, nearest, ready } from '../core/input.js';
import { ripple, replay, shuffle } from '../core/effects.js';
import { face, bush, box, ANIMAL_IDS, CLOTH_IDS } from '../data/art.js';
import { pick } from '../core/levels.js';

const RULES = {
  1: { spots: 2, peek: true, swaps: 0 },
  2: { spots: 3, peek: true, swaps: 0 },
  3: { spots: 3, peek: false, swaps: 0 },
  4: { spots: 4, peek: false, swaps: 1 },
  5: { spots: 4, peek: false, swaps: 2, boxes: true },
};
const SWAP_MS = 1000;

const ICON = `<svg viewBox="0 0 100 100"><g transform="translate(22 6) scale(.56)"><ellipse cx="36" cy="20" rx="9" ry="22" fill="#E6DCEC"/><ellipse cx="64" cy="20" rx="9" ry="22" fill="#E6DCEC"/><ellipse cx="36" cy="22" rx="4.5" ry="15" fill="#F2C6C2"/><ellipse cx="64" cy="22" rx="4.5" ry="15" fill="#F2C6C2"/><circle cx="50" cy="56" r="31" fill="#ECE4F0"/></g><g transform="translate(6 34) scale(.88)"><g fill="#A6CC9C"><circle cx="26" cy="62" r="22"/><circle cx="74" cy="62" r="22"/></g><g fill="#B9D7A8"><circle cx="50" cy="44" r="30"/><circle cx="28" cy="70" r="20"/><circle cx="72" cy="70" r="20"/><rect x="18" y="62" width="64" height="30" rx="14"/></g></g></svg>`;

function setBox(el, x, y, size, { scale = 1, ms = 0 } = {}) {
  const st = el.style;
  st.width = `${size}px`;
  st.height = `${size}px`;
  st.transition = ms ? `transform ${ms}ms cubic-bezier(.4,0,.2,1)` : 'none';
  st.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) scale(${scale})`;
}

class Peekaboo extends Game {
  init(root, services) {
    this.setup(root, services, 'coucou', 5);
    this.empty = {};
    this.last = null;
    this.audio.preload(['coucou', ...ANIMAL_IDS.map((a) => `ou-est-${a}`)]);
    createPointerField(root, { down: (p) => this.tap(p.x, p.y) });
    this.newRound();
  }

  get rules() {
    return RULES[this.level];
  }

  newRound() {
    this.levels.begin();
    this.ready = false;
    this.found = false;
    this.scene.replaceChildren();
    const rules = this.rules;
    this.animal = pick(ANIMAL_IDS.filter((a) => a !== this.last));
    this.last = this.animal;
    this.critter = div('critter hider', face(this.animal));
    this.critter.dataset.animal = this.animal;
    this.scene.append(this.critter);

    const colors = shuffle(CLOTH_IDS.slice());
    this.spots = Array.from({ length: rules.spots }, (_, i) => {
      const el = div('hide', rules.boxes ? box(colors[i]) : bush(i));
      this.scene.append(el);
      return { el, slot: i, x: 0, y: 0, reach: 0 };
    });
    this.secret = this.spots[Math.floor(Math.random() * rules.spots)];
    this.secret.el.dataset.secret = '1';
    this.phase = 'show';
    this.resize();
    this.play();
  }

  resize() {
    const r = this.layout.playRect();
    const [top, bottom] = this.layout.split(r, 0.36);
    const grid = this.layout.arrange(bottom, this.spots.length, { fill: 0.82, max: 230 });
    this.slots = grid.points;
    this.hideSize = grid.size;
    this.animalSize = Math.max(96, grid.size * 0.78);
    this.stage = { x: top.x + top.w / 2, y: top.y + top.h / 2 };
    this.spots.forEach((s) => this.placeSpot(s, 0));
    this.placeCritter(0);
  }

  placeSpot(s, ms) {
    const p = this.slots[s.slot];
    s.x = p.x;
    s.y = p.y;
    s.reach = this.hideSize * 0.75;
    setBox(s.el, p.x, p.y, this.hideSize, { ms });
  }

  // Position de l'animal selon la phase : sur scène, caché (oreilles qui dépassent ou non), trouvé.
  placeCritter(ms) {
    const s = this.secret;
    const size = this.animalSize;
    let x = this.stage.x;
    let y = this.stage.y;
    let scale = 1;
    if (this.phase === 'hidden') {
      x = s.x;
      y = s.y - (this.rules.peek ? this.hideSize * 0.36 : 0);
      scale = 0.9;
    } else if (this.phase === 'found') {
      x = s.x;
      y = s.y - this.hideSize * 0.62;
      scale = 1.12;
    }
    setBox(this.critter, x, y, size, { scale, ms });
  }

  // Déroulé d'une manche : l'animal se montre, va se cacher, les cachettes bougent éventuellement.
  play() {
    replay(this.critter, 'peek');
    this.later(() => replay(this.critter, 'wiggle'), 600);
    this.later(() => {
      this.phase = 'hidden';
      this.placeCritter(1100);
      this.audio.boing();
    }, 1500);
    let t = 2800;
    for (let k = 0; k < this.rules.swaps; k++) {
      this.later(() => this.swap(), t);
      t += SWAP_MS + 250;
    }
    this.later(() => {
      this.ready = true;
      this.audio.say(`ou-est-${this.animal}`);
    }, t);
  }

  swap() {
    const others = this.spots.filter((s) => s !== this.secret);
    const a = Math.random() < 0.7 ? this.secret : pick(others);
    const b = pick(this.spots.filter((s) => s !== a));
    [a.slot, b.slot] = [b.slot, a.slot];
    this.placeSpot(a, SWAP_MS);
    this.placeSpot(b, SWAP_MS);
    this.placeCritter(SWAP_MS);
    this.audio.pick(4);
  }

  tap(x, y) {
    const now = performance.now();
    const s = nearest(x, y, this.spots);
    if (!s) {
      if (!ready(this.empty, now)) return;
      ripple(this.scene, x, y);
      this.audio.tap();
      return;
    }
    if (!ready(s, now)) return;
    if (!this.ready || this.found) {
      replay(s.el, 'wiggle');
      return;
    }
    if (s !== this.secret) {
      this.levels.miss();
      replay(s.el, 'wiggle');
      this.audio.boing();
      return;
    }
    this.found = true;
    this.phase = 'found';
    s.el.classList.add('open');
    this.placeCritter(700);
    this.later(() => replay(this.critter, 'wiggle'), 700);
    this.audio.place(6);
    this.audio.say('coucou');
    this.later(() => this.finishRound(() => this.newRound(), { celebrateMs: 1600 }), 900);
  }
}

export default {
  id: 'coucou',
  icon: ICON,
  create: () => new Peekaboo(),
};
