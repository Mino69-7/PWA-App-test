// Bulles magiques : chaque bulle contient une petite surprise (étoile, cœur, fleur, poisson)
// qui tombe au sol quand elle éclate. Niveaux : toutes les bulles → seulement une couleur
// (« les bulles bleues ! ») → seulement une surprise (« les étoiles ! ») → les deux en alternance.
// Les autres bulles rebondissent gentiment : jamais d'échec.
// Rendu Canvas 2D, objets pré-alloués (aucune allocation dans la boucle).

import { createPointerField, nearest, ready } from '../core/input.js';
import { Game } from '../core/game.js';

const COLORS = ['#F2C6C2', '#F5E6A8', '#C5DDBF', '#BFD8E6', '#D4C8E6', '#F6D5B8'];
const DARK = ['#E5A9A3', '#E8D27E', '#A8C9A0', '#93BCD6', '#B9A9D6', '#ECBC94'];
const COLOR_IDS = ['rose', 'jaune', 'vert', 'bleu', 'violet', 'orange'];
const DISTINCT = 4;           // aux niveaux « couleur », on garde 4 couleurs bien différentes
const ITEM_IDS = ['etoile', 'coeur', 'fleur', 'poisson'];
const NOTES = [3, 5, 4, 7, 8, 6];
const SHINE = '#FCF8F2';
const RIPPLE = '#E6DACB';
const POP_MS = 750;
const RIPPLE_MS = 900;
const RESPAWN_MS = 600;
const GROW_MS = 800;
const FALL_MS = 900;
const BOUNCE_MS = 600;
const MAX_BUBBLES = 6;
const GOAL = 6;               // surprises à récolter par manche
const DROPS = 7;
const TAU = Math.PI * 2;
const DROP_COS = [];
const DROP_SIN = [];
for (let j = 0; j < DROPS; j++) {
  DROP_COS.push(Math.cos((j * TAU) / DROPS));
  DROP_SIN.push(Math.sin((j * TAU) / DROPS));
}

const RULES = {
  1: { target: null, count: 0 },
  2: { target: 'color', count: 0 },
  3: { target: 'item', count: 0 },
  4: { target: 'mix', count: 1, speed: 1.2 },
};

// Surprises dessinées dans une boîte 100×100 (Path2D créés une seule fois).
const flower = [[50, 24], [76, 42], [66, 74], [34, 74], [24, 42]]
  .map(([x, y]) => `M${x - 17} ${y} a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0`).join(' ');
const ITEM_PATHS = [
  'M50 6 L62 36 L95 37 L69 57 L79 90 L50 71 L21 90 L31 57 L5 37 L38 36 Z',
  'M50 90 C16 66 2 46 8 27 C14 8 38 6 50 25 C62 6 86 8 92 27 C98 46 84 66 50 90 Z',
  flower,
  'M62 50 L96 26 L96 74 Z M8 50 C8 30 30 20 50 20 C72 20 84 36 84 50 C84 64 72 80 50 80 C30 80 8 70 8 50 Z',
].map((d) => new Path2D(d));

const easeOut = (k) => 1 - (1 - k) * (1 - k) * (1 - k);

const ICON = `<svg viewBox="0 0 100 100"><circle cx="40" cy="56" r="27" fill="#BFD8E6"/><path d="M40 42 L44 51 L54 51 L46 57 L49 67 L40 61 L31 67 L34 57 L26 51 L36 51 Z" fill="#FCF8F2"/><circle cx="70" cy="30" r="17" fill="#F2C6C2"/><path d="M70 40 C62 34 59 30 60 27 C61 23 67 23 70 27 C73 23 79 23 80 27 C81 30 78 34 70 40 Z" fill="#FCF8F2"/><circle cx="74" cy="76" r="11" fill="#D4C8E6"/></svg>`;

