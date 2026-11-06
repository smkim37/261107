/* Deck controller: scaling, navigation, fragments, timeline rail, counters. */
(function () {
  "use strict";

  var stage = document.getElementById("stage");
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  var total = slides.length;
  var idx = -1;
  var locked = false;

  /* Chapters for the timeline rail. "start" is the 0-based slide index. */
  var chapters = [
    { label: "시작",   year: "",     start: 1 },
    { label: "고1",    year: "2017", start: 3 },
    { label: "고3",    year: "2019", start: 7 },
    { label: "대학",   year: "2020", start: 12 },
    { label: "대학원", year: "2025", start: 17 },
    { label: "마무리", year: "",     start: 20 }
  ];

  /* ---------- scaling ---------- */
  var scale = 1;
  function fit() {
    scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "scale(" + scale + ")";
  }
  window.addEventListener("resize", fit);
  fit();

  /* ---------- rail ---------- */
  var rail = stage.querySelector(".rail");
  var marks = [];
  var railFill = null;

  function buildRail() {
    var line = document.createElement("div");
    line.className = "rail-line";
    railFill = document.createElement("div");
    railFill.className = "rail-fill";
    line.appendChild(railFill);
    rail.appendChild(line);
    chapters.forEach(function (c, k) {
      var m = document.createElement("div");
      m.className = "mark";
      m.style.left = (k / (chapters.length - 1) * 100) + "%";
      m.innerHTML = '<span class="mark-label">' + c.label + '</span><span class="dot"></span>' +
                    (c.year ? '<span class="mark-year">' + c.year + "</span>" : "");
      rail.appendChild(m);
      marks.push(m);
    });
  }

  function updateRail(i) {
    var current = -1;
    chapters.forEach(function (c, k) { if (i >= c.start) current = k; });
    marks.forEach(function (m, k) {
      m.classList.toggle("is-current", k === current);
      m.classList.toggle("is-past", k < current);
    });
    railFill.style.width = (current < 0 ? 0 : current / (chapters.length - 1) * 100) + "%";
  }

  /* ---------- counters ---------- */
  function runCounters(slide) {
    var els = slide.querySelectorAll("[data-count]");
    Array.prototype.forEach.call(els, function (el, n) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var start = null, dur = 1100, delay = 260 + n * 110;
      el.textContent = (0).toFixed(dec);
      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start - delay) / dur);
        if (t < 0) { requestAnimationFrame(step); return; }
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * e).toFixed(dec);
        if (t < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- morph ----------
     Elements that carry the same data-morph key on two slides glide from
     the old position and size to the new one instead of fading. Titles
     are split into words so shared words move and the rest crossfade. */
  function splitTitleWords() {
    slides.forEach(function (sl) {
      var t = sl.querySelector(".title");
      if (!t) return;
      var words = t.textContent.trim().split(/\s+/), seen = {};
      t.textContent = "";
      words.forEach(function (w, i) {
        seen[w] = (seen[w] || 0) + 1;
        var span = document.createElement("span");
        span.className = "w";
        span.setAttribute("data-morph", "t:" + w + ":" + seen[w]);
        span.textContent = w;
        if (i) t.appendChild(document.createTextNode(" "));
        t.appendChild(span);
      });
    });
  }

  var morphTimer = null;
  function morph(prev, next) {
    if (!prev) return false;
    var map = {};
    Array.prototype.forEach.call(prev.querySelectorAll("[data-morph]"), function (e) { map[e.getAttribute("data-morph")] = e; });
    var pairs = [];
    Array.prototype.forEach.call(next.querySelectorAll("[data-morph]"), function (e) {
      var p = map[e.getAttribute("data-morph")];
      if (p) pairs.push({ from: p, to: e });
    });
    if (!pairs.length) return false;

    next.classList.add("is-measuring");
    pairs.forEach(function (pr) { pr.a = pr.from.getBoundingClientRect(); pr.b = pr.to.getBoundingClientRect(); });
    next.classList.remove("is-measuring");

    var fading = [];
    pairs.forEach(function (pr) {
      var dx = (pr.a.left - pr.b.left) / scale, dy = (pr.a.top - pr.b.top) / scale;
      var sx = pr.a.width / pr.b.width, sy = pr.a.height / pr.b.height;
      pr.to.classList.add("morph");
      pr.to.style.transition = "none";
      pr.to.style.transform = "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px) scale(" + sx.toFixed(4) + "," + sy.toFixed(4) + ")";
      pr.from.classList.add("morph-out");
    });
    pairs.forEach(function (pr) {
      var anc = pr.to.parentElement;
      while (anc && anc !== next) {
        if (anc.hasAttribute("data-r") && !anc.classList.contains("no-reveal")) {
          anc.classList.add("no-reveal");
          Array.prototype.forEach.call(anc.querySelectorAll(".w"), function (w) {
            if (!w.classList.contains("morph")) { w.classList.add("w-in"); fading.push(w); }
          });
        }
        anc = anc.parentElement;
      }
    });
    next.classList.add("morph-in");

    requestAnimationFrame(function () { requestAnimationFrame(function () {
      pairs.forEach(function (pr) { pr.to.style.transition = ""; pr.to.style.transform = ""; });
      fading.forEach(function (w) { w.classList.add("w-in-go"); });
    }); });

    clearTimeout(morphTimer);
    morphTimer = setTimeout(function () {
      pairs.forEach(function (pr) { pr.from.classList.remove("morph-out"); pr.to.classList.remove("morph"); });
      fading.forEach(function (w) { w.classList.remove("w-in", "w-in-go"); });
      Array.prototype.forEach.call(next.querySelectorAll(".no-reveal"), function (x) { x.classList.remove("no-reveal"); });
      next.classList.remove("morph-in");
    }, 900);
    return true;
  }

  /* ---------- navigation ---------- */
  function setFragments(slide, visible) {
    Array.prototype.forEach.call(slide.querySelectorAll(".fragment"), function (f) {
      f.classList.toggle("is-visible", visible);
    });
  }

  function go(n, dir) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === idx) return;
    dir = dir || (n > idx ? 1 : -1);
    var prev = slides[idx];
    var next = slides[n];

    if (prev) {
      prev.style.setProperty("--dir", dir);
      prev.classList.add("is-leaving");
      prev.classList.remove("is-active");
      setTimeout(function () { prev.classList.remove("is-leaving"); }, 400);
    }
    next.style.setProperty("--dir", dir);
    setFragments(next, dir < 0);
    morph(prev, next);
    next.classList.add("is-active");
    idx = n;

    stage.classList.toggle("on-cover", next.classList.contains("s-cover"));
    updateRail(n);
    runCounters(next);
    if (history.replaceState) history.replaceState(null, "", "#" + (n + 1));
    else location.hash = "#" + (n + 1);
  }

  /* fragments sharing a data-frag value appear and disappear together */
  function fragGroup(slide, f) {
    var id = f.getAttribute("data-frag");
    return id ? slide.querySelectorAll('.fragment[data-frag="' + id + '"]') : [f];
  }
  function next() {
    var cur = slides[idx];
    var f = cur.querySelector(".fragment:not(.is-visible)");
    if (f) { Array.prototype.forEach.call(fragGroup(cur, f), function (x) { x.classList.add("is-visible"); }); return; }
    go(idx + 1, 1);
  }
  function prev() {
    var cur = slides[idx];
    var vis = cur.querySelectorAll(".fragment.is-visible");
    if (vis.length) { Array.prototype.forEach.call(fragGroup(cur, vis[vis.length - 1]), function (x) { x.classList.remove("is-visible"); }); return; }
    go(idx - 1, -1);
  }

  function fromHash() {
    var h = parseInt((location.hash || "").replace("#", ""), 10);
    return isNaN(h) ? 0 : Math.max(0, Math.min(total - 1, h - 1));
  }

  /* ---------- keyboard ---------- */
  var help = document.getElementById("help");
  var typed = "";
  var typedTimer = null;

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === "?" || (k === "/" && e.shiftKey)) { help.classList.toggle("is-open"); e.preventDefault(); return; }
    if (k === "Escape") { help.classList.remove("is-open"); return; }
    if (help.classList.contains("is-open")) { help.classList.remove("is-open"); return; }

    if (/^[0-9]$/.test(k)) {
      typed += k;
      clearTimeout(typedTimer);
      typedTimer = setTimeout(function () { typed = ""; }, 1500);
      return;
    }
    if (k === "Enter" && typed) { go(parseInt(typed, 10) - 1); typed = ""; e.preventDefault(); return; }

    switch (k) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ": case "Enter":
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace":
        e.preventDefault(); prev(); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(total - 1); break;
      case "f": case "F":
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        break;
    }
  });

  /* ---------- wheel ---------- */
  var wheelAcc = 0;
  document.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (locked) return;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) < 48) return;
    wheelAcc > 0 ? next() : prev();
    wheelAcc = 0;
    locked = true;
    setTimeout(function () { locked = false; }, 700);
  }, { passive: false });

  /* ---------- touch ---------- */
  var tx = null, ty = null;
  document.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    dx < 0 ? next() : prev();
  }, { passive: true });

  /* ---------- click zones ---------- */
  Array.prototype.forEach.call(stage.querySelectorAll(".zone"), function (z) {
    z.addEventListener("click", function () { z.getAttribute("data-nav") === "next" ? next() : prev(); });
  });
  var arrowTimer = null;
  document.addEventListener("mousemove", function () {
    stage.classList.add("show-arrows");
    clearTimeout(arrowTimer);
    arrowTimer = setTimeout(function () { stage.classList.remove("show-arrows"); }, 1800);
  });

  window.addEventListener("hashchange", function () { var n = fromHash(); if (n !== idx) go(n); });

  /* ---------- start ---------- */
  splitTitleWords();
  buildRail();
  go(fromHash(), 1);

})();
