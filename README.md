# Navkar LGSF — Light Gauge Steel Frame Structures

A single-page parallax website for the LGSF vertical of **Navkar InfraSynergy Private Limited**,
built from the `NISPL_LGSF_R1.pdf` presentation. Separate from the consulting site at
[navkaris.com](https://navkaris.com/index.html) — the footer links across to it.

## Files

```
navkar-lgsf/
├── index.html          all content, one page
├── css/style.css       full stylesheet (no framework)
├── js/main.js          parallax engine, reveals, tabs, form (no libraries)
└── assets/img/         34 images extracted from the source PDF
```

No build step. Two CDN dependencies — Google Fonts (Sora + Inter) and GSAP + ScrollTrigger.
Both degrade gracefully: system fonts if one fails, the built-in scroll engine if the other does.

## Themes

Dark and light, flipped by the toggle in the header. First visit follows the visitor's OS
setting; after that their choice is remembered in `localStorage` (`nispl-theme`). An inline
script in `<head>` applies the theme before first paint, so it never flashes the wrong one.

Both themes are driven from the `:root` blocks at the top of `css/style.css`. Two channels
do most of the work:

| Variable | Dark | Light | Used for |
|---|---|---|---|
| `--w` | `255,255,255` | `18,24,34` | surface tint that lifts cards off the page |
| `--k` | `7,8,10` | `255,255,255` | the veil laid over photography |

They're raw `r,g,b` triples so every existing alpha keeps working. Photo treatments
(`--f-hero`, `--f-break`, …) and scrims (`--veil-hero`, …) are separate per-theme variables,
because a photo needs darkening in one theme and lightening in the other.

Gold splits in two: `--grad-gold` darkens in light mode so gradient text stays readable,
while `--grad-btn` stays bright in both so buttons look identical.

**To ship light as the default**, change the fallback in the `<head>` script in `index.html`
from `'dark'` to `'light'`.

## Running locally

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 5177 --directory navkar-lgsf
```

## Publishing

Upload the whole `navkar-lgsf` folder to any static host — cPanel/FTP, Netlify, Vercel,
GitHub Pages, or a subdirectory/subdomain of navkaris.com (e.g. `lgsf.navkaris.com`).
Nothing server-side is required.

## Sections

| # | Section | Source (PDF page) |
|---|---------|-------------------|
| — | Hero + spec ticker | 1 |
| 01 | What is LGSF | 4 |
| 02 | Bottlenecks in conventional construction | 5 |
| 03 | Advantages of LGSF (comparison table + features) | 6 |
| 04 | When to choose LGSF | 7 |
| 05 | Applications — project types + wall/roof/floor/special systems | 8, 10–12 |
| 06 | Material & structural specifications | 9, 13–14 |
| 07 | Production process (horizontal scroll) | 15 |
| 08 | Transportation & erection | 16–17 |
| 09 | Project snaps gallery | 18–19 |
| 10 | Leadership | 20–21 |
| 11 | Contact + enquiry form | 22 |

## Parallax & motion

Scroll animation runs one of two engines, chosen at load:

1. **GSAP + ScrollTrigger** when the CDN is reachable — smoothed scrubbing, batched
   staggers, and a ticker-driven marquee.
2. **A self-contained `requestAnimationFrame` loop** otherwise. Same effects, no smoothing.

Both are in `js/main.js`; everything else (theme, nav, tabs, form) is shared. Nothing
breaks if GSAP fails to load — the page just animates a little more plainly.

- `data-parallax="0.28"` on any element makes it drift at that fraction of scroll speed.
  Add the attribute to a new element and both engines pick it up.
- The **production process** section scrolls horizontally while pinned; its height is set by
  `.hsec { height: 520vh }` in the CSS — increase for a slower sweep.
- The hero runs an intro timeline; the spec ticker speeds up with scroll velocity.
- `prefers-reduced-motion: reduce` skips GSAP entirely and disables all animation.
- Below 720px the horizontal section unpins and stacks vertically.

Two things to know if you edit the animation:

- **Don't set an element's animation start state only in CSS.** GSAP parses
  `translateY(105%)` into a *pixel* `y`, so a later `{ yPercent: 0 }` tween moves nothing.
  Declare start states with `gsap.set()` — see the note above `heroIntro()`.
- **Keep `overflow-x: clip` on `body`, not `hidden`.** `hidden` forces `overflow-y` to
  compute as `auto`, which makes `<body>` a scroll container and silently corrupts every
  ScrollTrigger measurement on the page.

## Enquiry form

The form has **no backend**. On submit it builds a formatted `mailto:` to
`info@navkaris.com` and opens the visitor's email client.

To make it submit server-side instead, replace the `mailto` block at the bottom of
`js/main.js` with a `fetch()` to a form service (Formspree, Web3Forms) or your own endpoint.

## Editing content

Everything is plain HTML in `index.html` — tables, card lists and specs are all literal
markup, so text edits need no tooling.

**Colours** live in the `:root` block at the top of `css/style.css`:

```css
--gold: #F0BE3D;   /* brand gold, from the company logo */
--ink:  #07080a;   /* page background */
```

## Images

All 34 images were extracted from the source PDF and re-encoded (progressive JPEG,
quality 86). The logo was converted to a transparent PNG.

Source photos are low resolution (300–750px). They render well at current card sizes, but
if higher-resolution originals exist, drop them into `assets/img/` under the same filenames
for a sharper hero and gallery. Purely decorative photos carry `alt=""`; content photos
have descriptive alt text.

Note: the AI-generated diagram slides from the PDF (pages 14–15) contain garbled text and
were **not** used — the production process and wall build-ups are rebuilt as native HTML.

## Still to supply

- Real project names, locations and completion dates for the gallery captions
  (currently generic labels like "Curved-roof villa").
- A dedicated email for LGSF enquiries, if it should differ from `info@navkaris.com`.
- Higher-resolution photography where available.
