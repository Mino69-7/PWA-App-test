// Le train des animaux : chaque animal porte un foulard de couleur ;
// on le glisse dans la maison de la même couleur. Une manche sur deux, c'est l'inverse :
// le train vide vient chercher les animaux devant leurs maisons.

import { Game, div } from '../core/game.js';
import { createSorter, moveItem } from '../core/input.js';
import { ripple, replay, shuffle, clamp } from '../core/effects.js';
import { face, house, wagon, locomotive, inner, CLOTH_IDS, ANIMAL_IDS } from '../data/art.js';

const MAX_LEVEL = 4;
const ARRIVE_MS = 2200;
const RULES = {
  1: { houses: 3, autoTap: true, coloredWagons: true },
  2: { houses: 3, autoTap: false, coloredWagons: true },
  3: { houses: 4, autoTap: false, coloredWagons: true },
  4: { houses: 4, autoTap: false, coloredWagons: false }, // seul le foulard indique la couleur
};
const NOTES = { rouge: 3, jaune: 5, bleu: 7, vert: 4, violet: 8, orange: 6 };

const ICON = `<svg viewBox="0 0 100 100"><g transform="translate(2 44) scale(.42)">${inner(locomotive())}</g><g transform="translate(54 50) scale(.42)">${inner(wagon('rouge'))}</g><g transform="translate(56 14) scale(.5)">${inner(face('chien', 'rouge'))}</g><rect x="0" y="86" width="100" height="5" rx="2.5" fill="#E2D5C3"/></svg>`;

