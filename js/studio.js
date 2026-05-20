(function () {
  var body = document.body;
  if (!body.classList.contains("studio-home")) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var OPEN_DELAYS = {
    "projects-heading": 0,
    "project-card": 65,
    footer: 320,
  };

  var PROJECTS_START_MS = 480;

  function initOpeningSequence() {
    var items = document.querySelectorAll(".studio-open-item");
    items.forEach(function (el) {
      var id = el.getAttribute("data-open-id");
      var delay = OPEN_DELAYS[id] != null ? OPEN_DELAYS[id] : 0;
      el.style.setProperty("--open-delay", delay + "ms");
    });

    if (reducedMotion) {
      body.classList.add("studio-hero-ready", "studio-page-ready", "studio-hero-instant");
      return;
    }

    requestAnimationFrame(function () {
      body.classList.add("studio-hero-ready");
      window.setTimeout(function () {
        body.classList.add("studio-page-ready");
      }, PROJECTS_START_MS);
    });
  }

  function initParallax() {
    var hero = document.querySelector("[data-parallax-hero]");
    var inner = hero ? hero.querySelector(".studio-hero-inner") : null;
    if (!hero || !inner || reducedMotion) return;

    var ticking = false;
    function update() {
      ticking = false;
      inner.style.transform = "translate3d(0, " + window.scrollY * 0.18 + "px, 0)";
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  initOpeningSequence();
  initParallax();
})();
