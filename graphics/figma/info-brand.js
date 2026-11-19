// Fill the three info brand graphic templates for one brand.
// Creates linked instances (template edits still flow through) in a "Tailored - <brand>"
// section inside "Graphic templates", then sets text, seats, folders, members, photos and accent.
//
// Bridge usage (your copy of Info Funnel Graphic Templates, page "Templates"; see graphics/README.md):
//   (0, eval)(await (await fetch('http://localhost:9231/figma/info-brand.js')).text());
//   const brief = await (await fetch('http://localhost:9231/briefs/info-brand.json')).json();
//   return await IBG_FILL(brief);
//
// Brief (every field optional except brand):
// {
//   brand: 'Northstar Coaching',
//   accent: '#F2B84B',                         // brand accent; folder colours derive from it
//   coaching: { host, initials, title, timer, hostPhoto,   // hostPhoto: URL on localhost (PNG/JPG)
//               seats: [{ type: 'Empty'|'Photo'|'Speaking', photo }] },   // up to 5
//   modules:  { brandName, folders: [{ title, count, active }] },          // up to 6
//   community:{ members: [{ name, role, status: 'Online'|'Away'|'Offline', photo }] }, // up to 4
//   support:  { customer, reply1, link, reply2, placeholder, customerPhoto, agentPhoto, linkColor },
//   oneOnOne: { name, hostPhoto, participantPhoto },
// }
// No photo given = the grey placeholder avatar stays (no real people unless they agreed).

