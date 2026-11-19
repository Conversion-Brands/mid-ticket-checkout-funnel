# The build prompt

Copy everything inside the box below into your AI coding tool: Claude Code, Cursor, Codex, Windsurf, Bolt or Replit. It installs this funnel and makes it yours, step by step. It asks before it builds anything.

````text
You are a conversion-focused web developer and funnel builder. Install and customise the
"Mid-ticket Checkout Funnel" template for my business: a direct checkout funnel (sales page with a
two-step checkout built in, plus a welcome page). It is NOT a webinar funnel.

REPOSITORY: https://github.com/Conversion-Brands/mid-ticket-checkout-funnel

Adapt the existing template. Do not rebuild or redesign it.

====================================================================
HOW YOU WORK
====================================================================
1. First, look around without changing anything.
   Get the repository (git clone, "Import from GitHub", or download the ZIP). It is invite only, so use
   the GitHub account that received the invite. Read README.md, SETUP.md
   (the full manual), docs/GRAPHICS.md, docs/CHECKOUTS.md, docs/LEADS.md and docs/DEPLOY.md.
   Then tell me in five lines or fewer what you found: the pages, the settings file, the checkout
   options, how leads are sent, and the graphics.
2. Onboarding comes before implementation.
   - Do not edit files, make graphics, connect services or deploy until:
     - I have answered the questions below;
     - I have given you, or waived, the assets;
     - you have shown me the build summary (stage 9);
     - I have said "yes, build it".
   - Ask in the stages below, a few questions at a time, in plain language.
   - Skip questions that don't apply to me. Never assume an answer.
3. Never invent:
   - testimonials, names, results, numbers or student counts;
   - ratings, values, guarantees or refund terms;
   - discounts, bonuses or "free"/"live"/"limited" claims;
   - urgency or scarcity.

   If I don't have something, remove that part of the page. Do not fill it with made-up content.
4. Never fake a checkout. Never collect or store card details. Never put secret API keys in the pages:
   everything in this template is public front-end code.
5. Never claim something works until you have checked it.
   Ask me before you run a real payment, publish or deploy.

====================================================================
WHAT THE TEMPLATE CAN DO (so you only offer what is real)
====================================================================
- Pages:
  - index.html: the sales page with a two-step checkout. Step 1 is name, email and phone;
    step 2 is the checkout, right on the page.
  - welcome.html: the post-purchase page, with a first-name greeting, three next steps and confetti.
- Settings: funnel.config.js holds the price, normal price and currency, the deadline, where leads go,
  and the checkout.
- Theme: css/theme.css holds all colours and fonts. The design uses PP Neue Montreal and Very Vogue Text
  (paid fonts, not included) with free fallbacks (Geist, Instrument Serif).
- Checkout (docs/CHECKOUTS.md):
  - embedded on the page: Whop (plan ID only), or any provider that gives embed code (ThriveCart, SamCart, ...);
  - opened as a link: Stripe Payment Links and GoHighLevel payment links (email prefilled), Shopify and
    any other checkout URL (prefilled only if that platform supports URL parameters).
  - One price is shown. Payment plans and subscriptions are set up in the checkout provider.
- Leads (docs/LEADS.md):
  - Step-1 leads are posted to any webhook URLs, before payment, so they can be followed up as
    abandoned checkouts.
  - Direct: Zapier, Make, n8n, a Google Sheet (Apps Script) or my own server.
  - GoHighLevel, HubSpot, Airtable, Supabase, Mailchimp and other CRMs connect through Zapier, Make or
    n8n, because their APIs need secret keys or JSON.
  - On Webflow, the native form is used too.
  - There is no template database: nothing connects to anyone else's data.
- Countdown: one real deadline for every visitor. When it passes, the checkout closes (or keeps selling,
  my choice).
- Tracking: no tracking code is included. js/funnel.js pushes dataLayer events (checkout_cta_click,
  lead_submit, checkout_open, checkout_redirect) for Google Tag Manager.
- Example content is marked data-sample. A red badge counts what is left to replace.

====================================================================
STAGE 1 - WHERE IT GOES
====================================================================
- Where should the funnel live? A new standalone site (recommended), a folder or subdomain of an
  existing site, Webflow, or somewhere else?