class Bubbles extends Game {
  init(root, services) {
    this.setup(root, services, 'bulles', 4);
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.empty = {};
    this.audio.preload([...COLOR_IDS.slice(0, DISTINCT).map((c) => `bulles-${c}`), ...ITEM_IDS.map((i) => `bulles-${i}`)]);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fill';
    this.scene.append(this.canvas);

    this.bubbles = [];
    for (let i = 0; i < MAX_BUBBLES; i++) {
      this.bubbles.push({ x: 0, y: 0, baseX: 0, r: 0, scale: 1, reach: 0, color: 0, item: 0, phase: 0, secs: 15, speed: 0, active: false, respawnAt: 0, born: 0, bounceAt: -1e9, lastHit: 0 });
    }
    this.pops = [];
    for (let i = 0; i < 8; i++) this.pops.push({ on: false, x: 0, y: 0, r: 0, t0: 0, color: 0 });
    this.ripples = [];
    for (let i = 0; i < 6; i++) this.ripples.push({ on: false, x: 0, y: 0, t0: 0 });
    this.treasures = [];
    for (let i = 0; i < GOAL; i++) this.treasures.push({ on: false, sx: 0, sy: 0, x: 0, y: 0, t0: 0, color: 0, item: 0 });

    this.loop = this.loop.bind(this);
    this.isActive = (b) => b.active;
    createPointerField(root, { down: (p) => this.tap(p.x, p.y) });

    this.resize();
    this.newRound();
  }

  get rules() {
    return RULES[this.level];
  }

