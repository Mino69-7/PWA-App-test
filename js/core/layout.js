// Taille de l'écran, orientation, safe areas (encoche, barre du bas).

export const CORNER = 96; // taille de la zone cachée du bouton maison (haut gauche)

const probe = document.getElementById('safe-probe');
const state = {
  w: 0,
  h: 0,
  short: 0,
  landscape: false,
  safe: { top: 0, right: 0, bottom: 0, left: 0 },
};
const listeners = new Set();
let pending = 0;

function measure() {
  const cs = probe ? getComputedStyle(probe) : null;
  state.safe.top = cs ? parseFloat(cs.paddingTop) || 0 : 0;
  state.safe.right = cs ? parseFloat(cs.paddingRight) || 0 : 0;
  state.safe.bottom = cs ? parseFloat(cs.paddingBottom) || 0 : 0;
  state.safe.left = cs ? parseFloat(cs.paddingLeft) || 0 : 0;
  state.w = window.innerWidth;
  state.h = window.innerHeight;
  state.short = Math.min(state.w, state.h);
  state.landscape = state.w > state.h;
}

function notify() {
  pending = 0;
  measure();
  listeners.forEach((fn) => fn(state));
}

function schedule() {
  if (!pending) pending = requestAnimationFrame(notify);
}

export function init() {
  measure();
  window.addEventListener('resize', schedule);
  // Sur iOS, la taille n'est pas toujours à jour juste après la rotation.
  window.addEventListener('orientationchange', () => {
    schedule();
    setTimeout(schedule, 350);
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
}

export function size() {
  return state;
}

export function onResize(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Rectangle visible hors encoche et barre du bas.
export function safeRect(margin = 12) {
  const s = state.safe;
  return {
    x: s.left + margin,
    y: s.top + margin,
    w: state.w - s.left - s.right - 2 * margin,
    h: state.h - s.top - s.bottom - 2 * margin,
  };
}

// Zone de jeu : comme safeRect, mais en laissant libre le coin du bouton maison
// (bande à gauche en paysage, bande en haut en portrait).
export function playRect(margin = 12) {
  const r = safeRect(margin);
  const reserve = CORNER + 8 - margin;
  if (r.w > r.h) {
    r.x += reserve;
    r.w -= reserve;
  } else {
    r.y += reserve;
    r.h -= reserve;
  }
  return r;
}

// Répartit n objets dans un rectangle en grille, en choisissant le nombre de colonnes
// qui donne les plus grands objets. fill : part de la case occupée par l'objet.
export function arrange(rect, n, { fill = 0.78, max = 220 } = {}) {
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(rect.w / cols, rect.h / rows);
    if (!best || cell > best.cell) best = { cols, rows, cell };
  }
  const { cols, rows } = best;
  const cw = rect.w / cols;
  const ch = rect.h / rows;
  const size = Math.min(max, best.cell * fill);
  const points = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? n - row * cols : cols; // dernière rangée centrée
    const col = i - row * cols;
    const offset = (cols - inRow) * cw / 2;
    points.push({ x: rect.x + offset + cw * (col + 0.5), y: rect.y + ch * (row + 0.5) });
  }
  return { size, cols, rows, points };
}

// Découpe un rectangle en deux bandes (haut/bas en portrait, gauche/droite si demandé).
export function split(rect, ratio, vertical = true) {
  if (vertical) {
    const h1 = rect.h * ratio;
    return [{ x: rect.x, y: rect.y, w: rect.w, h: h1 }, { x: rect.x, y: rect.y + h1, w: rect.w, h: rect.h - h1 }];
  }
  const w1 = rect.w * ratio;
  return [{ x: rect.x, y: rect.y, w: w1, h: rect.h }, { x: rect.x + w1, y: rect.y, w: rect.w - w1, h: rect.h }];
}

// Canvas net mais pas trop lourd : densité de pixels plafonnée à 2.
export function fitCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(state.w * dpr);
  canvas.height = Math.round(state.h * dpr);
  canvas.style.width = `${state.w}px`;
  canvas.style.height = `${state.h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