globalThis.IBG_FILL = async function (brief) {
  const PARENT = 'Graphic templates';
  const parent = figma.currentPage.findOne((n) => n.type === 'SECTION' && n.name === PARENT);
  if (!parent) throw new Error('Section "Graphic templates" not found');
  const main = (name) => parent.findOne((n) => n.type === 'COMPONENT' && n.name === name);
  const mains = { coaching: main('Group coaching/Call card'), modules: main('Course modules/Card'), community: main('Community/Members') };
  for (const [k, m] of Object.entries(mains)) if (!m) throw new Error('Template not found: ' + k);

  const hexToRgb = (h) => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };
  const mix = (c, t, w) => ({ r: c.r + (t.r - c.r) * w, g: c.g + (t.g - c.g) * w, b: c.b + (t.b - c.b) * w });
  const near = (c, h) => { const t = hexToRgb(h); return Math.abs(c.r - t.r) < 0.03 && Math.abs(c.g - t.g) < 0.03 && Math.abs(c.b - t.b) < 0.03; };
  const imgCache = {};
  const image = async (url) => {
    if (!url) return null;
    if (imgCache[url]) return imgCache[url];
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    imgCache[url] = figma.createImage(bytes).hash;
    return imgCache[url];
  };
  const photoFill = async (node, url) => { const h = await image(url); if (h && node) node.fills = [{ type: 'IMAGE', imageHash: h, scaleMode: 'FILL' }]; };
  const key = (inst, name) => Object.keys(inst.componentProperties).find((k) => k.split('#')[0] === name);
  const setProp = (inst, name, value) => { const k = key(inst, name); if (k != null && value != null) { const p = {}; p[k] = value; inst.setProperties(p); } };
  const loadFonts = async (root) => {
    const seen = new Set();
    for (const t of root.findAll((n) => n.type === 'TEXT')) for (const s of t.getStyledTextSegments(['fontName'])) { const k = s.fontName.family + s.fontName.style; if (!seen.has(k)) { seen.add(k); await figma.loadFontAsync(s.fontName); } }
  };

  // section for this brand, stacked under the templates
  const name = 'Tailored - ' + brief.brand;
  let sec = parent.findChild((n) => n.type === 'SECTION' && n.name === name);
  if (sec) sec.remove();
  const subs = parent.children.filter((n) => n.type === 'SECTION');
  const bottom = Math.max(...subs.map((s) => s.y + s.height));
  sec = figma.createSection(); sec.name = name;
  parent.appendChild(sec);
  sec.x = 1914; sec.y = bottom + 80; sec.resizeWithoutConstraints(3160, 520);
  if (sec.y + sec.height + 80 > parent.height) parent.resizeWithoutConstraints(parent.width, sec.y + sec.height + 80);

  const out = {};
  // ---- group coaching
  const co = mains.coaching.createInstance(); sec.appendChild(co); co.x = 80; co.y = 120; co.name = 'Group coaching - ' + brief.brand;
  await loadFonts(co);
  const c = brief.coaching || {};
  setProp(co, 'Host name', c.host); setProp(co, 'Call title', c.title); setProp(co, 'Timer', c.timer); setProp(co, 'Host initials', c.initials);
  if (c.hostPhoto) { setProp(co, 'Host photo', true); await photoFill(co.findOne((n) => n.name === 'Host photo'), c.hostPhoto); }
  const seats = co.findAll((n) => n.type === 'INSTANCE' && n.isExposedInstance);
  (c.seats || []).slice(0, 5).forEach((s, i) => { if (s && s.type) seats[i].setProperties({ Type: s.type }); });
  for (let i = 0; i < (c.seats || []).length && i < 5; i++) { const s = c.seats[i]; if (s && s.photo) await photoFill(seats[i].findOne((n) => n.name === 'Photo'), s.photo); }
  out.coaching = co.id;

  // ---- course modules
  const mo = mains.modules.createInstance(); sec.appendChild(mo); mo.x = 1080; mo.y = 120; mo.name = 'Course modules - ' + brief.brand;
  await loadFonts(mo);
  const m = brief.modules || {};
  setProp(mo, 'Brand name', m.brandName || brief.brand);
  const folders = mo.findAll((n) => n.type === 'INSTANCE' && n.isExposedInstance);
  if (m.folders) {
    folders.forEach((f, i) => {
      const d = m.folders[i];
      if (!d) { f.visible = false; return; }
      f.setProperties({ State: d.active ? 'Active' : 'Default' });
      setProp(f, 'Title', d.title); setProp(f, 'Count', d.count || '');
      setProp(f, 'Cursor', !!d.active);
    });
  }
  out.modules = mo.id;

  // ---- community
  const cm = mains.community.createInstance(); sec.appendChild(cm); cm.x = 2080; cm.y = 120; cm.name = 'Community - ' + brief.brand;
  await loadFonts(cm);
  // visual order, top to bottom (layer order is not reading order)
  const members = cm.findAll((n) => n.type === 'INSTANCE' && n.isExposedInstance).sort((a, b) => a.y - b.y || a.x - b.x);
  const list = (brief.community && brief.community.members) || null;
  if (list) {
    for (let i = 0; i < members.length; i++) {
      const d = list[i], chip = members[i];
      if (!d) { chip.visible = false; continue; }
      if (d.status) chip.setProperties({ Status: d.status });
      setProp(chip, 'Name', d.name); setProp(chip, 'Role', d.role);
      if (d.photo) await photoFill(chip.findOne((n) => n.name === 'Photo'), d.photo);
    }
  }
  out.community = cm.id;

  // ---- support chat (needs a dark backdrop; the backdrop is not part of the template)
  const supMain = main('Support chat/Card');
  let su = null;
  if (supMain) {
    const back = figma.createFrame(); back.name = 'Preview background (not part of the graphic)';
    back.resize(supMain.width + 80, supMain.height + 80); back.cornerRadius = 24;
    back.fills = [{ type: 'SOLID', color: { r: 0.055, g: 0.055, b: 0.055 } }];
    sec.appendChild(back); back.x = 3080; back.y = 80;
    su = supMain.createInstance(); back.appendChild(su); su.x = 40; su.y = 40; su.name = 'Support chat - ' + brief.brand;
    await loadFonts(su);
    const s = brief.support || {};
    setProp(su, 'Customer message', s.customer); setProp(su, 'Reply 1', s.reply1);
    setProp(su, 'Link text', s.link); setProp(su, 'Reply 2', s.reply2);
    setProp(su, 'Input placeholder', s.placeholder);
    if (s.link === '') setProp(su, 'Show link', false);
    if (s.customerPhoto) await photoFill(su.findOne((n) => n.name === 'Customer photo'), s.customerPhoto);
    if (s.agentPhoto) for (const n of su.findAll((n) => /^Agent photo/.test(n.name))) await photoFill(n, s.agentPhoto);
    if (s.linkColor) { const L = su.findOne((n) => n.name === 'Link text'); if (L) L.fills = [{ type: 'SOLID', color: hexToRgb(s.linkColor) }]; }
    out.support = su.id;
    sec.resizeWithoutConstraints(3080 + back.width + 80, Math.max(sec.height, back.height + 160));
  }

  // ---- 1:1 session call
  const ooMain = main('1:1 session/Call');
  if (ooMain) {
    const oo = ooMain.createInstance(); sec.appendChild(oo);
    oo.x = sec.width; oo.y = 80; oo.name = '1:1 session - ' + brief.brand;
    await loadFonts(oo);
    const o = brief.oneOnOne || {};
    setProp(oo, 'Name', o.name);
    if (o.hostPhoto) await photoFill(oo.findOne((n) => n.name === 'Host video'), o.hostPhoto);
    if (o.participantPhoto) { setProp(oo, 'Participant photo', true); await photoFill(oo.findOne((n) => n.name === 'Participant photo'), o.participantPhoto); }
    out.oneOnOne = oo.id;
    sec.resizeWithoutConstraints(oo.x + oo.width + 80, Math.max(sec.height, oo.height + 160));
  }
  parent.resizeWithoutConstraints(Math.max(parent.width, sec.x + sec.width + 80), Math.max(parent.height, sec.y + sec.height + 80));

  // ---- accent: recolour the template's light-blue accent and the active folder in all three
  if (brief.accent) {
    const A = hexToRgb(brief.accent);
    const light = mix(A, { r: 1, g: 1, b: 1 }, 0.3);
    const swap = (col) => {
      if (near(col, 'AECDE3')) return A;
      if (near(col, '7CD2F8') || near(col, '7DD2F7') || near(col, '7AD1F9')) return A;
      if (near(col, '9BE0FF')) return light;
      return null;
    };
    const recolour = (paints) => {
      let changed = false;
      const outP = paints.map((p) => {
        if (p.type === 'SOLID') { const s = swap(p.color); if (s) { changed = true; return { type: 'SOLID', color: s, opacity: p.opacity, visible: p.visible, blendMode: p.blendMode }; } return p; }
        if (p.type && p.type.startsWith('GRADIENT')) {
          let any = false;
          const stops = p.gradientStops.map((st) => { const s = swap(st.color); if (s) { any = true; return { position: st.position, color: Object.assign({}, s, { a: st.color.a }) }; } return st; });
          if (any) { changed = true; return Object.assign({}, p, { gradientStops: stops }); }
        }
        return p;
      });
      return changed ? outP : null;
    };
    for (const inst of [co, mo, cm]) {
      for (const n of [inst, ...inst.findAll(() => true)]) {
        for (const k of ['fills', 'strokes']) {
          if (!(k in n)) continue;
          const ps = n[k];
          if (!Array.isArray(ps) || !ps.length) continue;
          const r = recolour(ps);
          if (r) { try { n[k] = r; } catch (e) {} }
        }
      }
    }
  }
  // ---- optional 2x PNG export (after the accent, so the files show the brand colour): brief.server = 'http://localhost:<port>' (a server that saves POSTs)
  if (brief.server) {
    const slug = brief.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    out.exports = [];
    for (const [k, id] of Object.entries(out)) {
      if (k === 'exports') continue;
      const node = await figma.getNodeByIdAsync(id);
      if (!node) continue;
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
      const file = `${slug}-${k}@2x.png`;
      await fetch(`${brief.server}/${file}`, { method: 'POST', body: bytes });
      out.exports.push(file);
    }
  }

  figma.commitUndo();
  return { section: sec.id, ...out };
};
