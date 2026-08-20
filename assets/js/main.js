(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Breathing ring: cycles the same 4-4-4-4s box-breathing label
     the app uses on its Focus Box exercise, in sync with the CSS
     orbit animation (16s = 4 phases x 4s). ---- */
  var ring = document.querySelector("[data-breath-ring]");
  if (ring) {
    var labelEl = ring.querySelector("[data-breath-label]");
    var marker = ring.querySelector("[data-breath-marker]");
    var phases = ring.getAttribute("data-phases");
    phases = phases ? JSON.parse(phases) : [
      "Breathe in", "Hold", "Breathe out", "Hold"
    ];
    var phaseSeconds = 4;
    /* Rotation center in the ring SVG's own coordinate system
       (viewBox="0 0 280 280", track centered at 140,140). Set via
       the SVG "rotate(angle cx cy)" transform on every frame instead
       of a CSS transform-origin, since browsers disagree on whether
       transform-origin resolves against an SVG element's fill-box or
       its view-box — this native form has no such ambiguity. */
    var CENTER = 140;
    var core = ring.querySelector(".breath-core");

    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var elapsed = (ts - start) / 1000;
      var total = phaseSeconds * phases.length;
      var cycle = elapsed % total;
      var phaseIndex = Math.floor(cycle / phaseSeconds);
      var into = cycle % phaseSeconds;
      labelEl.textContent = phases[phaseIndex];

      if (core) {
        var f = into / phaseSeconds;
        var scale = phaseIndex === 0 ? 0.95 + 0.10 * f
                  : phaseIndex === 1 ? 1.05
                  : phaseIndex === 2 ? 1.05 - 0.10 * f
                  : 0.95;
        core.style.transform = "scale(" + scale.toFixed(3) + ")";

        /* Organic wobble: in the app itself the core isn't a clean circle —
           its edge drifts continuously in an irregular, non-repeating way.
           Eight independent sine oscillators (off-frequency, out of phase)
           driving the 8-value border-radius shorthand approximate that
           without a canvas/SVG blob. Reduced amplitude under reduce-motion
           keeps this a "gentle in-place breathe" rather than restless motion. */
        var amp = reduceMotion ? 4 : 8;
        var r1 = 50 + amp * Math.sin(elapsed * 0.55 + 0.0);
        var r2 = 50 + amp * Math.sin(elapsed * 0.63 + 2.1);
        var r3 = 50 + amp * Math.sin(elapsed * 0.47 + 4.2);
        var r4 = 50 + amp * Math.sin(elapsed * 0.58 + 1.4);
        var r5 = 50 + amp * Math.sin(elapsed * 0.51 + 3.3);
        var r6 = 50 + amp * Math.sin(elapsed * 0.66 + 5.0);
        var r7 = 50 + amp * Math.sin(elapsed * 0.44 + 0.7);
        var r8 = 50 + amp * Math.sin(elapsed * 0.60 + 2.8);
        core.style.borderRadius =
          r1.toFixed(1) + "% " + r2.toFixed(1) + "% " + r3.toFixed(1) + "% " + r4.toFixed(1) + "% / " +
          r5.toFixed(1) + "% " + r6.toFixed(1) + "% " + r7.toFixed(1) + "% " + r8.toFixed(1) + "%";
      }
      if (!reduceMotion && marker) {
        var angle = (cycle / total) * 360;
        marker.setAttribute("transform", "rotate(" + angle.toFixed(2) + " " + CENTER + " " + CENTER + ")");
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  /* ---- Color theme demo: clicking a swatch recolors the device
     frame behind the screenshot, mirroring the app's Settings >
     Color theme picker. Demo target and swatches are independent
     nodes, matched by data attribute rather than DOM nesting. ---- */
  var demo = document.querySelector("[data-theme-demo]");
  var swatches = document.querySelectorAll("[data-theme-color]");
  var swatchLabel = document.querySelector("[data-theme-swatch-label]");
  if (demo && swatches.length) {
    function applyTheme(btn) {
      var top = btn.getAttribute("data-theme-color");
      demo.style.setProperty("--sky-1", top);
      demo.style.setProperty("--sky-2", btn.getAttribute("data-theme-color-2") || top);
      if (swatchLabel) swatchLabel.textContent = btn.getAttribute("data-theme-name") || "";
    }
    /* Reflect the theme pre-selected in the markup so the sky is lit on load. */
    applyTheme(document.querySelector('[data-theme-color][aria-pressed="true"]') || swatches[0]);
    swatches.forEach(function (btn) {
      btn.addEventListener("click", function () {
        swatches.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        applyTheme(btn);
      });
    });
  }

  /* ---- Scroll reveal: a restrained fade-and-rise as sections enter view.
     Opt-in via JS + IntersectionObserver so no-JS and reduced-motion visitors
     always see fully rendered content. The hero is left out on purpose so the
     breathing ring reads immediately. ---- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      ".feature .container > *, .manifesto .manifesto-grid > *, .platforms .platform-row > li"
    );
    if (targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

      targets.forEach(function (el) {
        el.classList.add("reveal");
        // Gentle stagger by position among siblings (capped so it never drags).
        var index = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(index, 4) * 80 + "ms";
        io.observe(el);
      });
    }
  }
})();
