(function () {
  var body = document.body;
  var enabled =
    body.classList.contains("studio-home") || body.classList.contains("artblock");
  var drawEnabled = enabled && !body.classList.contains("legal-doc");
  if (!enabled || !drawEnabled) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (reducedMotion || coarsePointer) return;

  var canvas = document.querySelector(".studio-draw-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var strokeStyle =
    body.getAttribute("data-draw-stroke") ||
    (body.classList.contains("studio-home")
      ? "rgba(255, 255, 255, 0.88)"
      : "rgba(26, 28, 30, 0.48)");

  var drawing = false;
  var lastX = 0;
  var lastY = 0;
  var dpr = 1;

  function documentSize() {
    var doc = document.documentElement;
    return {
      w: Math.max(doc.scrollWidth, doc.clientWidth, window.innerWidth),
      h: Math.max(doc.scrollHeight, doc.clientHeight, window.innerHeight),
    };
  }

  function isInteractiveTarget(target) {
    return !!(
      target &&
      target.closest &&
      target.closest("a, button, input, textarea, select, label")
    );
  }

  function applyStrokeSettings() {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.25;
    ctx.strokeStyle = strokeStyle;
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = documentSize();
    var w = size.w;
    var h = size.h;
    var snapshot = null;

    if (canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext("2d").drawImage(canvas, 0, 0);
    }

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    applyStrokeSettings();

    if (snapshot) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(snapshot, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyStrokeSettings();
    }
  }

  function plotTo(x, y) {
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function strokeTo(x, y) {
    var dx = x - lastX;
    var dy = y - lastY;
    var distSq = dx * dx + dy * dy;
    if (distSq < 0.25) return;

    var dist = Math.sqrt(distSq);
    var step = 1.75;
    var steps = Math.max(1, Math.ceil(dist / step));

    for (var i = 1; i <= steps; i++) {
      var t = i / steps;
      plotTo(lastX + dx * t, lastY + dy * t);
    }

    lastX = x;
    lastY = y;
  }

  function endDraw() {
    if (!drawing) return;
    drawing = false;
    body.classList.remove("studio-drawing");
    ctx.beginPath();
  }

  document.addEventListener("mousedown", function (e) {
    if (isInteractiveTarget(e.target)) return;
    if (e.button != null && e.button !== 0) return;

    drawing = true;
    lastX = e.pageX;
    lastY = e.pageY;
    body.classList.add("studio-drawing");
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    if (e.cancelable) e.preventDefault();
  });

  document.addEventListener(
    "mousemove",
    function (e) {
      if (!drawing) return;
      strokeTo(e.pageX, e.pageY);
    },
    { passive: true }
  );

  document.addEventListener("mouseup", endDraw);
  document.addEventListener("mouseleave", endDraw);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(resizeCanvas).observe(document.body);
  }
})();
