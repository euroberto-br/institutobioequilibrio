/* Instituto BioEquilíbrio — main.js (v3)
   Acessibilidade padrão eMAG + movimento fluido.
   As preferências são aplicadas antes da pintura pelo script inline
   do <head>; aqui apenas sincronizamos os controles e os eventos. */
(function () {
  "use strict";

  var raiz = document.documentElement;

  function reduzirMovimento() {
    return (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      raiz.classList.contains("a11y-parado")
    );
  }

  /* ==================================================================
     ACESSIBILIDADE — escala de fonte (90–130%), alto contraste,
     destacar links, pausar animações e restaurar padrão
     ================================================================== */
  var ESCALAS = [90, 100, 110, 120, 130];
  var escalaEl = document.querySelector("[data-escala]");

  function escalaAtual() {
    var p = 100;
    try { p = parseInt(localStorage.getItem("bioeq-fonte-escala"), 10) || 100; } catch (e) {}
    return ESCALAS.indexOf(p) === -1 ? 100 : p;
  }

  function aplicarEscala(p) {
    if (ESCALAS.indexOf(p) === -1) p = 100;
    raiz.style.fontSize = p === 100 ? "" : p + "%";
    if (escalaEl) escalaEl.textContent = p + "%";
    try { localStorage.setItem("bioeq-fonte-escala", String(p)); } catch (e) {}
  }

  function mudarEscala(direcao) {
    var i = ESCALAS.indexOf(escalaAtual()) + direcao;
    aplicarEscala(ESCALAS[Math.max(0, Math.min(ESCALAS.length - 1, i))]);
  }

  var btnMenor = document.querySelector('[data-fonte="menor"]');
  var btnMaior = document.querySelector('[data-fonte="maior"]');
  if (btnMenor) btnMenor.addEventListener("click", function () { mudarEscala(-1); });
  if (btnMaior) btnMaior.addEventListener("click", function () { mudarEscala(1); });
  if (escalaEl) escalaEl.textContent = escalaAtual() + "%";

  /* Alto contraste — atributo no <html>, aplicado antes da pintura */
  var btnContraste = document.querySelector("[data-contraste]");
  if (btnContraste) {
    btnContraste.setAttribute("aria-pressed", String(raiz.getAttribute("data-contraste") === "alto"));
    btnContraste.addEventListener("click", function () {
      var ligado = raiz.getAttribute("data-contraste") !== "alto";
      if (ligado) raiz.setAttribute("data-contraste", "alto");
      else raiz.removeAttribute("data-contraste");
      btnContraste.setAttribute("aria-pressed", String(ligado));
      try { localStorage.setItem("bioeq-contraste", ligado ? "sim" : "nao"); } catch (e) {}
    });
  }

  /* Modos ligados/desligados por classe no <html> */
  var MODOS = [
    { seletor: "[data-links]", classe: "a11y-links", chave: "bioeq-links" },
    { seletor: "[data-animacoes]", classe: "a11y-parado", chave: "bioeq-parado" }
  ];

  MODOS.forEach(function (modo) {
    var btn = document.querySelector(modo.seletor);
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(raiz.classList.contains(modo.classe)));
    btn.addEventListener("click", function () {
      var ligado = raiz.classList.toggle(modo.classe);
      btn.setAttribute("aria-pressed", String(ligado));
      try { localStorage.setItem(modo.chave, ligado ? "1" : "0"); } catch (e) {}
    });
  });

  var btnRestaurar = document.querySelector("[data-restaurar]");
  if (btnRestaurar) {
    btnRestaurar.addEventListener("click", function () {
      aplicarEscala(100);
      raiz.removeAttribute("data-contraste");
      if (btnContraste) btnContraste.setAttribute("aria-pressed", "false");
      try { localStorage.setItem("bioeq-contraste", "nao"); } catch (e) {}
      MODOS.forEach(function (modo) {
        raiz.classList.remove(modo.classe);
        var btn = document.querySelector(modo.seletor);
        if (btn) btn.setAttribute("aria-pressed", "false");
        try { localStorage.setItem(modo.chave, "0"); } catch (e) {}
      });
    });
  }

  /* Balão flutuante: abre/fecha o painel de ferramentas de acessibilidade */
  var acessToggle = document.querySelector("[data-acess-toggle]");
  var acessPainel = document.getElementById("acessPainel");
  if (acessToggle && acessPainel) {
    var fecharPainelAcess = function () {
      acessPainel.hidden = true;
      acessToggle.setAttribute("aria-expanded", "false");
    };

    acessToggle.addEventListener("click", function () {
      var abrir = acessPainel.hidden;
      acessPainel.hidden = !abrir;
      acessToggle.setAttribute("aria-expanded", String(abrir));
      if (abrir) {
        var primeiro = acessPainel.querySelector("button");
        if (primeiro) primeiro.focus();
      }
    });

    // Esc fecha o painel e devolve o foco ao balão
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !acessPainel.hidden) {
        fecharPainelAcess();
        acessToggle.focus();
      }
    });

    // Clique fora fecha o painel
    document.addEventListener("click", function (e) {
      if (!acessPainel.hidden && !e.target.closest(".acess-flutuante")) fecharPainelAcess();
    });
  }

  /* Links externos: avisa leitores de tela sobre a nova aba.
     Em links com aria-label o texto interno é ignorado pelo leitor,
     então o aviso é anexado ao próprio aria-label. */
  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    var rotulo = link.getAttribute("aria-label");
    if (rotulo) {
      if (rotulo.indexOf("(abre em nova aba)") === -1) {
        link.setAttribute("aria-label", rotulo + " (abre em nova aba)");
      }
      return;
    }
    if (link.querySelector(".sr-only")) return;
    var aviso = document.createElement("span");
    aviso.className = "sr-only";
    aviso.textContent = " (abre em nova aba)";
    link.appendChild(aviso);
  });

  /* ==================================================================
     MENU MOBILE
     ================================================================== */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var aberto = nav.classList.toggle("aberto");
      document.body.classList.toggle("nav-aberto", aberto);
      toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
      toggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("aberto");
        document.body.classList.remove("nav-aberto");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("aberto")) {
        nav.classList.remove("aberto");
        document.body.classList.remove("nav-aberto");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ==================================================================
     BARRA DE PROGRESSO DE LEITURA + HEADER COMPACTO + PARALLAX
     (um único listener de scroll com requestAnimationFrame)
     ================================================================== */
  var progresso = document.createElement("div");
  progresso.className = "progresso-scroll";
  progresso.setAttribute("aria-hidden", "true");
  document.body.appendChild(progresso);

  var topo = document.querySelector(".topo");
  var heroLogo = document.querySelector(".hero__logo");
  var aguardandoFrame = false;

  function aoRolar() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var altura = document.documentElement.scrollHeight - window.innerHeight;
    progresso.style.width = (altura > 0 ? (y / altura) * 100 : 0) + "%";
    if (topo) topo.classList.toggle("compacto", y > 12);
    if (heroLogo && !reduzirMovimento()) {
      heroLogo.style.transform = "translateY(" + Math.min(y * 0.12, 90) + "px)";
    } else if (heroLogo) {
      heroLogo.style.transform = "";
    }
    aguardandoFrame = false;
  }

  window.addEventListener("scroll", function () {
    if (!aguardandoFrame) {
      aguardandoFrame = true;
      requestAnimationFrame(aoRolar);
    }
  }, { passive: true });
  aoRolar();

  /* ==================================================================
     TILT 3D SUTIL NOS CARDS (apenas ponteiro fino e com movimento)
     ================================================================== */
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".card, .passo, .post-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        if (reduzirMovimento()) return;
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "translateY(-8px) perspective(900px) rotateX(" + (-y * 5) + "deg) rotateY(" + (x * 5) + "deg)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ==================================================================
     REVELAÇÃO SUAVE AO ROLAR
     ================================================================== */
  var reveals = document.querySelectorAll(".reveal");

  if (!reduzirMovimento() && "IntersectionObserver" in window && reveals.length) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visivel");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visivel"); });
  }

  /* ==================================================================
     CONTADORES ANIMADOS
     ================================================================== */
  var contadores = document.querySelectorAll("[data-contador]");
  if (contadores.length) {
    var animarContador = function (el) {
      var alvo = parseInt(el.getAttribute("data-contador"), 10);
      var sufixo = el.getAttribute("data-sufixo") || "";
      var prefixo = el.getAttribute("data-prefixo") || "";
      if (reduzirMovimento()) {
        el.textContent = prefixo + alvo + sufixo;
        return;
      }
      var inicio = null;
      var duracao = 1500;
      function passo(agora) {
        if (!inicio) inicio = agora;
        var progresso = Math.min((agora - inicio) / duracao, 1);
        var suave = 1 - Math.pow(1 - progresso, 3);
        el.textContent = prefixo + Math.round(alvo * suave) + sufixo;
        if (progresso < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    };

    if ("IntersectionObserver" in window) {
      var obsNum = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animarContador(entry.target);
              obsNum.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      contadores.forEach(function (el) { obsNum.observe(el); });
    } else {
      contadores.forEach(animarContador);
    }
  }

  /* ==================================================================
     ANO ATUAL NO RODAPÉ
     ================================================================== */
  var ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = new Date().getFullYear();
})();
