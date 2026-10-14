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

GSAP = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist"
LENIS = "https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"

NAV = [
    ("who", "who-we-serve.html", "Who we serve"),
    ("services", "services.html", "Services"),
    ("fees", "fees.html", "Fees"),
    ("about", "about.html", "About"),
    ("guides", "insights.html", "Guides"),
]

ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

MARK = (
    '<svg class="brand-mark" viewBox="0 0 30 30" aria-hidden="true">'
    '<circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" stroke-width="1.4"/>'
    '<path d="M1.5 16.5c3.4-3 6.8-3 10.2 0s6.8 3 10.2 0c2.3-2 4.6-2.6 6.6-1.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
    '<path d="M3.2 21.5c2.9-2.4 5.8-2.4 8.7 0s5.8 2.4 8.7 0c2-1.6 4-2 5.9-1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>'
    "</svg>"
)

HEAD = """<!doctype html>
<html lang="en" data-notes="all">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#07090c">
<meta name="robots" content="noindex">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<script>(function(d){{var h=d.documentElement;h.classList.add("js");if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){{h.classList.add("motion");setTimeout(function(){{if(!window.gsap)h.classList.remove("motion")}},3500)}}}})(document);</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body{body_attrs}>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="index.html" data-home-link aria-label="Swartz Wealth Management, home">{mark}<span class="brand-name">Swartz<small>Wealth Management</small></span></a>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <ul>
{nav_items}
      </ul>
      <div class="mobile-meta">
        <a class="btn btn-light" href="contact.html">Book a call <span class="chip">{arrow}</span></a>
        <a href="tel:+12698322433">(269) 832-2433</a>
        <a href="https://www.schwaballiance.com" rel="noopener">Client login</a>
      </div>
    </nav>
    <div style="display:flex;align-items:center;gap:10px">
      <a class="btn btn-light header-cta" href="contact.html">Book a call <span class="chip">{arrow}</span></a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><i aria-hidden="true"></i>Menu</button>
    </div>
  </div>
</header>
"""

FOOT = """
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-top">
      <ul class="foot-links">
        <li><a href="who-we-serve.html">Who we serve</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="fees.html">Fees</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="insights.html">Guides</a></li>
        <li><a href="contact.html">Book a call</a></li>
      </ul>
      <div class="foot-col">
        <h2>Talk to us</h2>
        <ul>
          <li><a href="tel:+12698322433">(269) 832-2433</a></li>
          <li><a href="mailto:Jake@swartzwealthmanagement.com">Jake@swartzwealthmanagement.com</a></li>
          <li>Chicago, Illinois</li>
          <li>Rockford, Michigan</li>
        </ul>
      </div>
      <div class="foot-col">
        <h2>Clients and records</h2>
        <ul>
          <li><a href="https://www.schwaballiance.com" rel="noopener">Schwab account login</a></li>
          <li><a href="https://adviserinfo.sec.gov/firm/summary/337684" rel="noopener">Form ADV and registration</a></li>
          <li><a href="disclosures.html#privacy">Privacy notice</a></li>
          <li><a href="disclosures.html">Disclosures</a></li>
        </ul>
        <div class="note note-check"><b>Check first · R4</b><p>Confirm Schwab Alliance is the login SWM's clients use.</p></div>
      </div>
    </div>
    <div class="foot-legal">
      <p>Swartz Wealth Management LLC (CRD 337684) is an investment adviser registered with the states of Illinois and Michigan. Registration does not imply a certain level of skill or training. Advisory services are offered only to residents of states where the firm is registered or exempt from registration.</p>
      <p>This site is general education, not individualized investment, tax or legal advice. Investing involves risk, including possible loss of principal. Jacob Swartz is also a licensed insurance agent and may earn commissions on insurance products, which is a conflict of interest described in our Form ADV Part 2A.</p>
      <p>&copy; <span data-year>2026</span> Swartz Wealth Management LLC</p>
      <div class="note note-check"><b>Check first · R3</b><p>Texas is left off until that registration is final. Check the SEC database before the call.</p></div>
      <div class="note note-later"><b>Later · Q23</b><p>Footer wording is a draft for Jake's compliance reviewer.</p></div>
    </div>
    <div class="foot-word" aria-hidden="true">Swartz</div>
  </div>
</footer>
<script src="{gsap}/gsap.min.js" defer></script>
<script src="{gsap}/ScrollTrigger.min.js" defer></script>
<script src="{gsap}/SplitText.min.js" defer></script>
<script src="{lenis}" defer></script>
<script src="assets/js/water.js" defer></script>
<script src="assets/js/main.js" defer></script>
<script src="assets/js/motion.js" defer></script>
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
        body = expand(body).replace("{{arrow}}", ARROW)
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
            HEAD.format(title=meta["title"], desc=meta["desc"], body_attrs=body_attrs, mark=MARK, arrow=ARROW,
                        nav_items="\n".join(items))
            + body.strip()
            + "\n"
            + FOOT.format(gsap=GSAP, lenis=LENIS, extra_scripts=scripts)
        )
        (OUT / src.name).write_text(html, encoding="utf-8")
        print("built", src.name)


if __name__ == "__main__":
    build()