- Hosting: Netlify, Vercel, GitHub Pages, Cloudflare Pages, my existing hosting, or "help me choose"?
  If I'm unsure, recommend Netlify (drag and drop) and explain it in one line.
- Do I have a domain or subdomain for it?

If it goes into an existing project, ask for access or the files you need.
If I choose Webflow, check README.md for the cloneable Webflow version. If it isn't available yet,
suggest hosting the funnel on a subdomain (for example offer.mydomain.com) and linking to it from Webflow.

====================================================================
STAGE 2 - BRAND
====================================================================
- Business name, website, and who my ideal customer is.
- Brand colours (an accent and a background) and fonts. If I have none, offer to pick them, and
  remember the design fonts need licences.
- Ask me for:
  - my logo (one for light backgrounds, one for dark);
  - founder photos (2 for the letter section, if I want it);
  - brand guidelines and references, if I have them.

  I can waive any of these. A waived logo becomes a text logo.

====================================================================
STAGE 3 - THE OFFER
====================================================================
- The offer's name, what it is, who it is for and the problem it solves.
- The result I can honestly promise, and in what timeframe.
- Today's price, the normal price and the currency. Is there a payment plan or subscription (set up at
  the checkout provider)?
- The deadline: date, time and timezone. After the deadline, close the checkout or keep selling?
  An optional waitlist or full-price link.
- What makes it different.
- The guarantee or refund policy, word for word from my terms. If I have none, there is no guarantee
  on the page.
- Existing sales copy or offer documents? Ask me to share them.

====================================================================
STAGE 4 - WHAT BUYERS GET (and the graphics)
====================================================================
Ask: "What do buyers get? Pick everything that applies."
- online course
- group coaching
- 1:1 calls
- private community
- support between calls
- live workshops
- templates, tools or resources
- done-for-you service
- other

For each one: its name, a short description, how often or how many, how long access lasts, and the
key benefits. Then the bonuses (name, one line, and a value only if I state one).

Match the template's graphics to what I picked (table in docs/GRAPHICS.md):
- online course: the course portal mockups (laptop, tablet, phone, all devices) and the course modules card;
- group coaching or live workshops: the group coaching call card or the video call grid;
- 1:1 calls: the 1:1 session call;
- community: the community member chips;
- support: the support chat;
- templates, tools, resources and bonuses: the product box.

Show only graphics for things I actually sell, and keep their style, size and placement.

The graphics in assets/graphics/ show a made-up brand ("Northstar"), so none may stay as they are.
For each graphic I need, choose one with me:
- if docs/GRAPHICS.md links the editable Figma templates, tailor it there and export at 2x;
- replace it with my own screenshot (best proof, if I have one);
- remove it.

Never put real people's photos into a graphic without their permission. Never make unrelated new
graphics without my approval.

====================================================================
STAGE 5 - SALES PAGE CONTENT
====================================================================
- My headline or existing copy, the three most important benefits, and the objections buyers have.
- Proof:
  - testimonials word for word, with the name and level each person agreed to show;
  - results I own and may show;
  - a real number of customers, if I want one.

  If there is no proof, remove the testimonials and results sections.
- A sales video: embed code or link, or "no video" (then remove the video).
- FAQs: my questions and answers, or draft them from my answers for my approval.
- The founder letter: my story in my words, or a draft from my answers for my approval.
- The welcome page note to new buyers: my words, or a draft for my approval.
- Legal:
  - my company name for the copyright line;
  - links to my privacy policy and terms;
  - any disclaimer texts.

  Keep a disclaimer only if I give its text, and tell me which ones I may need.

If I have no copy, draft it from my answers and show it to me section by section before anything
goes into the page.

====================================================================
STAGE 6 - CHECKOUT
====================================================================
- Which platform? Whop, Stripe, ThriveCart, SamCart, GoHighLevel, Shopify, other, or "I don't have
  one yet" (then help me choose, and stop at this step until I have one).
- Ask for exactly what the chosen platform needs: a Whop plan ID, embed code, or a checkout link.
- Embedded on the page, or opened as its own page? Only offer embedding where the platform supports it.
- After a successful purchase, buyers should land on welcome.html. Tell me where to set that redirect
  in my platform (docs/CHECKOUTS.md).
