// The theme contract: colours and fonts live only in css/theme.css (and css/fonts.css),
// css/funnel.css stays importable into Webflow, and the default theme is readable.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./helpers');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|(?<![-\w])(white|black)(?![-\w])/i;
const TAGS = 'html|body|h1|h2|h3|h4|h5|h6|p|a|img|ul|ol|li|button|input|textarea|select|strong|em|blockquote|figure';
const SAFE_SELECTOR = new RegExp('^(?:(?:\\.[a-z0-9_-]+)+|(?:' + TAGS + '))(?:::?[a-z-]+(?:\\([^)]*\\))?)*$');
const MEDIA = ['screen and (max-width: 991px)', 'screen and (max-width: 767px)', 'screen and (max-width: 479px)'];

// Split CSS text into { media, selectors, body } rules (one level of @media nesting, as the file uses).
function rules(css) {
  const out = [];
  let i = 0;
  function block(text, media) {
    let j = 0;
    while (j < text.length) {
      const open = text.indexOf('{', j);
      if (open === -1) break;
      const head = text.slice(j, open).trim();
      if (head.startsWith('@media')) {
        let depth = 1, k = open + 1;
        while (depth && k < text.length) { if (text[k] === '{') depth++; else if (text[k] === '}') depth--; k++; }
        block(text.slice(open + 1, k - 1), head.replace(/^@media\s*/, '').trim());
        j = k;
      } else {
        const close = text.indexOf('}', open);
        out.push({ media, selectors: head.split(',').map(s => s.trim()).filter(Boolean), body: text.slice(open + 1, close) });
        j = close + 1;
      }
    }
  }
  block(css, null);
  return out;
}

for (const file of ['css/funnel.css', 'css/states.css']) {
  test(`${file} contains no literal colour`, () => {
    const bad = rules(read(file)).filter(r => LITERAL_COLOUR.test(r.body)).map(r => r.selectors[0] + ' { ' + r.body.trim().slice(0, 80));
    expect(bad).toEqual([]);
  });

  test(`${file} sets fonts only through theme tokens`, () => {
    const bad = rules(read(file)).filter(r => /font-family\s*:/.test(r.body) && !/font-family\s*:\s*(var\(--mtf-font-[a-z]+\)|inherit)\s*(;|$)/.test(r.body.match(/font-family\s*:[^;]*;?/)[0]));
    expect(bad.map(r => r.selectors[0])).toEqual([]);
  });
}

test('funnel.css selectors are Webflow-safe', () => {
  const bad = [];
  rules(read('css/funnel.css')).forEach(r => r.selectors.forEach(s => { if (!SAFE_SELECTOR.test(s)) bad.push(s); }));
  expect(bad).toEqual([]);
});

test('funnel.css media queries are 991/767/479 only', () => {
  const media = [...new Set(rules(read('css/funnel.css')).map(r => r.media).filter(Boolean))];
  expect(media.filter(m => !MEDIA.includes(m))).toEqual([]);
});

test('only theme.css declares --mtf- tokens', () => {
  for (const file of ['css/funnel.css', 'css/states.css']) expect(read(file)).not.toMatch(/--mtf-[a-z0-9-]+\s*:/);
});

test('theme contrast', async ({ page }) => {
  await page.goto('/index.html');
  await page.addStyleTag({ url: '/css/theme.css' });
  const ratio = await page.evaluate(() => {
    const probe = document.createElement('div');
    document.body.appendChild(probe);
    function rgb(token) {
      probe.style.color = 'var(' + token + ')';
      const c = getComputedStyle(probe).color;
      let m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
      if (m) return [m[1], m[2], m[3]].map(Number);
      m = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
      return [m[1], m[2], m[3]].map(v => Number(v) * 255);
    }
    function lum(c) {
      const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function contrast(a, b) { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
    return {
      ink: contrast('--mtf-ink', '--mtf-bg'),
      muted: contrast('--mtf-muted', '--mtf-bg'),
      onAccent: contrast('--mtf-accent-ink', '--mtf-accent'),
      accent: contrast('--mtf-accent', '--mtf-bg'),
      inverse: contrast('--mtf-inverse-muted', '--mtf-inverse-bg'),
    };
  });
  expect(ratio.ink).toBeGreaterThanOrEqual(4.5);
  expect(ratio.muted).toBeGreaterThanOrEqual(4.5);
  expect(ratio.onAccent).toBeGreaterThanOrEqual(4.5);
  expect(ratio.accent).toBeGreaterThanOrEqual(3);
  expect(ratio.inverse).toBeGreaterThanOrEqual(4.5);
});
