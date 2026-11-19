// Checkout step 1: validation, the phone picker, lead posting to webhooks, and opening step 2.
const { test, expect } = require('@playwright/test');
const { withConfig, catchWebhooks, rewritePage, fillLead } = require('./helpers');

test.use({ locale: 'en-US' });
const HOOKS = ['https://hooks.test/a', 'https://hooks.test/b'];
const KEYS = ['name', 'first_name', 'email', 'phone', 'country', 'offer', 'price', 'currency', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'session_id', 'page_url', 'referrer', 'submitted_at', 'consent'];
const payment = page => page.locator('[data-funnel-step="payment"]');
const cont = page => page.locator('[data-funnel-continue]');
async function ready(page) { await page.waitForFunction(() => document.querySelector('.iti__selected-country') && window.intlTelInput && window.intlTelInput.utils); }

test('empty submit shows every error and posts nothing', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: HOOKS } });
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html');
  await ready(page);
  await cont(page).click();
  await expect(page.locator('[data-funnel-error="name"]')).toHaveText('Please enter your name');
  await expect(page.locator('[data-funnel-error="email"]')).toHaveText('Please enter a valid email address');
  await expect(page.locator('[data-funnel-error="phone"]')).toHaveText('Please enter a valid phone number');
  await expect(payment(page)).toBeHidden();
  await page.waitForTimeout(300);
  expect(hooks.length).toBe(0);
});

test('an invalid email or phone is refused', async ({ page }) => {
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page, { email: 'not-an-email', phone: '123' });
  await cont(page).click();
  await expect(page.locator('[data-funnel-error="email"]')).toBeVisible();
  await expect(page.locator('[data-funnel-error="phone"]')).toBeVisible();
  await expect(page.locator('[data-funnel-error="name"]')).toBeHidden();
  await expect(payment(page)).toBeHidden();
});

test('an error clears when the field is edited', async ({ page }) => {
  await page.goto('/index.html');
  await ready(page);
  await cont(page).click();
  await page.fill('#mtf-name', 'Sam');
  await expect(page.locator('[data-funnel-error="name"]')).toBeHidden();
});

test('the consent box is optional and recorded in the lead', async ({ page }) => {
  await withConfig(page, { leads: { consentCheckbox: true, webhooks: ['https://hooks.test/a'] } });
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html');
  await ready(page);
  await expect(page.locator('[data-funnel-consent]')).toBeVisible();
  await fillLead(page);
  await cont(page).click();
  await expect(payment(page)).toBeVisible();
  await expect.poll(() => hooks.length).toBe(1);
  expect(new URLSearchParams(hooks[0].body).get('consent')).toBe('no');
});

test('a ticked consent box is sent as yes', async ({ page }) => {
  await withConfig(page, { leads: { consentCheckbox: true, webhooks: ['https://hooks.test/a'] } });
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await page.check('input[name="consent"]');
  await cont(page).click();
  await expect.poll(() => hooks.length).toBe(1);
  expect(new URLSearchParams(hooks[0].body).get('consent')).toBe('yes');
});

test('phone off hides the field and does not require it', async ({ page }) => {
  await withConfig(page, { leads: { phone: false } });
  await page.goto('/index.html');
  await expect(page.locator('[data-funnel-phone]')).toBeHidden();
  await fillLead(page, { phone: null });
  await cont(page).click();
  await expect(payment(page)).toBeVisible();
});

test.describe('phone country from the browser language', () => {
  test.describe(() => {
    test.use({ locale: 'nl-NL' });
    test('nl-NL picks the Netherlands', async ({ page }) => {
      await page.goto('/index.html');
      await ready(page);
      await expect(page.locator('.iti__selected-dial-code')).toHaveText('+31');
    });
  });
  test.describe(() => {
    test.use({ locale: 'en' });
    test('a language without a region falls back to the US', async ({ page }) => {
      await page.goto('/index.html');
      await ready(page);
      await expect(page.locator('.iti__selected-dial-code')).toHaveText('+1');
    });
  });
  test('regionFromLocales', async ({ page }) => {
    await page.goto('/index.html');
    expect(await page.evaluate(() => [Funnel.regionFromLocales(['fr', 'de-AT']), Funnel.regionFromLocales(['en']), Funnel.regionFromLocales([])])).toEqual(['at', 'us', 'us']);
  });
});