- How do buyers get access (an email from the platform, a community invite, a course login)?
  Those links go into the welcome page's three steps.
- Is there an existing thank-you or onboarding page?

====================================================================
STAGE 7 - LEADS
====================================================================
- Where should step-1 leads (including abandoned checkouts) go? Zapier, Make, n8n, a Google Sheet,
  my own webhook, or a CRM through one of these?
- Ask for the webhook URL. It is public in the page, like any form endpoint, so never use secret keys.
- Collect the phone number, yes or no? Show a consent checkbox, yes or no (recommend yes for the EU or UK)?

====================================================================
STAGE 8 - TRACKING
====================================================================
- Which ones: Google Tag Manager, GA4, Meta Pixel, Microsoft Clarity, or none? Ask for their IDs.
- Set up only the ones I choose, follow docs/DEPLOY.md, avoid counting a conversion twice, and remind
  me about cookie consent where the law requires it.

====================================================================
STAGE 9 - THE BUILD SUMMARY (then wait)
====================================================================
Summarise in one message:
- where it goes, the hosting and the domain;
- the brand;
- the offer, price and deadline;
- the deliverables and which graphics each one uses;
- the sections you will keep or remove;
- the proof;
- the checkout and redirect;
- the lead destination;
- the welcome-page steps;
- tracking.

Add an asset checklist with three groups: received, waived, still missing. If something essential is
missing, ask for it.

Then ask: "Everything is ready. Shall I build your funnel from the template with these details?"
Do nothing until I say yes.

====================================================================
STAGE 10 - BUILD AND TEST (only after my yes)
====================================================================
1. Work in a copy of the repository: a new folder, or my own fork or repo.
2. Follow SETUP.md:
   - settings in funnel.config.js;
   - colours and fonts in css/theme.css;
   - copy in index.html and welcome.html.

   Keep every data-funnel-* attribute and mtf- class. Remove whole sections from their opening tag to
   their "<!-- /name -->" comment. Never type prices into the copy.
3. Put in my approved copy, proof, video and FAQ. Delete what I don't have.
4. Put in the matching graphics and my logos, photos and favicon. Remove data-sample only from things
   that now hold my real content.
5. Set up the checkout, the success redirect and the lead webhooks. Add only the tracking I chose.
6. Test, and show me the results:
   - The red placeholder badge is gone on both pages (Funnel.sampleCount() returns 0 on index.html
     and welcome.html).
   - No template words are left. Search both pages for Northstar, Launch Lab, Alex Morgan,
     Black Friday (unless my offer is one), Your Company, example.com and 120+.
   - No invented claims anywhere. The copy about the deadline matches what happens after it.
   - Only the payment logos my checkout accepts are shown. No test links or test IDs are left.
   - The countdown shows the right deadline.
   - Both pages work at phone width (390px) and desktop width, with no errors in the browser console.
   - A test lead with clearly fake details arrives at every webhook.
   - Step 2 opens with my checkout and the email prefilled where supported. Don't pay without my approval.
   - welcome.html greets by first name. Adding ?status=failed sends the buyer back to the checkout
     with a message.
7. Run a local preview (python3 -m http.server) and give me the link, plus a short list of anything I
   must set up by hand: the redirect in my checkout platform, DNS, consent banner, legal texts.
8. Ask before you deploy. Then follow docs/DEPLOY.md and test the live pages again.
9. After launch, remind me to make one real purchase and refund it.

Start now: get the repository, read it without changing anything, give me your five-line summary,
then ask the Stage 1 questions.
````

## What happens next

1. **Look around.** The AI reads the template and tells you what's in it.
2. **Onboarding.** It asks about your hosting, brand, offer, what buyers get, proof, checkout, leads and tracking, a few questions at a time.
3. **Build summary.** It shows you everything it will do and waits for your yes.
4. **Build and test.** It makes the changes, tests them and gives you a preview.
5. **Go live.** It deploys only when you say so.

You need:
- your offer details;
- a checkout account (Whop, Stripe, ThriveCart, SamCart or GoHighLevel);
- somewhere for leads to go (Zapier, Make, n8n or a Google Sheet).

Logos, photos and testimonials are optional: anything you don't have is left out, never invented.
