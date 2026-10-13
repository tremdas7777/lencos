(function () {
  var KITS = window.KITS, brl = window.brl;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- galeria ---------- */
  var track = $("track");
  var slides = track.querySelectorAll("img");
  var total = slides.length;
  var idx = 0;

  var thumbs = $("thumbs");
  slides.forEach(function (img, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Ver foto " + (i + 1));
    b.innerHTML = '<img src="' + img.getAttribute("src") + '" alt="">';
    b.addEventListener("click", function () { goTo(i); });
    thumbs.appendChild(b);
  });

  function paintGallery() {
    $("counter").textContent = (idx + 1) + "/" + total;
    $("prev").disabled = idx === 0;
    $("next").disabled = idx === total - 1;
    thumbs.querySelectorAll("button").forEach(function (b, i) {
      b.setAttribute("aria-current", i === idx ? "true" : "false");
    });
  }
  function goTo(i) {
    idx = Math.max(0, Math.min(total - 1, i));
    track.scrollTo({ left: idx * track.clientWidth });
    paintGallery();
  }
  var raf;
  track.addEventListener("scroll", function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== idx) { idx = i; paintGallery(); }
    });
  });
  $("prev").addEventListener("click", function () { goTo(idx - 1); });
  $("next").addEventListener("click", function () { goTo(idx + 1); });

  // arrastar com o mouse no desktop
  var drag = null;
  track.addEventListener("mousedown", function (e) { drag = { x: e.clientX, left: track.scrollLeft }; track.style.scrollSnapType = "none"; });
  window.addEventListener("mousemove", function (e) { if (drag) track.scrollLeft = drag.left - (e.clientX - drag.x); });
  window.addEventListener("mouseup", function () {
    if (!drag) return;
    track.style.scrollSnapType = "";
    goTo(Math.round(track.scrollLeft / track.clientWidth));
    drag = null;
  });

  /* ---------- kits ---------- */
  var kit = 2;
  var params = new URLSearchParams(location.search);
  if (KITS[params.get("kit")]) kit = Number(params.get("kit"));

  function checkoutUrl() {
    // repassa UTMs e demais parâmetros (Utmify) para o checkout
    var p = new URLSearchParams(location.search);
    p.set("kit", kit);
    return "checkout.html?" + p.toString();
  }

  function paintKit() {
    var k = KITS[kit];
    var free = kit >= 2;
    $("price").textContent = brl(k.valor);
    $("off").textContent = k.off;
    $("off").hidden = !k.antigo;
    $("old").textContent = k.antigo ? brl(k.antigo) : "";
    $("old").hidden = !k.antigo;
    $("per").textContent = "Cada lenço sai por " + k.porLenco + " centavos · R$ " + k.porPacote + " o pacote";
    $("title").textContent = "Lenços Umedecidos Mumm Baby – Kit " + k.pacotes.split(" ")[0] + " pacotes – " + k.qty + " unidades";
    $("kitPicked").textContent = k.qty + " lenços";
    $("shipTitle").textContent = free ? "Frete grátis" : "Frete a partir de R$ 9,97";
    $("shipTitle").style.color = free ? "var(--green)" : "var(--ink)";
    $("shipNote").textContent = free ? "Chega em até 7 dias úteis. Ou mais rápido por Padrão ou Sedex." : "Frete grátis a partir do kit de 2.000 lenços.";
    $("shipFree").classList.toggle("dim", !free);
    $("barSub").textContent = brl(k.valor) + (free ? " · Frete grátis" : " · " + k.qty + " lenços");
    $("buy").href = checkoutUrl();
    document.querySelectorAll(".kit").forEach(function (b) {
      b.setAttribute("aria-pressed", Number(b.dataset.kit) === kit ? "true" : "false");
    });
  }

  document.querySelectorAll(".kit").forEach(function (b) {
    b.addEventListener("click", function () {
      kit = Number(b.dataset.kit);
      paintKit();
      window.trackKit("AddToCart", kit);
    });
  });

  // InitiateCheckout dispara ao abrir o checkout (checkout.js), para não contar em dobro.

  paintGallery();
  paintKit();
  window.trackKit("ViewContent", kit);
})();
