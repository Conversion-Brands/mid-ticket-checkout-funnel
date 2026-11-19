// Page behaviours: FAQ tabs and accordion, testimonial carousel, results marquee, sticky offer bar, video facade.
const { test, expect } = require('@playwright/test');
const { rewritePage } = require('./helpers');

test('FAQ tabs switch tab and panel', async ({ page }) => {
  await page.goto('/index.html');
  const tabs = page.locator('[data-funnel-faq-tab]');
  await expect(tabs.nth(0)).toHaveClass(/mtf-is-active/);
  await expect(page.locator('[data-funnel-faq-panel]').nth(0)).toBeVisible();
  await expect(page.locator('[data-funnel-faq-panel]').nth(1)).toBeHidden();
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveClass(/mtf-is-active/);
  await expect(tabs.nth(0)).not.toHaveClass(/mtf-is-active/);
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-funnel-faq-panel]').nth(1)).toBeVisible();
  await expect(page.locator('[data-funnel-faq-panel]').nth(0)).toBeHidden();
});

test('FAQ accordion opens and closes by click and keyboard', async ({ page }) => {
  await page.goto('/index.html');
  const item = page.locator('[data-funnel-faq-panel]').first().locator('[data-funnel-faq-item]').nth(1);
  const q = item.locator('[data-funnel-faq-q]'), a = item.locator('[data-funnel-faq-a]');
  await expect(a).toBeHidden();
  await expect(q).toHaveAttribute('aria-expanded', 'false');
  await q.click();
  await expect(a).toBeVisible();
  await expect(q).toHaveAttribute('aria-expanded', 'true');
  await q.click();
  await expect(a).toBeHidden();
  await q.focus();
  await page.keyboard.press('Enter');
  await expect(a).toBeVisible();
  await page.keyboard.press(' ');
  await expect(a).toBeHidden();
});

test.describe('carousel on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('arrows, dots and ends', async ({ page }) => {
    await page.goto('/index.html');
    const track = page.locator('[data-funnel-carousel]');
    const prev = page.locator('[data-funnel-carousel-prev]'), next = page.locator('[data-funnel-carousel-next]');
    await expect(prev).toHaveClass(/mtf-is-disabled/);
    const step = await track.evaluate(t => t.children[1].offsetLeft - t.children[0].offsetLeft);
    await next.click();
    await expect.poll(() => track.evaluate(t => Math.round(t.scrollLeft))).toBeGreaterThanOrEqual(step - 2);
    expect(await track.evaluate(t => t.scrollLeft)).toBeLessThanOrEqual(step + 2);
    const dots = page.locator('[data-funnel-carousel-dots] > *');
    const n = await dots.count();
    expect(n).toBeGreaterThan(1);
    expect(n).toBeLessThanOrEqual(await track.evaluate(t => t.children.length));
    await dots.nth(n - 1).click();
    await expect.poll(() => track.evaluate(t => Math.abs(t.scrollWidth - t.clientWidth - t.scrollLeft))).toBeLessThanOrEqual(2);
    await expect(next).toHaveClass(/mtf-is-disabled/);
    await expect(dots.nth(n - 1)).toHaveAttribute('aria-current', 'true');
  });
});

test('carousel controls hide when nothing scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await rewritePage(page, '/index.html', html => {
    let n = 0;
    return html.replace(/<div class="mtf-testimonial-card mtf-is-community" data-sample>[\s\S]*?<\/p><\/div><\/div>/g, m => (++n <= 2 ? m : ''));
  });
  await page.goto('/index.html');
  expect(await page.locator('[data-funnel-carousel] > *').count()).toBe(2);
  await expect(page.locator('[data-funnel-carousel-prev]')).toBeHidden();
  await expect(page.locator('[data-funnel-carousel-next]')).toBeHidden();
});

test('marquee rows are doubled with hidden clones', async ({ page }) => {
  await page.goto('/index.html');
  const rows = await page.$$eval('[data-funnel-marquee-row]', rs => rs.map(r => ({ all: r.children.length, hidden: r.querySelectorAll(':scope > [aria-hidden="true"]').length })));
  expect(rows.length).toBe(2);
  for (const r of rows) { expect(r.all).toBeGreaterThan(0); expect(r.all % 2).toBe(0); expect(r.hidden).toBe(r.all / 2); }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the marquee does not move', async ({ page }) => {
    await page.goto('/index.html');
    expect(await page.locator('[data-funnel-marquee-row]').first().evaluate(r => getComputedStyle(r).animationName)).toBe('none');
  });
});

test('sticky bar shows only between the checkout and the footer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/index.html');
  const bar = page.locator('[data-funnel-section="sticky"]');
  const visible = () => bar.evaluate(b => b.classList.contains('mtf-is-visible'));
  const scrollToEl = sel => page.evaluate(s => window.scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY), sel);
  await page.waitForTimeout(200);
  expect(await visible()).toBe(false);
  await expect(bar).toHaveAttribute('aria-hidden', 'true');
  expect(await bar.evaluate(b => b.inert)).toBe(true);
  await scrollToEl('#checkout');
  await page.waitForTimeout(300);
  expect(await visible()).toBe(false);
  await scrollToEl('[data-funnel-section="audience"]');
  await expect.poll(visible).toBe(true);
  await expect(bar).toHaveAttribute('aria-hidden', 'false');
  expect(await bar.evaluate(b => b.inert)).toBe(false);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(visible).toBe(false);
});

test('the video loads its embed on click', async ({ page }) => {
  await page.route('https://video.test/**', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>video</title>' }));
  await rewritePage(page, '/index.html', html => html.replace(/(<div class="mtf-video" data-funnel-video[^>]*>[\s\S]*?<template>)[\s\S]*?(<\/template>)/, '$1<iframe class="mtf-video-frame" title="Video" src="https://video.test/v1" allow="autoplay"></iframe>$2'));
  await page.goto('/index.html');
  await expect(page.locator('[data-funnel-video] iframe')).toHaveCount(0);
  await page.locator('[data-funnel-video]').click();
  await expect(page.locator('[data-funnel-video] iframe')).toHaveAttribute('src', 'https://video.test/v1');
  await expect(page.locator('[data-funnel-video] .mtf-video-poster')).toHaveCount(0);
});

test('a video with no embed does nothing on click', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/index.html');
  await page.locator('[data-funnel-video]').click();
  await expect(page.locator('[data-funnel-video] .mtf-video-poster')).toHaveCount(1);
  expect(errors).toEqual([]);
});
