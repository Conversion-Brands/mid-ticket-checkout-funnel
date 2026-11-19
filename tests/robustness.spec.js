// Robustness: any section can be deleted, storage can be blocked, nothing calls a third party by default.
const { test, expect } = require('@playwright/test');
const { rewritePage, dropSection, blockStorage, fillLead } = require('./helpers');

test.use({ locale: 'en-US' });
const PAGES = {
  '/index.html': ['announcement', 'hero', 'checkout', 'testimonials', 'audience', 'steps', 'included', 'letter', 'offer', 'faq', 'results', 'footer', 'sticky'],
  '/welcome.html': ['hero', 'steps', 'letter', 'footer'],
};

for (const [path, sections] of Object.entries(PAGES)) {
  for (const name of sections) {
    test(`${path} works without its ${name} section`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await rewritePage(page, path, html => dropSection(html, name));
      await page.goto(path);
      await expect(page.locator(`[data-funnel-section="${name}"]`)).toHaveCount(0);
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
      expect(errors).toEqual([]);
    });
  }
}

test('without the hero, the checkout still opens step 2', async ({ page }) => {
  await rewritePage(page, '/index.html', html => dropSection(html, 'hero'));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.intlTelInput && window.intlTelInput.utils);
  await fillLead(page);
  await page.locator('[data-funnel-continue]').click();
  await expect(page.locator('[data-funnel-step="payment"]')).toBeVisible();
});

test.describe('storage blocked', () => {
  test.beforeEach(async ({ page }) => { await blockStorage(page); });
  test('the sales page loads and the checkout still opens', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/index.html?utm_source=ig');
    await page.waitForFunction(() => window.intlTelInput && window.intlTelInput.utils);
    await fillLead(page);
    await page.locator('[data-funnel-continue]').click();
    await expect(page.locator('[data-funnel-step="payment"]')).toBeVisible();
    expect(errors).toEqual([]);
  });
  test('the welcome page keeps its original greeting', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/welcome.html');
    await expect(page.locator('[data-funnel-section="hero"] [data-funnel-greeting]')).toHaveText('You did it!');
    expect(errors).toEqual([]);
  });
});

for (const path of Object.keys(PAGES)) {
  test(`${path} makes no third-party requests with the sample settings`, async ({ page }) => {
    const outside = [];
    page.on('request', r => { const u = new URL(r.url()); if (!['127.0.0.1:4381', 'localhost:4381'].includes(u.host) && !['data:', 'blob:'].includes(u.protocol)) outside.push(r.url()); });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    expect(outside).toEqual([]);
  });

  for (const w of [320, 390, 768, 1440]) {
    test(`${path} at ${w}: no overflow, no console errors`, async ({ page }) => {
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(e.message));
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
}
