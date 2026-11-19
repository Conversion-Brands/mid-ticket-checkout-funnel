// Shared test helpers. Nothing here ships to template users.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function deepMerge(base, extra) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  Object.keys(extra || {}).forEach(k => {
    out[k] = isObject(base && base[k]) && isObject(extra[k]) ? deepMerge(base[k], extra[k]) : extra[k];
  });
  return out;
}

// The repo's funnel.config.js, evaluated the way a browser would, or {} while it does not exist.
function sampleConfig() {
  const file = path.join(ROOT, 'funnel.config.js');
  if (!fs.existsSync(file)) return {};
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox.window.FUNNEL_CONFIG || {};
}

// Serve funnel.config.js as the sample config deep-merged with overrides.
async function withConfig(page, overrides) {
  const cfg = deepMerge(sampleConfig(), overrides || {});
  await page.route('**/funnel.config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.FUNNEL_CONFIG = ' + JSON.stringify(cfg) + ';',
  }));
  return cfg;
}

// Fulfil https://hooks.test/** and record every request.
// opts.status: { '/path': code } answers that path with the code; opts.hang: ['/path'] never answers.
async function catchWebhooks(page, opts) {
  opts = opts || {};
  const seen = [];
  await page.route('https://hooks.test/**', route => {
    const req = route.request();
    const p = new URL(req.url()).pathname;
    seen.push({ url: req.url(), method: req.method(), headers: req.headers(), body: req.postData() });
    if ((opts.hang || []).indexOf(p) !== -1) return; // never answered
    route.fulfill({ status: (opts.status || {})[p] || 200, body: 'ok', headers: { 'access-control-allow-origin': '*' } });
  });
  return seen;
}

// A stand-in for Whop Elements that records every call on window.__whop.
const WHOP_STUB = `
window.__whop = { calls: [], loads: (window.__whop && window.__whop.loads || 0) + 1 };
window.WhopElements = function (opts) {
  __whop.calls.push(['WhopElements', opts]); __whop.options = opts;
  return { checkout: { create: function (o) {
    __whop.calls.push(['checkout.create', o]); __whop.checkout = o;
    return { create: function (kind, o2) {
      __whop.calls.push(['create', kind, o2]); __whop.element = o2;
      return { mount: function (el) { __whop.calls.push(['mount']); __whop.mounted = el; el.setAttribute('data-whop-stub-mounted', '1'); } };
    } };
  } } };
};`;

async function stubWhop(page) {
  await page.route('https://cdn.whop.com/**', route => route.fulfill({ contentType: 'application/javascript', body: WHOP_STUB }));
}

// Make localStorage and sessionStorage throw, as in a locked-down browser.
async function blockStorage(page) {
  await page.addInitScript(() => {
    ['localStorage', 'sessionStorage'].forEach(k => {
      Object.defineProperty(window, k, { configurable: true, get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
  });
}

// Serve a page through fn(html) so a test can remove or add markup.
async function rewritePage(page, urlPath, fn) {
  await page.route('**' + urlPath + '*', async route => {
    if (new URL(route.request().url()).pathname !== urlPath) return route.continue();
    const res = await route.fetch();
    route.fulfill({ response: res, body: fn(await res.text()) });
  });
}

// Remove one top-level <tag data-funnel-section="name"> block (sections never nest).
function dropSection(html, name) {
  const re = new RegExp('<(section|footer|div)([^>]*data-funnel-section="' + name + '"[^>]*)>[\\s\\S]*?</\\1>\\s*<!-- /' + name + ' -->');
  if (!re.test(html)) throw new Error('section not found: ' + name);
  return html.replace(re, '');
}

module.exports = { withConfig, catchWebhooks, stubWhop, blockStorage, rewritePage, dropSection, sampleConfig, deepMerge, ROOT };
