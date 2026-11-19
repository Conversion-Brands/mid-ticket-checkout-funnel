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

  // shared page state
  var state = { ended: false };
  function hide(el) { el.hidden = true; }

  // ---------------------------------------------------------------- countdown and deadline
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  Funnel.countdownParts = function (msLeft) {
    var s = Math.max(0, Math.floor(msLeft / 1000));
    return { d: pad(Math.floor(s / 86400)), h: pad(Math.floor(s % 86400 / 3600)), m: pad(Math.floor(s % 3600 / 60)), s: pad(s % 60) };
  };
  Funnel.parseDeadline = function (value) {
    if (value === null || value === undefined || value === '') return null;
    var ok = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value);
    var d = ok ? new Date(value) : null;
    if (!d || isNaN(d.getTime())) {
      warn('deadline.endsAt "' + value + '" is not a date with a timezone, for example 2026-12-01T22:00:00Z. The countdown stays hidden and the offer stays open until it is fixed.');
      return null;
    }
    return d;
  };
  (function countdown() {
    var deadline = Funnel.parseDeadline(cfg.deadline.endsAt);
    var timers = $$('[data-funnel-countdown]');
    var wraps = $$('[data-funnel-countdown-wrap]');
    if (!deadline) { wraps.forEach(hide); return; }
    var timer;
    function endOffer() {
      if (state.ended) return;
      state.ended = true;
      clearInterval(timer);
      wraps.forEach(hide);
      if (cfg.deadline.afterEnd === 'keep') return;
      $$('[data-funnel-sale]').forEach(hide);
      var payment = $('[data-funnel-step="payment"]');
      if (payment && !payment.hidden) return; // a visitor already paying can finish
      showEnded();
    }
    function tick() {
      var left = deadline.getTime() - Date.now();
      var p = Funnel.countdownParts(left);
      var txt = p.d + 'D:' + p.h + 'H:' + p.m + 'M:' + p.s + 'S';
      timers.forEach(function (el) { el.textContent = txt; });
      if (left <= 0) endOffer();
    }
    tick();
    if (!state.ended) timer = setInterval(tick, 1000);
  })();
  function showEnded() {
    var details = $('[data-funnel-step="details"]');
    var payment = $('[data-funnel-step="payment"]');
    var stepper = $('[data-funnel-stepper]');
    var panel = $('[data-funnel-ended]');
    [details, payment, stepper].forEach(function (el) { if (el) el.hidden = true; });
    if (!panel) return;
    panel.hidden = false;
    var link = $('[data-funnel-ended-link]', panel);
    if (link && cfg.deadline.endedLink) { link.href = cfg.deadline.endedLink; link.hidden = false; }
  }

  // ---------------------------------------------------------------- storage (private mode and blocked site data must not break the page)
  function store(kind, key, value) { try { window[kind].setItem(key, value); } catch (e) { /* storage unavailable */ } }
  function load(kind, key) { try { return window[kind].getItem(key); } catch (e) { return null; } }

  // ---------------------------------------------------------------- lead data helpers
  Funnel.firstName = function (name) { return String(name || '').trim().split(/\s+/)[0] || ''; };
  Funnel.regionFromLocales = function (locales) {
    for (var i = 0; i < (locales || []).length; i++) {
      var m = /[-_]([a-z]{2})$/i.exec(locales[i] || '');
      if (m) return m[1].toLowerCase();
    }
    return 'us';
  };
  Funnel.fillTokens = function (text, lead, encode) {
    return String(text == null ? '' : text).replace(/\{(email|name|first_name|phone)\}/g, function (m, k) {
      var v = lead && lead[k] != null ? String(lead[k]) : '';
      return encode ? encodeURIComponent(v) : v;
    });
  };
  // UTM values: a visit with any utm_ parameter replaces all of them; otherwise the last stored set is kept
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var utm = (function () {
    var params = new URLSearchParams(location.search), fresh = {}, any = false;
    UTM_KEYS.forEach(function (k) { var v = params.get(k); fresh[k] = v || ''; if (v) any = true; });
    if (any) { store('localStorage', 'mtf_utm', JSON.stringify(fresh)); return fresh; }
    var saved = null;
    try { saved = JSON.parse(load('localStorage', 'mtf_utm') || 'null'); } catch (e) { saved = null; }
    var out = {};
    UTM_KEYS.forEach(function (k) { out[k] = saved && saved[k] ? String(saved[k]) : ''; });
    return out;
  })();
  var sessionId = load('sessionStorage', 'mtf_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    store('sessionStorage', 'mtf_session_id', sessionId);
  }
  Funnel.leadPayload = function (lead) {
    var p = new URLSearchParams(), o = cfg.offer;
    [['name', lead.name], ['first_name', lead.first_name], ['email', lead.email], ['phone', lead.phone], ['country', lead.country],
      ['offer', o.name], ['price', String(o.price)], ['currency', o.currency]].forEach(function (kv) { p.append(kv[0], kv[1] == null ? '' : String(kv[1])); });
    UTM_KEYS.forEach(function (k) { p.append(k, utm[k]); });
    p.append('session_id', sessionId);
    p.append('page_url', location.href);
    p.append('referrer', document.referrer || '');
    p.append('submitted_at', new Date().toISOString());
    return p;
  };
  // Fire and forget: a simple form-encoded request (no CORS preflight) to every webhook. Never awaited.
  Funnel.sendLead = function (lead) {
    cfg.leads.webhooks.forEach(function (url) {
      var fail = function () { warn('could not reach the lead webhook ' + url + ' (leads.webhooks in funnel.config.js).'); };
      try {
        fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body: Funnel.leadPayload(lead) }).catch(fail);
      } catch (e) { fail(); }
    });
  };

  // ---------------------------------------------------------------- checkout step 1: details
  var form = $('[data-funnel-form]');
  var detailsStep = $('[data-funnel-step="details"]');
  var paymentStep = $('[data-funnel-step="payment"]');
  var phone = form && $('input[name="phone"]', form);
  var phoneWrap = $('[data-funnel-phone]');
  var consent = $('[data-funnel-consent]');
  var iti = null;
  if (consent) consent.hidden = !cfg.leads.consentCheckbox;
  if (!cfg.leads.phone) {
    if (phoneWrap) phoneWrap.hidden = true;
    phone = null;
  }
  if (phone && window.intlTelInput) {
    var itiScript = $('script[src*="intlTelInput"]');
    var utilsUrl = itiScript ? itiScript.src.replace(/intlTelInput(\.min)?\.js.*$/, 'utils.js') : '';
    iti = window.intlTelInput(phone, {
      initialCountry: Funnel.regionFromLocales(navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]),
      separateDialCode: true,
      countrySearch: true,
      dropdownContainer: document.body, // keeps the country search box out of the form data
      autoPlaceholder: 'off',
      loadUtils: utilsUrl ? function () { return import(utilsUrl); } : undefined
    });
    var padPhone = function () {
      var b = phone.parentNode.querySelector('.iti__selected-country');
      if (b && b.offsetWidth) phone.style.paddingLeft = (b.offsetWidth + 12) + 'px';
    };
    phone.addEventListener('countrychange', padPhone);
    setTimeout(padPhone, 0);
    window.addEventListener('load', padPhone);
  }
  function wrapOf(input) { return input && input.closest('.mtf-input'); }
  function setError(key, msg, input) {
    var el = $('[data-funnel-error="' + key + '"]');
    if (el) { el.textContent = msg || ''; el.hidden = !msg; if (msg) el.setAttribute('role', 'alert'); }
    var w = wrapOf(input);
    if (w) w.classList.toggle('mtf-is-error', !!msg);
  }
  function field(name) { return form ? form.querySelector('[name="' + name + '"]') : null; }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function phoneValid() {
    if (!phone.value.trim()) return false;
    var v = iti && typeof iti.isValidNumber === 'function' ? iti.isValidNumber() : null;
    return v === true || (v === null && phone.value.replace(/\D/g, '').length >= 6); // null: number rules still loading
  }
  function validate() {
    var name = field('name'), email = field('email'), first = null;
    var checks = [
      ['name', name, name && name.value.trim(), 'Please enter your name'],
      ['email', email, email && EMAIL.test(email.value.trim()), 'Please enter a valid email address'],
      ['phone', phone, !phone || phoneValid(), 'Please enter a valid phone number'],
      ['consent', field('consent'), !cfg.leads.consentCheckbox || (field('consent') && field('consent').checked), 'Please tick the box to continue']
    ];
    checks.forEach(function (c) {
      setError(c[0], c[2] ? '' : c[3], c[1]);
      if (!c[2] && !first) first = c[1];
    });
    if (first && first.focus) first.focus();
    return !first;
  }
  if (form) {
    ['name', 'email', 'consent'].forEach(function (k) {
      var el = field(k);
      if (el) el.addEventListener(k === 'consent' ? 'change' : 'input', function () { setError(k, '', el); });
    });
    if (phone) ['input', 'countrychange'].forEach(function (ev) { phone.addEventListener(ev, function () { setError('phone', '', phone); }); });
  }

  function setStep(n) {
    $$('[data-funnel-stepper] [data-step]').forEach(function (s) {
      var on = Number(s.getAttribute('data-step')) <= n;
      s.classList.toggle('mtf-is-active', on);
      $$('.mtf-stepper-step-number', s).forEach(function (x) { x.classList.toggle('mtf-is-active', on); });
    });
  }
  function setHidden(name, value) {
    var el = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
    el.value = value;
  }

  var busy = false;
  function readLead() {
    var name = field('name').value.trim(), email = field('email').value.trim(), full = '', country = '';
    if (phone) {
      if (iti) {
        country = ((iti.getSelectedCountryData() || {}).iso2 || '').toUpperCase();
        full = iti.getNumber() || '';
        if (!full) { var dial = (iti.getSelectedCountryData() || {}).dialCode; full = (dial ? '+' + dial : '') + phone.value.replace(/\D/g, ''); }
      } else full = phone.value.trim();
    }
    return { name: name, first_name: Funnel.firstName(name), email: email, phone: full, country: country };
  }
  function submitDetails(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (busy || !form || !detailsStep || detailsStep.hidden) return;
    if (!validate()) return;
    busy = true;
    var lead = readLead();
    var webflowForm = form.closest('.w-form');
    if (webflowForm) { // Webflow stores the lead and runs its own form integrations
      Funnel.leadPayload(lead).forEach(function (v, k) { if (['name', 'email', 'phone'].indexOf(k) === -1) setHidden(k, v); });
      if (phone && lead.phone) phone.value = lead.phone;
      if (form.requestSubmit) form.requestSubmit(); else form.submit();
      if (iti && lead.phone) iti.setNumber(lead.phone); // show the national format again
    }
    Funnel.sendLead(lead);
    track('lead_submit', { offer: cfg.offer.name });
    openPayment(lead);
  }
  if (form) {
    $$('[data-funnel-continue]').forEach(function (btn) { btn.addEventListener('click', submitDetails); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') submitDetails(e);
    });
    if (!form.closest('.w-form')) form.addEventListener('submit', submitDetails); // never reload the page
  }

  // ---------------------------------------------------------------- checkout step 2: payment
  var payBox = $('[data-funnel-pay]');
  var missingPanel = $('[data-funnel-checkout-missing]');
  function absolute(url) { try { return new URL(url, location.href).href; } catch (e) { return url; } }
  function showMissing(why) { if (missingPanel) missingPanel.hidden = false; warn(why); }
  function themeColour(token) { // a theme token as rgb(), for checkout providers that take plain colours
    var probe = document.createElement('i');
    probe.style.color = 'var(' + token + ')';
    probe.style.display = 'none';
    document.body.appendChild(probe);
    var c = getComputedStyle(probe).color;
    probe.parentNode.removeChild(probe);
    return c;
  }

  // Whop Elements: the plan ID is all it needs (no API key for a public plan)
  var WHOP_SRC = 'https://cdn.whop.com/elements/amber/elements.js';
  var whop = { app: null, checkout: null, el: null, script: null };
  function whopAppearance() {
    var accent = themeColour('--mtf-accent'), onAccent = themeColour('--mtf-accent-ink'), line = themeColour('--mtf-line'), surface = themeColour('--mtf-surface');
    return {
      theme: { appearance: 'light', accentColor: cfg.checkout.whopAccent || 'gray', grayColor: 'sand' },
      variables: { '--radius': '8px' },
      classes: {
        'whop-Checkout': { backgroundColor: 'transparent' },
        'whop-CheckoutCollection': { backgroundColor: 'transparent', paddingLeft: '0px', paddingRight: '0px' },
        'whop-CheckoutDetails': { backgroundColor: 'transparent', paddingLeft: '0px', paddingRight: '0px' },
        'whop-CheckoutPayButton': { backgroundColor: accent, color: onAccent, borderRadius: '999px', minHeight: '56px', fontSize: '18px', fontWeight: '500' },
        'whop-EmailInput': { backgroundColor: surface, borderColor: line, minHeight: '48px', fontSize: '16px' },
        'whop-CardFieldInput': { backgroundColor: surface, borderColor: line },
        'whop-AddressGroup': { backgroundColor: surface, borderColor: line },
        'whop-PaymentMethods': { backgroundColor: surface, borderColor: line, borderRadius: '12px' },
        'whop-PaymentMethodRadioSelected': { borderColor: accent, backgroundColor: accent }
      }
    };
  }
  function unmountWhop() {
    if (whop.el && whop.el.destroy) whop.el.destroy();
    if (whop.checkout && whop.checkout.destroy) whop.checkout.destroy();
    whop.el = whop.checkout = null;
    if (payBox) payBox.innerHTML = '';
  }
  function mountWhop(lead) {
    if (!cfg.checkout.whopPlan) { showMissing('checkout.provider is "whop" but checkout.whopPlan is empty. Add your Whop plan ID in funnel.config.js.'); return; }
    if (!window.WhopElements) {
      if (!whop.script) {
        whop.script = document.createElement('script');
        whop.script.async = true;
        whop.script.src = WHOP_SRC;
        whop.script.setAttribute('data-whop-elements', '');
        whop.script.onerror = function () { if (payBox) payBox.textContent = 'The checkout could not load. Please refresh the page and try again.'; };
        document.head.appendChild(whop.script);
      }
      whop.script.addEventListener('load', function () { mountWhop(lead); }, { once: true });
      return;
    }
    unmountWhop();
    if (!whop.app) whop.app = window.WhopElements({ appearance: whopAppearance() });
    var success = absolute(cfg.checkout.successUrl);
    var opts = { plan: cfg.checkout.whopPlan, returnUrl: success, onComplete: function () { location.assign(success); } };
    var attribution = { utmSource: utm.utm_source, utmMedium: utm.utm_medium, utmCampaign: utm.utm_campaign, utmTerm: utm.utm_term, utmContent: utm.utm_content };
    Object.keys(attribution).forEach(function (k) { if (!attribution[k]) delete attribution[k]; });
    if (Object.keys(attribution).length) opts.attribution = attribution;
    whop.checkout = whop.app.checkout.create(opts);
    var props = { buyerEmail: lead.email, defaultValues: { billingDetails: { name: lead.name } } };
    if (lead.phone) props.defaultValues.phone = lead.phone;
    whop.el = whop.checkout.create('checkout', props);
    whop.el.mount(payBox);
  }

  // Any embed: the owner's snippet, with {email} {name} {first_name} {phone} filled in for each place they appear:
  // URL-encoded in attributes, as plain text in text, JavaScript-escaped inside scripts.
  var embedMounted = false;
  function hasContent(frag) {
    return Array.prototype.some.call(frag.childNodes, function (n) { return n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()); });
  }
  function embedSource() {
    var t = $('template[data-funnel-checkout-embed]');
    if (t && t.content && hasContent(t.content)) return t.innerHTML;
    return cfg.checkout.embedHtml || '';
  }
  function jsEscape(lead) {
    var out = {};
    Object.keys(lead).forEach(function (k) { out[k] = JSON.stringify(String(lead[k] == null ? '' : lead[k])).slice(1, -1).replace(/<\//g, '<\\/'); });
    return out;
  }
  function fillNode(node, lead) {
    if (node.nodeType === 1) {
      Array.prototype.forEach.call(node.attributes, function (a) { if (/\{(email|name|first_name|phone)\}/.test(a.value)) a.value = Funnel.fillTokens(a.value, lead, true); });
      if (node.tagName === 'SCRIPT') { node.textContent = Funnel.fillTokens(node.textContent, jsEscape(lead), false); return; }
    } else if (node.nodeType === 3) {
      node.nodeValue = Funnel.fillTokens(node.nodeValue, lead, false);
      return;
    }
    Array.prototype.forEach.call(node.childNodes, function (c) { fillNode(c, lead); });
  }
  function mountEmbed(lead) {
    if (embedMounted) return;
    var src = embedSource();
    if (!src.trim()) { showMissing('checkout.provider is "embed" but there is no embed code. Paste it into <template data-funnel-checkout-embed> in index.html, or into checkout.embedHtml.'); return; }
    var tpl = document.createElement('template');
    tpl.innerHTML = src;
    var frag = tpl.content;
    Array.prototype.forEach.call(frag.childNodes, function (c) { fillNode(c, lead); });
    Array.prototype.forEach.call(frag.querySelectorAll('script'), function (old) {
      var s = document.createElement('script');
      Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old); // a new script element runs; one set through innerHTML does not
    });
    payBox.appendChild(frag);
    embedMounted = true;
  }

  var openCheckout = function (lead) {
    if (missingPanel) missingPanel.hidden = true;
    var provider = cfg.checkout.provider;
    track('checkout_open', { provider: provider });
    if (provider === 'whop') return mountWhop(lead);
    if (provider === 'embed') return mountEmbed(lead);
    if (provider === 'link') {
      if (!cfg.checkout.link) return showMissing('checkout.provider is "link" but checkout.link is empty.');
      track('checkout_redirect', { url: cfg.checkout.link });
      location.assign(Funnel.fillTokens(cfg.checkout.link, lead, true));
      return;
    }
    showMissing('no checkout is set up yet. Set checkout.provider in funnel.config.js to "whop", "embed" or "link" (see docs/CHECKOUTS.md).');
  };

  // Back from a payment that did not go through: the welcome page sends ?payment=failed|canceled here
  Funnel.paymentStatus = function (search) {
    var m = /[?&]payment=(failed|canceled|cancelled|error)(&|$)/.exec(search || '');
    if (!m) return null;
    return m[1] === 'failed' || m[1] === 'error' ? 'failed' : 'canceled';
  };
  var notice = null;
  (function paymentNotice() {
    var status = Funnel.paymentStatus(location.search);
    var col = $('[data-funnel-stepper]') || detailsStep;
    if (!status || !col) return;
    notice = document.createElement('div');
    notice.className = 'mtf-pay-notice';
    notice.setAttribute('role', 'alert');
    notice.textContent = status === 'failed'
      ? 'Your payment didn’t go through. Please check your details and try again below.'
      : 'Your payment was cancelled. You can try again below whenever you’re ready.';
    col.insertAdjacentElement(col === detailsStep ? 'beforebegin' : 'afterend', notice);
    var toNotice = function () { if (notice && notice.parentNode) jumpTo(notice.getBoundingClientRect().top + window.pageYOffset - 140); };
    var settle = function () { toNotice(); setTimeout(toNotice, 700); };
    if (document.readyState === 'complete') setTimeout(settle, 50); else window.addEventListener('load', function () { setTimeout(settle, 50); });
  })();

  function openPayment(lead) {
    if (notice && notice.parentNode) { notice.parentNode.removeChild(notice); notice = null; }
    store('sessionStorage', 'mtf_first_name', lead.first_name); // the welcome page greets the buyer by first name
    var summary = $('[data-funnel-summary]');
    if (summary) summary.textContent = lead.email;
    if (detailsStep) detailsStep.hidden = true;
    if (paymentStep) paymentStep.hidden = false;
    setStep(2); // the page stays where the visitor is: no scroll here
    openCheckout(lead);
  }
  $$('[data-funnel-edit]').forEach(function (btn) {
    onActivate(btn, function (e) {
      e.preventDefault();
      busy = false;
      if (cfg.checkout.provider === 'whop') unmountWhop(); // remounted with the edited details
      if (paymentStep) paymentStep.hidden = true;
      setStep(1);
      if (state.ended && cfg.deadline.afterEnd !== 'keep') { showEnded(); return; }
      if (detailsStep) detailsStep.hidden = false;
    });
  });

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
