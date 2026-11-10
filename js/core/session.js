// Temps de jeu actif et pause douce au bout de 15 minutes.

import { attachLongPress, createRing, HOUSE_SVG } from './homeGuard.js';

const ADULT_MS = 6000;

// Compte le temps passé avec l'app au premier plan.
export function createSession({ limitMs, onLimit }) {
  let elapsed = 0;
  let last = performance.now();
  let running = true;
  let fired = false;

  function tick() {
    const now = performance.now();
    // Plafond par tick : un minuteur endormi en arrière-plan ne compte pas.
    if (running && !document.hidden) elapsed += Math.min(now - last, 2000);
    last = now;
    if (!fired && elapsed >= limitMs) {
      fired = true;
      onLimit();
    }
  }
  setInterval(tick, 1000);

  return {
    pause() {
      tick();
      running = false;
    },
    resume() {
      last = performance.now();
      running = true;
    },
    reset() {
      elapsed = 0;
      fired = false;
      last = performance.now();
      running = true;
    },
    elapsed: () => elapsed,
  };
}

const MOON_SVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#F5E6A8"/><path d="M29 49 q7 6 14 0" stroke="#B9A88F" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M57 49 q7 6 14 0" stroke="#B9A88F" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="28" cy="62" rx="7" ry="4.5" fill="#F2C6C2"/><ellipse cx="72" cy="62" rx="7" ry="4.5" fill="#F2C6C2"/><path d="M44 67 q6 4 12 0" stroke="#B9A88F" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const PLAY_SVG = `<svg viewBox="0 0 100 100"><path d="M36 24 L76 50 L36 76 Z" fill="#BCA996" stroke="#BCA996" stroke-width="10" stroke-linejoin="round"/></svg>`;

// Écran calme : lune qui se balance. Seul un appui long (2 s) montre
// les boutons adulte « reprendre » et « maison ».
export function createPauseScreen(parent, { audio, onResume, onHome }) {
  const el = document.createElement('div');
  el.className = 'pause';
  el.innerHTML = `
    <div class="moon-wrap">
      <div class="moon">${MOON_SVG}</div>
      <span class="zz z1"></span><span class="zz z2"></span><span class="zz z3"></span>
    </div>
    <div class="adult"><div class="resume">${PLAY_SVG}</div><div class="leave">${HOUSE_SVG}</div></div>`;
  const ring = createRing();
  el.append(ring.el);
  const adult = el.querySelector('.adult');
  let adultTimer = 0;
  let sayTimer = 0;
  let shown = false;

  attachLongPress(el, {
    ring,
    onStart(e) {
      ring.el.style.left = `${e.clientX - 36}px`;
      ring.el.style.top = `${e.clientY - 36}px`;
    },
    onDone() {
      adult.classList.add('visible');
      clearTimeout(adultTimer);
      adultTimer = setTimeout(() => adult.classList.remove('visible'), ADULT_MS);
    },
  });

  function bindButton(button, action) {
    let downId = null;
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downId = e.pointerId;
    });
    button.addEventListener('pointerup', (e) => {
      if (e.pointerId !== downId || !adult.classList.contains('visible')) return;
      downId = null;
      action();
    });
  }
  bindButton(el.querySelector('.resume'), () => onResume());
  bindButton(el.querySelector('.leave'), () => onHome());

  return {
    show() {
      if (shown) return;
      shown = true;
      el.classList.remove('leaving', 'visible');
      adult.classList.remove('visible');
      parent.append(el);
      void el.offsetWidth;
      el.classList.add('visible');
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => audio.say('pause'), 1800);
    },
    hide() {
      if (!shown) return;
      shown = false;
      clearTimeout(sayTimer);
      clearTimeout(adultTimer);
      adult.classList.remove('visible');
      el.classList.add('leaving');
      el.classList.remove('visible');
      setTimeout(() => { if (!shown) el.remove(); }, 650);
    },
  };
}
