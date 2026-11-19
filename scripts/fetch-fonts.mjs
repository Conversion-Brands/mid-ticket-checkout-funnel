// Maintainer script: downloads the template's fonts (Google Fonts, SIL Open Font License) once,
// so the pages never call Google. Run: node scripts/fetch-fonts.mjs
// Writes assets/fonts/*.woff2, assets/fonts/OFL-<family>.txt and css/fonts.css.
import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FONTS = path.join(ROOT, 'assets/fonts');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const FAMILIES = [
  { css: 'Geist:wght@400;500;700', name: 'Geist', ofl: 'geist' },
  { css: 'Instrument+Serif:ital@0;1', name: 'Instrument Serif', ofl: 'instrumentserif' },
  { css: 'Caveat:wght@400;500;600;700', name: 'Caveat', ofl: 'caveat' },
  { css: 'Mrs+Saint+Delafield', name: 'Mrs Saint Delafield', ofl: 'mrssaintdelafield' },
];

fs.mkdirSync(FONTS, { recursive: true });
let out = '/* Self-hosted fonts (SIL Open Font License, texts in assets/fonts/). Made by scripts/fetch-fonts.mjs. */\n';
for (const f of FAMILIES) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${f.css}&display=swap`, { headers: { 'user-agent': UA } })).text();
  // keep only the latin subset blocks
  const blocks = css.split(/(?=\/\* )/).filter(b => b.startsWith('/* latin */'));
  if (!blocks.length) throw new Error('no latin block for ' + f.name);
  const byUrl = new Map(); // variable fonts serve one file for every weight
  for (const b of blocks) {
    const url = b.match(/url\((https:[^)]+)\)/)[1];
    const style = b.match(/font-style:\s*(\w+)/)[1];
    const weight = Number(b.match(/font-weight:\s*(\d+)/)[1]);
    if (!byUrl.has(url)) byUrl.set(url, { style, weights: [] });
    byUrl.get(url).weights.push(weight);
  }
  const files = [];
  for (const [url, { style, weights }] of byUrl) {
    const lo = Math.min(...weights), hi = Math.max(...weights);
    const file = `${f.ofl}-${style}${lo === hi ? '-' + lo : ''}.woff2`;
    fs.writeFileSync(path.join(FONTS, file), Buffer.from(await (await fetch(url)).arrayBuffer()));
    files.push(file);
    out += `@font-face { font-family: '${f.name}'; font-style: ${style}; font-weight: ${lo === hi ? lo : lo + ' ' + hi}; font-display: swap; src: url('../assets/fonts/${file}') format('woff2'); }\n`;
  }
  const ofl = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${f.ofl}/OFL.txt`);
  if (!ofl.ok) throw new Error('no OFL text for ' + f.name);
  fs.writeFileSync(path.join(FONTS, `OFL-${f.ofl}.txt`), await ofl.text());
  console.log(f.name, files.join(', '));
}
// keep the licensed-fonts block (and anything after it) that css/fonts.css already has
const existing = fs.existsSync(path.join(ROOT, 'css/fonts.css')) ? fs.readFileSync(path.join(ROOT, 'css/fonts.css'), 'utf8') : '';
const keep = existing.indexOf('\n/*\n  Licensed fonts');
fs.writeFileSync(path.join(ROOT, 'css/fonts.css'), out + (keep === -1 ? '' : existing.slice(keep)));
