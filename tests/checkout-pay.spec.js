// Checkout step 2: the checkout providers (Whop, any embed, any link, none) and the failed-payment notice.
const { test, expect } = require('@playwright/test');
const { withConfig, stubWhop, rewritePage, fillLead } = require('./helpers');

test.use({ locale: 'en-US' });
const payment = page => page.locator('[data-funnel-step="payment"]');
async function ready(page) { await page.waitForFunction(() => window.intlTelInput && window.intlTelInput.utils); }
async function toStep2(page) { await ready(page); await fillLead(page); await page.locator('[data-funnel-continue]').click(); await expect(payment(page)).toBeVisible(); }
async function withEmbed(page, snippet) {
  await rewritePage(page, '/index.html', html => html.replace(/<template data-funnel-checkout-embed>[\s\S]*?<\/template>/, `<template data-funnel-checkout-embed>${snippet}</template>`));
}
async function blankPayTest(page) { await page.route('https://pay.test/**', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>pay</title>' })); }

test('Whop mounts with the plan, return URL and prefilled details', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'whop', whopPlan: 'plan_TEST123' } });
  await stubWhop(page);
  await page.goto('/index.html');
  await toStep2(page);
  await page.waitForFunction(() => window.__whop && window.__whop.mounted);
  const w = await page.evaluate(() => ({
    plan: __whop.checkout.plan, returnUrl: __whop.checkout.returnUrl, onComplete: typeof __whop.checkout.onComplete,
    email: __whop.element.buyerEmail, name: __whop.element.defaultValues.billingDetails.name, phone: __whop.element.defaultValues.phone,
    payBg: __whop.options.appearance.classes['whop-CheckoutPayButton'].backgroundColor,
    accent: (() => { const p = document.createElement('i'); p.style.color = 'var(--mtf-accent)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })(),
    mountedInPay: !!document.querySelector('[data-funnel-pay][data-whop-stub-mounted]'),
  }));
  expect(w.plan).toBe('plan_TEST123');
  expect(w.returnUrl).toBe(new URL('/welcome.html', page.url()).href);
  expect(w.onComplete).toBe('function');
  expect(w.email).toBe('a+b@x.io');
  expect(w.name).toBe('Zoë O\'Brien');
  expect(w.phone).toBe('+12015550123');
  expect(w.payBg).toBe(w.accent);
  expect(w.mountedInPay).toBe(true);
  await expect(page.locator('[data-funnel-checkout-missing]')).toBeHidden();
});

test('a double click mounts Whop once', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'whop', whopPlan: 'plan_TEST123' } });
  await stubWhop(page);
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await page.locator('[data-funnel-continue]').dblclick();
  await page.waitForFunction(() => window.__whop && window.__whop.mounted);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => __whop.calls.filter(c => c[0] === 'mount').length)).toBe(1);
});

test('the Whop script loads only when Whop is the provider', async ({ page }) => {
  const whopRequests = [];
  page.on('request', r => { if (r.url().includes('cdn.whop.com')) whopRequests.push(r.url()); });
  await page.goto('/index.html');
  await toStep2(page);
  await page.waitForTimeout(300);
  expect(whopRequests).toEqual([]);
});

test('Whop without a plan shows the missing panel and a warning', async ({ page }) => {
  const warnings = [];
  page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
  await withConfig(page, { checkout: { provider: 'whop', whopPlan: '' } });
  await page.goto('/index.html');
  await toStep2(page);
  await expect(page.locator('[data-funnel-checkout-missing]')).toBeVisible();
  expect(warnings.some(w => w.includes('checkout.whopPlan'))).toBe(true);
});

