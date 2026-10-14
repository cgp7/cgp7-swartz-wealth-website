/* Swartz Wealth Management: site behaviour.
   Plain JavaScript, no dependencies. Every feature checks that its markup exists. */
(function () {
  "use strict";

  var store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
    }
  };

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* ---------- Prototype review mode ----------
     Two homepage versions (A and B) and sticky notes for Jake.
     Remove this block, the review-note elements and .review-* CSS before launch. */
  var HOMES = { A: "index.html", B: "home-b.html" };
  var pageVariant = document.body.getAttribute("data-variant");
  if (pageVariant) store.set("swm-variant", pageVariant);
  var variant = pageVariant || store.get("swm-variant") || "A";
  if (!HOMES[variant]) variant = "A";

  document.querySelectorAll("[data-home-link]").forEach(function (a) {
    a.setAttribute("href", HOMES[variant]);
  });

  var notesOn = store.get("swm-notes") !== "off";
  var root = document.documentElement;
  root.classList.toggle("review-on", notesOn);

  var bar = document.createElement("div");
  bar.className = "review-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Prototype review controls");
  bar.innerHTML =
    '<span class="rb-label">Prototype</span>' +
    '<a href="index.html" data-v="A">Version A</a>' +
    '<a href="home-b.html" data-v="B">Version B</a>' +
    '<span class="rb-sep" aria-hidden="true"></span>' +
    '<button type="button" aria-pressed="' + notesOn + '">Notes for Jake</button>';
  bar.querySelectorAll("a[data-v]").forEach(function (a) {
    if (a.getAttribute("data-v") === variant) a.setAttribute("aria-current", "true");
  });
  bar.querySelector("button").addEventListener("click", function () {
    notesOn = !notesOn;
    this.setAttribute("aria-pressed", String(notesOn));
    root.classList.toggle("review-on", notesOn);
    store.set("swm-notes", notesOn ? "on" : "off");
  });
  document.body.appendChild(bar);

  /* ---------- "Start here" router (accessible tabs) ---------- */
  document.querySelectorAll("[data-router]").forEach(function (router) {
    var tabs = Array.prototype.slice.call(router.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    select(tabs[0], false);
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
  var MIN = 25000;
  var MAX = 10000000;

  function bandIndex(amount) {
    for (var i = 0; i < BANDS.length; i++) if (amount <= BANDS[i].max) return i;
    return BANDS.length - 1;
  }
  function feeAsFiled(amount) {
    return amount * BANDS[bandIndex(amount)].rate;
  }
  function feeTiered(amount) {
    var fee = 0;
    var floor = 0;
    for (var i = 0; i < BANDS.length && amount > floor; i++) {
      var top = Math.min(amount, BANDS[i].max);
      fee += (top - floor) * BANDS[i].rate;
      floor = BANDS[i].max;
    }
    return fee;
  }
  var dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  function toSlider(amount) {
    return Math.round((Math.log(amount / MIN) / Math.log(MAX / MIN)) * 1000);
  }
  function fromSlider(pos) {
    var raw = MIN * Math.pow(MAX / MIN, pos / 1000);
    var step = raw < 1000000 ? 5000 : raw < 5000000 ? 25000 : 50000;
    return Math.round(raw / step) * step;
  }

  document.querySelectorAll("[data-fee-calc]").forEach(function (calc) {
    var input = calc.querySelector("[data-fee-input]");
    var range = calc.querySelector("[data-fee-range]");
    var outAnnual = calc.querySelector("[data-fee-annual]");
    var outMonthly = calc.querySelector("[data-fee-monthly]");
    var outRate = calc.querySelector("[data-fee-rate]");
    var outTiered = calc.querySelector("[data-fee-tiered]");
    var bands = calc.querySelectorAll(".fee-band");
    var rows = document.querySelectorAll("[data-band-row]");
    if (!input || !range) return;

    function render(amount) {
      var i = bandIndex(amount);
      var fee = feeAsFiled(amount);
      if (outAnnual) outAnnual.textContent = dollars.format(fee);
      if (outMonthly) outMonthly.textContent = dollars.format(fee / 12);
      if (outRate) outRate.textContent = (BANDS[i].rate * 100).toFixed(2) + "%";
      bands.forEach(function (b, j) { b.classList.toggle("is-active", j === i); });
      rows.forEach(function (r) { r.classList.toggle("is-active", Number(r.getAttribute("data-band-row")) === i); });
      if (outTiered) {
        var t = feeTiered(amount);
        outTiered.textContent = dollars.format(fee) + " as filed vs " + dollars.format(t) +
          " if tiered (" + (t / amount * 100).toFixed(2) + "% effective).";
      }
    }
    function fromInput() {
      var amount = Number(String(input.value).replace(/[^0-9.]/g, ""));
      if (!isFinite(amount) || amount <= 0) return;
      range.value = String(Math.max(0, Math.min(1000, toSlider(Math.max(MIN, Math.min(MAX, amount))))));
      render(amount);
    }
    range.addEventListener("input", function () {
      var amount = fromSlider(Number(range.value));
      input.value = plain.format(amount);
      render(amount);
    });
    input.addEventListener("input", fromInput);
    input.addEventListener("blur", function () {
      var amount = Number(String(input.value).replace(/[^0-9.]/g, ""));
      if (isFinite(amount) && amount > 0) input.value = plain.format(amount);
    });

    var start = Number(calc.getAttribute("data-start")) || 750000;
    input.value = plain.format(start);
    range.value = String(toSlider(start));
    render(start);
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
