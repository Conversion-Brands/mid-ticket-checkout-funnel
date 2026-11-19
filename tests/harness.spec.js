// Proves the test helpers work before any feature relies on them.
const { test, expect } = require('@playwright/test');
const { withConfig, catchWebhooks, stubWhop, blockStorage, rewritePage } = require('./helpers');

test('withConfig serves the sample config merged with overrides', async ({ page }) => {
  await withConfig(page, { offer: { price: 123 } });
  await page.goto('/index.html');
  expect(await page.evaluate(() => window.FUNNEL_CONFIG.offer.price)).toBe(123);
});

test('catchWebhooks records a form-encoded post', async ({ page }) => {
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html');
  await page.evaluate(() => fetch('https://hooks.test/a', { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ a: '1' }) }));
  await expect.poll(() => hooks.length).toBe(1);
  expect(hooks[0].method).toBe('POST');
  expect(hooks[0].body).toBe('a=1');
});

test('catchWebhooks can fail a hook', async ({ page }) => {
  const hooks = await catchWebhooks(page, { status: { '/fail': 500 } });
  await page.goto('/index.html');
  const status = await page.evaluate(() => fetch('https://hooks.test/fail', { method: 'POST' }).then(r => r.status));
  expect(status).toBe(500);
  expect(hooks.length).toBe(1);
});

test('stubWhop provides a recording WhopElements', async ({ page }) => {
  await stubWhop(page);
  await page.goto('/index.html');
  await page.evaluate(() => new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdn.whop.com/elements/amber/elements.js'; s.onload = r; document.head.appendChild(s); }));
  expect(await page.evaluate(() => typeof window.WhopElements)).toBe('function');
});

test('blockStorage makes storage throw', async ({ page }) => {
  await blockStorage(page);
  await page.goto('/index.html');
  expect(await page.evaluate(() => { try { localStorage.getItem('x'); return 'ok'; } catch (e) { return 'blocked'; } })).toBe('blocked');
});

test('rewritePage serves an edited page', async ({ page }) => {
  await rewritePage(page, '/index.html', html => html.replace('stub</p>', 'edited</p>'));
  await page.goto('/index.html');
  await expect(page.locator('#stub')).toHaveText('edited');
});
