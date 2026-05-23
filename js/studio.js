(function () {
  var body = document.body;
  if (!body.classList.contains("studio-home")) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var projectsTimer = null;

  var OPEN_DELAYS = {
    "projects-heading": 0,
    "project-card": 65,
    footer: 320,
  };

  var PROJECTS_START_MS = 480;

  function removeTransitionOverlay() {
    document.querySelectorAll(".page-transition-overlay").forEach(function (el) {
      el.remove();
    });
  }

  function resetOpeningState() {
    body.classList.remove(
      "studio-hero-ready",
      "studio-page-ready",
      "studio-hero-instant"
    );
    if (projectsTimer != null) {
      window.clearTimeout(projectsTimer);
      projectsTimer = null;
    }
  }

  function showOpeningInstant() {
    body.classList.add("studio-hero-ready", "studio-page-ready", "studio-hero-instant");
  }

  function initOpeningSequence() {
    var items = document.querySelectorAll(".studio-open-item");
    items.forEach(function (el) {
      var id = el.getAttribute("data-open-id");
      var delay = OPEN_DELAYS[id] != null ? OPEN_DELAYS[id] : 0;
      el.style.setProperty("--open-delay", delay + "ms");
    });

    if (reducedMotion) {
      showOpeningInstant();
      return;
    }

    requestAnimationFrame(function () {
      body.classList.add("studio-hero-ready");
      projectsTimer = window.setTimeout(function () {
        projectsTimer = null;
        body.classList.add("studio-page-ready");
      }, PROJECTS_START_MS);
    });
  }

  function restoreFromCache() {
    removeTransitionOverlay();
    resetOpeningState();
    var heroInner = document.querySelector("[data-parallax-hero] .studio-hero-inner");
    if (heroInner) heroInner.style.transform = "";
    showOpeningInstant();
  }

  initOpeningSequence();

  window.addEventListener("pagehide", removeTransitionOverlay);
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    restoreFromCache();
  });
})();
