// The sales page markup: sections in order, sample content tagged, accessible images, no overflow.
const { test, expect } = require('@playwright/test');

const SECTIONS = ['announcement', 'hero', 'checkout', 'testimonials', 'audience', 'steps', 'included', 'letter', 'offer', 'faq', 'results', 'footer', 'sticky'];
const WIDTHS = [320, 390, 768, 1440];

test('has the 13 sections in order', async ({ page }) => {
  await page.goto('/index.html');
  const names = await page.$$eval('[data-funnel-section]', els => els.map(e => e.getAttribute('data-funnel-section')));
  expect(names).toEqual(SECTIONS);
});

test('sample content is tagged', async ({ page }) => {
  await page.goto('/index.html');
  expect(await page.locator('[data-sample]').count()).toBeGreaterThanOrEqual(20);
  const untagged = await page.$$eval('.mtf-testimonial-card', els => els.filter(e => !e.closest('[data-sample]')).length);
  expect(untagged).toBe(0);
});

test('every img has alt', async ({ page }) => {
  await page.goto('/index.html');
  expect(await page.$$eval('img', els => els.filter(e => !e.hasAttribute('alt')).map(e => e.outerHTML.slice(0, 80)))).toEqual([]);
});

for (const w of WIDTHS) {
  test(`no horizontal overflow at ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/index.html');
    await page.evaluate(() => document.fonts.ready);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(0);
  });
}

test('no console errors on load', async ({ page }) => {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/index.html');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('fonts load', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/["']/g, '')));
  expect(loaded).toContain('Geist');
  expect(loaded).toContain('Instrument Serif');
});
