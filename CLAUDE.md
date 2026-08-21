# BIFNIM — site repo

Static site for BIFNIM, a 3D property-tour service (Matterport tours for real
estate in Netanya). **No build step, no framework, no package.json** — every
page is a single self-contained HTML file with inline `<style>` and `<script>`.
Edit the HTML directly; there is nothing to compile.

Live at **https://bifnim.co.il** (https, no `www`). Vercel auto-deploys on push
to `main` — a merged commit is a live site, usually within a minute.

## Two repos

| Repo | Role |
|---|---|
| `tixmis/bifnim` (this one) | The live site. Everything Vercel serves. |
| `tixmis/bifnim-bot` | Telegram bot (Python, aiogram 3) that **publishes into this repo** over the GitHub Contents REST API. |

The bot never clones this repo and never runs git. It reads
`template/index.html` over the API, fills it in, and `PUT`s the result as
`<slug>/index.html`. Its commits are recognisable: `Add tour: <slug>`,
`Delete tour: <slug>`, `Fix tour: <slug>`, `Add cover: <slug>`,
`Update badge: <slug>`.

Consequence worth remembering: **changing this repo's structure can break the
bot.** The markers it substitutes into are the `TOUR = {...}` config object and
the `<title>` / `og:title` / `og:image` / `og:url` tags. If you rename those or
restructure `template/index.html`'s head, check `bot/publisher.py`
(`fill_template`) in the bot repo in the same change.

## Layout

```
index.html          landing page — hero + property grid (renders from tours.json)
tours.json          the grid's data (see schema below)
cover.jpg           OG preview image for the landing page itself
template/index.html THE tour template the bot fills in for every new property
object_N/index.html one published tour per folder
object_N/cover.jpg  that tour's cover image
a11y.js             accessibility widget, loaded by every page
accessibility.html  הצהרת נגישות (accessibility statement page)
```

### Folder-per-property

Each published tour is its own folder: `object_N/index.html` plus
`object_N/cover.jpg`. Slugs are **sequential numeric** — `object_1`,
`object_2`, … — allocated by the bot as `max(existing object_N) + 1`.

Address-based slugs (`herzl-5-netanya`, transliterated from Hebrew/Russian)
are **legacy and fallback only**: the bot falls back to them only when the
GitHub directory listing fails. Don't create them by hand and don't assume a
slug encodes an address.

`cover.jpg` does triple duty and is not optional in practice — it is the
WhatsApp/OG link preview, the blurred curtain background behind the "step
inside" button, and the card thumbnail on the landing grid. A tour without one
looks broken in all three places. When the owner sends no photo, the bot falls
back to Matterport's own `og:image` thumbnail.

### tours.json

Root-level JSON array; the landing grid renders straight from it. One object
per property:

```json
{
  "slug": "object_3",
  "title": "רח׳ דב גרונר 6",
  "rooms": "—",
  "area": "—",
  "floor": "—",
  "badge": "לדוגמה"
}
```

- `slug` — must match the folder name; the card links to `/<slug>/` and pulls
  `/<slug>/cover.jpg`.
- `title` — Hebrew address as shown on the card.
- `rooms` / `area` / `floor` — JSON **numbers** when numeric (`4`, `3.5`, `-1`),
  the string `"—"` when unknown.
- `badge` — the corner pill on the card. See "Badges" below.

**The bot owns this file.** It upserts on publish, removes on delete, mirrors
`fix` edits into it, and rewrites `badge` via its `badge <slug> <text>`
command. New entries are *prepended* so the newest tour shows first. Hand-edit
it only for emergency fixes — otherwise the next bot write may not do what you
expect.

## Design tokens

Every page defines the same custom properties on `:root`. **Reuse these; do not
introduce new colors.**

| Token | Value | Use |
|---|---|---|
| `--ink` | `#131A22` | page background, also `theme-color` |
| `--ink-soft` | `#1D2733` | raised surfaces, iframe backdrop |
| `--paper` | `#F6F4EF` | primary text |
| `--sand` | `#C7A175` | accent — brand, eyebrows, focus rings, badges |
| `--mist` | `#8E9AA6` | secondary/muted text |
| `--line` | `rgba(246,244,239,.14)` | borders and dividers |
| `--wa` | `#1FAD57` | WhatsApp green — CTA buttons only |
| `--radius` | `16px` landing / `14px` tour pages | corner radius |

Type: **Rubik** (UI, weight 300 default) and **Cormorant** (headings/serif
display), both from Google Fonts with `system-ui` / `serif` fallbacks. Muted
secondary lines are conventionally `--mist` at 13–15px.

`a11y.js` works by *overriding these same tokens*, so a hardcoded hex bypasses
the accessibility widget's contrast and grayscale modes entirely. That is the
practical reason the token rule matters.

