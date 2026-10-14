"""Build the static site: src/ -> site/.

Each page in src/*.html starts with a one-line metadata comment:
    <!-- title: ... | desc: ... | nav: fees | variant: A | scripts: a.js, b.js -->
Shared sections live in src/partials/ and are pulled in with <!-- include:name -->.
The header and footer are defined below, so navigation changes happen in one place.
src/assets/ is copied to site/assets/ as is.

Usage: python3 build.py   (Python 3.8+, no dependencies)
"""
import pathlib
import re
import shutil

HERE = pathlib.Path(__file__).parent
SRC = HERE / "src"
OUT = HERE / "site"

NAV = [
    ("who", "who-we-serve.html", "Who we serve"),
    ("services", "services.html", "Services"),
    ("fees", "fees.html", "Fees"),
    ("about", "about.html", "About"),
    ("guides", "insights.html", "Guides"),
]

MARK = (
    '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">'
    '<rect width="40" height="40" rx="10" fill="#13222f"/>'
    '<path d="M8 17c4-4 8-4 12 0s8 4 12 0" fill="none" stroke="#c9b48c" stroke-width="2.4" stroke-linecap="round"/>'
    '<path d="M8 25c4-4 8-4 12 0s8 4 12 0" fill="none" stroke="#9fd0cc" stroke-width="2.4" stroke-linecap="round"/>'
    "</svg>"
)

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#13222f">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body{body_attrs}>
<a class="skip-link" href="#main">Skip to content</a>
<div class="utility">
  <div class="container utility-inner">
    <span class="utility-tag">Independent · Fiduciary · Chicago &amp; West Michigan</span>
    <span class="utility-links">
      <a href="tel:+12698322433">(269) 832-2433</a>
      <a href="https://www.schwaballiance.com" rel="noopener">Client login</a>
    </span>
  </div>
</div>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="index.html" data-home-link aria-label="Swartz Wealth Management, home">
      {mark}
      <span class="brand-text"><span class="brand-name">Swartz</span><span class="brand-sub">Wealth Management</span></span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span class="nav-toggle-bars" aria-hidden="true"></span> Menu
    </button>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <ul>
{nav_items}
      </ul>
      <a class="btn btn-primary" href="contact.html">Book a call</a>
    </nav>
  </div>
</header>
"""

FOOT = """
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="index.html" data-home-link aria-label="Swartz Wealth Management, home">
          {mark}
          <span class="brand-text"><span class="brand-name">Swartz</span><span class="brand-sub">Wealth Management</span></span>
        </a>
        <p>Independent wealth management for business owners, professionals and families in Chicago and West Michigan.</p>
        <p><a href="tel:+12698322433">(269) 832-2433</a><br><a href="mailto:Jake@swartzwealthmanagement.com">Jake@swartzwealthmanagement.com</a><br>Chicago, Illinois · Rockford, Michigan</p>
      </div>
      <div>
        <h2>Explore</h2>
        <ul>
          <li><a href="who-we-serve.html">Who we serve</a></li>
          <li><a href="services.html">Services</a></li>
          <li><a href="fees.html">Fees</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="insights.html">Guides</a></li>
        </ul>
      </div>
      <div>
        <h2>Clients</h2>
        <ul>
          <li><a href="https://www.schwaballiance.com" rel="noopener">Schwab account login</a></li>
          <li><a href="contact.html">Book a review</a></li>
          <li><a href="about.html#custody">Where your money is held</a></li>
        </ul>
      </div>
      <div>
        <h2>Disclosures</h2>
        <ul>
          <li><a href="https://adviserinfo.sec.gov/firm/summary/337684" rel="noopener">Form ADV and registration</a></li>
          <li><a href="disclosures.html#privacy">Privacy notice</a></li>
          <li><a href="disclosures.html">Important disclosures</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-legal">
      <p>Swartz Wealth Management LLC (CRD 337684) is an investment adviser registered with the states of Illinois and Michigan. Registration does not imply a certain level of skill or training. Advisory services are offered only to residents of states where the firm is registered or exempt from registration.</p>
      <p>Content on this site is general education, not individualized investment, tax or legal advice. Investing involves risk, including possible loss of principal. Jacob Swartz is also a licensed insurance agent and may earn commissions on insurance products, which is a conflict of interest; see our Form ADV Part 2A for details.</p>
      <p>&copy; <span data-year>2026</span> Swartz Wealth Management LLC</p>
      <div class="review-note"><strong>For Jake · Q5, Q23</strong><p>Footer wording is a draft for your compliance reviewer. Texas is left out until that registration is final. "Client login" points to Schwab Alliance; confirm it's the right portal (Q27).</p></div>
    </div>
  </div>
</footer>
<script src="assets/js/main.js" defer></script>
{extra_scripts}
</body>
</html>
"""


INCLUDE = re.compile(r"<!--\s*include:([\w-]+)\s*-->")


def expand(text, depth=0):
    if depth > 5:
        raise RuntimeError("include nesting too deep")
    return INCLUDE.sub(
        lambda m: expand((SRC / "partials" / f"{m.group(1)}.html").read_text(encoding="utf-8").strip(), depth + 1),
        text,
    )


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(SRC / "assets", OUT / "assets")
    for src in sorted(SRC.glob("*.html")):
        text = src.read_text(encoding="utf-8")
        first, body = text.split("\n", 1)
        body = expand(body)
        meta = dict(
            (k.strip(), v.strip())
            for k, v in (part.split(":", 1) for part in re.sub(r"^<!--|-->$", "", first.strip()).split("|"))
        )
        active = meta.get("nav", "")
        items = []
        for key, href, label in NAV:
            current = ' aria-current="page"' if key == active else ""
            items.append(f'        <li><a href="{href}"{current}>{label}</a></li>')
        body_attrs = f' data-variant="{meta["variant"]}"' if meta.get("variant") else ""
        scripts = "\n".join(
            f'<script src="{s.strip()}" defer></script>' for s in meta.get("scripts", "").split(",") if s.strip()
        )
        html = (
            HEAD.format(title=meta["title"], desc=meta["desc"], body_attrs=body_attrs, mark=MARK, nav_items="\n".join(items))
            + body.strip()
            + "\n"
            + FOOT.format(mark=MARK, extra_scripts=scripts)
        )
        (OUT / src.name).write_text(html, encoding="utf-8")
        print("built", src.name)


if __name__ == "__main__":
    build()