test('an embed gets the tokens and its scripts run, once per page view', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed' } });
  await blankPayTest(page);
  await withEmbed(page, '<iframe title="pay" src="https://pay.test/c?email={email}"></iframe><p class="who">Paying as {first_name}</p><script>window.__ran = (window.__ran || 0) + 1; window.__email = "{email}";</script>');
  await page.goto('/index.html');
  await toStep2(page);
  await expect(page.locator('[data-funnel-pay] iframe')).toHaveAttribute('src', 'https://pay.test/c?email=a%2Bb%40x.io');
  await expect(page.locator('[data-funnel-pay] .who')).toHaveText('Paying as Zoë');
  expect(await page.evaluate(() => [window.__ran, window.__email])).toEqual([1, 'a+b@x.io']);
  await page.locator('[data-funnel-edit]').click();
  await page.locator('[data-funnel-continue]').click();
  await expect(payment(page)).toBeVisible();
  expect(await page.evaluate(() => window.__ran)).toBe(1);
  await expect(page.locator('[data-funnel-pay] iframe')).toHaveCount(1);
});

test('a quote in a name cannot break an embed script', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed' } });
  await withEmbed(page, '<script>window.__name = "{name}";</script>');
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page, { name: 'Zoë "Z" <b>O\'Brien</b>' });
  await page.locator('[data-funnel-continue]').click();
  await expect(payment(page)).toBeVisible();
  expect(await page.evaluate(() => window.__name)).toBe('Zoë "Z" <b>O\'Brien</b>');
  await expect(page.locator('[data-funnel-pay] b')).toHaveCount(0);
});

test('embedHtml is used when the template is empty', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed', embedHtml: '<div id="emb">{first_name}</div>' } });
  await page.goto('/index.html');
  await toStep2(page);
  await expect(page.locator('#emb')).toHaveText('Zoë');
});

test('embed with no code shows the missing panel', async ({ page }) => {
  const warnings = [];
  page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
  await withConfig(page, { checkout: { provider: 'embed' } });
  await page.goto('/index.html');
  await toStep2(page);
  await expect(page.locator('[data-funnel-checkout-missing]')).toBeVisible();
  expect(warnings.some(w => w.includes('embed'))).toBe(true);
});

test('a throwing embed script leaves Edit details working', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed' } });
  await withEmbed(page, '<div id="e1">checkout</div><script>throw new Error("broken checkout")</script>');
  await page.goto('/index.html');
  await toStep2(page);
  await page.locator('[data-funnel-edit]').click();
  await expect(page.locator('[data-funnel-step="details"]')).toBeVisible();
  await expect(payment(page)).toBeHidden();
});

test('link mode sends the buyer to the checkout link with the email filled in', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'link', link: 'https://pay.test/buy?prefilled_email={email}' } });
  await blankPayTest(page);
  const events = [];
  page.on('console', m => { if (m.text().startsWith('dl:')) events.push(m.text().slice(3)); });
  await page.addInitScript(() => {
    window.dataLayer = [];
    const push = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = e => { console.log('dl:' + e.event); return push(e); };
  });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await Promise.all([
    page.waitForURL('https://pay.test/buy?prefilled_email=a%2Bb%40x.io'),
    page.locator('[data-funnel-continue]').click(),
  ]);
  expect(events).toContain('checkout_redirect');
});

test('provider none shows the missing panel and warns', async ({ page }) => {
  const warnings = [];
  page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
  await page.goto('/index.html');
  await toStep2(page);
  await expect(page.locator('[data-funnel-checkout-missing]')).toBeVisible();
  expect(warnings.some(w => w.includes('checkout.provider'))).toBe(true);
});

test('checkout_open is pushed with the provider', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed', embedHtml: '<div>x</div>' } });
  await page.goto('/index.html');
  await toStep2(page);
  expect(await page.evaluate(() => window.dataLayer.filter(e => e.event === 'checkout_open').map(e => e.provider))).toEqual(['embed']);
});

const NOTICES = {
  failed: 'Your payment didn’t go through. Please check your details and try again below.',
  canceled: 'Your payment was cancelled. You can try again below whenever you’re ready.',
  cancelled: 'Your payment was cancelled. You can try again below whenever you’re ready.',
};
for (const [status, text] of Object.entries(NOTICES)) {
  test(`payment=${status} shows the notice in view on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/index.html?payment=${status}#checkout`);
    const notice = page.locator('.mtf-pay-notice[role="alert"]');
    await expect(notice).toHaveText(text);
    await page.waitForTimeout(900);
    const box = await notice.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
  });
}

