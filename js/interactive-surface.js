(function () {
  var body = document.body;
  var enabled =
    body.classList.contains("studio-home") || body.classList.contains("artblock");
  var drawEnabled = enabled && !body.classList.contains("legal-doc");
  if (!enabled) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  var strokeStyle =
    body.getAttribute("data-draw-stroke") ||
    (body.classList.contains("studio-home")
      ? "rgba(255, 255, 255, 0.88)"
      : "rgba(26, 28, 30, 0.48)");

  var cursor = {
    active: false,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    dotX: window.innerWidth / 2,
    dotY: window.innerHeight / 2,
    lerp: 0.18,
  };

  var draw = {
    drawing: false,
    useLazyCursor: false,
    onStroke: null,
  };

  function scrollX() {
    return window.scrollX || document.documentElement.scrollLeft || 0;
  }

  function scrollY() {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  function pagePoint(clientX, clientY) {
    return { x: clientX + scrollX(), y: clientY + scrollY() };
  }

  function initCursorLoop() {
    var dot = document.querySelector(".studio-cursor-dot");

    if (!reducedMotion && !coarsePointer && dot) {
      body.classList.add("studio-cursor-active");
      cursor.active = true;

      document.addEventListener(
        "mousemove",
        function (e) {
          body.classList.add("studio-cursor-on");
          cursor.targetX = e.clientX;
          cursor.targetY = e.clientY;
        },
        { passive: true }
      );
    }

    function tick() {
      cursor.dotX += (cursor.targetX - cursor.dotX) * cursor.lerp;
      cursor.dotY += (cursor.targetY - cursor.dotY) * cursor.lerp;

      if (dot && cursor.active) {
        dot.style.transform =
          "translate3d(" + cursor.dotX + "px, " + cursor.dotY + "px, 0)";
      }

      if (draw.drawing && draw.useLazyCursor && draw.onStroke) {
        var page = pagePoint(cursor.dotX, cursor.dotY);
        draw.onStroke(page.x, page.y);
      }

      requestAnimationFrame(tick);
    }
    tick();
  }

  function initDrawCanvas() {
    var canvas = document.querySelector(".studio-draw-canvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.25;
      ctx.strokeStyle = strokeStyle;

      if (snapshot) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(snapshot, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.25;
        ctx.strokeStyle = strokeStyle;
      }
    }

    function touchPos(e) {
      if (!e.touches || !e.touches[0]) return null;
      return { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }

    function plotTo(x, y) {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    function startDraw(x, y, useLazyCursor) {
      draw.drawing = true;
      draw.useLazyCursor = useLazyCursor;
      lastX = x;
      lastY = y;
      body.classList.add("studio-drawing");
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

    draw.onStroke = strokeTo;

    function endDraw() {
      if (!draw.drawing) return;
      draw.drawing = false;
      draw.useLazyCursor = false;
      body.classList.remove("studio-drawing");
      ctx.beginPath();
    }

    function onMouseDown(e) {
      if (isInteractiveTarget(e.target)) return;
      if (e.button != null && e.button !== 0) return;

      var pt = cursor.active
        ? pagePoint(cursor.dotX, cursor.dotY)
        : { x: e.pageX, y: e.pageY };
      startDraw(pt.x, pt.y, cursor.active);
      if (e.cancelable) e.preventDefault();
    }

    function onTouchStart(e) {
      if (isInteractiveTarget(e.target)) return;
      var pos = touchPos(e);
      if (!pos) return;
      startDraw(pos.x, pos.y, false);
      if (e.cancelable) e.preventDefault();
    }

    function onTouchMove(e) {
      if (!draw.drawing || draw.useLazyCursor) return;
      var pos = touchPos(e);
      if (!pos) return;
      strokeTo(pos.x, pos.y);
      if (e.cancelable) e.preventDefault();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(resizeCanvas).observe(document.body);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", endDraw);
    document.addEventListener("mouseleave", endDraw);

    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", endDraw);
    document.addEventListener("touchcancel", endDraw);
  }

  if (drawEnabled) initDrawCanvas();
  initCursorLoop();
})();