test('the lead is posted to every webhook, form-encoded, with every field', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: HOOKS } });
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html?utm_source=ig&utm_campaign=bf');
  await ready(page);
  await fillLead(page);
  await cont(page).click();
  await expect.poll(() => hooks.length).toBe(2);
  expect(hooks.map(h => h.url).sort()).toEqual(HOOKS);
  for (const h of hooks) {
    expect(h.method).toBe('POST');
    expect(h.headers['content-type']).toBe('application/x-www-form-urlencoded;charset=UTF-8');
    const body = new URLSearchParams(h.body);
    expect([...body.keys()]).toEqual(KEYS);
    expect(body.get('name')).toBe('Zoë O\'Brien');
    expect(body.get('first_name')).toBe('Zoë');
    expect(body.get('email')).toBe('a+b@x.io');
    expect(body.get('phone')).toBe('+12015550123');
    expect(body.get('country')).toBe('US');
    expect(body.get('offer')).toBe('Northstar Launch Lab');
    expect(body.get('price')).toBe('497');
    expect(body.get('utm_source')).toBe('ig');
    expect(body.get('utm_campaign')).toBe('bf');
    expect(body.get('session_id')).toMatch(/^[a-z0-9]{12,}$/);
    expect(isNaN(new Date(body.get('submitted_at')).getTime())).toBe(false);
  }
});

test('a hanging webhook does not hold up step 2', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: ['https://hooks.test/slow'] } });
  await catchWebhooks(page, { hang: ['/slow'] });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  const t0 = Date.now();
  await cont(page).click();
  await expect(payment(page)).toBeVisible({ timeout: 500 });
  expect(Date.now() - t0).toBeLessThan(1000);
});

test('a webhook that answers 500 causes no page error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await withConfig(page, { leads: { webhooks: ['https://hooks.test/fail'] } });
  await catchWebhooks(page, { status: { '/fail': 500 } });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await cont(page).click();
  await expect(payment(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test('an unreachable webhook only logs a warning', async ({ page }) => {
  const warnings = [], errors = [];
  page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await withConfig(page, { leads: { webhooks: ['https://hooks.test/down'] } });
  await catchWebhooks(page, { abort: ['/down'] });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await cont(page).click();
  await expect(payment(page)).toBeVisible();
  await expect.poll(() => warnings.some(w => w.includes('hooks.test/down'))).toBe(true);
  expect(errors).toEqual([]);
});

test('a double click posts the lead once per webhook', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: HOOKS } });
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await cont(page).dblclick();
  await expect(payment(page)).toBeVisible();
  await page.waitForTimeout(500);
  expect(hooks.length).toBe(2);
  expect(await page.evaluate(() => window.dataLayer.filter(e => e.event === 'lead_submit').length)).toBe(1);
});

test('Enter in the email field acts like one click', async ({ page }) => {
  await withConfig(page, { leads: { webhooks: ['https://hooks.test/a'] } });
  const hooks = await catchWebhooks(page);
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await page.press('#mtf-email', 'Enter');
  await page.press('#mtf-email', 'Enter').catch(() => {}); // the field may be hidden by now
  await expect(payment(page)).toBeVisible();
  await page.waitForTimeout(300);
  expect(hooks.length).toBe(1);
  expect(page.url()).toContain('/index.html');
});

