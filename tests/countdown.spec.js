// The countdown and what the page does when the deadline passes.
const { test, expect } = require('@playwright/test');
const { withConfig } = require('./helpers');

const END = '2026-12-01T22:00:00Z';
const at = (ms) => new Date(new Date(END).getTime() + ms);

async function open(page, { clock, deadline }) {
  await withConfig(page, { deadline: Object.assign({ endsAt: END, afterEnd: 'close', endedLink: '' }, deadline || {}) });
  await page.clock.install({ time: clock });
  await page.goto('/index.html');
}
const texts = page => page.$$eval('[data-funnel-countdown]', els => [...new Set(els.map(e => e.textContent))]);
const allHidden = (page, sel) => page.$$eval(sel, els => els.length > 0 && els.every(e => e.hidden));
const allShown = (page, sel) => page.$$eval(sel, els => els.length > 0 && els.every(e => !e.hidden));

test('countdownParts', async ({ page }) => {
  await page.goto('/index.html');
  const r = await page.evaluate(() => [0, 90061000, -5, 100 * 86400000].map(ms => Funnel.countdownParts(ms)));
  expect(r[0]).toEqual({ d: '00', h: '00', m: '00', s: '00' });
  expect(r[1]).toEqual({ d: '01', h: '01', m: '01', s: '01' });
  expect(r[2]).toEqual({ d: '00', h: '00', m: '00', s: '00' });
  expect(r[3].d).toBe('100');
});

test('ticks', async ({ page }) => {
  await open(page, { clock: at(-12000) });
  await page.clock.pauseAt(at(-10000));
  const first = await texts(page);
  expect(first.length).toBe(1);
  expect(first[0]).toMatch(/^00D:00H:00M:(09|10)S$/);
  await page.clock.runFor(3000);
  const later = await texts(page);
  expect(Number(first[0].slice(-3, -1)) - Number(later[0].slice(-3, -1))).toBe(3);
});

test('close after the end', async ({ page }) => {
  await open(page, { clock: at(-5000) });
  expect(await allShown(page, '[data-funnel-sale]')).toBe(true);
  await page.clock.runFor(6000);
  expect(await allHidden(page, '[data-funnel-countdown-wrap]')).toBe(true);
  expect(await allHidden(page, '[data-funnel-sale]')).toBe(true);
  await expect(page.locator('[data-funnel-ended]')).toBeVisible();
  expect(await allHidden(page, '[data-funnel-step="details"]')).toBe(true);
});

test('endedLink shows a button to that page', async ({ page }) => {
  await open(page, { clock: at(1000), deadline: { endedLink: 'https://example.test/waitlist' } });
  const link = page.locator('[data-funnel-ended-link]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://example.test/waitlist');
});

test('no endedLink, no button', async ({ page }) => {
  await open(page, { clock: at(1000) });
  await expect(page.locator('[data-funnel-ended-link]')).toBeHidden();
});

test('close keeps a visitor already in step 2', async ({ page }) => {
  await open(page, { clock: at(-3000) });
  // simulate an open payment step (Task 7 opens it for real)
  await page.evaluate(() => {
    document.querySelector('[data-funnel-step="details"]').hidden = true;
    document.querySelector('[data-funnel-step="payment"]').hidden = false;
  });
  await page.clock.runFor(5000);
  expect(await allShown(page, '[data-funnel-step="payment"]')).toBe(true);
  await expect(page.locator('[data-funnel-ended]')).toBeHidden();
});

test('loaded after the end with close', async ({ page }) => {
  await open(page, { clock: at(60000) });
  await expect(page.locator('[data-funnel-ended]')).toBeVisible();
  expect(await allHidden(page, '[data-funnel-sale]')).toBe(true);
});

test('keep after the end', async ({ page }) => {
  await open(page, { clock: at(60000), deadline: { afterEnd: 'keep' } });
  expect(await allHidden(page, '[data-funnel-countdown-wrap]')).toBe(true);
  expect(await allShown(page, '[data-funnel-sale]')).toBe(true);
  await expect(page.locator('[data-funnel-ended]')).toBeHidden();
  expect(await allShown(page, '[data-funnel-step="details"]')).toBe(true);
});

for (const bad of ['2026-12-01T17:00:00', 'next friday', null]) {
  test(`bad endsAt ${JSON.stringify(bad)} hides the countdown and keeps the sale open`, async ({ page }) => {
    const warnings = [];
    page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
    await open(page, { clock: at(-60000), deadline: { endsAt: bad } });
    await page.clock.runFor(120000);
    if (bad === null) expect(warnings.filter(w => w.includes('deadline.endsAt'))).toEqual([]);
    else expect(warnings.some(w => w.includes('deadline.endsAt'))).toBe(true);
    expect(await allHidden(page, '[data-funnel-countdown-wrap]')).toBe(true);
    expect(await allShown(page, '[data-funnel-step="details"]')).toBe(true);
    await expect(page.locator('[data-funnel-ended]')).toBeHidden();
  });
}
