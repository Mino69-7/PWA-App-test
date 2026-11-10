// Vérifications des jeux de la V2 (train, coloriage, coucou, à table, orchestre, niveaux, voix).
import { test, expect } from '@playwright/test';

let errors;
test.beforeEach(({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => {
  expect(errors, 'aucune erreur dans la console').toEqual([]);
});

async function center(locator) {
  const b = await locator.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height };
}

async function launch(page, id, query = '') {
  await page.goto(`/${query}`);
  const t = await center(page.locator(`.tile[data-game=${id}]`));
  await page.touchscreen.tap(t.x, t.y);
  await expect(page.locator(`.game[data-game=${id}]`)).toBeAttached();
  await expect(page.locator('#screen')).not.toHaveClass(/hidden/);
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

test('train : chaque animal va dans la maison de la couleur de son foulard', async ({ page }) => {
  await launch(page, 'train');
  await page.waitForTimeout(2600); // arrivée du train
  const critters = page.locator('.critter');
  await expect(critters).toHaveCount(3);
  await expect(page.locator('.house')).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const c = critters.nth(i);
    const color = await c.getAttribute('data-color');
    const from = await center(c);
    const h = await center(page.locator(`.house[data-color=${color}]`));
    await drag(page, from, { x: h.x, y: h.y + h.h * 0.15 });
    await expect(c).toHaveClass(/inside/);
  }
  // Le train repart, puis revient vide chercher de nouveaux animaux devant les maisons.
  await expect(page.locator('.critter.peek')).toHaveCount(3, { timeout: 15000 });
  await page.waitForTimeout(2600);
  const next = page.locator('.critter');
  await expect(next).toHaveCount(3);
  const c = next.first();
  const color = await c.getAttribute('data-color');
  await drag(page, await center(c), await center(page.locator(`.wagon[data-color=${color}]`)));
  await expect(c).toHaveClass(/seated/);
});

test('train niveau 4 : 4 maisons, wagons neutres, un mauvais lâcher ramène l\'animal', async ({ page }) => {
  await launch(page, 'train', '?niveau=4');
  await page.waitForTimeout(2600);
  await expect(page.locator('.house')).toHaveCount(4);
  const c = page.locator('.critter').first();
  const color = await c.getAttribute('data-color');
  const wrong = page.locator(`.house:not([data-color=${color}])`).first();
  const from = await center(c);
  await drag(page, from, await center(wrong));
  await page.waitForTimeout(900);
  await expect(c).not.toHaveClass(/inside/);
  const back = await center(c);
  expect(Math.hypot(back.x - from.x, back.y - from.y)).toBeLessThan(4);
  // Tap sans aide automatique : la bonne maison est montrée, l'animal ne part pas tout seul.
  await page.touchscreen.tap(back.x, back.y);
  await expect(page.locator(`.house[data-color=${color}]`)).toHaveClass(/hint/);
  await expect(c).not.toHaveClass(/inside/);
});

test('coloriage : toucher une partie la colorie, glisser du dessin ne change pas de couleur', async ({ page }) => {
  await launch(page, 'coloriage');
  const pots = page.locator('.pot');
  await expect(pots).toHaveCount(6);
  const bleu = await center(page.locator('.pot[data-color=bleu]'));
  await page.touchscreen.tap(bleu.x, bleu.y);
  await expect(page.locator('.pot[data-color=bleu]')).toHaveClass(/selected/);

  // Pour chaque partie, un point qui la touche vraiment (certaines sont entourées par d'autres).
  const points = await page.evaluate(() => [...document.querySelectorAll('.paper .part')].map((part) => {
    const b = part.getBoundingClientRect();
    for (let fy = 0.5; fy < 1; fy += 0.04) {
      for (const sy of [fy, 1 - fy]) {
        for (let fx = 0.5; fx < 1; fx += 0.04) {
          for (const sx of [fx, 1 - fx]) {
            const x = b.left + b.width * sx;
            const y = b.top + b.height * sy;
            if (document.elementFromPoint(x, y) === part) return { x, y };
          }
        }
      }
    }
    return null;
  }));
  for (const p of points) {
    expect(p, 'chaque partie est touchable').not.toBeNull();
    await page.touchscreen.tap(p.x, p.y);
  }
  // Glisser depuis le dessin jusque sur les pots : la couleur choisie ne change pas.
  const paper = await center(page.locator('.paper'));
  const rouge = await center(page.locator('.pot[data-color=rouge]'));
  await drag(page, paper, rouge);
  await expect(page.locator('.pot[data-color=bleu]')).toHaveClass(/selected/);
  // Toutes les parties coloriées → l'animal fait la fête.
  await expect(page.locator('.paper')).toHaveClass(/party/, { timeout: 3000 });
});

test('coucou caché : toucher le bon buisson fait apparaître l\'animal', async ({ page }) => {
  await launch(page, 'coucou');
  await page.waitForTimeout(3400);
  const secret = page.locator('.hide[data-secret]');
  const s = await center(secret);
  await page.touchscreen.tap(s.x, s.y);
  await expect(secret).toHaveClass(/open/);
});

test('à table : donner son repas à chaque animal', async ({ page }) => {
  await launch(page, 'table');
  const dishes = page.locator('.dish');
  const count = await dishes.count();
  expect(count).toBe(2);
  for (let i = 0; i < count; i++) {
    const d = dishes.nth(i);
    await page.touchscreen.tap((await center(d)).x, (await center(d)).y); // niveau 1 : le tap suffit
    await expect(d).toHaveClass(/eaten/);
  }
});

test('à table niveau 4 : un aliment en trop, la manche se termine quand tous ont mangé', async ({ page }) => {
  await launch(page, 'table', '?niveau=4');
  await expect(page.locator('.dish')).toHaveCount(4);
  await expect(page.locator('.eater')).toHaveCount(3);
  const DIET = { lapin: 'carotte', chien: 'os', chat: 'poisson', souris: 'fromage', ours: 'miel', vache: 'herbe', poussin: 'mais', panda: 'bambou' };
  const eaters = page.locator('.eater');
  for (let i = 0; i < 3; i++) {
    const e = eaters.nth(i);
    const dish = page.locator(`.dish[data-food=${DIET[await e.getAttribute('data-animal')]}]`);
    await drag(page, await center(dish), await center(e));
    await expect(dish).toHaveClass(/eaten/);
  }
  await expect(page.locator('.dish.eaten')).toHaveCount(4, { timeout: 4000 });
});

test('orchestre : chaque lame joue, et « écoute et répète » au niveau 2', async ({ page }) => {
  await launch(page, 'orchestre');
  const bars = page.locator('.bar');
  await expect(bars).toHaveCount(5);
  const b = await center(bars.nth(2));
  await page.touchscreen.tap(b.x, b.y);
  await expect(page.locator('.fly-note')).toHaveCount(1);

  await launch(page, 'orchestre', '?niveau=2');
  // La lame à répéter s'allume.
  await expect(page.locator('.bar.glow')).toHaveCount(1, { timeout: 4000 });
});

test('niveaux : après 3 manches, le tap ne place plus la forme tout seul', async ({ page }) => {
  await launch(page, 'formes');
  for (let round = 0; round < 3; round++) {
    const pieces = page.locator('.piece:not(.placed)');
    await expect(pieces).toHaveCount(3, { timeout: 6000 });
    for (let i = 0; i < 3; i++) {
      const p = await center(page.locator('.piece:not(.placed)').first());
      await page.touchscreen.tap(p.x, p.y);
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(3500);
  }
  const p = page.locator('.piece').first();
  await expect(page.locator('.piece')).toHaveCount(3);
  const c = await center(p);
  await page.touchscreen.tap(c.x, c.y);
  await page.waitForTimeout(1200);
  await expect(p).not.toHaveClass(/placed/);
});

test('voix : toutes les phrases ont leur fichier audio', async ({ page, request }) => {
  await page.goto('/');
  const files = await page.evaluate(async () => {
    const { PHRASES } = await import('/js/data/phrases.js');
    return Object.keys(PHRASES).map((k) => `/audio/voix/${k}.mp3`);
  });
  expect(files.length).toBeGreaterThan(80);
  for (const f of files) expect((await request.get(f)).ok(), f).toBe(true);
});
