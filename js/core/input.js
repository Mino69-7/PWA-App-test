// Entrées tactiles : garde-fous anti-zoom, Pointer Events, hitbox élargie,
// objet le plus proche, anti-rebond, glisser-déposer tolérant.

export const DEBOUNCE_MS = 80;
const MAX_POINTERS = 3;    // au-delà, c'est sans doute la paume : on ignore
const DOUBLE_TAP_MS = 350;
const TAP_MOVE = 14;       // px : en dessous, c'est un tap et pas un glisser
const TAP_TIME = 350;      // ms

export function installGuards() {
  const block = (e) => e.preventDefault();
  const opts = { passive: false };
  ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'selectstart', 'dragstart', 'dblclick']
    .forEach((type) => document.addEventListener(type, block, opts));

  // Double-tap zoom : on annule un touchend trop proche du précédent.
  let lastEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = performance.now();
    if (now - lastEnd < DOUBLE_TAP_MS) e.preventDefault();
    lastEnd = now;
  }, opts);

  // Aucun scroll ni pincement.
  document.addEventListener('touchmove', block, opts);
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, opts);
}

// Anti-rebond par objet : renvoie false si l'objet a déjà réagi il y a moins de 80 ms.
export function ready(obj, now = performance.now()) {
  if (now - (obj.lastHit || 0) < DEBOUNCE_MS) return false;
  obj.lastHit = now;
  return true;
}

// Objet le plus proche dont la zone tactile (reach) contient le point.
// Chaque objet a x, y (centre) et reach (rayon de la zone tactile).
export function nearest(x, y, items, accept) {
  let best = null;
  let bestScore = Infinity;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (accept && !accept(it)) continue;
    const d = Math.hypot(it.x - x, it.y - y);
    if (d > it.reach) continue;
    const score = d / it.reach;
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}

// Suivi multi-doigts sur un élément, en coordonnées locales.
export function createPointerField(el, { down, move, up } = {}) {
  const active = new Map();
  let rect = el.getBoundingClientRect();

  function onDown(e) {
    if (active.size >= MAX_POINTERS) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    rect = el.getBoundingClientRect();
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = { id: e.pointerId, x, y, sx: x, sy: y, t0: performance.now(), item: null, cancelled: false, isTap: false };
    active.set(e.pointerId, p);
    if (down) down(p);
  }

  function onMove(e) {
    const p = active.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX - rect.left;
    p.y = e.clientY - rect.top;
    if (move) move(p);
  }

  function onEnd(e) {
    const p = active.get(e.pointerId);
    if (!p) return;
    active.delete(e.pointerId);
    p.cancelled = e.type !== 'pointerup';
    if (!p.cancelled) {
      p.x = e.clientX - rect.left;
      p.y = e.clientY - rect.top;
    }
    p.isTap = !p.cancelled
      && Math.hypot(p.x - p.sx, p.y - p.sy) < TAP_MOVE
      && performance.now() - p.t0 < TAP_TIME;
    if (up) up(p);
  }

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onEnd);
  el.addEventListener('pointercancel', onEnd);
  el.addEventListener('lostpointercapture', onEnd);
  return { active };
}

// Place un objet (élément carré de côté it.size) avec son centre en x, y.
export function moveItem(it, x, y, scale = 1, ms = 0) {
  it.x = x;
  it.y = y;
  const st = it.el.style;
  st.transition = ms ? `transform ${ms}ms cubic-bezier(.4,0,.2,1)` : 'none';
  st.transform = `translate3d(${x - it.size / 2}px, ${y - it.size / 2}px, 0) scale(${scale})`;
}

// Glisser-déposer tolérant : aimant vers la cible, retour doux sinon.
// Un simple tap sur l'objet l'envoie tout seul à sa place si autoTap() est vrai,
// sinon il déclenche onHint (aux niveaux plus avancés).
// onMiss(it, x, y) : l'objet a été lâché loin de sa cible, après un vrai glisser.
// Chaque objet : el, size, x, y, reach, magnet, home {x,y}, target {x,y},
// targetScale, done, busy, pointer (null si libre).
export function createSorter(el, { items, onPick, onPlace, onEmpty, onMiss, onHint, autoTap = () => true }) {
  const background = {};

  function settle(it, ms) {
    it.done = true;
    moveItem(it, it.target.x, it.target.y, it.targetScale || 1, ms);
    setTimeout(() => onPlace(it), ms);
  }

  createPointerField(el, {
    down(p) {
      const now = performance.now();
      const it = nearest(p.x, p.y, items(), (i) => !i.done && !i.busy && i.pointer === null);
      if (it) {
        if (!ready(it, now)) return;
        it.pointer = p.id;
        p.item = it;
        p.dx = it.x - p.x;
        p.dy = it.y - p.y;
        it.el.classList.add('held');
        if (onPick) onPick(it);
        moveItem(it, it.x, it.y, 1.08, 200);
      } else if (onEmpty && ready(background, now)) {
        onEmpty(p.x, p.y);
      }
    },
    move(p) {
      const it = p.item;
      if (!it) return;
      let x = p.x + p.dx;
      let y = p.y + p.dy;
      const d = Math.hypot(it.target.x - x, it.target.y - y);
      if (d < it.magnet) {
        const k = 1 - d / it.magnet;
        const pull = k * k * 0.6;
        x += (it.target.x - x) * pull;
        y += (it.target.y - y) * pull;
      }
      moveItem(it, x, y, 1.08, 0);
    },
    up(p) {
      const it = p.item;
      if (!it) return;
      it.pointer = null;
      it.el.classList.remove('held');
      const d = Math.hypot(it.target.x - it.x, it.target.y - it.y);
      const dropX = it.x;
      const dropY = it.y;
      if (!p.cancelled && p.isTap && autoTap()) {
        settle(it, 900);
      } else if (!p.cancelled && !p.isTap && d < it.magnet) {
        settle(it, 450);
      } else {
        // Mauvais endroit : retour doux, sans aucun son négatif.
        it.busy = true;
        moveItem(it, it.home.x, it.home.y, 1, p.isTap ? 250 : 700);
        setTimeout(() => { it.busy = false; }, p.isTap ? 250 : 700);
        if (p.cancelled) return;
        if (p.isTap) {
          if (onHint) onHint(it);
        } else if (onMiss && Math.hypot(dropX - it.home.x, dropY - it.home.y) > it.size * 0.6) {
          onMiss(it, dropX, dropY);
        }
      }
    },
  });
}
