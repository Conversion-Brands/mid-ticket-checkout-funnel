/*
  Mid-ticket Checkout Funnel - sales page behaviour.
  Template by The Conversion Brands (https://theconversionbrands.com). MIT licence.
  You should not need to edit this file: settings live in funnel.config.js, colours and fonts in css/theme.css.
  Every part looks for its elements by data-funnel-* attributes and skips itself when they are missing,
  so you can delete any section of the page.
*/
(function () {
  'use strict';

  var VERSION = '1.0.0';
  var DEFAULTS = {
    offer: { name: 'Your Program', price: 497, compareAt: 997, currency: 'USD' },
    deadline: { endsAt: null, afterEnd: 'close', endedLink: '' },
    leads: { webhooks: [], phone: true, consentCheckbox: false },
    checkout: { provider: 'none', whopPlan: '', whopAccent: 'gray', link: '', embedHtml: '', successUrl: 'welcome.html' },
    sampleWarnings: true
  };

  // ---------------------------------------------------------------- helpers
  function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(base, extra) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = isObject(base[k]) ? merge(base[k], {}) : base[k]; });
    Object.keys(extra || {}).forEach(function (k) {
      out[k] = isObject(base[k]) && isObject(extra[k]) ? merge(base[k], extra[k]) : extra[k];
    });
    return out;
  }
  function deepFreeze(o) { Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === 'object') deepFreeze(o[k]); }); return Object.freeze(o); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function onActivate(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
  }
  function jumpTo(y) { window.scrollTo(0, Math.max(0, y)); }
  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    var entry = { event: event };
    Object.keys(data || {}).forEach(function (k) { entry[k] = data[k]; });
    window.dataLayer.push(entry);
  }
  function warn(msg) { if (window.console) console.warn('Mid-ticket Checkout Funnel: ' + msg); }

  // ---------------------------------------------------------------- settings
  var cfg = merge(DEFAULTS, isObject(window.FUNNEL_CONFIG) ? window.FUNNEL_CONFIG : {});
  var hooks = cfg.leads.webhooks;
  if (typeof hooks === 'string') hooks = [hooks];
  cfg.leads.webhooks = (Array.isArray(hooks) ? hooks : []).filter(function (u) { return typeof u === 'string' && u.trim(); }).map(function (u) { return u.trim(); });
  deepFreeze(cfg);

  var Funnel = window.Funnel = {
    version: VERSION,
    config: cfg
  };

  // ---------------------------------------------------------------- prices
  Funnel.formatPrice = function (amount, currency) {
    var cents = amount % 1 !== 0;
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(amount);
    } catch (e) {
      return String(amount);
    }
  };
  (function prices() {
    var o = cfg.offer;
    var savings = Math.max(0, o.compareAt - o.price);
    var values = {
      'price': Funnel.formatPrice(o.price, o.currency),
      'compare-at': Funnel.formatPrice(o.compareAt, o.currency),
      'savings': Funnel.formatPrice(savings, o.currency),
      'savings-percent': (o.compareAt > 0 ? Math.round(savings / o.compareAt * 100) : 0) + '%'
    };
    $$('[data-funnel-price]').forEach(function (el) {
      var v = values[el.getAttribute('data-funnel-price')];
      if (v !== undefined) el.textContent = v;
    });
  })();

  // ---------------------------------------------------------------- in-page links: jump straight to the section (no animation)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    e.stopPropagation(); // Webflow's own script would animate the scroll
    if (id === 'checkout') track('checkout_cta_click', { section: (a.closest('[data-funnel-section]') || {}).getAttribute ? a.closest('[data-funnel-section]').getAttribute('data-funnel-section') : '' });
    jumpTo(target.getBoundingClientRect().top + window.pageYOffset);
  }, true);

  // @@MODULES@@

  // ---------------------------------------------------------------- template placeholders banner
  Funnel.sampleCount = function () { return document.querySelectorAll('[data-sample]').length; };
  (function sampleBanner() {
    var n = Funnel.sampleCount();
    if (!cfg.sampleWarnings || !n) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'mtf-sample-banner';
    b.textContent = n + (n === 1 ? ' template placeholder left' : ' template placeholders left');
    b.title = 'Click to outline the example content you still need to replace (see SETUP.md). Turn this off with sampleWarnings: false.';
    b.addEventListener('click', function () { document.documentElement.classList.toggle('mtf-show-samples'); });
    document.body.appendChild(b);
    if (window.console && console.info) console.info('Mid-ticket Checkout Funnel: ' + n + ' items marked data-sample still hold example content.', $$('[data-sample]'));
  })();
})();
