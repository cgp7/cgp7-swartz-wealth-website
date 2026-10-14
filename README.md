# Swartz Wealth Management website (redesign prototype)

A redesign of [swartzwealthmanagement.com](https://www.swartzwealthmanagement.com) to propose to Jake Swartz. It's a static site: plain HTML, CSS and JavaScript, with no framework and no backend.

**Status:** prototype for review. Nothing here should go live until Jake has answered the open questions and a compliance reviewer has signed off (see "Before launch").

## Look at it

Open `site/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server -d site 8000   # then open http://localhost:8000
```

**Version 2 design.** The look is dark and cinematic, modelled on [marble.studio](https://marble.studio):
- very large, tight Inter Tight headlines;
- a WebGL "lake water" surface in the hero and call-to-action (`src/assets/js/water.js`);
- hairline rows and white pill buttons;
- GSAP motion (`src/assets/js/motion.js`): split-line headline reveals, statements that light up word by word as you scroll, a pinned sideways process section on desktop, the Lake Michigan map drawing itself, and animated custody connectors;
- smooth scrolling with Lenis.

Every animation is optional. With reduced motion, JavaScript off, or the CDN blocked, the content still shows and the calculator still works.

A bar at the bottom of every page is for review only:

- **Version A / Version B** swaps the homepage headline and order live. A leads with business owners; B leads with the fee calculator.
- **All notes / Jake / Off** filters the sticky notes:
    - yellow **For Jake · J1 to J9** are the 9 questions for the first call;
    - blue **Check first · R1 to R12** are things to research before showing him;
    - grey **Later · Q#** are questions that can wait.

  Use "Jake" when presenting.
- **Checklist** opens the Google Doc that holds every J, R and Q item. The doc is private to its owner.

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

**Design tokens** are at the top of `src/assets/css/styles.css`:
- colors: near-black `#07090c`, off-white `#f2f2ef`, paper `#ecebe6`, accent blue `#9cc0ff`;
- type: Inter Tight for headlines and Inter for text, both from Google Fonts.

The libraries load from jsDelivr at pinned versions: GSAP 3.13.0 with ScrollTrigger and SplitText, and Lenis 1.1.13.

**Fee calculator** (`src/assets/js/main.js`) uses the schedule in Form ADV Part 2A (January 2026). As filed, one rate applies to the whole balance, so the fee drops at each band edge ($2.5M pays $25,000, $2.6M pays $22,100). The review note shows what tiered billing would charge. If Jake changes the schedule, update `BANDS` in `main.js` and the table in `src/partials/schedule.html`.

## Before launch

1. Jake answers the starred questions in the question list, which is shared separately.
2. A state-registered-adviser compliance reviewer approves every page. Illinois bans testimonials, so the site has none.
3. Post the insurance commission policy on the fee page (a council condition).
4. Replace monogram placeholders with headshots.
5. Remove review mode:
    - the review-mode block in `src/assets/js/main.js`;
    - every `<div class="note ...">`;
    - the `.note` and `.review-bar` CSS;
    - the `noindex` meta in `build.py`.

    Then rebuild.
6. Add the firm's privacy notice to `disclosures.html`.
7. Decide hosting and the domain (Squarespace account owner), then archive each published version.

## Docs

- [`docs/PLAN.md`](docs/PLAN.md): the redesign plan and the reasoning behind it
- [`docs/RESEARCH.md`](docs/RESEARCH.md): what peer firms do well, the evidence on what converts, and compliance notes, with sources
- [`docs/roast-room/`](docs/roast-room/): the first council (positioning), which recommended Version A
- [`docs/roast-room-site-review/`](docs/roast-room-site-review/): the full seven-advisor council on how to show Jake the site. Its verdict was to show the Version A homepage and the fee page on a live 30-minute call. (Its brief says 13 starred questions; the actual number is 9.)
