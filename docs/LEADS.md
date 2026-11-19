# Where your leads go

When a visitor finishes step 1, the page posts their details to every URL in `leads.webhooks` (in `funnel.config.js`), then opens step 2 straight away. It never waits for the webhook, so a slow or broken webhook can't block a sale.

```js
leads: { webhooks: ['https://hooks.zapier.com/hooks/catch/123/abc/'] }
```

You can list several URLs. Each one gets the same lead.

## What is sent

One `POST` with a form-encoded body (`application/x-www-form-urlencoded`), the same format as a classic HTML form:

| Field | Example |
|---|---|
| `name` | Sam Rivera |
| `first_name` | Sam |
| `email` | sam@example.com |
| `phone` | +12015550123 (international format; empty when the phone field is off) |
| `country` | US (from the phone picker) |
| `offer` | Northstar Launch Lab |
| `price` | 497 |
| `currency` | USD |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | from the visitor's link; kept until a later link brings new ones |
| `session_id` | a random ID for this browser session |
| `page_url` | the page the lead came from |
| `referrer` | the site that sent the visitor, if the browser shares it |
| `submitted_at` | 2026-11-19T17:42:03.120Z (UTC) |

Good to know:
- **No confirmation is visible.** The page sends the lead the simple way (no CORS preflight), so it can post to any service. The browser can't read the reply, so the page only notices when a URL can't be reached at all (a console warning). **Always send one test lead and check it arrives.**
- **Webhook URLs are public.** They sit in your page's code, like any form endpoint. Anyone could post junk to them, so filter or deduplicate in your automation if that matters to you.
- **Building on Webflow?** The native Webflow form is submitted too, so leads also appear under Site settings > Forms.

## Destinations

"Tested" means the template's own tests or a live check confirmed it. "From the provider's docs" means it is written from the provider's documentation (checked November 2026) and not yet tested end to end with this template.

### Zapier: Webhooks by Zapier, "Catch Hook" (from the provider's docs)

1. Create a Zap.
2. Pick the trigger **Webhooks by Zapier** with the event **Catch Hook**.
3. Continue to the **Test** tab and copy the webhook URL.
4. Put it in `leads.webhooks`, send a test lead, then click **Test trigger** in Zapier to see the fields.

Zapier accepts form-encoded data. Webhooks are not on Zapier's Free plan.
Docs: https://help.zapier.com/hc/en-us/articles/8496288690317

### Make: "Custom webhook" (from the provider's docs)

1. In a scenario, add **Webhooks > Custom webhook**.
2. Click **Add**, give it a name, **Save**, and copy the URL.
3. Click **Detect new values** (or **Redetermine data structure**), then send one test lead so Make learns the fields.

Make accepts form-encoded data.
Docs: https://apps.make.com/gateway

### n8n: Webhook node (from the provider's docs)

1. Add a **Webhook** trigger node and set **HTTP Method** to `POST`.
2. Copy the URL.
   - **Test URL:** only listens while you click "Listen for test event" (about two minutes).
   - **Production URL:** works once the workflow is active (published).
3. Use the Production URL in `leads.webhooks`.

n8n reads form-encoded bodies into `body`.
Docs: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

### GoHighLevel: through Zapier, Make or n8n (from the provider's docs)

GoHighLevel's **Inbound Webhook** trigger only accepts JSON. A sales page can't send JSON to another site this way, so send leads to Zapier, Make or n8n (above) and create or update the GoHighLevel contact from there. GoHighLevel's Inbound Webhook is also a premium trigger.
Docs: https://help.gohighlevel.com/support/solutions/articles/48001237383

### Google Sheets: a small Apps Script (from the provider's docs)

1. Create a sheet with a tab called `Leads`.
2. Open **Extensions > Apps Script**, replace the code with this script and save:

```js
const SHEET = 'Leads';
const COLUMNS = ['name', 'email', 'phone', 'country', 'utm_source', 'utm_medium', 'utm_campaign', 'page_url', 'submitted_at'];
function doPost(e) {
  const p = (e && e.parameter) || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET)
      .appendRow([new Date()].concat(COLUMNS.map(k => p[k] || '')));
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput('ok');
}
```

3. Click **Deploy > New deployment**, choose **Web app**, set **Execute as: Me** and **Who has access: Anyone** (the option that does not require a Google sign-in), then **Deploy**.
4. Authorise it and copy the web app URL into `leads.webhooks`.
5. Send a test lead and check a row appears.
   - To change the code later, use **Manage deployments > Edit > New version**. The URL stays the same.
   - Optionally add header names in row 1: time, then the column names.

Docs: https://developers.google.com/apps-script/guides/web

### Your own server (tested)

Accept a `POST` with an `application/x-www-form-urlencoded` body at any URL and read the fields in the table above. The browser does not need CORS headers from you, and it ignores your response.

This is the format the template's automated tests check, field by field. A live test against a public request inspector (webhook.site) received every field as a form-encoded POST.
