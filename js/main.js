// Démarrage : garde-fous, audio, menu d'accueil, routeur menu ↔ jeux, pause douce.

import { installGuards, createPointerField, nearest } from './core/input.js';
import * as layout from './core/layout.js';
import * as audio from './core/audio.js';
import * as effects from './core/effects.js';
import { createHomeGuard } from './core/homeGuard.js';
import { createSession, createPauseScreen } from './core/session.js';
import train from './games/train.js';
import bubbles from './games/bubbles.js';
import shapes from './games/shapes.js';
import colors from './games/colors.js';
import coloring from './games/coloring.js';
import peekaboo from './games/peekaboo.js';
import food from './games/food.js';
import music from './games/music.js';

// Pour ajouter un jeu : créer js/games/monjeu.js sur le même modèle et l'ajouter ici.
const GAMES = [train, bubbles, shapes, colors, coloring, peekaboo, food, music];
const FADE_MS = 600;

// Durée avant la pause douce. Pour tester : ajouter ?minutes=0.5 à l'adresse.
const LIMIT_MIN = parseFloat(new URLSearchParams(location.search).get('minutes')) || 15;

installGuards();
layout.init();
audio.init();

const app = document.getElementById('app');
const screen = document.getElementById('screen');
const services = { audio, layout, effects };

let current = null;   // jeu en cours (null sur le menu)
let busy = false;     // transition en cours
let paused = false;   // écran de pause affiché

const home = createHomeGuard(app, { onHome: showMenu });
const pause = createPauseScreen(app, {
  audio,
  onResume: () => endPause(true),
  onHome: () => {
    endPause(false);
    showMenu();
  },
});
const session = createSession({ limitMs: LIMIT_MIN * 60000, onLimit: startPause });

// Fondu doux entre deux écrans.
function swap(build) {
  if (busy) return;
  busy = true;
  screen.classList.add('hidden');
  setTimeout(() => {
    if (current) {
      current.stop();
      current = null;
    }
    screen.replaceChildren();
    build();
    void screen.offsetWidth;
    screen.classList.remove('hidden');
    busy = false;
  }, FADE_MS);
}

function buildMenu() {
  const menu = document.createElement('div');
  menu.className = 'menu';
  const tiles = GAMES.map((game, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.game = game.id;
    tile.innerHTML = game.icon;
    tile.style.animationDelay = `${-i * 0.9}s`;
    cell.append(tile);
    menu.append(cell);
    return { game, tile, x: 0, y: 0, reach: 0 };
  });
  screen.append(menu);

  createPointerField(menu, {
    down(p) {
      const box = menu.getBoundingClientRect();
      tiles.forEach((t) => {
        const r = t.tile.getBoundingClientRect();
        t.x = r.left - box.left + r.width / 2;
        t.y = r.top - box.top + r.height / 2;
        t.reach = r.width * 0.8;
      });
      const t = nearest(p.x, p.y, tiles);
      if (!t) return;
      p.item = t;
      t.tile.classList.add('pressed');
    },
    up(p) {
      const t = p.item;
      if (!t) return;
      t.tile.classList.remove('pressed');
      if (p.cancelled || Math.hypot(p.x - p.sx, p.y - p.sy) > 60) return;
      audio.note(5);
      launch(t.game);
    },
  });
}

function showMenu() {
  home.disable();
  swap(buildMenu);
}

function launch(game) {
  swap(() => {
    const root = document.createElement('div');
    root.className = 'game';
    root.dataset.game = game.id;
    screen.append(root);
    const instance = game.create();
    instance.init(root, services);
    if (!paused && !document.hidden) instance.start();
    current = instance;
    home.enable();
  });
}

function startPause() {
  paused = true;
  session.pause();
  if (current) current.stop();
  pause.show();
}

function endPause(restart) {
  paused = false;
  session.reset();
  pause.hide();
  if (restart && current && !document.hidden) current.start();
}

// Arrière-plan : on arrête tout proprement, et on reprend au retour.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (current) current.stop();
    audio.suspend();
    session.pause();
  } else {
    audio.resume();
    if (!paused) {
      session.resume();
      if (current) current.start();
    }
  }
});

layout.onResize(() => {
  if (current) current.resize();
});

buildMenu();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
