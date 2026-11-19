# Mid-ticket Checkout Funnel

A free, ready-to-sell template for a mid-ticket offer: a long-form sales page with a **two-step checkout built into the page**, plus a **welcome page** for buyers.

![The sales page](docs/preview.png)

**Live demo:** https://conversion-brands.github.io/mid-ticket-checkout-funnel/ (welcome page: `/welcome.html`)

## What it does

- **Two-step checkout on the page.** Step 1 takes name, email and phone (with a country picker). Step 2 shows your checkout right below it. Visitors never leave the page, and the page never jumps.
- **Leads go anywhere.** Every step-1 lead is posted to any webhook you list: Zapier, Make, n8n, a Google Sheet or your own server. GoHighLevel and other CRMs connect through one of those. It happens before payment, so you can follow up on abandoned checkouts.
- **Bring your own checkout.**
  - **Whop:** paste your plan ID.
  - **Any embed code:** ThriveCart, SamCart and others.
  - **Any checkout link:** Stripe Payment Links, GoHighLevel payment links and others.

  The buyer's email is filled in for you where the provider allows it.
- **One honest countdown.** The same deadline for every visitor. When it passes, the checkout closes (or keeps selling, your choice).
- **A welcome page that converts the moment after purchase:** confetti, a "You did it, Sam!" greeting and three clear next steps. Failed or cancelled payments are sent back to the checkout with a message.
- **Theme in one file.** Every colour and font lives in `css/theme.css`.
- **Plain files.** HTML, CSS and a little JavaScript. No build step, no framework, and no third-party requests unless you add them. Fonts are self-hosted.
- **Placeholder guard.** Example content is marked, and a red badge counts what you still need to replace, so you never go live with sample testimonials.

## Make it yours with one prompt

Open **[PROMPT.md](PROMPT.md)**, copy the prompt (the copy button sits at the top right of the box) and paste it into an AI coding tool:
- Claude Code, Cursor, Codex or Windsurf;
- **Bolt:** open https://bolt.new/github.com/Conversion-Brands/mid-ticket-checkout-funnel, or use "Import from GitHub", then paste the prompt;
- **Replit:** Create > Import from GitHub > paste the repository URL, then paste the prompt.

Lovable is not supported yet, because it cannot import an existing repository.

The AI works in stages:
1. It reads the template.
2. It interviews you a few questions at a time: hosting, brand, offer, what buyers get, proof, checkout, leads and tracking.
3. It matches the graphics to what you sell.
4. It shows you a build summary and waits for your yes.
5. It builds, tests and deploys when you say so.

It never invents testimonials, results, guarantees or urgency: anything you don't have is left out.

## Without AI

1. Download the ZIP (Code > Download ZIP) and unzip it.
2. Follow [SETUP.md](SETUP.md): edit `funnel.config.js`, `css/theme.css` and the text in `index.html` and `welcome.html`.
3. Drag the folder onto [Netlify Drop](https://app.netlify.com/drop). Other hosts are covered in [docs/DEPLOY.md](docs/DEPLOY.md).

## Webflow

A cloneable Webflow version is on its way. This page will link to it.

## What's in the box

| File | What it is |
|---|---|
| `index.html` | the sales page with the two-step checkout |
| `welcome.html` | the page buyers land on after paying |
| `funnel.config.js` | all settings: price, deadline, lead webhooks, checkout |
| `css/theme.css` | all colours and fonts |
| `PROMPT.md` | the build prompt for your AI tool |
| `SETUP.md` | the full manual (for you or your AI) |
| `assets/graphics/` | sample graphics for each kind of deliverable (course, coaching, 1:1, community, support, bonuses) |
| `docs/` | lead destinations, checkout providers, deploying and tracking |
| `tests/` | the maintainer's automated tests (you don't need them) |

## Credits and licence

Template by **The Conversion Brands**. Want it built and launched for you? [theconversionbrands.com](https://theconversionbrands.com/)

Free to use for your own and your clients' funnels under the [MIT licence](LICENSE). Bundled pieces keep their licences:
- the fonts: SIL Open Font License, in `assets/fonts/`;
- the icons: Lucide, ISC;
- the payment glyphs: Simple Icons, CC0;
- intl-tel-input: MIT;
- canvas-confetti: ISC.
