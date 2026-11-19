// Maintainer script: writes the labelled placeholder images, the tape decoration and the payment badges.
// Run: node scripts/make-placeholders.mjs   (no dependencies)
// Placeholders are shown until an owner makes their own graphics (studio/) or adds their photos.
import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const P = path.join(ROOT, 'assets/placeholders');
const D = path.join(ROOT, 'assets/decor');
const L = path.join(ROOT, 'assets/logos');
[P, D, L].forEach(d => fs.mkdirSync(d, { recursive: true }));

const PAPER = '#ebe8dc', LINE = '#b9b5a5', TEXT = '#5f5d55';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function card(w, h, title, hint, opts = {}) {
  const r = opts.r ?? Math.round(Math.min(w, h) * 0.04);
  const fs1 = Math.max(14, Math.round(Math.min(w, h) * 0.075)), fs2 = Math.max(11, Math.round(fs1 * 0.5));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="${opts.fill || PAPER}" stroke="${LINE}" stroke-width="2" stroke-dasharray="10 8"/>
<text x="50%" y="${h / 2 - fs2 * 0.4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fs1}" font-weight="700" fill="${opts.text || TEXT}">${esc(title)}</text>
${hint ? `<text x="50%" y="${h / 2 + fs1 * 0.75}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fs2}" fill="${opts.text || TEXT}">${esc(hint)}</text>` : ''}
</svg>
`;
}

const studio = (w, h) => `${w}x${h}, make yours in the studio`;
const files = {
  'logo.svg': card(248, 100, 'Your logo', '', { r: 12 }),
  'logo-inverse.svg': card(448, 182, 'Your logo', '', { r: 16, fill: '#262626', text: '#bdbdbd' }),
  'video-poster.svg': card(1280, 720, 'Your video', 'paste your video embed into the hero (see SETUP.md)', { r: 0 }),
  'bundle.svg': card(992, 594, 'Bundle shot', studio(992, 594)),
  'laptop.svg': card(828, 500, 'Laptop mockup', studio(828, 500)),
  'tablet.svg': card(404, 310, 'Tablet mockup', studio(404, 310)),
  'phone.svg': card(168, 348, 'Phone', '168x348', { r: 18 }),
  'feature-wide.svg': card(1052, 666, 'Feature image', '1052x666, a screenshot of your calls or product'),
  'feature.svg': card(996, 544, 'Feature image', '996x544, a screenshot of your community or product'),
  'sticker.svg': card(356, 368, 'Sale sticker', studio(356, 368), { r: 178 }),
  'photo-1.svg': card(400, 520, 'Your photo', '400x520', { r: 0 }),
  'photo-2.svg': card(400, 520, 'Your photo', '400x520', { r: 0 }),
};
for (let i = 1; i <= 3; i++) {
  files[`step-card-${i}.svg`] = card(640, 402, `Step ${i} graphic`, studio(640, 402));
  files[`box-${i}.svg`] = card(940, 724, `Bonus ${i} box`, studio(940, 724));
  files[`welcome-step-${i}.svg`] = card(640, 402, `Next step ${i} graphic`, studio(640, 402));
}
// three overlapping initials, for the "join N students" rows
function avatars(w, h) {
  const d = h, cols = ['#d9d3bf', '#c9c2aa', '#e3ddcb'], letters = ['A', 'B', 'C'];
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  letters.forEach((l, i) => {
    const cx = d / 2 + i * (w - d) / 2;
    out += `<circle cx="${cx}" cy="${h / 2}" r="${d / 2 - 1}" fill="${cols[i]}" stroke="#ffffff" stroke-width="2"/><text x="${cx}" y="${h / 2 + d * 0.13}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(d * 0.38)}" font-weight="700" fill="${TEXT}">${l}</text>`;
  });
  return out + '</svg>\n';
}
files['avatars.svg'] = avatars(106, 42);
files['avatars-md.svg'] = avatars(250, 98);
for (const [f, svg] of Object.entries(files)) fs.writeFileSync(path.join(P, f), svg);

// translucent paper tape with torn ends
function tape(w, h, angle) {
  const teeth = 7, pts = [];
  for (let i = 0; i <= teeth; i++) pts.push(`${(i % 2 ? 4 : 0)},${(h * i) / teeth}`);
  const right = [];
  for (let i = teeth; i >= 0; i--) right.push(`${w - (i % 2 ? 0 : 4)},${(h * i) / teeth}`);
  const W = Math.ceil(Math.abs(w * Math.cos(angle * Math.PI / 180)) + Math.abs(h * Math.sin(angle * Math.PI / 180))) + 4;
  const H = Math.ceil(Math.abs(w * Math.sin(angle * Math.PI / 180)) + Math.abs(h * Math.cos(angle * Math.PI / 180))) + 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<g transform="translate(${W / 2} ${H / 2}) rotate(${angle}) translate(${-w / 2} ${-h / 2})">
<polygon points="${pts.join(' ')} ${right.join(' ')}" fill="#f4f1e6" fill-opacity="0.82" stroke="#d6d1bf" stroke-opacity="0.7"/>
</g></svg>
`;
}
fs.writeFileSync(path.join(D, 'tape-left.svg'), tape(210, 54, -38));
fs.writeFileSync(path.join(D, 'tape-right.svg'), tape(180, 48, -30));

// payment badges (glyphs from Simple Icons, CC0), white card with a hairline border
const BRANDS = {
  visa: '#1A1F71', mastercard: '#EB001B', americanexpress: '#2E77BC', paypal: '#002991', applepay: '#000000',
};
for (const [slug, colour] of Object.entries(BRANDS)) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`);
  if (!res.ok) throw new Error('simple-icons ' + slug + ' ' + res.status);
  const glyph = (await res.text()).match(/<path d="([^"]+)"/)[1];
  fs.writeFileSync(path.join(L, `${slug}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="52" viewBox="0 0 80 52">
<rect x="1" y="1" width="78" height="50" rx="7" fill="#ffffff" stroke="#e1e1e1" stroke-width="2"/>
<g transform="translate(24 10) scale(1.333)"><path d="${glyph}" fill="${colour}"/></g>
</svg>
`);
}
fs.writeFileSync(path.join(L, 'LICENSE.txt'), 'Payment brand glyphs: Simple Icons (https://simpleicons.org), CC0 1.0. The brands are trademarks of their owners; show only the methods your checkout accepts.\n');
console.log('placeholders', Object.keys(files).length, '+ tape + 5 payment badges');
