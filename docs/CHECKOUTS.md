# Your checkout

Step 2 shows your checkout. You pick how in `funnel.config.js` > `checkout.provider`:

| `provider` | What happens | Set |
|---|---|---|
| `whop` | Whop's checkout appears inside the page, email and name filled in | `whopPlan` |
| `embed` | your provider's embed code appears inside the page | the code in `<template data-funnel-checkout-embed>` in `index.html` (or `embedHtml`) |
| `link` | the buyer goes to your checkout page, email filled in where possible | `link` |
| `none` | a note asking you to set up the checkout | nothing |

In embed code and links, these tokens are replaced with what the buyer typed in step 1:

| Token | Filled with |
|---|---|
| `{email}` | the email |
| `{name}` | the full name |
| `{first_name}`, `{last_name}` | the first word of the name, and the rest |
| `{phone}` | the phone in international format |

Inside URLs they are URL-encoded. Elsewhere in the embed code they are filled in as plain text.

**After payment:**
1. Set your provider's success redirect to your live `welcome.html`.
2. If your provider returns failed or cancelled payments to that same page with `?status=failed` or `?status=canceled`, the welcome page sends the buyer back to the checkout with a message.
3. Always make one real purchase and refund it before you launch.

"Tested" means checked with this template. "From the provider's docs" means it is written from the provider's documentation (checked November 2026): confirm it in your account.

## Whop (embed tested)

```js
checkout: { provider: 'whop', whopPlan: 'plan_XXXXXXXX', successUrl: 'welcome.html' }
```

- **The plan ID:** it starts with `plan_`. Find it in your Whop dashboard on the product's pricing option, or in its checkout link `whop.com/checkout/plan_XXXXXXXX`. A public plan needs no API key.
- **What loads:** the page uses Whop Elements, Whop's embedded checkout. Its look follows your theme (`css/theme.css`), and `whopAccent` sets Whop's own accent name for its fields.
- **Returns:** Whop sends buyers who pay off-site (bank page, PayPal) back to `successUrl` with `?status=succeeded`, `failed` or `canceled`. The welcome page handles all three.
- **If you also share the plain `whop.com/checkout/...` link** anywhere (email, bio, ads), set **Redirect after checkout** on that checkout link (Checkout links > the link > Advanced options) to your `welcome.html`, so those buyers land there too.

Docs: https://docs.whop.com/elements/latest/checkout/overview

## Stripe Payment Links (from the provider's docs)

Payment Links open Stripe's own checkout page, so use `link` mode:

```js
checkout: { provider: 'link', link: 'https://buy.stripe.com/XXXXXXXX?prefilled_email={email}' }
```

- **Prefill:** `prefilled_email` fills in the email and the buyer can still change it. `locked_prefilled_email` fills it in and locks it. There is no name parameter.
- **Redirect:** in the payment link's settings, under **After the payment > Confirmation page**, choose to send customers to your website, and enter your `welcome.html` URL.
- **Buy Button instead:** Stripe's Buy Button (payment link > Buy button > Copy code) is a script plus a `<stripe-buy-button>` element. You can paste it as `embed` code and add `customer-email="{email}"` to the element. It still opens Stripe's checkout in a new view.

Docs: https://docs.stripe.com/payment-links/customize, https://docs.stripe.com/payment-links/post-payment, https://docs.stripe.com/payment-links/buy-button

## ThriveCart (from the provider's docs)

- **Embed:** on an **Embeddable** checkout template, use **Save > Get URL > Copy embed code**, and paste the code as `embed`.
- **Link:**
  ```js
  link: 'https://YOURACCOUNT.thrivecart.com/YOURPRODUCT/?passthrough[customer_email]={email}&passthrough[customer_firstname]={first_name}&passthrough[customer_lastname]={last_name}'
  ```
  ThriveCart also supports `passthrough[customer_contactno]` for the phone.
- **Redirect:** on the product's **Fulfillment** tab choose "Send them to a URL" with your `welcome.html`, then turn on "Automatically redirect to success URL" on the success page. ThriveCart's docs say accounts that use the newer ThrivePages editor can't set a custom success page redirect yet.

Docs: https://support.thrivecart.com/help/pre-fill-your-checkout-fields/

## SamCart (from the provider's docs)

- **Embed:** Products > your product > **Share > Embed > Copy Embed Code**: a script plus an `<sc-checkout>` element. Paste it as `embed`.
- **Link:**
  ```js
  link: 'https://YOURSTORE.samcart.com/products/YOURPRODUCT?email={email}&first_name={first_name}&last_name={last_name}'
  ```
  `phone_number` is also supported.
- **Redirect:** the product's **Details** tab > **Order Redirect** > Custom URL with your `welcome.html`.

Docs: https://help.samcart.com/support/solutions/articles/60001131898-embed-checkout, https://help.samcart.com/support/solutions/articles/60000650242-pre-populated-checkout-forms, https://help.samcart.com/support/solutions/articles/60000690580-order-redirect

## GoHighLevel (from the provider's docs)

- **Payment Links** (Payments > Payment Links): use `link` mode. GoHighLevel documents `firstName`, `lastName`, `email` and `phone` for prefilling, and `redirectUrl` for the page after payment. Test the exact link format in your account.
- **Order forms in GoHighLevel funnels:** GoHighLevel does not document embedding them on another site. Use a Payment Link, or build the whole funnel in GoHighLevel.

Docs: https://help.gohighlevel.com/support/solutions/articles/155000002177-payment-links

## Any other checkout

- **Your provider gives you embed code** (an `<iframe>` or a `<script>` plus an element): use `embed`. Scripts in the code run when step 2 opens. The code is added once per page view.
- **Your provider gives you a checkout link:** use `link`, and add its prefill parameters with the tokens above if it supports them.
- **Lemon Squeezy:** not covered. It no longer accepts new sign-ups and is shutting down.

Then set the provider's success redirect to `welcome.html`, and test one real purchase.
