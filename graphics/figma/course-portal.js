// Course portal tailor (Info Funnel Graphic Templates, page "Templates").
// Makes a brand-specific, fully detached copy of the "Course portal template" export frames
// in your own copy of the Figma file, and exports PNGs. The template itself is never changed.
// See graphics/README.md for the setup.
//
// Run through the figma-console Desktop Bridge (one figma_execute, timeout 300000):
//   (0, eval)(await (await fetch('http://localhost:9231/figma/course-portal.js')).text());
//   const brief = await (await fetch('http://localhost:9231/briefs/course-portal.json')).json();
//   return await CPT.tailor(brief);
//
// Brief (every field except brand and modules is optional; missing copy keeps the template value):
// {
//   "brand": "Northstar Launch Lab",               // used for the section and file names
//   "label": "test",                                // optional suffix on the section name
//   "date": "2026-11-19",
//   "server": "http://localhost:9231/figma",        // where icons/ live and exports are POSTed
//   "brandHex": "#1F6FEB",
//   "pageHex": "#F6F6F3",                           // optional page background
//   "logo": { "svg": "<svg ...>" } | { "png": "logo.png" },   // png is a path on the server
//   "course": { "name": "", "tagline": "", "shortName": "", "progressLabel": "1 of 6 completed" },
//   "courseIcon": "shopping-bag",                   // Lucide name
//   "modules": [ { "name": "", "description": "", "icon": "rocket" } ],  // 1 to 8
//   "lesson": { "number": "Lesson 2.1:", "title": "", "fullTitle": "", "progress": 40 },
//   "lessonImage": "lesson.png",                    // 16:9 still on the server; without it the grey placeholder stays
//   "post": { "title": "", "subtitle": "", "author": "", "meta": "" },
//   "community": { "prompt": "", "replyPrompt": "" },
//   "cta": "Enroll Now",
//   "avatars": { "user": "user.png", "author": "author.png" },   // real photos; without them the grey placeholder stays
//   "export": { "scale": 2, "prefix": "northstar" }
// }

const CPT = (globalThis.CPT = {});
CPT.TEMPLATE = 'Course portal template';
CPT.COLLECTION = 'Course portal';
CPT.EXPORTS = [['Export/Laptop', 'laptop'], ['Export/Tablet', 'tablet'], ['Export/Phone', 'phone'], ['Export/All devices', 'all-devices']];

