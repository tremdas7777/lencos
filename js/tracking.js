/*
 * Rastreamento: Meta Pixel + Utmify.
 * Os IDs abaixo são públicos (aparecem no navegador de qualquer visitante).
 * Tokens (API de Conversões, Utmify API) NUNCA entram aqui: ficam no .env do servidor.
 * Cada evento sai com um event_id e é repetido pelo servidor (/api/evento) na
 * API de Conversões; com o mesmo id, o Meta junta os dois e conta uma vez só.
 */
/* Dispara no Pixel e manda o mesmo evento (mesmo event_id) para o servidor. */
window.trackEvento = function (evento, data, kit) {
  var id = window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  if (typeof fbq === "function") fbq("track", evento, data || {}, { eventID: id });
  try {
    fetch("/api/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: evento,
        event_id: id,
        url: location.href,
        kit: kit,
        value: data && data.value
      }),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
};

(function () {
  var META_PIXEL_ID = "2213639929564048";
  var UTMIFY_PIXEL_ID = "6ace4ed4f94f278cc3eb8329";

  // Utmify
  window.pixelId = UTMIFY_PIXEL_ID;
  var u = document.createElement("script");
  u.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
  u.async = true;
  u.defer = true;
  document.head.appendChild(u);

  // Meta Pixel
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", META_PIXEL_ID);
  window.trackEvento("PageView");
})();

window.KITS = {
  1: { id: "mumm-1000", qty: "1.000", nome: "Mumm Baby 1.000 lenços", pacotes: "10 pacotes de 100", valor: 39.90, antigo: 0, off: "", porLenco: "4,0", porPacote: "3,99" },
  2: { id: "mumm-2000", qty: "2.000", nome: "Mumm Baby 2.000 lenços", pacotes: "20 pacotes de 100", valor: 59.90, antigo: 79.80, off: "-25%", porLenco: "3,0", porPacote: "3,00" },
  3: { id: "mumm-3000", qty: "3.000", nome: "Mumm Baby 3.000 lenços", pacotes: "30 pacotes de 100", valor: 72.90, antigo: 119.70, off: "-39%", porLenco: "2,4", porPacote: "2,43" }
};

window.brl = function (v) {
  return "R$ " + v.toFixed(2).replace(".", ",");
};

/* Dispara um evento do Meta Pixel com os dados do kit. */
window.trackKit = function (evento, kit, extra) {
  var k = window.KITS[kit];
  if (!k) return;
  var data = {
    content_ids: [k.id],
    content_name: k.nome,
    content_type: "product",
    value: k.valor,
    currency: "BRL"
  };
  if (extra) for (var key in extra) data[key] = extra[key];
  window.trackEvento(evento, data, kit);
};
