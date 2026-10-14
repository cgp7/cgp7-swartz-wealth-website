# Swartz Wealth Management website (redesign prototype)

A redesign of [swartzwealthmanagement.com](https://www.swartzwealthmanagement.com) to propose to Jake Swartz. It's a static site: plain HTML, CSS and JavaScript, with no framework and no backend.

**Status:** prototype for review. Nothing here should go live until Jake has answered the open questions and a compliance reviewer has signed off (see "Before launch").

## Look at it

Open `site/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server -d site 8000   # then open http://localhost:8000
```

A dark bar at the bottom of every page is for review only:

- **Version A / Version B** switch between the two homepages. The rest of the site is shared, and the logo links back to whichever version you last viewed.
- **Notes for Jake** shows or hides yellow sticky notes. Each one points to a numbered question in Jake's question list.

| Homepage | File | Positioning |
|---|---|---|
| Version A | `index.html` | Business owners and professionals first, families second. Chicago and West Michigan, with a Lake Michigan map. |
| Version B | `home-b.html` | Broad: families, individuals and business owners as three equal doors. Leads with transparency, with the fee calculator in the hero. |

A simulated advisory council (the Roast Room) recommended **Version A** (7.0/10 against 4.3), with conditions. See [`docs/roast-room/verdict.md`](docs/roast-room/verdict.md).

## Pages

| Page | What's on it |
|---|---|
| `who-we-serve.html` | The three client groups, each with a labelled illustration (not a real client) |
| `services.html` | Six services, investment approach, process, two ways to work |
| `fees.html` | Full fee schedule, calculator, billing, what's not included, conflicts |
| `about.html` | Story, bios, "where your money lives" custody diagram, six questions to ask any advisor |
| `insights.html` | Guides index |
| `guide-401k-rollover.html` | Full guide with an interactive 401(k) options helper |
| `contact.html` | Embedded Calendly booking (Jake's existing link) |
| `disclosures.html` | Disclosures, privacy notice placeholder, website privacy |

## Edit it

Pages are assembled from `src/` by a small Python script with no dependencies:

```bash
python3 build.py      # rebuilds site/ from src/
```

- `src/*.html` holds one file per page. The first line is metadata (title, description, active nav item).
- `src/partials/` holds sections shared across pages: fee calculator, custody diagram, process, team, guides and the call-to-action.
- The header, navigation and footer are defined once, in `build.py`.
- `src/assets/` (CSS, JS, favicon) is copied to `site/assets/`.

Commit both `src/` and the rebuilt `site/`, so `site/` can be deployed as is (Netlify, Cloudflare Pages or any static host).

**Design tokens** (colors, fonts) are at the top of `src/assets/css/styles.css`: ink navy `#13222f`, paper `#f7f3ec`, lake `#1d6a73`, brass `#b48a4a`, with Fraunces and Instrument Sans from Google Fonts. Text colors meet WCAG AA contrast.

**Fee calculator** (`src/assets/js/main.js`) uses the schedule in Form ADV Part 2A (January 2026). As filed, one rate applies to the whole balance, so the fee drops at each band edge ($2.5M pays $25,000, $2.6M pays $22,100). The review note shows what tiered billing would charge. If Jake changes the schedule, update `BANDS` in `main.js` and the table in `src/fees.html`.

## Before launch

1. Jake answers the starred questions in the question list, which is shared separately.
2. A state-registered-adviser compliance reviewer approves every page. Illinois bans testimonials, so the site has none.
3. Post the insurance commission policy on the fee page (a council condition).
4. Replace monogram placeholders with headshots.
5. Remove review mode: the review-mode block in `src/assets/js/main.js`, every `<aside class="review-note">` / `<div class="review-note">`, and the `.review-*` CSS. Then rebuild.
6. Add the firm's privacy notice to `disclosures.html`.
7. Decide hosting and the domain (Squarespace account owner), then archive each published version.

## Docs

- [`docs/PLAN.md`](docs/PLAN.md): the redesign plan and the reasoning behind it
- [`docs/RESEARCH.md`](docs/RESEARCH.md): what peer firms do well, the evidence on what converts, and compliance notes, with sources
- [`docs/roast-room/`](docs/roast-room/): the council's brief, rounds and verdict
