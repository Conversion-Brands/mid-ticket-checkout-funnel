# The graphics bundle

`assets/graphics/` holds one graphic for each kind of thing a mid-ticket offer usually includes. They are filled in for the made-up sample brand "Northstar Launch Lab", so every one of them shows sample names and is marked `data-sample`. Before launch, each one is either tailored to your offer, replaced with your own image, or removed with the part of the page it belongs to.

## Which graphic for which deliverable

The bundle shot combines the parts below. When the offer changes, rebuild it from the same parts (it is one frame in the Figma templates), and keep only what the offer really includes.


| You sell | Graphic | File (2x) | Where it sits in the template |
|---|---|---|---|
| **Online course** | course portal on three devices | `course-portal-laptop.webp` (828x500), `course-portal-tablet.webp` (404x310), `course-portal-phone.webp` (168x350) | "What's included", first card (the three device images) |
| **The whole offer** | the bundle: course devices, coaching call, bonus boxes and handwritten labels in one shot | `offer-bundle.webp` (992x594) | the checkout's "everything you get" image, and the offer section |
| | course portal, all devices together | `course-portal-devices.webp` (992x462) | spare: use it instead of the bundle when the offer is a course only |
| | course modules card | `course-modules.webp` (611x462) | welcome step 2 |
| **Group coaching** or **live workshops** | video call grid | `video-call-grid.webp` (1052x652) | "What's included", coaching card |
| | group coaching call card | `group-coaching-call.webp` (616x460) | welcome step 3 |
| **1:1 calls** | one-to-one session | `one-on-one-call.webp` (640x414) | not placed in the sample; use it in a "What's included" card when the offer has 1:1 calls |
| **Private community** | community member chips | `community-members.webp` (658x570) | welcome step 1 |
| **Support between calls** | support chat | `support-chat.webp` (996x567) | "What's included", community card |
| **Templates, tools, resources, bonuses** | product box | `bonus-box-1.webp` to `bonus-box-3.webp` (600x800) | the bonus cards |

Rules for using them:
- **Only show what is really included.** If the offer has no 1:1 calls, the 1:1 graphic goes, and so does any copy about calls.
- **Every slot takes any graphic.** Images in the fixed-height slots (the welcome step cards and the bonus cards) carry the extra class `mtf-is-graphic`, which fits the whole graphic onto a soft panel in your accent colour instead of cropping it. Keep that class when you swap the file.
- **More deliverables than cards?** In "What's included", copy one feature card (from `<div class="mtf-card mtf-is-feature` to its closing tag) and alternate the `mtf-is-media-end` class so the images switch sides.
- **No graphic for a deliverable?** Done-for-you services, for example, have none. Use a real screenshot or photo from the owner, or leave the card without an image (delete the `<img>`).

The three "How it works" step cards on the sales page are not deliverables, so they have plain image placeholders (`assets/placeholders/step-card-1..3.svg`, 640x402). Use a photo, screenshot or simple illustration of each step, or delete the `<img>`.

## Tailoring them to your brand

You have three options:
- **Edit the Figma templates.** The editable Figma versions of every graphic (course portal, call cards, community, support chat, product box) are listed at the bottom of this page when they are published. Duplicate the file, then change:
  - the text: names, course title, module names, chat lines;
  - the accent colour;
  - the logo.

  Export each frame at 2x and keep the same width. Save it as the matching file name in `assets/graphics/`. If you save a PNG instead of WebP, change the `src` of that image in the page too.
- **Use your own screenshots.** A real screenshot of your course platform, community or a call is the strongest proof of all. Crop it to roughly the same shape as the graphic it replaces. Only use screenshots you own, and blur or remove other people's names and faces unless they agreed.
- **Remove it.** Delete the image, or the whole card if the deliverable isn't in your offer.

Never keep a sample graphic on a live page. They show the made-up "Northstar" brand and made-up people.

## People in graphics

The sample graphics use grey silhouettes, never photos. If you put real faces or names into a graphic, for example members in the community chips or people in the call grid, get their permission first.

## Editable Figma templates

Coming soon: a public Figma file with every template in this bundle.
