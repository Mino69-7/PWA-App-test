// Petit orchestre : un xylophone. D'abord on joue librement, puis « écoute et répète » :
// une lame s'allume et chante, à toi de la retrouver ; ensuite 2, 3, puis 4 notes de suite.
// Une mauvaise note n'est jamais un échec : elle sonne juste (gamme pentatonique) et on réécoute.

import { Game, div } from '../core/game.js';
import { createPointerField, ready } from '../core/input.js';
import { ripple, replay } from '../core/effects.js';

const BARS = [
  { color: '#E8A8A2', note: 5 },
  { color: '#F2C29A', note: 6 },
  { color: '#F0D67E', note: 7 },
  { color: '#A6CC9C', note: 8 },
  { color: '#9EC3DA', note: 9 },
];
const RULES = {
  1: { seq: 0, taps: 14 },  // jeu libre
  2: { seq: 1, wins: 3 },
  3: { seq: 2, wins: 3 },
  4: { seq: 3, wins: 3 },
  5: { seq: 4, wins: 3 },
};
const STEP_MS = 750;

const ICON = `<svg viewBox="0 0 100 100">${BARS.map((b, i) => `<rect x="${10 + i * 17}" y="${18 + i * 5}" width="13" height="${66 - i * 10}" rx="6" fill="${b.color}"/>`).join('')}<path d="M24 92 L80 70" stroke="#C9B8A8" stroke-width="5" stroke-linecap="round"/><circle cx="82" cy="69" r="7" fill="#C3B1DE"/></svg>`;
const NOTE_SVG = (c) => `<svg viewBox="0 0 40 50"><path d="M16 38 V8 L34 4 V30" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="11" cy="38" rx="9" ry="7" fill="${c}"/><ellipse cx="29" cy="31" rx="8" ry="6" fill="${c}"/></svg>`;

class Music extends Game {
  init(root, services) {
    this.setup(root, services, 'orchestre', 5);
    this.audio.preload(['ecoute', 'a-toi', 'musique']);
    this.bars = BARS.map((b, i) => {
      const el = div('bar');
      el.style.background = b.color;
      el.dataset.bar = String(i);
      el.innerHTML = '<span class="nail"></span><span class="nail"></span>';
      this.scene.append(el);
      return { ...b, i, el, rect: null };
    });
    this.empty = {};
    createPointerField(root, { down: (p) => this.tap(p.x, p.y) });
    this.resize();
    this.newRound();
  }

  get rules() {
    return RULES[this.level];
  }

  resize() {
    const r = this.layout.playRect();
    const wide = r.w >= r.h;
    const n = this.bars.length;
    this.bars.forEach((b, i) => {
      const k = 1 - i * 0.08;
      let x;
      let y;
      let w;
      let h;
      if (wide) {
        const cw = r.w / n;
        w = Math.max(96, cw * 0.8);
        h = r.h * 0.92 * k;
        x = r.x + cw * i + (cw - w) / 2;
        y = r.y + (r.h - h) / 2;
      } else {
        const rh = r.h / n;
        h = Math.max(96, rh * 0.8);
        w = r.w * 0.94 * k;
        x = r.x + (r.w - w) / 2;
        y = r.y + rh * i + (rh - h) / 2;
      }
      b.rect = { x, y, w, h };
      const st = b.el.style;
      st.left = `${x}px`;
      st.top = `${y}px`;
      st.width = `${w}px`;
      st.height = `${h}px`;
      b.el.classList.toggle('upright', wide);
    });
  }

  newRound() {
    this.levels.begin();
    this.count = 0;
    this.wins = 0;
    this.locked = false;
    if (this.rules.seq) this.later(() => this.newSequence(true), 600);
  }

  newSequence(withVoice) {
    const seq = [];
    while (seq.length < this.rules.seq) {
      const i = Math.floor(Math.random() * this.bars.length);
      if (seq[seq.length - 1] !== i) seq.push(i);
    }
    this.seq = seq;
    this.demo(withVoice);
  }

  // La musique à répéter : chaque lame s'allume et chante à son tour.
  demo(withVoice) {
    this.locked = true;
    this.pos = 0;
    if (withVoice) this.audio.say('ecoute');
    const start = withVoice ? 1200 : 300;
    this.seq.forEach((i, k) => this.later(() => this.ring(this.bars[i], true), start + k * STEP_MS));
    this.later(() => {
      this.locked = false;
      if (withVoice) this.audio.say('a-toi');
    }, start + this.seq.length * STEP_MS);
  }

  ring(bar, glow) {
    this.audio.xylo(bar.note);
    replay(bar.el, glow ? 'glow' : 'ring');
  }

  barAt(x, y) {
    let best = null;
    let bestD = 40; // tolérance autour des lames
    this.bars.forEach((b) => {
      const { x: bx, y: by, w, h } = b.rect;
      const d = Math.hypot(Math.max(bx - x, 0, x - bx - w), Math.max(by - y, 0, y - by - h));
      if (d < bestD || (d === 0 && bestD > 0)) {
        bestD = d;
        best = b;
      }
    });
    return best;
  }

  tap(x, y) {
    const now = performance.now();
    const bar = this.barAt(x, y);
    if (!bar) {
      if (!ready(this.empty, now)) return;
      ripple(this.scene, x, y);
      this.audio.tap();
      return;
    }
    if (!ready(bar, now)) return;
    this.ring(bar, false);
    this.flyNote(bar, x, y);
    if (this.finished) return;

    if (!this.rules.seq) {
      this.count++;
      if (this.count >= this.rules.taps) this.complete();
      return;
    }
    if (this.locked) return;
    if (bar.i === this.seq[this.pos]) {
      this.pos++;
      if (this.pos < this.seq.length) return;
      this.locked = true;
      this.wins++;
      if (this.wins >= this.rules.wins) {
        this.complete();
        return;
      }
      this.later(() => this.bravo(), 400);
      this.later(() => this.newSequence(false), 1800);
    } else {
      // Pas la bonne lame : on réécoute tranquillement, sans aucun son négatif.
      this.levels.miss();
      this.locked = true;
      this.later(() => this.demo(false), 900);
    }
  }

  flyNote(bar, x, y) {
    const n = div('fly-note', NOTE_SVG(bar.color));
    n.style.left = `${x - 20}px`;
    n.style.top = `${y - 25}px`;
    n.addEventListener('animationend', () => n.remove(), { once: true });
    this.scene.append(n);
    setTimeout(() => n.remove(), 2000);
  }

  complete() {
    this.finished = true;
    this.later(() => {
      this.audio.say('musique');
      this.bars.forEach((b, k) => this.later(() => replay(b.el, 'ring'), k * 120));
      this.finishRound(() => {
        this.finished = false;
        this.newRound();
      }, { celebrateMs: 2200, say: false });
    }, 500);
  }
}

export default {
  id: 'orchestre',
  icon: ICON,
  create: () => new Music(),
};
