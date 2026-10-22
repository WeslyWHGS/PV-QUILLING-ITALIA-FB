/*
  Funil do quiz: envia cada etapa para uma Planilha Google (ver apps-script-funil.gs).
  Cole abaixo a URL do app da Web do Apps Script (termina em /exec).
  Enquanto estiver vazio, nada é enviado.
*/
(function () {
  "use strict";

  var FUNIL_URL = "https://script.google.com/macros/s/AKfycbwRWycgrV8-PY5HR0B3uH8gZZg-aQ9oE3cInrqGM-pUlhwpJ1dwPJd8cf7YINYBp-iK-A/exec";

  // identifica a visita (a mesma aba conta como um lead, inclusive na página de 10 €)
  var sid = "";
  try {
    sid = sessionStorage.getItem("funil_sid") || "";
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem("funil_sid", sid);
    }
  } catch (e) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function param(name) {
    var m = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  window.trackEvent = function (evento) {
    if (!FUNIL_URL) return;
    var body = JSON.stringify({
      sid: sid,
      evento: evento,
      pagina: location.pathname,
      utm_source: param("utm_source"),
      utm_campaign: param("utm_campaign"),
      utm_content: param("utm_content")
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(FUNIL_URL, new Blob([body], { type: "text/plain" }))) return;
    } catch (e) {}
    try {
      fetch(FUNIL_URL, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: body });
    } catch (e) {}
  };
})();
