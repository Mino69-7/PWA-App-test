// Coloriage : on choisit un pot de couleur, puis un tap ou un glisser sur une partie
// de l'animal la colorie entièrement. Quand tout est colorié, l'animal fait la fête.
// Un doigt qui part du dessin ne change jamais la couleur (les pots sont à part).

import { Game, div } from '../core/game.js';
import { ripple, replay, clamp } from '../core/effects.js';
import { CLOTH, CLOTH_IDS } from '../data/art.js';
import { pick } from '../core/levels.js';

const BLANK = '#E4D6C2'; // parties pas encore coloriées : bien visibles sur le fond crème
const GAP = '#F7F1E8';
const EYE = '#7D6B61';
const NOTES = { rouge: 3, jaune: 5, bleu: 7, vert: 4, violet: 8, orange: 6 };
const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

// Chaque dessin : parties coloriables (dans l'ordre d'affichage) + détails non coloriables.
const DRAWINGS = {
  poisson: {
    level: 1,
    parts: ['M150 100 L192 64 Q182 100 192 136 Z', 'M78 66 Q102 26 128 66 Z', 'M30 100 Q30 58 95 58 Q160 58 162 100 Q160 142 95 142 Q30 142 30 100 Z'],
    details: `<circle cx="62" cy="92" r="8" fill="${EYE}"/><path d="M38 112 q8 6 16 0" stroke="${EYE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  },
  escargot: {
    level: 1,
    parts: ['M14 162 Q14 146 40 146 L150 146 L150 112 Q150 92 168 92 Q188 92 186 118 L184 160 Q182 176 160 176 L36 176 Q14 176 14 162 Z', circle(95, 108, 56), circle(95, 108, 26)],
    details: `<path d="M162 94 L154 64 M178 94 L186 64" stroke="#C9B8A8" stroke-width="4" stroke-linecap="round"/><circle cx="154" cy="62" r="5" fill="#C9B8A8"/><circle cx="186" cy="62" r="5" fill="#C9B8A8"/><circle cx="172" cy="112" r="5" fill="${EYE}"/>`,
  },
  coccinelle: {
    level: 1,
    parts: [circle(100, 52, 28), 'M100 74 Q38 74 40 128 Q44 180 100 182 Z', 'M100 74 Q162 74 160 128 Q156 180 100 182 Z'],
    details: `<g fill="${EYE}" opacity=".25"><circle cx="70" cy="110" r="9"/><circle cx="78" cy="150" r="8"/><circle cx="130" cy="110" r="9"/><circle cx="122" cy="150" r="8"/></g><path d="M90 28 L80 10 M110 28 L120 10" stroke="#C9B8A8" stroke-width="4" stroke-linecap="round"/><circle cx="90" cy="48" r="4" fill="${EYE}"/><circle cx="110" cy="48" r="4" fill="${EYE}"/>`,
  },
  tortue: {
    level: 2,
    parts: [`${oval(60, 152, 14, 16)} ${oval(140, 152, 14, 16)}`, circle(176, 126, 20), 'M30 142 Q30 66 100 66 Q170 66 170 142 Z', 'M62 128 Q62 92 100 92 Q138 92 138 128 Z'],
    details: `<circle cx="182" cy="120" r="4" fill="${EYE}"/><path d="M172 134 q6 4 12 0" stroke="${EYE}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },
  oiseau: {
    level: 2,
    parts: ['M50 100 L12 74 L18 128 Z', circle(100, 108, 56), 'M66 116 Q96 82 134 116 Q100 146 66 116 Z', 'M150 92 L186 104 L150 116 Z'],
    details: `<circle cx="130" cy="88" r="6" fill="${EYE}"/><path d="M88 164 v18 M112 164 v18" stroke="#C9B8A8" stroke-width="5" stroke-linecap="round"/>`,
  },
  papillon: {
    level: 3,
    parts: [
      'M98 96 Q60 18 28 44 Q8 66 30 92 Q50 104 98 100 Z',
      'M102 96 Q140 18 172 44 Q192 66 170 92 Q150 104 102 100 Z',
      'M98 106 Q50 106 40 140 Q38 174 70 168 Q94 158 98 112 Z',
      'M102 106 Q150 106 160 140 Q162 174 130 168 Q106 158 102 112 Z',
      'M92 64 Q100 50 108 64 L108 150 Q100 164 92 150 Z',
    ],
    details: `<path d="M96 56 Q86 34 76 32 M104 56 Q114 34 124 32" stroke="#C9B8A8" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="76" cy="32" r="5" fill="#C9B8A8"/><circle cx="124" cy="32" r="5" fill="#C9B8A8"/>`,
  },
  chat: {
    level: 3,
    parts: ['M146 168 Q196 160 186 104 Q183 94 175 104 Q180 146 142 154 Z', oval(104, 152, 52, 38), 'M62 66 L60 22 L94 46 Z', 'M138 66 L140 22 L106 46 Z', circle(100, 84, 42)],
    details: `<circle cx="84" cy="80" r="5.5" fill="${EYE}"/><circle cx="116" cy="80" r="5.5" fill="${EYE}"/><path d="M94 94 H106 L100 101 Z" fill="#D9A39D"/>`,
  },
  elephant: {
    level: 3,
    parts: ['M80 150 h22 v34 q0 6 -6 6 h-10 q-6 0 -6 -6 Z M132 150 h22 v34 q0 6 -6 6 h-10 q-6 0 -6 -6 Z', oval(124, 124, 58, 42), 'M34 104 Q18 136 28 164 Q34 174 44 166 Q36 138 52 116 Z', circle(62, 96, 34), oval(86, 92, 24, 30)],
    details: `<circle cx="48" cy="88" r="5" fill="${EYE}"/>`,
  },
};
const IDS = Object.keys(DRAWINGS);

const ICON = `<svg viewBox="0 0 100 100"><path d="M30 60 Q20 30 50 22 Q80 30 70 60 Z" fill="#C3B1DE"/><circle cx="36" cy="72" r="13" fill="#E39189"/><circle cx="64" cy="72" r="13" fill="#9EC3DA"/><circle cx="50" cy="84" r="11" fill="#F0D67E"/><circle cx="42" cy="38" r="5" fill="#FCF8F2" opacity=".7"/></svg>`;

const potSvg = (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="40" fill="${c.dark}"/><circle cx="50" cy="50" r="40" fill="${c.fill}"/><circle cx="36" cy="36" r="9" fill="#FCF8F2" opacity=".55"/></svg>`;

class Coloring extends Game {
  init(root, services) {
    this.setup(root, services, 'coloriage', 3);
    this.color = CLOTH_IDS[0];
    this.last = null;
    this.audio.preload(['joli', ...IDS.map((d) => `coloriage-${d}`), ...CLOTH_IDS.map((c) => `couleur-${c}`)]);

    this.paper = div('paper');
    this.palette = div('palette');
    root.append(this.palette);
    this.scene.append(this.paper);
    this.pots = CLOTH_IDS.map((id) => {
      const el = div('pot', potSvg(CLOTH[id]));
      el.dataset.color = id;
      this.palette.append(el);
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.choose(id);
      });
      return { el, id };
    });
    this.choose(this.color, true);
    this.bindPaint();
    this.newRound();
  }

  choose(id, quiet = false) {
    if (id === this.color && !quiet) {
      replay(this.pots.find((p) => p.id === id).el, 'wiggle');
      return;
    }
    this.color = id;
    this.pots.forEach((p) => p.el.classList.toggle('selected', p.id === id));
    if (quiet) return;
    this.audio.note(NOTES[id]);
    this.audio.say(`couleur-${id}`);
  }

  newRound() {
    this.levels.begin();
    this.finished = false;
    const choices = IDS.filter((d) => DRAWINGS[d].level === this.level && d !== this.last);
    const id = pick(choices.length ? choices : IDS);
    this.last = id;
    const d = DRAWINGS[id];
    const parts = d.parts.map((p, i) => `<path class="part" data-part="${i}" d="${p}" fill="${BLANK}" stroke="${GAP}" stroke-width="4" stroke-linejoin="round"/>`).join('');
    this.paper.innerHTML = `<svg viewBox="0 0 200 200" data-drawing="${id}">${parts}<g class="details">${d.details}</g></svg>`;
    this.parts = [...this.paper.querySelectorAll('.part')];
    this.filled = new Set();
    this.resize();
    this.later(() => this.audio.say(`coloriage-${id}`), 400);
  }

  resize() {
    const r = this.layout.playRect();
    const wide = r.w >= r.h;
    const pot = clamp(Math.min(wide ? r.h / 3 : r.w / 3, wide ? r.w * 0.16 : r.h * 0.16) * 0.86, 96, 130);
    const band = pot * 2 + 24;
    const [area, pal] = wide ? this.layout.split(r, (r.w - band) / r.w, false) : this.layout.split(r, (r.h - band) / r.h);
    const side = Math.min(area.w, area.h) * 0.96;
    const st = this.paper.style;
    st.width = `${side}px`;
    st.height = `${side}px`;
    st.left = `${area.x + (area.w - side) / 2}px`;
    st.top = `${area.y + (area.h - side) / 2}px`;

    // Pots : 2 colonnes × 3 en paysage (à droite), 3 colonnes × 2 en portrait (en bas).
    const grid = this.layout.arrange(pal, this.pots.length, { fill: 0.9, max: pot });
    const size = Math.max(96, grid.size);
    this.pots.forEach((p, i) => {
      const s = p.el.style;
      const { x, y } = grid.points[i];
      s.width = `${size}px`;
      s.height = `${size}px`;
      s.left = `${x - size / 2}px`;
      s.top = `${y - size / 2}px`;
    });
  }

  // Peinture : chaque doigt posé sur le dessin colorie les parties qu'il touche.
  bindPaint() {
    const active = new Set();
    const paper = this.paper;
    paper.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (active.size >= 3) return;
      active.add(e.pointerId);
      try { paper.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      this.paintAt(e.clientX, e.clientY, true);
    });
    paper.addEventListener('pointermove', (e) => {
      if (active.has(e.pointerId)) this.paintAt(e.clientX, e.clientY, false);
    });
    const end = (e) => active.delete(e.pointerId);
    paper.addEventListener('pointerup', end);
    paper.addEventListener('pointercancel', end);
    paper.addEventListener('lostpointercapture', end);
  }

  paintAt(cx, cy, generous) {
    if (this.finished) return;
    let part = document.elementFromPoint(cx, cy);
    if (!part || !part.classList || !part.classList.contains('part')) part = null;
    if (!part && generous) part = this.nearestPart(cx, cy);
    if (!part) {
      if (generous) {
        const box = this.root.getBoundingClientRect();
        ripple(this.root, cx - box.left, cy - box.top);
        this.audio.tap();
      }
      return;
    }
    const c = CLOTH[this.color].fill;
    if (part.getAttribute('fill') === c) return;
    part.setAttribute('fill', c);
    this.audio.note(NOTES[this.color]);
    const box = this.root.getBoundingClientRect();
    ripple(this.root, cx - box.left, cy - box.top, c, 90);
    this.filled.add(part);
    if (this.filled.size === this.parts.length) this.complete();
  }

  // Tap juste à côté d'une partie : on prend la plus proche.
  nearestPart(cx, cy) {
    const limit = this.paper.getBoundingClientRect().width * 0.12;
    let best = null;
    let bestD = Infinity;
    this.parts.forEach((p) => {
      const b = p.getBoundingClientRect();
      const dx = Math.max(b.left - cx, 0, cx - b.right);
      const dy = Math.max(b.top - cy, 0, cy - b.bottom);
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return bestD <= limit ? best : null;
  }

  complete() {
    this.finished = true;
    this.later(() => {
      replay(this.paper, 'party');
      this.audio.say('joli');
      this.finishRound(() => this.newRound(), { celebrateMs: 3200, say: false });
    }, 700);
  }
}

export default {
  id: 'coloriage',
  icon: ICON,
  create: () => new Coloring(),
};
