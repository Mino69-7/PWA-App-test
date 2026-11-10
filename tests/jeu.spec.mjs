// Vérifications automatiques sur WebKit (iPhone et iPad, portrait et paysage).
import { test, expect } from '@playwright/test';

const GAMES = ['train', 'bulles', 'formes', 'couleurs', 'coloriage', 'coucou', 'table', 'orchestre'];
// Tout ce que l'enfant touche ou vise (les wagons et la locomotive ne sont que décor).
const TARGETS = '.piece, .hole, .ball, .basket-front, .house, .critter, .pot, .hide, .dish, .bar';
const MIN_TARGET = 95.5; // 96 px, à l'arrondi du moteur près

let errors;
test.beforeEach(({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => {
  expect(errors, 'aucune erreur dans la console').toEqual([]);
});

async function open(page, query = '') {
  await page.goto(`/${query}`);
  await expect(page.locator('.tile')).toHaveCount(GAMES.length);
}

async function center(locator) {
  const b = await locator.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height };
}

async function launch(page, id) {
  const t = await center(page.locator(`.tile[data-game=${id}]`));
  await page.touchscreen.tap(t.x, t.y);
  await expect(page.locator(`.game[data-game=${id}]`)).toBeAttached();
  await expect(page.locator('#screen')).not.toHaveClass(/hidden/);
}

async function longPress(page, x, y, ms) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function goHome(page) {
  await longPress(page, 40, 40, 2200);
  await expect(page.locator('.home')).toHaveClass(/visible/);
  await page.touchscreen.tap(48, 48);
  await expect(page.locator('.menu')).toBeAttached();
}

// Taille minimale, débordement et chevauchement du coin maison pour les objets d'un jeu.
async function measureTargets(page) {
  return page.evaluate((sel) => {
    const rects = [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect());
    const w = innerWidth;
    const h = innerHeight;
    return {
      count: rects.length,
      min: Math.min(...rects.map((r) => Math.min(r.width, r.height))),
      offscreen: rects.some((r) => r.left < -1 || r.top < -1 || r.right > w + 1 || r.bottom > h + 1),
      inCorner: rects.some((r) => r.left < 96 && r.top < 96),
    };
  }, TARGETS);
}

test('zoom, défilement et gestes du navigateur bloqués', async ({ page }) => {
  await open(page);
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', /user-scalable=no/);
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', /maximum-scale=1/);

  const css = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { touch: s.touchAction, position: s.position, overscroll: s.overscrollBehaviorY };
  });
  expect(css.touch).toBe('none');
  expect(css.position).toBe('fixed');

  // Pincement, menu contextuel, double-clic : annulés.
  const prevented = await page.evaluate(() => ['gesturestart', 'gesturechange', 'contextmenu', 'dblclick', 'selectstart']
    .map((type) => !document.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }))));
  expect(prevented).toEqual([true, true, true, true, true]);

  // Double-tap dans un jeu : pas de zoom, pas de défilement.
  await launch(page, 'bulles');
  const { width, height } = page.viewportSize();
  for (let i = 0; i < 3; i++) {
    await page.touchscreen.tap(width / 2, height / 2);
    await page.touchscreen.tap(width / 2, height / 2);
  }
  // Glisser vers le haut : la page ne doit pas défiler.
  await page.mouse.move(width / 2, height * 0.8);
  await page.mouse.down();
  await page.mouse.move(width / 2, height * 0.2, { steps: 8 });
  await page.mouse.up();
  const view = await page.evaluate(() => ({
    scale: window.visualViewport ? window.visualViewport.scale : 1,
    scrollY: window.scrollY,
    tooTall: document.documentElement.scrollHeight > innerHeight + 1,
  }));
  expect(view).toEqual({ scale: 1, scrollY: 0, tooTall: false });
});

test('installation : manifest et balises iOS', async ({ page, request }) => {
  await open(page);
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.orientation).toBeUndefined();
  await expect(page.locator('meta[name=apple-mobile-web-app-capable]')).toHaveAttribute('content', 'yes');
  await expect(page.locator('meta[name=apple-mobile-web-app-status-bar-style]')).toHaveCount(1);
  const icon = await page.locator('link[rel=apple-touch-icon]').getAttribute('href');
  const size = await page.evaluate((src) => new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok([img.naturalWidth, img.naturalHeight]);
    img.onerror = () => ok(null);
    img.src = src;
  }), icon);
  expect(size).toEqual([180, 180]);
  for (const f of manifest.icons) expect((await request.get(f.src)).ok()).toBe(true);
});

