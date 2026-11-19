# Graphics kit: tailor the graphics to your offer

Every graphic in `assets/graphics/` has an editable template in one Figma file:

**[Info Funnel Graphic Templates](https://www.figma.com/design/3r8j4H9unrBJ7k72I6wA5k/Info-Funnel-Graphic-Templates)** (free, view link)

| Page | What is on it |
|---|---|
| Start here | the steps and a table of which template becomes which file in `assets/graphics/` |
| Templates | the course portal (laptop, tablet, phone, all devices), course modules card, group coaching call card, video call grid, 1:1 session call, community members, support chat and the blank product box |
| Example | every template filled in for the made-up brand "Northstar Launch Lab", plus the bundle shot |

The file uses free Google fonts only (Geist, Instrument Serif, Manrope, Inter, Roboto), so you or your AI can edit every text. People are grey placeholders.

First, in Figma: open the link and choose **Duplicate to your drafts** (a free Figma account is enough). Always work in your own copy.

You can fill it in two ways.

## 1. By hand (no setup)

- **Course portal:** open Local variables, collection "Course portal". Change `course/*`, `lesson/*`, `post/*` and `module/1-8/name|description`. Set `module/N/show` to false for modules you don't have. Change the four brand colours (`color/bg/brand`, `color/text/brand`, `color/icon/brand`, `color/bg/brand-faint`). Replace the artwork in the `Course portal/Logo` main component. Every screen and device updates.
- **Calls, community, support, modules card:** select an instance and change its properties in the right-hand panel (names, titles, roles, chat lines). The colours are in the "Info brand graphics" collection (`accent`, `folder/*`, `status/*`, `call/end`, `chat/link`).
- **Photos:** drop an image on a "Photo" layer. Only use photos of people who agreed.
- **Export:** every template has a 2x PNG export set. Save each file under the name in the "Start here" table, convert it to WebP if you like, and put it in `assets/graphics/`.

## 2. With AI (Claude Code, Cursor, Codex, Windsurf)

Your AI tool can fill the whole file from your offer. It needs to run code inside Figma, which works through the free, open-source **figma-console MCP** server and its **Figma Desktop Bridge** plugin (github.com/southleft/figma-console-mcp). Set that up in your AI tool once, open your copy of the file in the Figma desktop app, and run the Desktop Bridge plugin in it.

Then paste this to your AI:

```text
Tailor the graphics for my offer with the graphics kit in graphics/ (read graphics/README.md first).
My copy of the Figma file is open with the Desktop Bridge plugin running.
```

### Steps for the AI

1. **Read the offer.** Use what the owner told you (or SETUP.md's interview): brand name, logo, brand colour, course name, modules, coaching call name, community, support, bonuses. Make graphics only for deliverables the offer really includes. Never invent names, numbers or results.
2. **Write two briefs** next to the examples, and keep every field the owner has no answer for out of them:
   - `graphics/briefs/course-portal.json`, shaped like `course-portal.example.json`. Up to 8 modules, each with a [Lucide](https://lucide.dev/icons) icon name. `python3 graphics/figma/brand_color.py <logo file>` suggests `brandHex` from the logo. Put the logo in as inline `svg`, or as a `png` path on the server.
   - `graphics/briefs/info-brand.json`, shaped like `info-brand.example.json` (coaching call, modules card, community, support, 1:1).
3. **Get the icons.** For every icon name in the course brief that is not in `graphics/figma/icons/`:
   `curl -sf https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/<name>.svg -o graphics/figma/icons/<name>.svg`
4. **Start the local server** from the repository root and leave it running:
   `python3 graphics/figma/serve.py 9231`
   The Desktop Bridge plugin can only reach `http://localhost` on ports 9223 to 9232, and the MCP servers often take 9223 to 9227, so use a free port from 9228 to 9232. If you pick another port, change `server` in both briefs to match.
5. **Run the scripts in Figma** (one bridge call each). The file must show the "Templates" page:

   ```js
   (0, eval)(await (await fetch('http://localhost:9231/figma/course-portal.js')).text());
   const brief = await (await fetch('http://localhost:9231/briefs/course-portal.json')).json();
   return await CPT.tailor(brief);
   ```

   ```js
   (0, eval)(await (await fetch('http://localhost:9231/figma/info-brand.js')).text());
   const brief = await (await fetch('http://localhost:9231/briefs/info-brand.json')).json();
   return await IBG_FILL(brief);
   ```

   Each one adds a "Tailored - <brand>" copy next to the templates (the templates stay untouched) and saves 2x PNGs to `graphics/figma/exports/`. Read the result: `warnings` lists texts that wrap to more lines than the template, so shorten that copy in the brief and run it again.
6. **Look at the result.** Take a screenshot of each tailored section, and fix anything that looks off before going on.
7. **Put the graphics in the funnel:**
   `python3 graphics/figma/to-assets.py <export.prefix of the course brief> <info brief brand, lower-case-with-dashes>`
   This writes the WebP files into `assets/graphics/` at the sizes the page uses (it needs Pillow: `pip install pillow`). Then remove `data-sample` from each graphic you replaced, as SETUP.md describes.
8. **By hand, with the owner** (no script for these yet):
   - **Video call grid:** set the names and the meeting title on the "Video call template" instance, export it at 2x and save it as `video-call-grid.webp` (the page shows it at 1052x652).
   - **Bonus boxes:** one per real bonus. Edit a flat cover from the Example page, export it at 2x, run `python3 graphics/figma/warp_cover.py <cover.png> <overlay.png>` (needs Pillow and NumPy), put the overlay on the box's "Cover print" layer, and export the box as `bonus-box-N.webp` (600x800).
   - **Bundle shot:** on the Example page, swap the parts inside "Bundle - Northstar Launch Lab" for the tailored ones, and export it as `offer-bundle.webp`.

## Rules

- Only graphics for deliverables the offer really includes. No 1:1 calls, no 1:1 graphic.
- No real people's faces or names without their permission. Without a photo, the grey placeholder stays.
- No made-up results, numbers or testimonials in any graphic.
- Never leave a Northstar sample graphic on a live page.

## What is in this folder

| File | What it does |
|---|---|
| `figma/course-portal.js` | `CPT.tailor(brief)`: copies the course portal exports, fills copy, colours, logo and icons, exports PNGs |
| `figma/info-brand.js` | `IBG_FILL(brief)`: fills the coaching call card, modules card, community, support chat and 1:1 call, exports PNGs |
| `figma/serve.py` | local server for the plugin: serves `graphics/`, saves POSTed exports to `figma/exports/` |
| `figma/to-assets.py` | turns the exports into `assets/graphics/*.webp` at the right sizes |
| `figma/brand_color.py` | suggests a brand colour from a logo |
| `figma/warp_cover.py` | puts a flat bonus cover onto the product box in perspective |
| `figma/icons/` | the Lucide icons the example brief uses (ISC licence, see `icons/LICENSE`) |
| `briefs/*.example.json` | example briefs for the made-up Northstar brands |
