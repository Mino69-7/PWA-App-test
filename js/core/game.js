// Base commune des mini-jeux : scène, niveaux, minuteries sûres, fin de manche.

import { levelsFor, pick } from './levels.js';
import { BRAVO } from '../data/phrases.js';

export function div(className, html = '') {
  const el = document.createElement('div');
  el.className = className;
  if (html) el.innerHTML = html;
  return el;
}

export class Game {
  setup(root, services, id, maxLevel) {
    this.root = root;
    this.audio = services.audio;
    this.layout = services.layout;
    this.effects = services.effects;
    this.levels = levelsFor(id, maxLevel);
    this.scene = div('scene');
    root.append(this.scene);
  }

  start() {}
  stop() {}

  // Minuterie qui ne se déclenche plus une fois le jeu quitté.
  later(fn, ms) {
    setTimeout(() => { if (this.root.isConnected) fn(); }, ms);
  }

  get level() {
    return this.levels.level;
  }

  bravo() {
    this.audio.say(pick(BRAVO));
  }

  // Fin de manche : petite fête, éventuellement passage au niveau suivant,
  // puis fondu et manche suivante.
  finishRound(next, { celebrateMs = 2000, say = true } = {}) {
    const change = this.levels.end();
    this.audio.chime();
    if (change > 0) {
      this.later(() => {
        this.audio.fanfare();
        this.audio.say('niveau');
      }, 600);
    } else if (say) {
      this.later(() => this.bravo(), 500);
    }
    this.later(() => {
      this.scene.classList.add('hidden');
      this.later(() => {
        next();
        void this.scene.offsetWidth;
        this.scene.classList.remove('hidden');
      }, 750);
    }, celebrateMs + (change > 0 ? 900 : 0));
  }
}