  newRound() {
    this.levels.begin();
    this.collected = 0;
    this.finished = false;
    this.dance = false;
    for (let i = 0; i < GOAL; i++) this.treasures[i].on = false;
    const rules = this.rules;
    this.palette = rules.target ? DISTINCT : COLORS.length;
    let kind = rules.target;
    if (kind === 'mix') kind = Math.random() < 0.5 ? 'color' : 'item';
    this.kind = kind;
    this.want = kind === 'color' ? Math.floor(Math.random() * DISTINCT) : Math.floor(Math.random() * ITEM_IDS.length);
    this.count = this.baseCount + rules.count;
    const now = performance.now();
    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      b.active = false;
      b.respawnAt = 0;
      if (i < this.count) this.spawn(b, now, true);
    }
    if (kind) {
      const key = kind === 'color' ? `bulles-${COLOR_IDS[this.want]}` : `bulles-${ITEM_IDS[this.want]}`;
      this.later(() => this.audio.say(key), 500);
    }
  }

  resize() {
    const s = this.layout.size();
    this.ctx = this.layout.fitCanvas(this.canvas);
    this.w = s.w;
    this.h = s.h;
    this.ground = s.h - s.safe.bottom - Math.max(34, s.short * 0.06);
    // Diamètre ≥ 96 px, environ 22 % du petit côté.
    this.r = Math.max(48, Math.min(110, s.short * 0.11));
    this.baseCount = s.short >= 600 ? 5 : 4;
    this.badge = { x: s.w / 2, y: s.safe.top + Math.max(34, this.r * 0.55), r: Math.max(26, this.r * 0.42) };
    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      if (!b.active) continue;
      b.r = this.r * b.scale;
      b.reach = b.r * 1.6 + 16;
      b.baseX = Math.min(Math.max(b.baseX, b.r + 8), this.w - b.r - 8);
      b.speed = this.h / b.secs;
    }
    for (let i = 0; i < GOAL; i++) this.placeTreasure(this.treasures[i], i);
  }

  placeTreasure(t, i) {
    const span = Math.min(this.w * 0.8, GOAL * this.r * 1.3);
    t.x = this.w / 2 - span / 2 + (span * (i + 0.5)) / GOAL;
    t.y = this.ground;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  isTarget(b) {
    if (!this.kind) return true;
    return this.kind === 'color' ? b.color === this.want : b.item === this.want;
  }

  targetsOnScreen(except) {
    let n = 0;
    for (let i = 0; i < MAX_BUBBLES; i++) {
      const o = this.bubbles[i];
      if (o !== except && o.active && this.isTarget(o)) n++;
    }
    return n;
  }

  spawn(b, now, spread) {
    b.scale = 0.85 + Math.random() * 0.3;
    b.r = this.r * b.scale;
    b.reach = b.r * 1.6 + 16; // zone tactile bien plus large que la bulle
    b.color = this.pickColor(b);
    b.item = Math.floor(Math.random() * ITEM_IDS.length);
    // Toujours au moins deux bulles « à trouver » à l'écran.
    if (this.kind && this.targetsOnScreen(b) < 2) {
      if (this.kind === 'color') b.color = this.want;
      else b.item = this.want;
    }
    b.y = spread ? this.h * (0.25 + Math.random() * 0.55) : this.h * (0.5 + Math.random() * 0.3);
    b.baseX = this.pickX(b);
    b.x = b.baseX;
    b.secs = (13 + Math.random() * 5) / (this.rules.speed || 1);
    b.speed = this.h / b.secs;
    b.phase = Math.random() * TAU;
    b.active = true;
    b.respawnAt = 0;
    b.born = now;
    b.bounceAt = -1e9;
  }

  pickColor(self) {
    let c = 0;
    for (let tries = 0; tries < 12; tries++) {
      c = Math.floor(Math.random() * this.palette);
      let used = false;
      for (let i = 0; i < MAX_BUBBLES; i++) {
        const o = this.bubbles[i];
        if (o !== self && o.active && o.color === c) used = true;
      }
      if (!used) break;
    }
    return c;
  }

  // Choisit, parmi quelques positions au hasard, la plus éloignée des autres bulles.
  pickX(self) {
    const min = self.r + 12;
    const max = Math.max(min, this.w - self.r - 12);
    let best = min;
    let bestGap = -1;
    for (let tries = 0; tries < 10; tries++) {
      const x = min + Math.random() * (max - min);
      let gap = Infinity;
      for (let i = 0; i < MAX_BUBBLES; i++) {
        const o = this.bubbles[i];
        if (o === self || !o.active) continue;
        gap = Math.min(gap, Math.hypot(o.x - x, o.y - self.y) - o.r);
      }
      if (gap > bestGap) {
        bestGap = gap;
        best = x;
      }
    }
    return best;
  }

  tap(x, y) {
    const now = performance.now();
    const b = nearest(x, y, this.bubbles, this.isActive);
    if (b) {
      if (!ready(b, now)) return;
      if (this.finished || this.isTarget(b)) this.pop(b, now);
      else {
        // Pas celle qu'on cherche : la bulle rebondit doucement.
        b.bounceAt = now;
        this.levels.miss();
        this.audio.boing();
      }
      return;
    }
    // Tap dans le vide : jamais d'échec, une ondulation et une note douce.
    if (!ready(this.empty, now)) return;
    const rp = this.slot(this.ripples);
    rp.on = true;
    rp.x = x;
    rp.y = y;
    rp.t0 = now;
    this.audio.tap();
  }

  pop(b, now) {
    b.active = false;
    b.respawnAt = now + RESPAWN_MS;
    const p = this.slot(this.pops);
    p.on = true;
    p.x = b.x;
    p.y = b.y;
    p.r = b.r;
    p.t0 = now;
    p.color = b.color;
    this.audio.plop(NOTES[b.color]);
    if (this.finished || this.collected >= GOAL) return;
    // La surprise tombe et rejoint la collection au sol.
    const t = this.treasures[this.collected];
    this.placeTreasure(t, this.collected);
    t.on = true;
    t.sx = b.x;
    t.sy = b.y;
    t.t0 = now;
    t.color = b.color;
    t.item = b.item;
    this.collected++;
    if (this.collected === GOAL) {
      this.finished = true;
      this.later(() => {
        this.dance = true;
        this.finishRound(() => this.newRound(), { celebrateMs: 2400 });
      }, FALL_MS);
    }
  }

  // Emplacement libre d'un pool (ou le plus ancien).
  slot(pool) {
    let oldest = pool[0];
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].on) return pool[i];
      if (pool[i].t0 < oldest.t0) oldest = pool[i];
    }
    return oldest;
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(now, dt);
    this.draw(now);
    this.raf = requestAnimationFrame(this.loop);
  }

  update(now, dt) {
    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      if (!b.active) {
        if (i < this.count && b.respawnAt && now >= b.respawnAt) this.spawn(b, now, false);
        continue;
      }
      b.y -= b.speed * dt;
      b.x = b.baseX + Math.sin(b.phase + now * 0.0008) * b.r * 0.2;
      if (b.y < -b.r * 1.2) this.spawn(b, now, false);
    }
  }

  circle(x, y, r) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }

  item(k, x, y, size) {
    const c = this.ctx;
    c.save();
    c.translate(x - size, y - size);
    c.scale(size / 50, size / 50);
    c.fill(ITEM_PATHS[k]);
    c.restore();
  }

  draw(now) {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);

    c.fillStyle = RIPPLE;
    for (let i = 0; i < this.ripples.length; i++) {
      const rp = this.ripples[i];
      if (!rp.on) continue;
      const k = (now - rp.t0) / RIPPLE_MS;
      if (k >= 1) {
        rp.on = false;
        continue;
      }
      c.globalAlpha = 0.5 * (1 - k);
      this.circle(rp.x, rp.y, 14 + 76 * easeOut(k));
    }

    // Badge discret en haut : ce qu'on cherche.
    if (this.kind) {
      const bd = this.badge;
      c.globalAlpha = 0.9;
      c.fillStyle = this.kind === 'color' ? COLORS[this.want] : '#EFE5D6';
      this.circle(bd.x, bd.y, bd.r);
      c.fillStyle = this.kind === 'color' ? SHINE : '#C9B8A8';
      c.globalAlpha = this.kind === 'color' ? 0.6 : 1;
      if (this.kind === 'color') this.circle(bd.x - bd.r * 0.33, bd.y - bd.r * 0.35, bd.r * 0.22);
      else this.item(this.want, bd.x, bd.y, bd.r * 0.6);
    }

    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      if (!b.active) continue;
      const g = easeOut(Math.min(1, (now - b.born) / GROW_MS));
      let rr = b.r * (0.4 + 0.6 * g) * (1 + 0.025 * Math.sin(now * 0.0021 + b.phase));
      const bk = (now - b.bounceAt) / BOUNCE_MS;
      if (bk < 1) rr *= 1 + 0.12 * Math.sin(bk * Math.PI * 3) * (1 - bk);
      c.globalAlpha = g;
      c.fillStyle = COLORS[b.color];
      this.circle(b.x, b.y, rr);
      c.globalAlpha = 0.85 * g;
      c.fillStyle = SHINE;
      this.item(b.item, b.x, b.y + rr * 0.05, rr * 0.42);
      c.globalAlpha = 0.6 * g;
      this.circle(b.x - rr * 0.36, b.y - rr * 0.4, rr * 0.16);
    }

    for (let i = 0; i < this.pops.length; i++) {
      const p = this.pops[i];
      if (!p.on) continue;
      const k = (now - p.t0) / POP_MS;
      if (k >= 1) {
        p.on = false;
        continue;
      }
      const e = easeOut(k);
      c.fillStyle = COLORS[p.color];
      c.globalAlpha = 0.35 * (1 - k);
      this.circle(p.x, p.y, p.r * (1 + 0.45 * e));
      c.globalAlpha = 0.9 * (1 - k);
      const dist = p.r * (0.5 + 0.9 * e);
      const dr = p.r * 0.14 * (1 - 0.6 * k);
      for (let j = 0; j < DROPS; j++) this.circle(p.x + DROP_COS[j] * dist, p.y + DROP_SIN[j] * dist, dr);
    }

    // Les surprises récoltées, posées au sol (elles dansent en fin de manche).
    const size = this.r * 0.42;
    c.globalAlpha = 1;
    for (let i = 0; i < GOAL; i++) {
      const t = this.treasures[i];
      if (!t.on) continue;
      const k = Math.min(1, (now - t.t0) / FALL_MS);
      const e = easeOut(k);
      const bob = this.dance ? Math.abs(Math.sin(now * 0.006 + i)) * size * 0.6 : 0;
      const x = t.sx + (t.x - t.sx) * e;
      const y = t.sy + (t.y - t.sy) * e - bob;
      c.fillStyle = DARK[t.color];
      this.item(t.item, x, y, size * (0.8 + 0.2 * e));
    }
    c.globalAlpha = 1;
  }
}

export default {
  id: 'bulles',
  icon: ICON,
  create: () => new Bubbles(),
};