class Train extends Game {
  init(root, services) {
    this.setup(root, services, 'train', MAX_LEVEL);
    this.mode = 'drop';
    this.items = [];
    this.houses = [];
    this.wagons = [];
    this.audio.preload([
      'train-arrive', 'train-vide', 'train-part',
      ...ANIMAL_IDS.map((a) => `nom-${a}`),
      ...CLOTH_IDS.flatMap((c) => [`maison-${c}`, `wagon-${c}`, `couleur-${c}`]),
    ]);

    createSorter(root, {
      items: () => this.items,
      autoTap: () => this.rules.autoTap,
      onPick: (it) => this.audio.pick(NOTES[it.color]),
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
    this.moving = false;
    this.scene.replaceChildren();
    const rules = this.rules;
    const colors = shuffle(CLOTH_IDS.slice()).slice(0, rules.houses);
    const animals = shuffle(ANIMAL_IDS.slice()).slice(0, 3);
    const animalColors = shuffle(colors.slice()).slice(0, 3);
    const drop = this.mode === 'drop';

    this.houses = colors.map((color) => {
      const el = div('house', house(color));
      el.dataset.color = color;
      this.scene.append(el);
      return { el, color, x: 0, y: 0, size: 0 };
    });

    this.track = div('track');
    this.trainEl = div('train');
    this.loco = div('loco', locomotive());
    this.trainEl.append(this.loco);
    // Wagons : dans l'ordre des animaux (déposer) ou mélangés (ramasser).
    const wagonColors = drop ? animalColors : shuffle(animalColors.slice());
    this.wagons = wagonColors.map((color) => {
      const shown = drop && !rules.coloredWagons ? null : color;
      const el = div('wagon', wagon(shown));
      el.dataset.color = color;
      this.trainEl.append(el);
      return { el, color, x: 0, y: 0, w: 0 };
    });
    this.scene.append(this.track, this.trainEl);

    this.items = animals.map((id, i) => {
      const color = animalColors[i];
      const el = div('critter', face(id, color));
      el.dataset.animal = id;
      el.dataset.color = color;
      this.scene.append(el);
      return {
        el, id, color, size: 0, x: 0, y: 0, reach: 0, magnet: 0, targetScale: 1,
        home: { x: 0, y: 0 }, target: { x: 0, y: 0 }, done: false, busy: true, pointer: null,
        wagon: this.wagons.find((w) => w.color === color),
        house: this.houses.find((h) => h.color === color),
      };
    });

    this.resize();
    this.arrive();
  }

  resize() {
    const r = this.layout.playRect();
    const [top, bottom] = this.layout.split(r, 0.5);
    const drop = this.mode === 'drop';

    const grid = this.layout.arrange(top, this.houses.length, { fill: 0.86, max: 210 });
    this.houses.forEach((h, i) => {
      h.size = grid.size;
      h.x = grid.points[i].x;
      h.y = grid.points[i].y;
      place(h.el, h.x, h.y, h.size, h.size);
    });

    // Train : 3 wagons centrés, la locomotive devant (elle peut dépasser du bord).
    const ww = Math.min(bottom.w / 3.45, bottom.h / 1.36, 190);
    const wh = ww * 0.84;
    const gap = ww * 0.04;
    const x0 = bottom.x + (bottom.w - 3 * ww - 2 * gap) / 2;
    const wy = bottom.y + bottom.h - wh / 2 - 4;
    this.trainY = wy;
    this.wagons.forEach((w, i) => {
      w.w = ww;
      w.x = x0 + i * (ww + gap) + ww / 2;
      w.y = wy;
      place(w.el, w.x, w.y, ww, wh);
    });
    const lw = ww * 1.2;
    place(this.loco, x0 - gap - lw / 2, wy - wh * 0.02, lw, lw * 0.73);
    const st = this.track.style;
    st.left = '0px';
    st.width = `${this.layout.size().w}px`;
    st.top = `${wy + wh / 2 - 3}px`;

    const size = clamp(drop ? ww * 0.92 : Math.min(ww * 0.92, grid.size * 0.72), 96, 190);
    this.items.forEach((it) => {
      it.size = size;
      it.el.style.width = `${size}px`;
      it.el.style.height = `${size}px`;
      it.reach = size * 0.85;
      const seat = { x: it.wagon.x, y: it.wagon.y - wh / 2 - size * 0.18 };
      const door = { x: it.house.x, y: it.house.y + it.house.size * 0.2 };
      if (drop) {
        it.home = seat;
        it.target = door;
        it.targetScale = 0.55;
        it.magnet = it.house.size * 0.85;
      } else {
        it.home = door;
        it.target = seat;
        it.targetScale = 1;
        it.magnet = ww * 0.95;
      }
      if (it.pointer !== null || this.moving) return;
      if (it.done) moveItem(it, it.target.x, it.target.y, it.targetScale, 0);
      else moveItem(it, it.home.x, it.home.y, 1, 0);
    });
  }

  // Le train entre par la droite (plein en mode « déposer », vide en mode « ramasser »).
  arrive() {
    const drop = this.mode === 'drop';
    const dx = this.layout.size().w + 60;
    this.moving = true;
    this.slideTrain(dx, 0);
    if (drop) this.items.forEach((it) => moveItem(it, it.home.x + dx, it.home.y, 1, 0));
    else this.items.forEach((it) => { it.el.classList.add('peek'); });
    void this.scene.offsetWidth;
    this.slideTrain(0, ARRIVE_MS);
    if (drop) this.items.forEach((it) => moveItem(it, it.home.x, it.home.y, 1, ARRIVE_MS));
    this.audio.tchou();
    this.later(() => this.audio.say(drop ? 'train-arrive' : 'train-vide'), 500);
    this.later(() => {
      this.moving = false;
      this.items.forEach((it) => { it.busy = false; });
    }, ARRIVE_MS);
  }

  slideTrain(dx, ms) {
    const st = this.trainEl.style;
    st.transition = ms ? `transform ${ms}ms cubic-bezier(.3,.1,.25,1)` : 'none';
    st.transform = `translate3d(${dx}px, 0, 0)`;
  }

  placed(it) {
    const drop = this.mode === 'drop';
    it.el.classList.add(drop ? 'inside' : 'seated');
    replay(it.el, 'wave');
    replay((drop ? it.house : it.wagon).el, 'wiggle');
    this.audio.place(NOTES[it.color]);
    this.audio.say([`nom-${it.id}`, `${drop ? 'maison' : 'wagon'}-${it.color}`]);
    if (this.finished || !this.items.every((i) => i.done)) return;
    this.finished = true;
    this.later(() => this.depart(), 2200);
  }

  // Le train repart vers la gauche (avec les animaux en mode « ramasser »).
  depart() {
    const drop = this.mode === 'drop';
    const dx = -(this.layout.size().w + 260);
    this.moving = true;
    this.audio.tchou();
    this.audio.say('train-part');
    this.slideTrain(dx, ARRIVE_MS);
    if (drop) this.items.forEach((it) => it.el.classList.add('gone'));
    else this.items.forEach((it) => moveItem(it, it.x + dx, it.y, 1, ARRIVE_MS));
    // Après « Au revoir », la fête de fin de manche, puis la manche suivante.
    this.later(() => {
      this.mode = drop ? 'pick' : 'drop';
      this.finishRound(() => this.newRound(), { celebrateMs: 700 });
    }, 2000);
  }

  // Tap sans aide automatique : on montre doucement la bonne destination.
  hint(it) {
    const goal = this.mode === 'drop' ? it.house : it.wagon;
    replay(goal.el, 'hint');
    replay(it.el, 'wiggle');
    this.audio.say(`couleur-${it.color}`);
  }

  missed(it, x, y) {
    const drop = this.mode === 'drop';
    const spots = drop ? this.houses : this.wagons;
    const wrong = spots.find((s) => s !== (drop ? it.house : it.wagon)
      && Math.hypot(s.x - x, s.y - y) < (s.size || s.w) * 0.75);
    if (!wrong) return;
    this.levels.miss();
    replay(wrong.el, 'wiggle');
    this.later(() => this.hint(it), 400);
  }
}

function place(el, x, y, w, h) {
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`;
}

export default {
  id: 'train',
  icon: ICON,
  create: () => new Train(),
};
