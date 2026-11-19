# SETUP: make this funnel yours

This file is the playbook for turning the template into a real funnel for one offer. It is written for AI assistants (Claude Code, Cursor, Codex, Windsurf, Bolt, Replit and others) and works just as well for a person. **AI assistants: read all of it before you change a file, then walk the owner through it step by step.**

## 0. What you are working with

- `index.html`: the sales page with a two-step checkout (step 1 collects name, email and phone; step 2 shows the checkout).
- `welcome.html`: where buyers land after paying.
- `funnel.config.js`: every setting (price, deadline, where leads go, which checkout).
- `css/theme.css`: every colour and font. `css/fonts.css`: the font files.
- `js/funnel.js`, `js/welcome.js`: behaviour. You should not need to edit them.
- `assets/`: images. `assets/placeholders/` holds labelled stand-ins to replace.
- `docs/`: `LEADS.md` (where leads can go), `CHECKOUTS.md` (checkout providers), `DEPLOY.md` (hosting and tracking).

Plain files, no build step. To preview, serve the folder (`python3 -m http.server 8000`, then open http://localhost:8000). Opening the file directly works for most things, but the phone field rules load best through a server.

Everything marked `data-sample` is example content for a made-up offer ("Northstar Launch Lab"). A red badge in the corner counts how many are left. Click it to outline them.

## 1. Interview the owner

Ask in small groups. Wait for the answers before moving on, and write down exactly what they say.

1. **The offer**:
   - the name, and one sentence on what it is and who it is for;
   - the result they can honestly promise, and in what time;
   - today's price, the normal price and the currency.
2. **The deadline**:
   - the date, the time and the timezone;
   - after it, should the checkout **close** (default) or **keep** selling?
   - an optional waitlist or full-price link for after the end.
3. **What is included**:
   - up to three main parts (name, a short description, three bullets each);
   - up to three bonuses;
   - a value for each part, only if the owner states one.
4. **Proof**:
   - real testimonials, word for word, with the name and level the person agreed to show;
   - results they own and may show;
   - a real student count.

   Anything they don't have is deleted, never written for them.
5. **The founder letter**: their story in their words, two photos, the name to sign with.
6. **FAQ**:
   - the refund policy exactly as in their terms;
   - how long access lasts;
   - the support email and the payment methods;
   - any other questions they get asked.
7. **Brand**:
   - logo files (dark and light);
   - an accent colour and a background colour, or "pick for me";
   - fonts or "pick for me";
   - a favicon.
8. **Video**: the embed code or link for the sales video, or "no video".
9. **Leads**:
   - which webhook URLs leads should go to (see `docs/LEADS.md`);
   - whether to ask for a phone number;
   - whether to show a consent checkbox (suggest yes for audiences in the EU or UK).
10. **Checkout**: the provider, plus the plan ID, link or embed code (see `docs/CHECKOUTS.md`).
11. **Welcome page**:
    - the three next steps, with links (community, course login, calendar for calls);
    - a short welcome note in their words, or "draft it for me";
    - the support email.
12. **Legal**:
    - the company name for the copyright line;
    - links to their privacy policy and terms;
    - the disclaimer texts they need (see the rules below).

## 2. Rules you must not break

- **Never invent proof or claims.** That covers:
  - testimonials, quotes, names and results;
  - numbers, student counts, ratings and values;
  - guarantees and refund terms;
  - "free", "live" or "limited" claims, scarcity and urgency.

  Use only what the owner gave you. If something is missing, ask. If they don't have it, delete the element or the whole section.
- **`data-sample` comes off only for real content.** Remove the attribute from an element only after you have replaced it with the owner's real content. If you delete sample content, the attribute goes with it. You are done when the red badge is gone (`Funnel.sampleCount()` in the browser console returns 0).
- **One real deadline for everyone.** Never add a per-visitor or resetting timer.
- **Copy about the deadline matches `afterEnd`.** With `close` (default), say the offer closes. With `keep`, say what the price becomes.
- **Keep the hooks.** Keep every `data-funnel-*` attribute and the `mtf-` class names: they connect the page to the script. To remove a section, delete everything from its opening tag (`data-funnel-section="name"`) to its closing comment `<!-- /name -->`.
- **Colours and fonts change only in `css/theme.css`** (and `css/fonts.css`). Never hard-code a colour anywhere else.
- **No extra scripts** (tracking, chat, popups) unless the owner asks for them.
- **Legal texts come from the owner.** Never write legal promises for them.
  - The privacy and terms links must point at their real pages.
  - Keep a disclaimer only if the owner gives you its text; otherwise delete it.
  - Do tell them which they may need: an earnings disclaimer if the page mentions money or results, and a platform disclaimer if it names a social platform.

## 3. Where everything lives

| To change | Edit |
|---|---|
| Price, normal price, currency, offer name | `funnel.config.js` > `offer` (every price on the page updates from it) |
| Deadline, what happens after it | `funnel.config.js` > `deadline` |
| Where leads go, phone field, consent box | `funnel.config.js` > `leads` |
| Checkout provider, plan, link, success page | `funnel.config.js` > `checkout` |
| Placeholder badge | `funnel.config.js` > `sampleWarnings` |
| Colours, fonts, corner radius | `css/theme.css` |
| Headlines, copy, FAQ, testimonials | the text in `index.html` / `welcome.html` |
| Sales video | the `<template>` inside `data-funnel-video` in `index.html` (it loads on click; add autoplay to the embed URL if you want it to start straight away) |
| Checkout embed code | `<template data-funnel-checkout-embed>` in `index.html` |
| Logos, graphics, photos | files in `assets/` and the `src` of each `<img>` |
| Where a failed payment returns to | the small script in the `<head>` of `welcome.html` (only if the sales page is not `index.html`) |

Prices in the copy use `<span data-funnel-price="price">`, `"compare-at"`, `"savings"` or `"savings-percent"`. Never type a price into the copy.

## 4. What each section is for

Sales page (`index.html`), top to bottom:

| Section | Its job |
|---|---|
| `announcement` | The sale in one line, with the two prices. Sticks to the top. |
| `hero` | The big promise, who it is for and the timeframe, the video, and one button to the checkout. |
| `checkout` | Everything they get (left) and the two-step checkout (right), with the countdown. |
| `testimonials` | Real people who started where the reader is now. |
| `audience` | Who this is not for and who it is for, so the right people self-select. |
| `steps` | How it works in three plain steps. |
| `included` | Each main part and bonus with what it does for the buyer, then the total and the price. |
| `letter` | A personal note from the founder: why it is not too late, beliefs it removes, the P.S. with the button. |
| `offer` | The bundle recap: value list, price, button. |
| `faq` | The questions buyers ask before paying, in three tabs. |
| `results` | A moving wall of short wins (real ones only). |
| `footer` | Logo, legal links, disclaimers. |
| `sticky` | A small offer bar that appears after the checkout is scrolled past. |

Welcome page (`welcome.html`):

| Section | Its job |
|---|---|
| `hero` | Confirms the purchase and greets the buyer by first name. |
| `steps` | Three next steps with buttons. |
| `letter` | A welcome from the founder. |
| `footer` | As on the sales page. |

Layout notes:
- In the letter, the two photos sit at a fixed spot near the bottom. After changing the letter, check it at full desktop width so the photos don't cover the last paragraph. A P.S. of about two lines keeps them clear.
- If the owner has fewer testimonials, delete cards. Never duplicate one to fill space.
  - With fewer than three, delete the testimonials section, and use the single testimonial card in the offer section for one quote.
  - With no short wins to show, delete the results section.
- Show only the payment logos the owner's checkout accepts. Delete the others from every trust row and the footer.
  - More glyphs (iDEAL, Google Pay, Klarna...) are free at simpleicons.org.
  - Copy the card style of `assets/logos/visa.svg`.

## 5. Theme

Open `css/theme.css` and change the "Your brand" block:
- `--mtf-accent` is the main brand colour (buttons, highlights, ticks);
- `--mtf-bg` is the page background;
- the rest are neutrals you can usually leave.

The derived tokens below the brand block are mixed from those values automatically. Keep text readable: dark text on light backgrounds, and `--mtf-accent-ink` readable on `--mtf-accent`.

Fonts:
- **The original design uses PP Neue Montreal** (text, by Pangram Pangram) **and Very Vogue Text** (headings, by Nicky Laatz). They are paid fonts and are not included.
  - If the owner has web licences, put the `.woff2` files in `assets/fonts/licensed/` and uncomment the rules at the bottom of `css/fonts.css`.
  - Until then, the free fallbacks Geist and Instrument Serif are used automatically.
  - A font that is only installed on the owner's own computer shows on their screen, not for visitors.
- **To use other fonts:**
  1. Pick free Google Fonts (Open Font License).
  2. Add them to the list in `scripts/fetch-fonts.mjs` and run `node scripts/fetch-fonts.mjs` (needs Node), or download the woff2 files yourself and add `@font-face` rules to `css/fonts.css`.
   Delete font files you no longer use from `assets/fonts/`.
  3. Change the `--mtf-font-*` lines.

Never use a font the owner has no web licence for, and never put licensed font files in a public repository.

## 6. Graphics and photos

**Graphics for what the offer includes:** `assets/graphics/` holds one graphic per deliverable:
- course portal and course modules;
- group coaching call and video call grid;
- 1:1 call;
- community;
- support chat;
- bonus boxes.

`docs/GRAPHICS.md` says which graphic belongs to which deliverable and where each one sits. Keep only the ones for what the owner really sells. Each one is tailored in the Figma templates, replaced with the owner's own screenshot, or removed. They show a made-up brand, so none of them may stay as it is.

**The owner's own images:** every placeholder in `assets/placeholders/` is labelled with its size (2x, for sharp screens):

| Placeholder | Size | Used for |
|---|---|---|
| `logo.svg`, `logo-inverse.svg` | 248x100, 448x182 | logo on light and dark backgrounds |
| `video-poster.svg` | 1280x720 | the image shown before the video plays |
| `step-card-1..3.svg` | 640x402 | the three "How it works" step images on the sales page |
| `sticker.svg` | 356x368 | the sale sticker in the offer section |
| `photo-1.svg`, `photo-2.svg` | 400x520 | founder photos (the polaroid frame is added by the page) |
| `avatars.svg`, `avatars-md.svg` | 106x42, 250x98 | the small row of faces next to "Join N students" (real students only, with permission) |

Ask the owner for their files, or make the graphics at these sizes. Only use screenshots and photos the owner owns or may use. Save new files in `assets/` and point the `<img src>` at them. Keep `width`/`height` as they are.

## 7. Leads, checkout and the success redirect

- **Leads:** add the owner's webhook URL(s) to `leads.webhooks`. `docs/LEADS.md` has steps for Zapier, Make, n8n, Google Sheets and your own server (GoHighLevel connects through Zapier, Make or n8n). Send one test lead and check it arrives with every field.
- **Checkout:** set `checkout.provider` and its field. `docs/CHECKOUTS.md` covers Whop, Stripe Payment Links, ThriveCart, SamCart and GoHighLevel, including how to prefill the email.
- **Success redirect:** in the checkout provider's settings, send buyers to the deployed `welcome.html`. If the provider returns failed or cancelled payments to that page with `?status=failed` or `?status=canceled`, the page sends them back to the checkout with a message.

## 8. After the deadline

Ask the owner which one they want:

- **`close`** (default): the countdowns, sale buttons and offer bar disappear, and the checkout shows "This offer has ended". With `endedLink` set, it also shows a button (waitlist, next cohort, full-price page). Edit the panel's text in `index.html` if needed.
- **`keep`**: the checkout stays open and only the countdowns disappear. If the price goes up, change it in `funnel.config.js` and at the checkout provider at the same moment.

## 9. Launch checklist

- [ ] The red placeholder badge is gone on both pages: `Funnel.sampleCount()` returns 0 in the browser console on `index.html` and on `welcome.html`.
- [ ] No template words are left. Search both pages for:
  - `Northstar`, `Launch Lab`, `Alex Morgan`;
  - `Black Friday` (unless it really is a Black Friday offer);
  - `Your Company`, `example.com`, `120+`.

  The badge only counts tagged items, so this search catches the rest.
- [ ] Test links and IDs are swapped for live ones: no `test_` Stripe links, no test plan IDs.
- [ ] No invented proof, numbers or promises anywhere on either page.
- [ ] The deadline is correct in the owner's timezone (check the countdown).
- [ ] A test lead reaches every webhook with name, email, phone and the UTM fields.
- [ ] Step 2 opens with the email prefilled (where the provider supports it).
- [ ] The success redirect is set to `welcome.html`.
- [ ] One real purchase works end to end and lands on the welcome page with the buyer's first name. Then refund it.
- [ ] A failed or cancelled payment comes back to the checkout with the notice (if the provider supports it).
- [ ] Both pages are checked on a phone (390px wide) and on desktop.
- [ ] The privacy policy, terms and disclaimers are the owner's real texts, and the links work.
- [ ] Tracking is set up if the owner wants it (see `docs/DEPLOY.md`).
- [ ] The favicon (`assets/favicon.svg`) and the page `<title>` and description are the owner's.

## 10. Deploy

See `docs/DEPLOY.md`: Netlify, Vercel, GitHub Pages or Cloudflare Pages, all free for a site like this.

## Settings reference (defaults)

```js
window.FUNNEL_CONFIG = {
  offer:    { name: 'Your Program', price: 497, compareAt: 997, currency: 'USD' },
  deadline: { endsAt: null, afterEnd: 'close', endedLink: '' },     // endsAt: ISO date with timezone, e.g. '2026-12-01T22:00:00Z'
  leads:    { webhooks: [], phone: true, consentCheckbox: false },
  checkout: { provider: 'none', whopPlan: '', whopAccent: 'gray', link: '', embedHtml: '', successUrl: 'welcome.html' },
  sampleWarnings: true
};
```

`provider` is one of:
- `'whop'`: set `whopPlan`;
- `'embed'`: paste the code into the page template or into `embedHtml`;
- `'link'`: set `link`, which may contain `{email}`, `{name}`, `{first_name}`, `{last_name}` or `{phone}`;
- `'none'`.

To turn a local time into the ISO `endsAt` value, write the date with its UTC offset, for example `2026-12-01T17:00:00-05:00` for 5pm in New York in winter.