## Hebrew / RTL

Hebrew is the default everywhere: pages ship as `<html lang="he" dir="rtl">`
and all copy is authored in Hebrew first.

Tour pages carry an `I18N` dictionary in their inline script — one entry per
language holding `dir` plus every UI string. `apply(lang)` swaps
`document.documentElement.lang` / `dir` and rewrites text content; the language
`<select>` is populated from `Object.keys(I18N)`, so **key order in the object
is the order in the switcher**. Adding a language means adding one complete
entry — a partial entry renders `undefined` in the UI.

Language can be forced per-link with `?lang=ru` (used for targeted outreach);
otherwise `TOUR.defaultLang` (`he`) wins. There is no browser-locale sniffing,
deliberately.

Use physical `left`/`right` only when positioning against something whose
layout does not follow page direction (the Matterport player's own UI); use
logical `inset-inline-*` everywhere else.

## a11y.js

Self-contained accessibility widget, no dependencies, loaded on **every** page:

```html
<script src="/a11y.js" defer></script>
```

It injects its own trigger button and drawer, and offers: high contrast,
inverted contrast, grayscale, text size ±, underline links, and stop
animations. State persists in `localStorage` under `bifnim-a11y` and applies as
classes on `<html>` that override the design tokens.

**Do not add a second accessibility system**, and don't inline a copy into a
page — extend `a11y.js` itself so every page gains the feature at once. Note it
is a user-preference tool that complements semantic accessibility; it does not
by itself make a page WCAG-conformant. `accessibility.html` is the public
statement page.

## template/index.html

The single source template for every future property. Anything meant to apply
to all new tours goes here.

It is a working page in its own right (placeholder address, sample Matterport
model `uJprx82uPV4`, `whatsapp: "9725XXXXXXXX"`), so you can open it directly
to check a change.

Already-published `object_N/index.html` files are **frozen copies** taken at
publish time — they do not track later template edits. After changing the
template, decide explicitly whether existing pages should be brought in line
(mirror the edit, or have the bot republish) and say which you did; silently
leaving them divergent is how the live site drifts from the template.

## Badges

The `badge` field is free text, so any wording is possible. Current
conventions:

| Badge | Meaning |
|---|---|
| `לדוגמה` | demo / portfolio piece — **the bot's default for new publishes** |
| `להשכרה` | real client listing, for rent |
| `למכירה` | real client listing, for sale |
| `הושכר` | rented out |

New tours default to `לדוגמה` because most publishes are portfolio and test
pieces; a real client listing gets its real status set explicitly with the
bot's `badge <slug> <text>` command. A demo must never carry `להשכרה` — a
visitor would read a portfolio piece as an available apartment.

## Settled decisions — don't re-litigate unless asked

- **The BIFNIM badge lives in the `<header>`**, as a normal flex item beside the
  address and the language/agency group. It is deliberately *not* overlaid on
  the Matterport iframe: Matterport's ToS require their attribution stay
  visible, and the old absolute-positioned badge covered their logo. Keep the
  badge and the player out of each other's space.
- **Language switcher order is `he → en → ru → ar → fr → es`** (the key order in
  `I18N`).
- **Addresses on demo/portfolio properties are fictional, on purpose** —
  privacy. Never put a real client address on example content.
- **Pricing: exactly one line** on the landing hero ("החל מ-₪500"). The full
  price list lives in the WhatsApp Business catalog. No package grid, no
  comparison table, no calculator.
- **Domain is `bifnim.co.il`** — https, no `www`. Absolute URLs in OG tags must
  use it.

## Before you edit

**Re-read the files you are about to change.** The owner edits this repo
directly through GitHub's web UI between sessions — creating folders,
uploading files, renaming things — and the bot commits to it independently. A
prior session's picture of the tree is not reliable. Check the actual current
state (`git fetch`, list the tree, open the file) before trusting any
assumption about what exists.

Past drift, as concrete examples of what this catches: a manual upload once
created a folder literally named `template/: weisburg-6/` — leading colon and
space — nesting a whole tour inside `template/`; and the same property has been
published under several slugs (`explore-rch-db-grvnr-6-in-3d`, `object_1`,
`object_2`, `object_3`) as the bot evolved.

## Checking a change

There is no test suite here — it's static HTML. Serve the directory and look:

```bash
python3 -m http.server 8000    # then open http://localhost:8000/
```

Worth checking on any UI change: 320px width (the narrowest supported — content
should shrink or truncate, never wrap or scroll horizontally), RTL layout, and
that the landing grid's cards still resolve their `/<slug>/cover.jpg`.

The bot repo has a smoke suite (`python tests/smoke_test.py`) that covers
template filling — run it there if you touched `template/index.html`'s
substitution markers.
