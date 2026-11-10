// À table ! : donner à chaque animal ce qu'il mange (la carotte au lapin, l'os au chien…).
// Plus loin : plus d'animaux, plus d'aide au tap, et un aliment en trop pour réfléchir.

import { Game, div } from '../core/game.js';
import { createSorter, moveItem } from '../core/input.js';
import { ripple, replay, shuffle } from '../core/effects.js';
import { face, food, DIET } from '../data/art.js';

const RULES = {
  1: { pairs: 2, extra: 0, autoTap: true },
  2: { pairs: 2, extra: 0, autoTap: false },
  3: { pairs: 3, extra: 0, autoTap: false },
  4: { pairs: 3, extra: 1, autoTap: false },
  5: { pairs: 4, extra: 0, autoTap: false },
};
const EATERS = Object.keys(DIET);
const NOTES = [3, 5, 7, 9];

const ICON = `<svg viewBox="0 0 100 100"><path d="M50 18 Q60 18 59 30 L52 66 Q50 70 48 66 L41 30 Q40 18 50 18 Z" fill="#F2B27E"/><path d="M50 20 Q43 8 36 7 M50 20 Q50 7 50 3 M50 20 Q57 8 64 7" stroke="#A6CC9C" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 62 H86 Q84 90 50 90 Q16 90 14 62 Z" fill="#9EC3DA"/><rect x="10" y="58" width="80" height="8" rx="4" fill="#83AFCB"/></svg>`;

class Food extends Game {
  init(root, services) {
    this.setup(root, services, 'table', 5);
    this.items = [];
    this.eaters = [];
    this.audio.preload(['a-table', 'miam', 'miam-2', ...EATERS.map((a) => `qui-mange-${DIET[a]}`)]);
    createSorter(root, {
      items: () => this.items,
      autoTap: () => this.rules.autoTap,
      onPick: (it) => this.audio.pick(it.note),
      onPlace: (it) => this.eaten(it),
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
    const chosen = shuffle(EATERS.slice());
    const animals = chosen.slice(0, rules.pairs);
    const extras = chosen.slice(rules.pairs, rules.pairs + rules.extra);

    this.eaters = animals.map((id) => {
      const el = div('critter eater', face(id));
      el.dataset.animal = id;
      this.scene.append(el);
      return { el, id, x: 0, y: 0, size: 0 };
    });
    const foods = shuffle([...animals, ...extras]);
    this.items = foods.map((animal, i) => {
      const el = div('dish', food(DIET[animal]));
      el.dataset.food = DIET[animal];
      this.scene.append(el);
      return {
        el, food: DIET[animal], eater: this.eaters.find((e) => e.id === animal) || null,
        note: NOTES[i % NOTES.length], size: 0, x: 0, y: 0, reach: 0, magnet: 0, targetScale: 0.35,
        home: { x: 0, y: 0 }, target: { x: -9999, y: -9999 }, done: false, busy: false, pointer: null,
      };
    });
    this.resize();
    this.later(() => this.audio.say('a-table'), 400);
  }

  resize() {
    const r = this.layout.playRect();
    const [top, bottom] = this.layout.split(r, 0.44);
    const fg = this.layout.arrange(top, this.items.length, { fill: 0.78, max: 170 });
    const ag = this.layout.arrange(bottom, this.eaters.length, { fill: 0.84, max: 230 });
    this.eaters.forEach((e, i) => {
      e.size = Math.max(96, ag.size);
      e.x = ag.points[i].x;
      e.y = ag.points[i].y;
      const st = e.el.style;
      st.width = `${e.size}px`;
      st.height = `${e.size}px`;
      st.transform = `translate3d(${e.x - e.size / 2}px, ${e.y - e.size / 2}px, 0)`;
    });
    this.items.forEach((it, i) => {
      it.size = Math.max(96, fg.size);
      it.el.style.width = `${it.size}px`;
      it.el.style.height = `${it.size}px`;
      it.reach = it.size * 0.85;
      it.home = fg.points[i];
      if (it.eater) {
        it.target = { x: it.eater.x, y: it.eater.y + it.eater.size * 0.18 };
        it.magnet = it.eater.size * 0.8;
      }
      if (it.pointer !== null) return;
      if (it.done) moveItem(it, it.target.x, it.target.y, it.targetScale, 0);
      else moveItem(it, it.home.x, it.home.y, 1, 0);
    });
  }

  eaten(it) {
    it.el.classList.add('eaten');
    replay(it.eater.el, 'chomp');
    this.audio.munch();
    this.audio.say(Math.random() < 0.6 ? 'miam' : 'miam-2');
    const left = this.items.filter((i) => i.eater && !i.done);
    if (this.finished || left.length) return;
    this.finished = true;
    this.items.filter((i) => !i.eater).forEach((i) => i.el.classList.add('eaten'));
    this.later(() => {
      this.eaters.forEach((e) => replay(e.el, 'wiggle'));
      this.finishRound(() => this.newRound(), { celebrateMs: 1800 });
    }, 1300);
  }

  hint(it) {
    replay(it.el, 'wiggle');
    this.audio.say(`qui-mange-${it.food}`);
    if (it.eater) this.later(() => replay(it.eater.el, 'hint'), 600);
  }

  missed(it, x, y) {
    const wrong = this.eaters.find((e) => e !== it.eater && Math.hypot(e.x - x, e.y - y) < e.size * 0.7);
    if (!wrong) return;
    this.levels.miss();
    replay(wrong.el, 'nope');
    this.later(() => this.hint(it), 500);
  }
}

export default {
  id: 'table',
  icon: ICON,
  create: () => new Food(),
};