test('the notice goes away when step 2 opens', async ({ page }) => {
  await page.goto('/index.html?payment=failed#checkout');
  await expect(page.locator('.mtf-pay-notice')).toHaveCount(1);
  await toStep2(page);
  await expect(page.locator('.mtf-pay-notice')).toHaveCount(0);
});

test('paymentStatus', async ({ page }) => {
  await page.goto('/index.html');
  expect(await page.evaluate(() => [Funnel.paymentStatus('?payment=error'), Funnel.paymentStatus('?x=1'), Funnel.paymentStatus('?a=1&payment=cancelled'), Funnel.paymentStatus('?payment=failedx')])).toEqual(['failed', null, 'canceled', null]);
});

test('attributes that are not URLs get the plain value', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed' } });
  await withEmbed(page, '<div id="sb" customer-email="{email}" data-name="{name}" data-url="https://pay.test/x?e={email}"></div>');
  await page.goto('/index.html');
  await toStep2(page);
  const el = page.locator('#sb');
  await expect(el).toHaveAttribute('customer-email', 'a+b@x.io');
  await expect(el).toHaveAttribute('data-name', 'Zoë O\'Brien');
  await expect(el).toHaveAttribute('data-url', 'https://pay.test/x?e=a%2Bb%40x.io');
});

test('{last_name} is everything after the first name', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed', embedHtml: '<p id="ln">{first_name}|{last_name}</p>' } });
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page, { name: 'Zoë van der Berg' });
  await page.locator('[data-funnel-continue]').click();
  await expect(page.locator('#ln')).toHaveText('Zoë|van der Berg');
});

test('a name with an apostrophe or backtick cannot break a single-quoted or template-string embed script', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed' } });
  await withEmbed(page, "<script>window.__a = '{name}'; window.__b = `{name}`;</script>");
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page, { name: "Zoë O'Brien ${1+1}`" });
  await page.locator('[data-funnel-continue]').click();
  await expect(payment(page)).toBeVisible();
  expect(await page.evaluate(() => [window.__a, window.__b])).toEqual(["Zoë O'Brien ${1+1}`", "Zoë O'Brien ${1+1}`"]);
});

test('embed scripts run in order, waiting for external ones to load', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'embed' } });
  await page.route('https://pay.test/sdk.js', async r => { await new Promise(res => setTimeout(res, 300)); r.fulfill({ contentType: 'application/javascript', body: 'window.SDK = { ok: 42 };' }); });
  await withEmbed(page, '<script src="https://pay.test/sdk.js"></script><script>window.__init = SDK.ok;</script>');
  await page.goto('/index.html');
  await toStep2(page);
  await expect.poll(() => page.evaluate(() => window.__init)).toBe(42);
});

test('focus moves to step 2, and back to the form after Edit details', async ({ page }) => {
  await page.goto('/index.html');
  await toStep2(page);
  expect(await page.evaluate(() => !!document.activeElement.closest('[data-funnel-step="payment"]'))).toBe(true);
  await page.locator('[data-funnel-edit]').click();
  expect(await page.evaluate(() => document.activeElement.id)).toBe('mtf-name');
});

test('coming back from a link checkout with the Back button shows the form again', async ({ page }) => {
  await withConfig(page, { checkout: { provider: 'link', link: 'https://pay.test/buy?prefilled_email={email}' } });
  await page.route('https://pay.test/**', r => r.fulfill({ status: 204 })); // a 204 cancels the navigation, so the page stays
  await page.goto('/index.html');
  await ready(page);
  await fillLead(page);
  await page.locator('[data-funnel-continue]').click();
  await expect(payment(page)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('[data-funnel-step="details"]')).toBeVisible();
  await expect(payment(page)).toBeHidden();
});
