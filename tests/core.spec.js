// funnel.js core: settings, prices, in-page links, events and the placeholder banner.
const { test, expect } = require('@playwright/test');
const { withConfig, rewritePage } = require('./helpers');

async function rawConfig(page, js) {
  await page.route('**/funnel.config.js', r => r.fulfill({ contentType: 'application/javascript', body: js }));
}

test('config merges defaults', async ({ page }) => {
  await rawConfig(page, 'window.FUNNEL_CONFIG = { offer: { price: 297 } };');
  await page.goto('/index.html');
  const cfg = await page.evaluate(() => window.Funnel.config);
  expect(cfg.offer.price).toBe(297);
  expect(cfg.offer.compareAt).toBe(997);
  expect(cfg.checkout.provider).toBe('none');
  expect(cfg.deadline.afterEnd).toBe('close');
  expect(cfg.checkout.successUrl).toBe('welcome.html');
});

test('a missing config falls back to the defaults', async ({ page }) => {
  await rawConfig(page, '');
  await page.goto('/index.html');
  expect(await page.evaluate(() => window.Funnel.config.offer.currency)).toBe('USD');
});

test('webhooks given as a string become an array', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: 'https://hooks.test/a' } });
  await page.goto('/index.html');
  expect(await page.evaluate(() => window.Funnel.config.leads.webhooks)).toEqual(['https://hooks.test/a']);
});

test('empty webhook entries are dropped', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: ['', ' ', 'https://hooks.test/b'] } });
  await page.goto('/index.html');
  expect(await page.evaluate(() => window.Funnel.config.leads.webhooks)).toEqual(['https://hooks.test/b']);
});

test('formatPrice', async ({ page }) => {
  await page.goto('/index.html');
  const r = await page.evaluate(() => [Funnel.formatPrice(497, 'USD'), Funnel.formatPrice(165.67, 'USD'), Funnel.formatPrice(497, 'EUR')]);
  expect(r[0]).toBe('$497');
  expect(r[1]).toBe('$165.67');
  expect(r[2]).toContain('497');
  expect(r[2]).toContain('€');
});

test('prices render from the settings', async ({ page }) => {
  await rewritePage(page, '/index.html', html => html.replace('<body>', '<body><span data-funnel-price="savings">x</span>'));
  await page.goto('/index.html');
  const text = sel => page.locator(`[data-funnel-price="${sel}"]`).first().textContent();
  expect(await text('price')).toBe('$497');
  expect(await text('compare-at')).toBe('$997');
  expect(await text('savings')).toBe('$500');
  expect(await text('savings-percent')).toBe('50%');
});

test('every price element follows a changed price', async ({ page }) => {
  await withConfig(page, { offer: { price: 297, compareAt: 594 } });
  await page.goto('/index.html');
  const prices = await page.$$eval('[data-funnel-price="price"]', els => [...new Set(els.map(e => e.textContent))]);
  expect(prices).toEqual(['$297']);
  expect(await page.locator('[data-funnel-price="savings-percent"]').first().textContent()).toBe('50%');
});

test('CTA click pushes checkout_cta_click and jumps without animation', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('[data-funnel-section="hero"] a[href="#checkout"]').click();
  const top = await page.evaluate(() => document.getElementById('checkout').getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(-2);
  expect(top).toBeLessThanOrEqual(2);
  const y = await page.evaluate(() => scrollY);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  expect(await page.evaluate(() => window.dataLayer.filter(e => e.event === 'checkout_cta_click').length)).toBe(1);
});

test('sample banner shows the count and outlines on click', async ({ page }) => {
  await page.goto('/index.html');
  const n = await page.evaluate(() => Funnel.sampleCount());
  expect(n).toBeGreaterThan(1);
  await expect(page.locator('#mtf-sample-banner')).toHaveText(`${n} template placeholders left`);
  await page.locator('#mtf-sample-banner').click();
  expect(await page.evaluate(() => document.documentElement.classList.contains('mtf-show-samples'))).toBe(true);
});

test('sample banner singular', async ({ page }) => {
  let seen = 0;
  await rewritePage(page, '/index.html', html => html.replace(/(<[a-z][^>]*?) data-sample(?=[\s>])/gi, (m, pre) => (seen++ === 0 ? m : pre)));
  await page.goto('/index.html');
  await expect(page.locator('#mtf-sample-banner')).toHaveText('1 template placeholder left');
});

test('sampleWarnings false hides the banner', async ({ page }) => {
  await withConfig(page, { sampleWarnings: false });
  await page.goto('/index.html');
  await expect(page.locator('#mtf-sample-banner')).toHaveCount(0);
});

test('Funnel.version', async ({ page }) => {
  await page.goto('/index.html');
  expect(await page.evaluate(() => Funnel.version)).toBe('1.0.0');
});
