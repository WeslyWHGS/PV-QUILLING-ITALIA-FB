(function () {
  "use strict";

  // ALTERE O LINK PARA A PÁGINA QUE QUISER MOSTRAR QUANDO O USUÁRIO TENTAR SAIR
  // (deixe vazio "" para desativar)
  var BACK_REDIRECT_LINK = "offerta.html";

  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var progress = document.getElementById("progress");
  var progressFill = document.getElementById("progressFill");
  var current = 0;
  var answers = {};

  /* ---------- Navegação entre etapas ---------- */

  function showStep(index) {
    if (index < 0 || index >= steps.length) return;
    var prev = steps[current];
    var next = steps[index];
    current = index;

    prev.classList.remove("visible");
    setTimeout(function () {
      prev.classList.remove("active");
      next.classList.add("active");
      window.scrollTo(0, 0);
      updateProgress();
      // força o reflow para o fade-in acontecer
      void next.offsetWidth;
      next.classList.add("visible");
      onEnter(next);
    }, prev === next ? 0 : 200);
  }

  function nextStep() {
    showStep(current + 1);
  }

  function updateProgress() {
    // a barra não aparece na capa nem na oferta
    var hide = current === 0 || current === steps.length - 1;
    progress.hidden = hide;
    progressFill.style.width = ((current + 1) / steps.length) * 100 + "%";
  }

  function onEnter(step) {
    initSliders(step);
    if (step.hasAttribute("data-loading")) startLoading(step);
    if (step.querySelector("#fixedCta")) watchFixedCta();
    // o back redirect só é ativado quando a pessoa chega na oferta (última etapa)
    if (step === steps[steps.length - 1] && BACK_REDIRECT_LINK) setBackRedirect(BACK_REDIRECT_LINK);
  }

  /* ---------- Botões "continuar" ---------- */

  document.querySelectorAll("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var required = btn.getAttribute("data-requires");
      if (required && !(answers[required] && answers[required].length)) return;
      nextStep();
    });
  });

  /* ---------- Opções ---------- */

  document.querySelectorAll(".options").forEach(function (group) {
    var name = group.getAttribute("data-name");
    var multiple = group.hasAttribute("data-multiple");
    var locked = false;

    group.querySelectorAll(".option").forEach(function (option) {
      option.addEventListener("click", function () {
        var label = option.querySelector(".option-label").textContent.trim();

        if (multiple) {
          option.classList.toggle("active");
          answers[name] = Array.prototype.map.call(group.querySelectorAll(".option.active .option-label"), function (el) {
            return el.textContent.trim();
          });
          return;
        }

        if (locked) return;
        locked = true;
        group.querySelectorAll(".option.active").forEach(function (el) { el.classList.remove("active"); });
        option.classList.add("active");
        answers[name] = [label];
        setTimeout(function () {
          locked = false;
          nextStep();
        }, 300);
      });
    });
  });

  /* ---------- Etapa de carregamento ---------- */

  function startLoading(step) {
    var seconds = parseFloat(step.getAttribute("data-loading")) || 7;
    var fill = document.getElementById("loadingFill");
    var percent = document.getElementById("loadingPercent");
    var start = null;

    function tick(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / (seconds * 1000), 1);
      var value = Math.round(p * 100);
      fill.style.width = value + "%";
      percent.textContent = value + "%";
      if (p < 1) requestAnimationFrame(tick);
      else nextStep();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Sliders (depoimentos e carrossel) ---------- */

  function initSliders(scope) {
    scope.querySelectorAll("[data-slider]").forEach(function (el) {
      if (!el._slider) el._slider = createSlider(el);
    });
  }

  function createSlider(root) {
    var track = root.querySelector(".slider-track");
    var viewport = root.querySelector(".slider-viewport") || root;
    var originals = Array.prototype.slice.call(track.children);
    var count = originals.length;
    var autoplay = parseInt(root.getAttribute("data-autoplay"), 10) || 3000;
    var dotsTrack = root.querySelector(".slider-dots-track");
    var index = count; // primeiro slide real (depois dos clones)
    var timer = null;
    var dots = [];

    // clones antes e depois para o loop infinito
    originals.forEach(function (slide) { track.appendChild(slide.cloneNode(true)); });
    originals.slice().reverse().forEach(function (slide) { track.insertBefore(slide.cloneNode(true), track.firstChild); });

    if (dotsTrack) {
      for (var i = 0; i < count; i++) {
        var dot = document.createElement("span");
        dotsTrack.appendChild(dot);
        dots.push(dot);
      }
    }

    function stepSize() {
      var slide = track.children[0];
      return slide.getBoundingClientRect().width + 8;
    }

    function offsetFor(i) {
      var slideWidth = stepSize() - 8;
      return (viewport.clientWidth - slideWidth) / 2 - i * stepSize();
    }

    function place(animate, extra) {
      track.style.transition = animate ? "transform .3s ease" : "none";
      track.style.transform = "translate3d(" + (offsetFor(index) + (extra || 0)) + "px,0,0)";
      updateDots();
    }

    function updateDots() {
      if (!dots.length) return;
      var real = ((index % count) + count) % count;
      dots.forEach(function (dot, i) {
        var d = Math.abs(i - real);
        dot.className = d === 0 ? "on" : d === 1 ? "near" : d === 2 ? "far" : "";
      });
      // mantém o ponto ativo no centro da janela de 80px
      dotsTrack.style.transform = "translateX(" + (32 - real * 16) + "px)";
    }

    function go(delta) {
      index += delta;
      place(true);
    }

    track.addEventListener("transitionend", function (e) {
      if (e.target !== track) return;
      if (index >= count * 2) { index -= count; place(false); }
      else if (index < count) { index += count; place(false); }
    });

    function play() {
      stop();
      timer = setInterval(function () {
        if (root.offsetParent !== null) go(1);
      }, autoplay);
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    // arrastar
    var startX = 0, startY = 0, dx = 0, dragging = false, decided = false, horizontal = false;

    root.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true; decided = false; horizontal = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
      stop();
    });

    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!decided && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        decided = true;
        horizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (horizontal) place(false, dx);
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      if (horizontal && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      else place(true);
      play();
    }

    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("resize", function () { place(false); });

    place(false);
    play();
    return { go: go };
  }

  /* ---------- FAQ ---------- */

  document.querySelectorAll(".faq-question").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.parentElement;
      var wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item.open").forEach(function (el) { el.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------- Botão fixo da oferta ---------- */

  function watchFixedCta() {
    var cta = document.getElementById("fixedCta");
    var price = document.getElementById("price");
    if (!cta || !price || cta._watching) return;
    cta._watching = true;

    if (!("IntersectionObserver" in window)) { cta.hidden = false; return; }
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        cta.hidden = false;
        observer.disconnect();
      }
    });
    observer.observe(price);
  }

  // repassa os parâmetros da URL (UTMs) para o checkout
  var checkout = document.getElementById("checkoutLink");
  if (checkout) {
    checkout.addEventListener("click", function () {
      var query = window.location.search.replace("?", "");
      if (query && checkout.href.indexOf("utm_") === -1 && checkout.href.indexOf(query) === -1) {
        checkout.href += (checkout.href.indexOf("?") > -1 ? "&" : "?") + query;
      }
    });
  }

  /* ---------- Back redirect ---------- */

  var backRedirectSet = false;

  function setBackRedirect(url) {
    if (backRedirectSet) return;
    backRedirectSet = true;

    var target = url.trim() + (url.indexOf("?") > 0 ? "&" : "?") + document.location.search.replace("?", "").toString();

    history.pushState({}, "", location.href);
    history.pushState({}, "", location.href);
    history.pushState({}, "", location.href);

    window.addEventListener("popstate", function () {
      setTimeout(function () {
        location.href = target;
      }, 1);
    });
  }

  /* ---------- Início ---------- */

  updateProgress();
  steps[0].classList.add("visible");
  onEnter(steps[0]);
})();
