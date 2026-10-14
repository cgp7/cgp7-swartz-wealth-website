/* Swartz Wealth Management: behaviour (no animation library needed).
   Navigation, header state, review mode, accordions, glossary, fee calculator. */
(function () {
  "use strict";

  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  window.SWM = window.SWM || {};
  window.SWM.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { toggle.click(); toggle.focus(); }
    });
  }

  /* ---------- Review mode ----------
     Version A / B (homepage only) and three note filters:
     all notes, Jake's questions only, or none. Remove before launch. */
  var DOC = "https://docs.google.com/document/d/1I0zcKUNqaicLX7HeIr7qSSVkU0cDw1fY1WqAFjhYsXM/edit";
  var isHome = !!document.querySelector("[data-home]");
  var variant = (new URLSearchParams(location.search).get("v") || document.body.getAttribute("data-variant") || store.get("swm-variant") || "A").toUpperCase();
  if (variant !== "B") variant = "A";
  var notes = store.get("swm-notes") || "all";

  function applyVariant(v, refresh) {
    variant = v;
    store.set("swm-variant", v);
    root.setAttribute("data-variant", v);
    document.querySelectorAll(".hero-variant").forEach(function (el) { el.hidden = el.getAttribute("data-v") !== v; });
    document.querySelectorAll("[data-home-link]").forEach(function (a) { a.setAttribute("href", v === "B" ? "home-b.html" : "index.html"); });
    document.querySelectorAll(".review-bar [data-v]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v)); });
    if (refresh && window.SWM.refresh) window.SWM.refresh();
  }
  function applyNotes(n) {
    notes = n;
    store.set("swm-notes", n);
    root.setAttribute("data-notes", n);
    document.querySelectorAll(".review-bar [data-n]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-n") === n)); });
    if (window.SWM.refresh) window.SWM.refresh();
  }

  var bar = document.createElement("div");
  bar.className = "review-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Prototype review controls");
  bar.innerHTML =
    '<span class="lbl" style="padding:0 6px 0 10px">Draft</span>' +
    '<button type="button" data-v="A">Version A</button>' +
    '<button type="button" data-v="B">Version B</button>' +
    '<span class="sep" aria-hidden="true"></span>' +
    '<button type="button" data-n="all">All notes</button>' +
    '<button type="button" data-n="jake">Jake</button>' +
    '<button type="button" data-n="off">Off</button>' +
    '<span class="sep" aria-hidden="true"></span>' +
    '<a class="doc" href="' + DOC + '" target="_blank" rel="noopener">Checklist</a>';
  document.body.appendChild(bar);
  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-v")) {
      var v = b.getAttribute("data-v");
      if (isHome) applyVariant(v, true);
      else location.href = v === "B" ? "home-b.html" : "index.html";
    }
    if (b.hasAttribute("data-n")) applyNotes(b.getAttribute("data-n"));
  });
  applyVariant(variant, false);
  applyNotes(notes);

  /* ---------- Accordions ---------- */
  document.querySelectorAll(".acc-item").forEach(function (item, i) {
    var btn = item.querySelector(":scope > button");
    var panel = item.querySelector(".acc-panel");
    if (!btn || !panel) return;
    var id = panel.id || "acc-" + i + "-" + Math.random().toString(36).slice(2, 7);
    panel.id = id;
    btn.setAttribute("aria-controls", id);
    btn.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      btn.setAttribute("aria-expanded", String(open));
      if (window.gsap && !window.SWM.reduced) {
        if (open) {
          item.classList.add("is-open");
          gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 0.6, ease: "power3.out", onComplete: window.SWM.refresh });
          gsap.fromTo(panel.firstElementChild, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.05 });
        } else {
          gsap.to(panel, { height: 0, duration: 0.45, ease: "power3.inOut", onComplete: function () { item.classList.remove("is-open"); gsap.set(panel, { clearProps: "height" }); if (window.SWM.refresh) window.SWM.refresh(); } });
        }
      } else {
        item.classList.toggle("is-open", open);
      }
    });
  });

  /* A link such as services.html#tax opens that item. */
  window.SWM.openItem = function (el) {
    var item = el && el.closest(".acc-item");
    var btn = item && item.querySelector(":scope > button");
    if (btn && !item.classList.contains("is-open")) btn.click();
  };
  if (location.hash.length > 1) window.SWM.openItem(document.getElementById(location.hash.slice(1)));

  /* ---------- Glossary ---------- */
  document.querySelectorAll("[data-gloss]").forEach(function (box) {
    var buttons = box.querySelectorAll(".gloss-terms button");
    var title = box.querySelector("[data-gloss-title]");
    var text = box.querySelector("[data-gloss-text]");
    var ours = box.querySelector("[data-gloss-ours]");
    var def = box.querySelector(".gloss-def");
    function show(b) {
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var set = function () {
        title.textContent = b.textContent;
        text.textContent = b.getAttribute("data-def");
        ours.textContent = b.getAttribute("data-ours") || "";
      };
      if (window.gsap && !window.SWM.reduced) {
        gsap.to(def, { opacity: 0, y: -10, duration: 0.2, ease: "power2.in", onComplete: function () {
          set(); gsap.fromTo(def, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" });
        } });
      } else { set(); }
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { show(b); }); });
  });

  /* ---------- Fee calculator ----------
     Schedule from Form ADV Part 2A (January 2026). As filed, one rate applies to the
     whole balance, set by the band the total falls in. */
  var BANDS = [
    { max: 500000, rate: 0.015 },
    { max: 1000000, rate: 0.0125 },
    { max: 2500000, rate: 0.01 },
    { max: 5000000, rate: 0.0085 },
    { max: Infinity, rate: 0.0075 }
  ];
  var MIN = 25000, MAX = 10000000;
  function bandIndex(a) { for (var i = 0; i < BANDS.length; i++) if (a <= BANDS[i].max) return i; return BANDS.length - 1; }
  function feeAsFiled(a) { return a * BANDS[bandIndex(a)].rate; }
  function feeTiered(a) {
    var fee = 0, floor = 0;
    for (var i = 0; i < BANDS.length && a > floor; i++) { fee += (Math.min(a, BANDS[i].max) - floor) * BANDS[i].rate; floor = BANDS[i].max; }
    return fee;
  }
  var usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  function toPos(a) { return Math.round(Math.log(a / MIN) / Math.log(MAX / MIN) * 1000); }
  function fromPos(p) {
    var raw = MIN * Math.pow(MAX / MIN, p / 1000);
    var step = raw < 1000000 ? 5000 : raw < 5000000 ? 25000 : 50000;
    return Math.round(raw / step) * step;
  }
  window.SWM.fees = { feeAsFiled: feeAsFiled, feeTiered: feeTiered, bandIndex: bandIndex };

  document.querySelectorAll("[data-calc]").forEach(function (calc) {
    var input = calc.querySelector("[data-calc-input]");
    var range = calc.querySelector("[data-calc-range]");
    var outYear = calc.querySelector("[data-calc-year]");
    var outMonth = calc.querySelector("[data-calc-month]");
    var outRate = calc.querySelector("[data-calc-rate]");
    var outTier = calc.querySelector("[data-calc-tiered]");
    var bands = calc.querySelectorAll(".calc-bands span");
    var rows = document.querySelectorAll("[data-band]");
    var shown = { y: 0, m: 0 };
    if (!input || !range) return;

    function render(a) {
      var i = bandIndex(a), fee = feeAsFiled(a);
      if (outRate) outRate.textContent = (BANDS[i].rate * 100).toFixed(2) + "% of the whole balance, billed monthly.";
      bands.forEach(function (b, j) { b.classList.toggle("on", j === i); });
      rows.forEach(function (r) { r.classList.toggle("on", Number(r.getAttribute("data-band")) === i); });
      if (outTier) {
        var t = feeTiered(a);
        outTier.textContent = usd.format(fee) + " as filed, against " + usd.format(t) + " if each band were billed at its own rate.";
      }
      if (window.gsap && !window.SWM.reduced) {
        gsap.to(shown, { y: fee, m: fee / 12, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: function () {
          if (outYear) outYear.textContent = usd.format(shown.y);
          if (outMonth) outMonth.textContent = usd.format(shown.m);
        } });
      } else {
        if (outYear) outYear.textContent = usd.format(fee);
        if (outMonth) outMonth.textContent = usd.format(fee / 12);
      }
    }
    range.addEventListener("input", function () { var a = fromPos(Number(range.value)); input.value = plain.format(a); render(a); });
    input.addEventListener("input", function () {
      var a = Number(String(input.value).replace(/[^0-9.]/g, ""));
      if (!isFinite(a) || a <= 0) return;
      range.value = String(Math.max(0, Math.min(1000, toPos(Math.max(MIN, Math.min(MAX, a))))));
      render(a);
    });
    input.addEventListener("blur", function () { var a = Number(String(input.value).replace(/[^0-9.]/g, "")); if (a > 0) input.value = plain.format(a); });
    var start = Number(calc.getAttribute("data-start")) || 750000;
    input.value = plain.format(start);
    range.value = String(toPos(start));
    render(start);
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
