/*
  Microsoft Clarity: funil de abandono do quiz.
  Cole o ID do seu projeto do Clarity abaixo (Configurações > Visão geral > ID do projeto).
  Enquanto estiver vazio, nada é carregado e nada é enviado.
*/
(function () {
  "use strict";

  var CLARITY_ID = "yzxi9dc6r0";

  // fila: os eventos ficam guardados até o Clarity terminar de carregar
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  if (CLARITY_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.clarity.ms/tag/" + CLARITY_ID;
    document.head.appendChild(s);
  }

  // dispara um evento personalizado (aparece em Funis e nos filtros do Clarity)
  window.trackEvent = function (name) {
    if (!CLARITY_ID) return;
    window.clarity("event", name);
  };

  // grava uma etiqueta na sessão (para filtrar gravações, ex.: etapa_max = 07)
  window.trackTag = function (key, value) {
    if (!CLARITY_ID) return;
    window.clarity("set", key, String(value));
  };
})();