test('menu : grosses icônes sans texte, chaque jeu se lance', async ({ page }) => {
  await open(page);
  const tiles = page.locator('.tile');
  for (let i = 0; i < 4; i++) {
    const b = await tiles.nth(i).boundingBox();
    expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(MIN_TARGET);
  }
  expect((await page.locator('.menu').innerText()).trim()).toBe('');

  for (const id of GAMES) {
    await launch(page, id);
    // Pendant un jeu : aucune interface visible.
    await expect(page.locator('.home')).not.toHaveClass(/visible/);
    if (id === 'train') await page.waitForTimeout(2600); // le train arrive
    if (id !== 'bulles') {
      const m = await measureTargets(page);
      expect(m.count).toBeGreaterThan(0);
      expect(m.min, `taille des cibles (${id})`).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(m.offscreen, `objets hors écran (${id})`).toBe(false);
      expect(m.inCorner, `objets dans le coin maison (${id})`).toBe(false);
    }
    await goHome(page);
  }
});

test('coin caché : seul un appui de 2 s fait apparaître la maison', async ({ page }) => {
  await open(page);
  await launch(page, 'formes');
  const home = page.locator('.home');

  await page.touchscreen.tap(40, 40);
  await longPress(page, 40, 40, 800);
  for (let i = 0; i < 5; i++) await page.touchscreen.tap(40, 40);
  await page.waitForTimeout(300);
  await expect(home).not.toHaveClass(/visible/);

  await longPress(page, 40, 40, 2200);
  await expect(home).toHaveClass(/visible/);
  await page.waitForTimeout(5500);
  await expect(home).not.toHaveClass(/visible/);
  await expect(page.locator('.game')).toBeAttached();

  await goHome(page);
  await expect(page.locator('.game')).toHaveCount(0);
});

test('formes : un tap place la forme, un lâcher au mauvais endroit la ramène', async ({ page }) => {
  await open(page);
  await launch(page, 'formes');
  const pieces = page.locator('.piece');

  const a = await center(pieces.nth(0));
  await page.touchscreen.tap(a.x + a.w * 0.3, a.y + a.h * 0.3); // tap un peu à côté
  await expect(pieces.nth(0)).toHaveClass(/placed/);

  const b = await center(pieces.nth(1));
  const { height } = page.viewportSize();
  await page.mouse.move(b.x, b.y);
  await page.mouse.down();
  await page.mouse.move(b.x, Math.min(height - 5, b.y + 90), { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const back = await center(pieces.nth(1));
  expect(Math.hypot(back.x - b.x, back.y - b.y)).toBeLessThan(3);
  await expect(pieces.nth(1)).not.toHaveClass(/placed/);
});

test('couleurs : glisser une balle près de son panier la fait entrer', async ({ page }) => {
  await open(page);
  await launch(page, 'couleurs');
  const ball = page.locator('.ball').first();
  const color = await ball.getAttribute('data-color');
  const s = await center(ball);
  const k = await center(page.locator(`.basket-front[data-color=${color}]`));
  await page.mouse.move(s.x, s.y);
  await page.mouse.down();
  await page.mouse.move(k.x + k.w * 0.3, k.y - k.h * 0.4, { steps: 10 });
  await page.mouse.up();
  await expect(ball).toHaveClass(/in/);
});

test('pause douce : un tap ne fait rien, un appui long montre les boutons adulte', async ({ page }) => {
  await open(page, '?minutes=0.05');
  await launch(page, 'table');
  const pause = page.locator('.pause');
  await expect(pause).toHaveClass(/visible/, { timeout: 8000 });

  const { width, height } = page.viewportSize();
  for (let i = 0; i < 4; i++) await page.touchscreen.tap(width / 2, height / 2);
  await expect(page.locator('.adult')).not.toHaveClass(/visible/);
  await expect(pause).toBeAttached();

  await longPress(page, width / 2, height / 2, 2200);
  await expect(page.locator('.adult')).toHaveClass(/visible/);
  const r = await center(page.locator('.adult .resume'));
  await page.touchscreen.tap(r.x, r.y);
  await expect(pause).toHaveCount(0);
  await expect(page.locator('.game[data-game=table]')).toBeAttached();
});

test('rotation : la mise en page suit en direct', async ({ page }) => {
  await open(page);
  await launch(page, 'formes');
  const { width, height } = page.viewportSize();
  await page.setViewportSize({ width: height, height: width });
  await page.waitForTimeout(500);
  const m = await measureTargets(page);
  expect(m.min).toBeGreaterThanOrEqual(MIN_TARGET);
  expect(m.offscreen).toBe(false);
  expect(m.inCorner).toBe(false);
});

test('hors-ligne : après une première visite, le jeu se recharge sans réseau', async ({ page, context }) => {
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // le service worker contrôle maintenant la page
  await expect(page.locator('.tile')).toHaveCount(GAMES.length);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.tile')).toHaveCount(GAMES.length);
  await launch(page, 'bulles');
  await context.setOffline(false);
});
