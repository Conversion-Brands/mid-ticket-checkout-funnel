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
  const untagged = await page.$$eval('.mtf-testimonial-card', els => els.filter(e => !e.closest('[data-sample]') && !e.closest('[aria-hidden="true"]')).length);
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

test('the original design fonts come first, the free fonts are the fallback', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => document.fonts.ready);
  const stacks = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    display: getComputedStyle(document.querySelector('.mtf-heading-h1')).fontFamily,
    declared: [...document.fonts].map(f => f.family.replace(/["']/g, '')),
  }));
  expect(stacks.body).toMatch(/^"?PP Neue Montreal"?, "?Geist"?/);
  expect(stacks.display).toMatch(/^"?Very Vogue Text"?, "?Nicky Laatz Very Vogue Text"?, "?Instrument Serif"?/);
  expect(stacks.declared).toContain('Geist');
  expect(stacks.declared).toContain('Instrument Serif');
});

test('avatar stacks are separate images, so each face can be replaced', async ({ page }) => {
  await page.goto('/index.html');
  const stacks = await page.$$eval('.mtf-social-proof-avatars', els => els.map(e => ({ tag: e.tagName, faces: e.querySelectorAll('img.mtf-avatar').length, tagged: !!e.closest('[data-sample]') })));
  expect(stacks.length).toBe(3);
  for (const s of stacks) { expect(s.tag).toBe('DIV'); expect(s.faces).toBe(3); expect(s.tagged).toBe(true); }
});
