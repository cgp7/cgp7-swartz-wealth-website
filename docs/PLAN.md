# Redesign plan

## What the filings told us

Facts from the firm's [SEC adviser listing](https://adviserinfo.sec.gov/firm/summary/337684) and [Form ADV Part 2A](https://files.adviserinfo.sec.gov/IAPD/Content/Common/crd_iapd_Brochure.aspx?BRCHR_VRSN_ID=1003383):

- Swartz Wealth Management LLC, CRD 337684, is state-registered (Illinois and Michigan; Texas pending), with its principal office in Chicago. Adam Skedgell works from Rockford, MI.
- It is newly established and reports $0 assets under management.
- Fees are 1.50% (under $500K) down to 0.75% (over $5M), on the whole balance. Standalone planning is $150/hr, typically $1,500 to $3,000. There is no minimum.
- Assets are held at Charles Schwab. The investment approach is passive (index funds and ETFs).
- Jake is a licensed insurance agent and can earn commissions, which is a disclosed conflict. The site never says "fee-only".

## Problems with the current site

- Everything is on one page, there's a leftover Squarespace cart icon, and there's no meta description or location.
- There are no fees, ADV link, privacy notice or regulatory footer, yet the copy promises a "transparent fee structure".
- Wording risks:
    - Adam is called "a Registered Investment Advisor".
    - "Over a decade of experience" is ambiguous.
    - The "$30 billion" and "$300 million" figures are unsubstantiated.
- There are typos, and the Calendly URL is shown as raw text.

## Positioning

There are two homepages to compare (see README). The council recommended Version A with conditions:

- Drop the "From the deal table to your kitchen table" line.
- State Jake's exact titles.
- Post a commission policy.
- Switch to Version B if the first 10 consultations aren't mostly owners and professionals with $1M or more.

## What we borrowed from peer firms

| Feature | Inspired by | Where |
|---|---|---|
| Published fees with a calculator | Arnold & Mote, Plancorp, Facet | `fees.html`, both homepages |
| "Start here" router by situation | Root Financial | Version A homepage |
| Custody explainer ("we never hold your money") | LVM Capital (Kalamazoo) | One answer in the questions on `about.html` |
| Questions to ask any advisor, with our answers | Define Financial's comparison table, recast to avoid competitor claims | Version B homepage, `about.html` |
| Segment pages with labelled examples | Grand Wealth (Grand Rapids), Mission Wealth | `who-we-serve.html` |
| Named three-step process | Define Financial, Center for Financial Planning | `services.html` |
| Conflicts stated plainly | Center for Financial Planning ("Fees, Compensation and Fit") | `fees.html`, rollover guide |
| Guides with an interactive tool | Root Financial, Plancorp | `guide-401k-rollover.html` |

## Left out on purpose

- Testimonials, reviews and star ratings (banned by Illinois rules)
- Performance charts and assets-under-management claims
- Social media feeds
- Stock photos

## Design

- **Colors:** ink navy, warm paper, a Lake Michigan blue-green accent and brass.
- **Type:** Fraunces for headlines; the body keeps Instrument Sans from the current site.
- **Map:** drawn from real shoreline coordinates, with pins in Chicago and Rockford.
- **Layout:** mobile first. No horizontal scroll at 390px, and text meets WCAG AA contrast.

## Version 2 (October 14, 2026)

- **Visual direction:** a dark, cinematic look modelled on marble.studio, with oversized Inter Tight headlines, a WebGL water surface, hairline rows and white pill buttons.
- **Motion:** GSAP animations, all optional.
- **Copy:**
    - No small uppercase labels above headlines.
    - No icon grids or tick-mark lists.
    - Rewritten to avoid common AI-writing patterns.
- **Plain-language explainers:**
    - a glossary of eight terms, each showing how it applies to SWM;
    - services as open-and-close rows, each with a one-sentence answer;
    - a fee calculator that shows dollars.
- **Version A and B** now share one homepage and swap the headline and section order.
- **Notes on the page use the codes from the Google Doc:**
    - J for Jake's 9 questions;
    - R for research before showing him;
    - Q for later.

## Homepage trim (October 14, 2026)

- **Overview, not a landing page.** The homepage now introduces the firm and sends people on to each page: services (new six-tile index, each opening its row on `services.html`), who we work with, fees with the calculator, and the two advisors. It dropped from 11 sections to 7 and is about 40% shorter on desktop.
- **Moved off the homepage:** the process (still on `services.html`), the team bios (`about.html`), the glossary (now on `insights.html`) and the guides list (`insights.html`).
- **Less about Schwab.** The custody diagram is gone from the homepage and About page. Schwab now appears only where it's factual: one answer on About, how billing works on the fee page, the glossary, the disclosures and the client login link.

