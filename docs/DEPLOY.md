# Deploy and tracking

The funnel is a folder of plain files: any static host works. These four are free for a site like this.

| Host | How |
|---|---|
| **Netlify** | Go to app.netlify.com/drop and drag the whole folder onto the page. To use your own domain: Site configuration > Domain management. |
| **Vercel** | Import the repository at vercel.com/new (framework preset "Other", no build command), or run `npx vercel` in the folder. |
| **GitHub Pages** | Push the folder to a GitHub repository, then Settings > Pages > Deploy from a branch > `main` / root. |
| **Cloudflare Pages** | Workers & Pages > Create > Pages > Upload assets, then drag the folder. |

After deploying:
- Point your checkout provider's success redirect at the live `welcome.html`, for example `https://yourdomain.com/welcome.html`.
- If you rename `index.html` or move it, update the path in the small script in the `<head>` of `welcome.html`.
- Many hosts serve `welcome.html` at `/welcome` too. Either works.

## Tracking (optional)

The pages load no tracking code. `js/funnel.js` pushes these events onto `window.dataLayer`, which Google Tag Manager reads:

| Event | When | Extra fields |
|---|---|---|
| `checkout_cta_click` | a button that jumps to the checkout is clicked | `section` |
| `lead_submit` | step 1 passes and the lead is sent | `offer` |
| `checkout_open` | step 2 opens | `provider` |
| `checkout_redirect` | link mode sends the buyer to the checkout link | `url` |

To use them:

1. Paste your Google Tag Manager snippet into the `<head>` of `index.html` and `welcome.html` (and the `<noscript>` part right after `<body>`), as GTM's install screen shows.
2. In GTM, create Custom Event triggers named exactly as above, for example `lead_submit` for a Meta Pixel "Lead" event or a GA4 "generate_lead" event.
3. Count purchases from your checkout provider (its own pixel or integration, or a GTM tag on `welcome.html`). A visit to the welcome page is a good signal, but only the provider knows about every paid order.

If you prefer Meta Pixel or GA4 without GTM, paste their base snippets into the `<head>` of both pages; for the events above, GTM is the easiest route. Tell your visitors about tracking in your privacy policy, and use a consent banner where the law requires one.