// ---------- colour helpers ----------
CPT.rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };
CPT.mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
CPT.lum = (c) => { const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
CPT.contrast = (a, b) => { const x = CPT.lum(a), y = CPT.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

CPT.palette = function (brief, base) {
  const out = Object.assign({}, base);
  if (!brief.brandHex) return out;
  const white = { r: 1, g: 1, b: 1 }, black = { r: 0, g: 0, b: 0 }, ink = CPT.rgb('#111111');
  const brand = CPT.rgb(brief.brandHex);
  let text = brand;
  for (let i = 0; i < 14 && CPT.contrast(text, white) < 4.5; i++) text = CPT.mix(text, black, 0.08);
  const onBrand = CPT.contrast(brand, white) >= CPT.contrast(brand, ink) ? white : ink;
  out['color/bg/brand'] = Object.assign({ a: 1 }, brand);
  out['color/text/brand'] = Object.assign({ a: 1 }, text);
  out['color/icon/brand'] = Object.assign({ a: 1 }, text);
  out['color/bg/brand-faint'] = Object.assign({ a: 0.1 }, brand);
  out['color/text/on-brand'] = Object.assign({ a: 1 }, onBrand);
  out['color/bg/page'] = Object.assign({ a: 1 }, brief.pageHex ? CPT.rgb(brief.pageHex) : CPT.mix(CPT.rgb('#F6F6F3'), brand, 0.03));
  out['color/bg/muted'] = Object.assign({ a: 1 }, CPT.mix(CPT.rgb('#DDDDD8'), brand, 0.06));
  return out;
};

// ---------- tree helpers ----------
CPT.detachDeep = function (node) {
  if (node.type === 'INSTANCE') node = node.detachInstance();
  for (let guard = 0; guard < 60; guard++) {
    const insts = node.findAll((n) => n.type === 'INSTANCE');
    if (!insts.length) break;
    for (const i of insts) {
      if (i.removed) continue;
      let p = i.parent, nested = false;
      while (p && p !== node) { if (p.type === 'INSTANCE') { nested = true; break; } p = p.parent; }
      if (!nested) i.detachInstance();
    }
  }
  return node;
};

CPT.fonts = new Set();
CPT.loadFonts = async function (t) {
  for (const seg of t.getStyledTextSegments(['fontName'])) {
    const k = seg.fontName.family + '|' + seg.fontName.style;
    if (CPT.fonts.has(k)) continue;
    await figma.loadFontAsync(seg.fontName); CPT.fonts.add(k);
  }
};

CPT.fetchBytes = async (url) => new Uint8Array(await (await fetch(url)).arrayBuffer());
CPT.url = (brief, p) => (/^https?:/.test(p) ? p : brief.server.replace(/\/$/, '') + '/' + p.replace(/^\//, ''));

// ---------- content map ----------
CPT.values = function (brief, current) {
  const v = Object.assign({}, current);
  const set = (k, x) => { if (x != null && x !== '') v[k] = String(x); };
  const c = brief.course || {}, l = brief.lesson || {}, p = brief.post || {}, cm = brief.community || {};
  const mods = (brief.modules || []).slice(0, 8);
  const n = mods.length;
  set('course/name', c.name); set('course/tagline', c.tagline); set('course/short-name', c.shortName);
  if (n) { v['course/module-count'] = n + (n === 1 ? ' module' : ' modules'); v['course/progress'] = c.progressLabel || '1 of ' + n + ' completed'; }
  set('lesson/number', l.number); set('lesson/title', l.title);
  if (l.fullTitle) v['lesson/full-title'] = l.fullTitle;
  else if (l.number || l.title) v['lesson/full-title'] = (l.number || v['lesson/number']).replace(/:\s*$/, '') + ': ' + (l.title || v['lesson/title']);
  if (l.progress != null) v['lesson/progress'] = Math.round(l.progress) + '%';
  set('post/title', p.title); set('post/subtitle', p.subtitle); set('post/author', p.author); set('post/meta', p.meta);
  set('community/prompt', cm.prompt); set('community/reply-prompt', cm.replyPrompt);
  set('cta/label', brief.cta);
  for (let i = 0; i < 8; i++) {
    const m = mods[i];
    if (m) { set(`module/${i + 1}/name`, m.name); set(`module/${i + 1}/description`, m.description); }
    v[`module/${i + 1}/show`] = n ? i < n : current[`module/${i + 1}/show`];
  }
  return v;
};

// ---------- main ----------
CPT.tailor = async function (brief) {
  const report = { texts: 0, paints: 0, hidden: 0, logos: 0, icons: 0, missingIcons: [], exports: [], warnings: [] };
  if (!brief || !brief.brand) throw new Error('brief.brand is required');
  brief.server = brief.server || 'http://localhost:9231/figma';
  const date = brief.date || new Date().toISOString().slice(0, 10);
  const page = figma.currentPage;
  const tpl = page.findOne((n) => n.type === 'SECTION' && n.name === CPT.TEMPLATE);
  if (!tpl) throw new Error('template section not found');

  // variables: current values (template defaults) and colours
  const col = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === CPT.COLLECTION);
  const modeId = col.modes[0].modeId;
  const vars = (await figma.variables.getLocalVariablesAsync()).filter((v) => v.variableCollectionId === col.id);
  const byId = {}, current = {}, baseColours = {};
  for (const v of vars) {
    byId[v.id] = v;
    const val = v.valuesByMode[modeId];
    if (v.resolvedType === 'COLOR') baseColours[v.name] = val; else current[v.name] = val;
  }
  const values = CPT.values(brief, current);
  const colours = CPT.palette(brief, baseColours);

  // output section, stacked below the template and any earlier tailored copies
  let bottom = tpl.y + tpl.height;
  for (const s of page.children) if (s.type === 'SECTION' && s.name.startsWith('Tailored - ') && Math.abs(s.x - tpl.x) < 10) bottom = Math.max(bottom, s.y + s.height);
  const label = brief.label ? ' ' + brief.label : '';
  let name = `Tailored - ${brief.brand} (${date})${label}`;
  for (let k = 2; page.findOne((n) => n.type === 'SECTION' && n.name === name); k++) name = `Tailored - ${brief.brand} (${date})${label} v${k}`;
  const sec = figma.createSection(); sec.name = name; sec.x = tpl.x; sec.y = bottom + 240;
  sec.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

  await figma.loadFontAsync({ family: 'PP Neue Montreal', style: 'Medium' });
  const head = figma.createText(); head.fontName = { family: 'PP Neue Montreal', style: 'Medium' }; head.fontSize = 44;
  head.characters = `${brief.brand}: course portal mockups (${date})`; head.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.07 } }];
  sec.appendChild(head); head.x = 80; head.y = 80;

  // clone + detach the export frames
  const exportsBoard = tpl.findChild((n) => n.name === 'Exports');
  const frames = [];
  let x = 80;
  for (const [fname, kind] of CPT.EXPORTS) {
    const src = exportsBoard && exportsBoard.findOne((n) => n.name === fname);
    if (!src) { report.warnings.push('missing ' + fname); continue; }
    const c = src.clone(); sec.appendChild(c); c.x = x; c.y = 200; x += c.width + 120;
    CPT.detachDeep(c);
    c.name = `${brief.brand}/${kind}`;
    frames.push([c, kind]);
  }
  const maxH = Math.max(...frames.map(([f]) => f.height));
  sec.resizeWithoutConstraints(x - 120 + 80, 200 + maxH + 120);

  // logo + images prepared once
  let logoSvg = null, logoImg = null, lessonImg = null;
  if (brief.logo && brief.logo.svg) logoSvg = brief.logo.svg;
  if (brief.logo && brief.logo.png) logoImg = figma.createImage(await CPT.fetchBytes(CPT.url(brief, brief.logo.png)));
  if (brief.lessonImage) lessonImg = figma.createImage(await CPT.fetchBytes(CPT.url(brief, brief.lessonImage)));
  const avatarImg = {};
  for (const [k, p] of Object.entries(brief.avatars || {})) avatarImg[k] = figma.createImage(await CPT.fetchBytes(CPT.url(brief, p)));
  const iconCache = {};
  const iconSvg = async (nm) => {
    if (!nm) return null;
    if (iconCache[nm] !== undefined) return iconCache[nm];
    try { const r = await fetch(CPT.url(brief, 'icons/' + nm + '.svg')); iconCache[nm] = r.ok ? await r.text() : null; } catch (e) { iconCache[nm] = null; }
    if (!iconCache[nm]) report.missingIcons.push(nm);
    return iconCache[nm];
  };
  const iconColour = colours['color/icon/brand'];
  const placeIcon = (frame, svg) => {
    for (const ch of [...frame.children]) ch.remove();
    const node = figma.createNodeFromSvg(svg);
    node.name = 'Icon'; node.fills = [];
    const paint = [{ type: 'SOLID', color: { r: iconColour.r, g: iconColour.g, b: iconColour.b } }];
    for (const v of node.findAll(() => true)) {
      if ('strokes' in v && v.strokes.length) v.strokes = paint;
      if ('fills' in v && Array.isArray(v.fills) && v.fills.length && v.type !== 'FRAME') v.fills = paint;
    }
    frame.appendChild(node);
    node.rescale(frame.width / node.width);
    node.x = 0; node.y = 0;
  };

  for (const [f] of frames) {
    const nodes = [f, ...f.findAll(() => true)];
    for (const n of nodes) {
      if (n.removed) continue;
      const bv = n.boundVariables || {};
      // text content
      if (n.type === 'TEXT' && bv.characters) {
        const v = byId[bv.characters.id];
        await CPT.loadFonts(n);
        const h0 = n.height;
        n.setBoundVariable('characters', null);
        if (v && values[v.name] != null) n.characters = values[v.name];
        report.texts++;
        if (v && n.height > h0 * 1.3 && n.visible) {
          const w = `${v.name} wraps to more lines (${f.name} > ${n.parent ? n.parent.name : ''})`;
          if (!report.warnings.includes(w)) report.warnings.push(w);
        }
      }
      // module visibility
      if (bv.visible) {
        const v = byId[bv.visible.id];
        n.setBoundVariable('visible', null);
        if (v && typeof values[v.name] === 'boolean') { n.visible = values[v.name]; if (!n.visible) report.hidden++; }
      }
      // colours
      for (const key of ['fills', 'strokes']) {
        const paints = n[key];
        if (!Array.isArray(paints) || !paints.some((p) => p.boundVariables && p.boundVariables.color)) continue;
        n[key] = paints.map((p) => {
          const b = p.boundVariables && p.boundVariables.color;
          if (!b) return p;
          const v = byId[b.id];
          const c = v && colours[v.name];
          if (!c) { const q = Object.assign({}, p); delete q.boundVariables; return q; }
          report.paints++;
          const out = { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a == null ? 1 : c.a };
          if (p.visible === false) out.visible = false;
          return out;
        });
      }
      if (n.type === 'TEXT' && n.fills === figma.mixed) {
        await CPT.loadFonts(n);
        for (const seg of n.getStyledTextSegments(['fills'])) {
          n.setRangeFills(seg.start, seg.end, seg.fills.map((p) => {
            const b = p.boundVariables && p.boundVariables.color; const v = b && byId[b.id]; const c = v && colours[v.name];
            return c ? { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a == null ? 1 : c.a } : p;
          }));
        }
      }
    }

    // logo
    for (const lf of f.findAll((n) => n.name === 'Course portal/Logo')) {
      const art = lf.findChild((n) => n.name === 'Logo artwork') || lf;
      if (!logoSvg && !logoImg) continue;
      for (const ch of [...art.children]) ch.remove();
      const leftAlign = lf.parent && lf.parent.name === 'Top bar';
      if (logoSvg) {
        const node = figma.createNodeFromSvg(logoSvg); node.name = 'Logo'; node.fills = [];
        art.appendChild(node);
        node.rescale(Math.min(art.width / node.width, art.height / node.height));
        node.x = leftAlign ? 0 : (art.width - node.width) / 2; node.y = (art.height - node.height) / 2;
      } else {
        const r = figma.createRectangle(); r.name = 'Logo'; r.resize(art.width, art.height);
        r.fills = [{ type: 'IMAGE', imageHash: logoImg.hash, scaleMode: 'FIT' }];
        art.appendChild(r); r.x = 0; r.y = 0;
      }
      report.logos++;
    }

    // module icons and course icon
    const mods = (brief.modules || []).slice(0, 8);
    for (let i = 0; i < mods.length; i++) {
      const svg = await iconSvg(mods[i].icon);
      if (!svg) continue;
      for (const fr of f.findAll((n) => n.name === `Course portal/Module icon/${i + 1}`)) { placeIcon(fr, svg); report.icons++; }
    }
    if (brief.courseIcon) {
      const svg = await iconSvg(brief.courseIcon);
      if (svg) for (const fr of f.findAll((n) => n.name === 'Course portal/Course icon')) { placeIcon(fr, svg); report.icons++; }
    }

    // progress bars
    if (brief.lesson && brief.lesson.progress != null) {
      const pct = Math.max(0, Math.min(100, brief.lesson.progress)) / 100;
      for (const bar of f.findAll((n) => n.name === 'Progress bar')) {
        const fill = bar.findChild((n) => n.name === 'Fill');
        if (fill) fill.resize(Math.max(1, bar.width * pct), fill.height);
      }
    }

    // lesson video image
    if (lessonImg) {
      for (const vf of f.findAll((n) => n.name === 'Course portal/Lesson video' || n.name === 'Lesson video')) {
        if (!('fills' in vf)) continue;
        vf.fills = [{ type: 'IMAGE', imageHash: lessonImg.hash, scaleMode: 'FILL' }];
        const play = vf.findChild((n) => n.name === 'Play button'); if (play) play.visible = true;
      }
    }

    // avatars: the template uses a grey placeholder silhouette; only a real photo from the brief replaces it
    for (const [k, img] of Object.entries(avatarImg)) {
      const nm = k === 'author' ? 'Author avatar' : 'User avatar';
      for (const a of f.findAll((n) => n.name === nm)) a.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
    }
  }

  // exports
  const ex = brief.export || {};
  const scale = ex.scale || 2;
  const prefix = ex.prefix || brief.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (ex.skip !== true) {
    for (const [f, kind] of frames) {
      const bytes = await f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = `${prefix}-${kind}@${scale}x.png`;
      const r = await fetch(CPT.url(brief, file), { method: 'POST', body: bytes });
      report.exports.push({ file, ok: r.ok, bytes: bytes.length });
    }
  }
  report.section = { id: sec.id, name: sec.name, x: sec.x, y: sec.y, w: sec.width, h: sec.height };
  report.frames = frames.map(([f, kind]) => ({ kind, id: f.id }));
  return report;
};
