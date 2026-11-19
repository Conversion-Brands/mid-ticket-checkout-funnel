/*
  Mid-ticket Checkout Funnel - welcome page behaviour: greets the buyer by first name and fires confetti once.
  Template by The Conversion Brands (https://theconversionbrands.com). MIT licence.
*/
(function () {
  'use strict';

  // ---- smooth scrolling (Lenis), as on the sales page
  var settings = window.FUNNEL_CONFIG || {};
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (settings.smoothScroll !== false && window.Lenis && !calm && !window.lenis) {
    window.lenis = new window.Lenis({ autoRaf: true, lerp: 0.1, allowNestedScroll: true, stopInertiaOnNavigate: true });
  }

  // ---- first name from the checkout (sessionStorage mtf_first_name, set when the payment step opened)
  var name = '';
  try { name = (sessionStorage.getItem('mtf_first_name') || '').trim().split(/\s+/)[0].slice(0, 24); } catch (e) { name = ''; }
  if (name) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
    Array.prototype.forEach.call(document.querySelectorAll('[data-funnel-greeting]'), function (el) {
      el.textContent = el.getAttribute('data-funnel-greeting').replace('{first_name}', name); // text, never HTML
    });
  }

  // ---- template placeholders badge (same as on the sales page; off with sampleWarnings: false)
  window.Funnel = window.Funnel || {};
  window.Funnel.sampleCount = function () { return document.querySelectorAll('[data-sample]').length; };
  (function sampleBanner() {
    var cfg = window.FUNNEL_CONFIG || {};
    var n = document.querySelectorAll('[data-sample]').length;
    if (cfg.sampleWarnings === false || !n) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'mtf-sample-banner';
    b.textContent = n + (n === 1 ? ' template placeholder left' : ' template placeholders left');
    b.title = 'Click to outline the example content you still need to replace (see SETUP.md).';
    b.addEventListener('click', function () { document.documentElement.classList.toggle('mtf-show-samples'); });
    document.body.appendChild(b);
  })();

  // ---- confetti: two side bursts, then one from the middle, in the theme colours; skipped for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function toHex(css) { // rgb(...) or color(srgb ...) as #rrggbb, which the confetti library expects
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(css), rgb;
    if (m) rgb = [m[1], m[2], m[3]].map(Number);
    else {
      m = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(css);
      if (!m) return null;
      rgb = [m[1], m[2], m[3]].map(function (v) { return Number(v) * 255; });
    }
    return '#' + rgb.map(function (v) { var h = Math.round(Math.max(0, Math.min(255, v))).toString(16); return h.length < 2 ? '0' + h : h; }).join('');
  }
  function themeColours() {
    var probe = document.createElement('i'), out = [];
    probe.style.display = 'none';
    document.body.appendChild(probe);
    for (var i = 1; i <= 6; i++) {
      probe.style.color = 'var(--mtf-confetti-' + i + ')';
      var hex = toHex(getComputedStyle(probe).color);
      if (hex) out.push(hex);
    }
    probe.parentNode.removeChild(probe);
    return out;
  }
  function start() {
    if (typeof window.confetti !== 'function') return;
    var colours = themeColours();
    var fire = function (opts) {
      var o = { colors: colours, zIndex: 2000, ticks: 240, scalar: 0.9, disableForReducedMotion: true };
      for (var k in opts) o[k] = opts[k];
      window.confetti(o);
    };
    fire({ particleCount: 70, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.75 } });
    fire({ particleCount: 70, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.75 } });
    setTimeout(function () { fire({ particleCount: 90, spread: 100, startVelocity: 38, origin: { x: 0.5, y: 0.35 } }); }, 350);
  }
  if (document.readyState === 'complete') setTimeout(start, 300);
  else window.addEventListener('load', function () { setTimeout(start, 300); });
})();
