/*
  SETTINGS for the Mid-ticket Checkout Funnel. Change the values, keep the shape.
  Every key is optional: anything you leave out falls back to the default shown in SETUP.md.
*/
window.FUNNEL_CONFIG = {
  offer: {
    name: 'Northstar Launch Lab', // used in the lead data and the page's price labels
    price: 497,                    // what buyers pay today
    compareAt: 997,                // the normal price, shown struck through; leave it out if there is no discount (no discount is shown then)
    currency: 'USD'                // ISO code: USD, EUR, GBP, AUD...
  },

  deadline: {
    endsAt: '2027-06-30T22:00:00Z', // when the offer ends, ISO date with a timezone (Z = UTC). Same moment for every visitor.
    afterEnd: 'close',              // 'close': hide the countdowns and sale buttons and show "This offer has ended"
                                    // 'keep':  keep selling, only hide the countdowns
    endedLink: ''                   // optional button on the ended panel, e.g. a waitlist page
  },

  leads: {
    webhooks: [],                   // every lead from step 1 is posted to each URL here (Zapier, Make, n8n, GoHighLevel, your own)
    phone: true,                    // show and require the phone field
    consentCheckbox: false          // show an optional "email me about this offer" checkbox; the lead's consent field says yes or no
  },

  checkout: {
    provider: 'none',               // 'whop' | 'embed' | 'link' | 'none' (see docs/CHECKOUTS.md)
    whopPlan: '',                   // provider 'whop': your Whop plan ID, e.g. plan_XXXXXXXX
    whopAccent: 'gray',             // provider 'whop': Whop's accent name for its own fields
    link: '',                       // provider 'link': your checkout URL, e.g. https://buy.stripe.com/xxx?prefilled_email={email}
    embedHtml: '',                  // provider 'embed': embed code, if you can't paste it into the page's <template data-funnel-checkout-embed>
    successUrl: 'welcome.html'      // where buyers land after paying (also set this in your checkout provider)
  },

  sampleWarnings: true              // show the "template placeholders left" badge until every data-sample item is replaced
};
