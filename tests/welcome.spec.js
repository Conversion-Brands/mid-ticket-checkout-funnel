// The welcome page: sections, the failed-payment bounce, the first-name greeting, confetti, layout.
const { test, expect } = require('@playwright/test');
const { rewritePage } = require('./helpers');

test('sections in order and noindex', async ({ page }) => {
  await page.goto('/welcome.html');
  expect(await page.$$eval('[data-funnel-section]', els => els.map(e => e.getAttribute('data-funnel-section')))).toEqual(['hero', 'steps', 'letter', 'footer']);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

for (const [status, target] of [['failed', 'failed'], ['canceled', 'canceled'], ['cancelled', 'cancelled'], ['error', 'error']]) {
  test(`status=${status} goes back to the checkout with a notice`, async ({ page }) => {
    await page.goto(`/welcome.html?payment=pay_x&status=${status}`);
    await page.waitForURL(`**/index.html?payment=${target}#checkout`);
    await expect(page.locator('.mtf-pay-notice')).toBeVisible();
  });
}

test('the welcome page is hidden before the bounce', async ({ page }) => {
  await rewritePage(page, '/welcome.html', html => html.replace('location.replace(', 'window.__target = ('));
  await page.goto('/welcome.html?payment=pay_x&status=failed');
  expect(await page.evaluate(() => [document.documentElement.style.visibility, window.__target])).toEqual(['hidden', 'index.html?payment=failed#checkout']);
});

test('status=succeeded stays on the welcome page', async ({ page }) => {
  await page.goto('/welcome.html?payment=pay_x&status=succeeded');
  await page.waitForTimeout(300);
  expect(page.url()).toContain('/welcome.html');
});

test('greets the buyer by first name', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('mtf_first_name', 'zoë'));
  await page.goto('/welcome.html');
  await expect(page.locator('[data-funnel-section="hero"] [data-funnel-greeting]')).toHaveText('You did it, Zoë!');
  await expect(page.locator('[data-funnel-section="letter"] [data-funnel-greeting]')).toHaveText('Hi Zoë,');
});

test('without a name the original text stays', async ({ page }) => {
  await page.goto('/welcome.html');
  await expect(page.locator('[data-funnel-section="hero"] [data-funnel-greeting]')).toHaveText('You did it!');
  await expect(page.locator('[data-funnel-section="letter"] [data-funnel-greeting]')).toHaveText('Hi there,');
});

test('a name is shown as text, never as HTML', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('mtf_first_name', '<b>Zoë</b>'));
  await page.goto('/welcome.html');
  await expect(page.locator('[data-funnel-section="hero"] [data-funnel-greeting]')).toHaveText('You did it, <b>Zoë</b>!');
  await expect(page.locator('[data-funnel-greeting] b')).toHaveCount(0);
});

async function recordConfetti(page) {
  await page.addInitScript(() => {
    window.__confetti = [];
    Object.defineProperty(window, 'confetti', { configurable: true, set() {}, get() { return o => { window.__confetti.push(o); }; } });
  });
}

test('confetti: three bursts in the theme colours', async ({ page }) => {
  await recordConfetti(page);
  await page.goto('/welcome.html');
  await expect.poll(() => page.evaluate(() => window.__confetti.length), { timeout: 3000 }).toBe(3);
  const calls = await page.evaluate(() => window.__confetti);
  for (const c of calls) {
    expect(c.zIndex).toBe(2000);
    expect(c.disableForReducedMotion).toBe(true);
    expect(c.colors.length).toBe(6);
    c.colors.forEach(col => expect(col).toMatch(/^#[0-9a-f]{6}$/));
  }
  expect(calls[0].colors[0]).toBe('#2b4aa8'); // --mtf-accent
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no confetti', async ({ page }) => {
    await recordConfetti(page);
    await page.goto('/welcome.html');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__confetti.length)).toBe(0);
  });
});

for (const w of [320, 390, 768, 1440]) {
  test(`welcome: no horizontal overflow at ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/welcome.html');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

test('welcome: no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/welcome.html');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('the welcome page shows the placeholder badge too', async ({ page }) => {
  await page.goto('/welcome.html');
  const n = await page.locator('[data-sample]').count();
  expect(n).toBeGreaterThan(0);
  await expect(page.locator('#mtf-sample-banner')).toHaveText(`${n} template placeholders left`);
});

test('sampleWarnings false hides the welcome badge', async ({ page }) => {
  await page.route('**/funnel.config.js', r => r.fulfill({ contentType: 'application/javascript', body: 'window.FUNNEL_CONFIG = { sampleWarnings: false };' }));
  await page.goto('/welcome.html');
  await expect(page.locator('#mtf-sample-banner')).toHaveCount(0);
});

test('Funnel.sampleCount works on the welcome page', async ({ page }) => {
  await page.goto('/welcome.html');
  expect(await page.evaluate(() => window.Funnel.sampleCount())).toBe(await page.locator('[data-sample]').count());
});

test('welcome placeholder links are tagged', async ({ page }) => {
  await page.goto('/welcome.html');
  expect(await page.$$eval('a[href="#"]', els => els.filter(a => !a.closest('[data-sample]')).map(a => a.textContent.trim()))).toEqual([]);
});