for (const where of ['high', 'low']) {
  test(`continue does not scroll the page (button ${where} on screen)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/index.html');
    await ready(page);
    await fillLead(page);
    const box0 = await cont(page).boundingBox();
    const y = await page.evaluate(() => scrollY);
    await page.evaluate(([top, offset]) => window.scrollTo(0, top - offset), [box0.y + y, where === 'high' ? 120 : 760]);
    const before = await page.evaluate(() => scrollY);
    const box = await cont(page).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(payment(page)).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => scrollY)).toBe(before);
  });
}

test('on Webflow the native form is submitted too', async ({ page }) => {
  await rewritePage(page, '/index.html', html => html.replace('<form class="mtf-form-group" data-funnel-form novalidate>', '<div class="w-form"><form class="mtf-form-group" data-funnel-form novalidate>').replace('</form>', '</form></div>'));
  await page.addInitScript(() => {
    window.__submits = 0;
    document.addEventListener('submit', e => { window.__submits++; e.preventDefault(); }, true); // stands in for Webflow's handler
  });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await cont(page).click();
  await expect(payment(page)).toBeVisible();
  expect(await page.evaluate(() => window.__submits)).toBe(1);
});

test('step 2 shows the email and stores the first name', async ({ page }) => {
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await cont(page).click();
  await expect(page.locator('[data-funnel-summary]')).toHaveText('a+b@x.io');
  await expect(page.locator('[data-funnel-step="details"]')).toBeHidden();
  await expect(page.locator('[data-funnel-stepper] [data-step="2"]')).toHaveClass(/mtf-is-active/);
  expect(await page.evaluate(() => sessionStorage.getItem('mtf_first_name'))).toBe('Zoë');
});

test('firstName', async ({ page }) => {
  await page.goto('/index.html');
  expect(await page.evaluate(() => [Funnel.firstName('  Zoë   O\'Brien '), Funnel.firstName('<b>Zoë</b> x'), Funnel.firstName('')])).toEqual(['Zoë', '<b>Zoë</b>', '']);
});

test('fillTokens', async ({ page }) => {
  await page.goto('/index.html');
  const r = await page.evaluate(() => {
    const lead = { email: 'a+b@x.io', first_name: 'Zoë', name: 'Zoë O\'Brien', phone: '+12015550123' };
    return [Funnel.fillTokens('?e={email}&n={first_name}', lead, true), Funnel.fillTokens('{name} <{email}>', lead, false), Funnel.fillTokens('{unknown}-{phone}', lead, true)];
  });
  expect(r).toEqual(['?e=a%2Bb%40x.io&n=Zo%C3%AB', 'Zoë O\'Brien <a+b@x.io>', '{unknown}-%2B12015550123']);
});

test('a later visit with any utm replaces all stored utm values', async ({ page }) => {
  await page.goto('/index.html?utm_source=ig&utm_campaign=bf');
  await page.goto('/index.html?utm_medium=email');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mtf_utm')));
  expect(stored).toEqual({ utm_source: '', utm_medium: 'email', utm_campaign: '', utm_term: '', utm_content: '' });
  await page.goto('/index.html');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mtf_utm')).utm_medium)).toBe('email');
});

test('a visitor who opened step 2 before the deadline can still finish after it', async ({ page }) => {
  const end = '2026-12-01T22:00:00Z';
  await withConfig(page, { deadline: { endsAt: end, afterEnd: 'close' } });
  await page.clock.install({ time: new Date(new Date(end).getTime() - 20000) });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await cont(page).click();
  await expect(payment(page)).toBeVisible();
  await page.clock.runFor(30000);
  await expect(payment(page)).toBeVisible();
  await expect(page.locator('[data-funnel-ended]')).toBeHidden();
  // going back after the end shows the ended panel instead of the form
  await page.locator('[data-funnel-edit]').click();
  await expect(page.locator('[data-funnel-ended]')).toBeVisible();
  await expect(page.locator('[data-funnel-step="details"]')).toBeHidden();
});
