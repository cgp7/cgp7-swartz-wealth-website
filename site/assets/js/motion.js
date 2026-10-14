/* Motion with GSAP (ScrollTrigger, SplitText) and Lenis smooth scrolling.
   Content is visible without this file: initial states are only set here, and a
   timer in <head> drops the hiding class if GSAP never loads.
   SWM.animate(scope) (re)builds every scroll animation inside one element, which
   lets a single-file preview re-run them when it swaps pages. */
(function () {
  "use strict";
  var root = document.documentElement;
  window.SWM = window.SWM || {};
  window.SWM.refresh = function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); };

  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("motion"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { root.classList.remove("motion"); return; }

  var ease = "expo.out";
  var lenis = null;
  var current = null;

  /* Split lines only after the web fonts are in, or line breaks shift later. */
  var started = false;
  function go() { if (started) return; started = true; init(); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 1200); } else { go(); }

  function init() {
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.addEventListener("click", function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a || a.hasAttribute("data-route")) return;
        var id = a.getAttribute("href");
        if (id.length < 2 || id.indexOf(":") > -1) return;
        var el = document.getElementById(id.slice(1));
        if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80 }); }
      });
    }
    window.SWM.lenis = lenis;
    gsap.from(".site-header .header-inner > *", { autoAlpha: 0, y: -12, duration: 1, ease: ease, stagger: 0.08, delay: 0.1 });
    window.SWM.animate = animate;
    animate(document.querySelector("[data-scope]:not([hidden])") || document.body);

    var baseRefresh = window.SWM.refresh;
    window.SWM.refresh = function () {
      document.querySelectorAll(".hero-variant:not([hidden]) [data-split]").forEach(function (h) {
        if (!h.dataset.done) { h.dataset.done = "1"; revealHeadline(h, 0, false); }
      });
      gsap.set(".hero-variant:not([hidden]) [data-fade]", { autoAlpha: 1, y: 0 });
      baseRefresh();
    };
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  function animate(scope) {
    if (current) current.revert();
    scope.querySelectorAll("[data-split]").forEach(function (h) { delete h.dataset.done; });
    current = gsap.context(function () { setup(scope); }, scope);
    ScrollTrigger.refresh();
  }

  function splitLines(el) {
    if (!window.SplitText) return [el];
    return new SplitText(el, { type: "lines", linesClass: "line", mask: "lines" }).lines;
  }

  function revealHeadline(el, delay, trigger) {
    var lines = splitLines(el);
    gsap.set(el, { autoAlpha: 1 });
    var tween = { yPercent: 110, duration: 1.25, ease: ease, stagger: 0.09, delay: delay || 0 };
    if (trigger) tween.scrollTrigger = { trigger: el, start: "top 86%", once: true };
    gsap.from(lines, tween);
  }

  function q(scope, sel) { return Array.prototype.slice.call(scope.querySelectorAll(sel)); }

  function setup(scope) {
    /* Hero: headline, then supporting lines, while the water fades up. */
    q(scope, ".hero, .page-hero").forEach(function (hero) {
      q(hero, "[data-split]").forEach(function (h) {
        if (h.closest(".hero-variant[hidden]")) return;
        h.dataset.done = "1";
        revealHeadline(h, 0.15, false);
      });
      var fades = q(hero, "[data-fade]").filter(function (el) { return !el.closest(".hero-variant[hidden]"); });
      gsap.fromTo(fades, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: ease, stagger: 0.08, delay: 0.55 });
      var water = q(hero, "canvas, .water-fallback");
      gsap.fromTo(water, { scale: 1.12, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2.4, ease: "power2.out" });
      gsap.to(water, { yPercent: 12, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    });

    /* Section headlines. */
    q(scope, "[data-split]").forEach(function (h) {
      if (h.closest(".hero, .page-hero")) return;
      revealHeadline(h, 0, true);
    });

    /* Generic reveal. */
    q(scope, "[data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: ease, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });

    /* Statement: words light up as you read. */
    q(scope, "[data-lit]").forEach(function (el) {
      var words = window.SplitText ? new SplitText(el, { type: "words" }).words : [el];
      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: true } });
    });

    /* Rows. */
    q(scope, "[data-rows]").forEach(function (list) {
      gsap.fromTo(q(list, ".row, .acc-item, .svc"), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1, ease: ease, stagger: 0.08,
        scrollTrigger: { trigger: list, start: "top 86%", once: true } });
    });

    /* Counters. */
    q(scope, "[data-count]").forEach(function (el) {
      var end = Number(el.getAttribute("data-count")), pre = el.getAttribute("data-prefix") || "", o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: function () { el.textContent = pre + Math.round(o.v).toLocaleString("en-US"); } });
    });

    /* Lake map draws itself. */
    q(scope, "[data-lake]").forEach(function (svg) {
      var shore = svg.querySelector(".shore");
      var tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 82%", once: true } });
      if (shore && shore.getTotalLength) {
        var len = shore.getTotalLength();
        gsap.set(shore, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
        tl.to(shore, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }).to(shore, { fillOpacity: 1, duration: 1 }, "-=0.6");
      }
      tl.from(q(svg, ".contour"), { autoAlpha: 0, duration: 1.2, stagger: 0.15 }, "-=1.2")
        .from(q(svg, ".pin"), { scale: 0, transformOrigin: "center", duration: 0.6, ease: "back.out(2)", stagger: 0.2 }, "-=0.8")
        .from(q(svg, ".label, .sub"), { autoAlpha: 0, x: -8, duration: 0.8, stagger: 0.08 }, "-=0.4")
        .from(q(svg, ".route"), { autoAlpha: 0, duration: 1 }, "-=0.6");
      gsap.to(q(svg, ".ring"), { scale: 3, opacity: 0, duration: 2.6, ease: "power2.out", repeat: -1, stagger: 1.3 });
      gsap.to(q(svg, ".route"), { strokeDashoffset: -40, duration: 3, ease: "none", repeat: -1 });
    });

    /* Process: pinned horizontal scroll on wide screens. */
    var mm = gsap.matchMedia();
    q(scope, "[data-process]").forEach(function (sec, idx) {
      mm.add("(min-width: 1000px)", function () {
        if (idx > 0 && !sec.offsetParent) return;
        var track = sec.querySelector(".process-track");
        sec.classList.add("is-pinnable");
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 80); };
        var tween = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        q(sec, ".step-num").forEach(function (num) {
          gsap.from(num, { xPercent: 30, autoAlpha: 0, ease: "none",
            scrollTrigger: { trigger: num.parentElement, containerAnimation: tween, start: "left 95%", end: "left 45%", scrub: true } });
        });
        return function () { sec.classList.remove("is-pinnable"); };
      });
      mm.add("(max-width: 999px)", function () {
        q(sec, ".step-card").forEach(function (card) {
          gsap.from(card, { autoAlpha: 0, y: 40, duration: 1, ease: ease, scrollTrigger: { trigger: card, start: "top 88%", once: true } });
        });
      });
    });

    /* Team photos: slow parallax. */
    q(scope, "[data-parallax] .mono").forEach(function (m) {
      gsap.fromTo(m, { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: m.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* CTA water eases in. */
    q(scope, ".cta").forEach(function (cta) {
      gsap.fromTo(q(cta, "canvas, .water-fallback"), { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: cta, start: "top bottom", end: "bottom bottom", scrub: true } });
    });

    /* Footer word drifts. */
    var word = document.querySelector(".foot-word");
    if (word) gsap.fromTo(word, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: word, start: "top bottom", end: "bottom top", scrub: true } });
  }
})();
