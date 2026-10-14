/* 401(k) options helper: flags which of the four options deserve a closer look.
   Runs entirely in the browser; nothing is stored or sent. */
(function () {
  "use strict";
  var box = document.querySelector("[data-rollover]");
  if (!box) return;
  var out = box.querySelector("[data-results]");

  function val(name) {
    var el = box.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  var BADGE = {
    look: '<span class="badge badge-look">Worth a look</span>',
    maybe: '<span class="badge badge-maybe">Possible</span>',
    care: '<span class="badge badge-care">Use with care</span>'
  };

  function render() {
    var a = { newplan: val("newplan"), age55: val("age55"), stock: val("stock"), cash: val("cash") };
    var options = [];

    var leave = { title: "Leave it in your old plan", level: "maybe", notes: ["Compare its fees and fund choices with your alternatives."] };
    if (a.age55 === "yes") {
      leave.level = "look";
      leave.notes.unshift("Leaving at 55 or older usually lets you withdraw from this plan without the 10% penalty.");
    }
    if (a.cash === "yes" && a.age55 === "yes") leave.notes.push("If you need cash soon, taking it from this plan may avoid the penalty an IRA would trigger.");
    options.push(leave);

    var newPlan = { title: "Move it to your new employer's plan", level: "maybe", notes: [] };
    if (a.newplan === "yes") {
      newPlan.level = "look";
      newPlan.notes.push("Keeps your savings in one place, with employer-plan protections.");
    } else if (a.newplan === "no") {
      newPlan.level = "care";
      newPlan.notes.push("Not available until you have a plan that accepts rollovers.");
    } else {
      newPlan.notes.push("Ask your new employer's HR team whether the plan accepts incoming rollovers.");
    }
    options.push(newPlan);

    var ira = { title: "Roll it to an IRA", level: "look", notes: ["More investment choices, and a simple way to combine old accounts.", "Ask for a direct rollover so nothing is withheld."] };
    if (a.age55 === "yes") {
      ira.level = "maybe";
      ira.notes.push("You'd generally lose the age-55 penalty exception on this money.");
    }
    if (a.stock !== "no") {
      ira.level = "maybe";
      ira.notes.push(a.stock === "yes"
        ? "Check the company-stock rules (net unrealized appreciation) before rolling that stock."
        : "Find out whether you hold company stock first; it can change the answer.");
    }
    options.push(ira);

    var cash = { title: "Cash it out", level: "care", notes: ["Expect income tax, 20% withheld up front, and usually a 10% penalty under age 59½."] };
    if (a.cash === "yes") cash.notes.push("If you need money soon, consider taking only what you need and keeping the rest invested.");
    options.push(cash);

    var order = { look: 0, maybe: 1, care: 2 };
    options.sort(function (x, y) { return order[x.level] - order[y.level]; });

    out.innerHTML = options.map(function (o) {
      return '<div class="option-card"><h4>' + o.title + " " + BADGE[o.level] + "</h4><ul>" +
        o.notes.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></div>";
    }).join("");
  }

  box.addEventListener("change", render);
  render();
})();
