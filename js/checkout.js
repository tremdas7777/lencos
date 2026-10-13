(function () {
  var KITS = window.KITS, brl = window.brl;
  var $ = function (id) { return document.getElementById(id); };

  var FRETES = {
    gratis: { nome: "Frete grátis", prazo: "Até 7 dias úteis", valor: 0 },
    padrao: { nome: "Frete Padrão", prazo: "Até 5 dias úteis", valor: 9.97 },
    sedex:  { nome: "Sedex",        prazo: "Até 2 dias úteis", valor: 14.50 }
  };

  var params = new URLSearchParams(location.search);
  var state = {
    step: 1,
    kit: KITS[params.get("kit")] ? Number(params.get("kit")) : 2,
    frete: "gratis",
    pay: "pix"
  };
  if (state.kit === 1) state.frete = "padrao";

  // mantém UTMs ao voltar para a loja
  $("back-store").href = "index.html?" + params.toString();

  function total() { return KITS[state.kit].valor + FRETES[state.frete].valor; }

  /* ---------- render ---------- */
  function renderKits() {
    var html = "";
    [1, 2, 3].forEach(function (id) {
      var k = KITS[id];
      html += '<button type="button" class="opt" data-kit="' + id + '" aria-pressed="' + (state.kit === id) + '">' +
        '<span class="radio" aria-hidden="true"></span>' +
        '<span class="grow"><strong>' + k.qty + " lenços" + (id === 2 ? '<span class="tag">Mais escolhida</span>' : "") + "</strong>" +
        "<span>" + k.pacotes + " · " + k.porLenco + " centavos por lenço</span></span>" +
        '<span style="display:flex;flex-direction:column;align-items:flex-end;gap:2px"><span class="val">' + brl(k.valor) + "</span>" +
        '<span style="font-size:13px;font-weight:700" class="' + (id >= 2 ? "free" : "") + '">' + (id >= 2 ? "Frete grátis" : "Frete a partir de R$ 9,97") + "</span></span>" +
        "</button>";
    });
    $("kitOpts").innerHTML = html;
  }

  function renderFretes() {
    var freeOk = state.kit >= 2;
    var html = "";
    Object.keys(FRETES).forEach(function (id) {
      var f = FRETES[id];
      var dis = id === "gratis" && !freeOk;
      html += '<button type="button" class="opt" data-frete="' + id + '" aria-pressed="' + (state.frete === id) + '"' + (dis ? " disabled" : "") + ">" +
        '<span class="radio" aria-hidden="true"></span>' +
        '<span class="grow"><strong>' + f.nome + "</strong><span>" + (dis ? "Disponível a partir de 2.000 lenços" : f.prazo) + "</span></span>" +
        '<span class="val ' + (f.valor === 0 ? "free" : "") + '">' + (f.valor === 0 ? "Grátis" : brl(f.valor)) + "</span>" +
        "</button>";
    });
    $("freteOpts").innerHTML = html;
  }

  function renderSummary() {
    var k = KITS[state.kit], f = FRETES[state.frete];
    $("sumName").textContent = k.nome;
    $("sumSub").textContent = k.pacotes;
    $("sumSubtotal").textContent = brl(k.valor);
    $("sumFreteName").textContent = f.nome + " · " + f.prazo.toLowerCase();
    $("sumFrete").textContent = f.valor === 0 ? "Grátis" : brl(f.valor);
    $("sumFrete").style.color = f.valor === 0 ? "var(--green)" : "var(--ink)";
    $("sumTotal").textContent = brl(total());
    $("upsell").hidden = !(state.kit === 1 && state.step < 5);
    $("payBtn").textContent = (state.pay === "pix" ? "Gerar Pix de " : "Pagar ") + brl(total());
  }

  function renderSteps() {
    document.querySelectorAll("section[data-step]").forEach(function (s) {
      s.classList.toggle("on", Number(s.dataset.step) === state.step);
    });
    document.querySelectorAll("#steps li").forEach(function (li, i) {
      var n = i + 1;
      li.classList.toggle("done", n < state.step);
      li.classList.toggle("cur", n === state.step);
      li.querySelector(".dot").textContent = n < state.step ? "✓" : String(n);
      if (n === state.step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  function renderPay() {
    document.querySelectorAll("[data-pay]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.pay === state.pay ? "true" : "false");
    });
    $("pixBox").hidden = state.pay !== "pix";
    $("cardBox").hidden = state.pay !== "cartao";
  }

  function render() { renderKits(); renderFretes(); renderSummary(); renderSteps(); renderPay(); }

  /* ---------- validação dos dados ---------- */
  var digitos = function (v) { return String(v || "").replace(/\D/g, ""); };

  // Dígitos verificadores do CPF (Receita Federal).
  function cpfValido(v) {
    var c = digitos(v);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
      if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
    }
    return true;
  }

  var DDDS = ("11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 " +
    "51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99").split(" ");
  var UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

  // CEP já consultado: { cep, ok } (ok = null enquanto a consulta não volta).
  var cepConsulta = { cep: "", ok: null };

  // Cada regra devolve a mensagem de erro, ou "" se estiver certo.
  var REGRAS = {
    nome: function (v) {
      var partes = v.split(/\s+/).filter(Boolean);
      return partes.length >= 2 && /^[A-Za-zÀ-ÿ' .-]+$/.test(v) ? "" : "Digite seu nome e sobrenome.";
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v) ? "" : "Confira o e-mail (ex.: voce@email.com).";
    },
    telefone: function (v) {
      var d = digitos(v);
      return d.length === 11 && DDDS.indexOf(d.slice(0, 2)) >= 0 && d[2] === "9"
        ? "" : "Digite o WhatsApp com DDD, ex.: (19) 99999-9999.";
    },
    cpf: function (v) { return cpfValido(v) ? "" : "CPF inválido. Confira os números."; },
    cep: function (v) {
      var d = digitos(v);
      if (d.length !== 8) return "Digite o CEP com 8 números.";
      return cepConsulta.cep === d && cepConsulta.ok === false ? "CEP não encontrado. Confira os números." : "";
    },
    numero: function (v) { return v ? "" : "Digite o número da casa (ou S/N)."; },
    uf: function (v) { return UFS.indexOf(v.toUpperCase()) >= 0 ? "" : "UF inválida (ex.: SP)."; }
  };

  function erroDoCampo(inp) {
    var v = inp.value.trim();
    if (REGRAS[inp.name]) return v === "" && !inp.required ? "" : REGRAS[inp.name](v);
    if (inp.required && v === "") return "Preencha " + inp.closest("label").firstChild.textContent.trim() + ".";
    return "";
  }

  // Mostra (ou limpa) a mensagem logo abaixo do campo.
  function marcar(inp, msg) {
    inp.setAttribute("aria-invalid", msg ? "true" : "false");
    var span = inp.parentNode.querySelector(".field-err");
    if (!span) {
      span = document.createElement("span");
      span.className = "field-err";
      span.id = "err-" + inp.name;
      inp.setAttribute("aria-describedby", span.id);
      inp.parentNode.appendChild(span);
    }
    span.textContent = msg;
    return !msg;
  }

  function validate(section) {
    var err = section.querySelector(".err");
    var ruins = [];
    section.querySelectorAll(".fields input:not([name^='cc_'])").forEach(function (inp) {
      if (!marcar(inp, erroDoCampo(inp))) ruins.push(inp);
    });
    if (ruins.length) {
      err.textContent = ruins.length === 1
        ? erroDoCampo(ruins[0])
        : "Confira os " + ruins.length + " campos marcados em vermelho.";
      ruins[0].focus();
      return false;
    }
    if (err) err.textContent = "";
    return true;
  }

  /* ---------- máscaras ---------- */
  var MASCARAS = {
    cpf: function (v) {
      return digitos(v).slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    },
    telefone: function (v) {
      var d = digitos(v).slice(0, 11);
      if (d.length <= 2) return d;
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + (d.length > 7 ? "-" + d.slice(7) : "");
    },
    cep: function (v) {
      var d = digitos(v).slice(0, 8);
      return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
    },
    uf: function (v) { return v.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2); }
  };

  /* ---------- CEP -> endereço (ViaCEP) ---------- */
  var campo = function (nome) { return document.querySelector("input[name='" + nome + "']"); };

  function buscarCep(d) {
    if (cepConsulta.cep === d) return;
    cepConsulta = { cep: d, ok: null };
    var cepInp = campo("cep");
    cepInp.parentNode.classList.add("buscando");
    fetch("https://viacep.com.br/ws/" + d + "/json/")
      .then(function (r) { return r.json(); })
      .then(function (e) {
        if (cepConsulta.cep !== d) return; // a pessoa já trocou o CEP
        cepConsulta.ok = !e.erro;
        if (e.erro) { marcar(cepInp, REGRAS.cep(cepInp.value)); return; }
        marcar(cepInp, "");
        var dados = { endereco: e.logradouro, bairro: e.bairro, cidade: e.localidade, uf: e.uf };
        Object.keys(dados).forEach(function (k) {
          if (dados[k]) { campo(k).value = dados[k]; marcar(campo(k), ""); }
        });
        // CEP de rua: falta só o número. CEP geral da cidade: falta a rua também.
        (e.logradouro ? campo("numero") : campo("endereco")).focus();
      })
      .catch(function () {
        // ViaCEP fora do ar: não trava a compra, a pessoa digita o endereço.
        if (cepConsulta.cep === d) cepConsulta.ok = true;
      })
      .then(function () { cepInp.parentNode.classList.remove("buscando"); });
  }

  document.addEventListener("input", function (e) {
    var inp = e.target;
    if (MASCARAS[inp.name]) inp.value = MASCARAS[inp.name](inp.value);
    if (inp.name === "cep" && digitos(inp.value).length === 8) buscarCep(digitos(inp.value));
    // Já estava vermelho: limpa assim que ficar certo.
    if (inp.getAttribute("aria-invalid") === "true" && !erroDoCampo(inp)) marcar(inp, "");
  });

  // Ao sair do campo, já avisa se está errado (sem reclamar de campo vazio).
  document.addEventListener("focusout", function (e) {
    var inp = e.target;
    if (inp.tagName === "INPUT" && inp.closest(".fields") && inp.value.trim() && !/^cc_/.test(inp.name)) {
      marcar(inp, erroDoCampo(inp));
    }
  });

  function go(step) {
    state.step = step;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (step === 4) window.trackKit("AddPaymentInfo", state.kit, { value: total() });
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.kit) {
      state.kit = Number(t.dataset.kit);
      if (state.kit === 1 && state.frete === "gratis") state.frete = "padrao";
      if (state.kit >= 2 && state.frete === "padrao") state.frete = "gratis";
      render();
      window.trackKit("AddToCart", state.kit);
    } else if (t.dataset.frete && !t.disabled) {
      state.frete = t.dataset.frete; render();
    } else if (t.dataset.pay) {
      state.pay = t.dataset.pay; render();
    } else if (t.hasAttribute("data-next")) {
      var sec = t.closest("section");
      if (validate(sec)) go(state.step + 1);
    } else if (t.hasAttribute("data-back")) {
      go(state.step - 1);
    } else if (t.id === "upsell") {
      state.kit = 2; state.frete = "gratis"; render();
      window.trackKit("AddToCart", 2);
    } else if (t.id === "payBtn") {
      finalizar(t);
    }
  });

  /* ---------- pagamento ---------- */
  function coletarPedido() {
    var data = {};
    document.querySelectorAll("section[data-step='2'] input, section[data-step='3'] input").forEach(function (i) {
      data[i.name] = i.value.trim();
    });
    return {
      kit: KITS[state.kit].id,
      quantidade: KITS[state.kit].qty,
      valor_produto: KITS[state.kit].valor,
      frete: state.frete,
      valor_frete: FRETES[state.frete].valor,
      total: Number(total().toFixed(2)),
      pagamento: state.pay,
      cliente: data,
      utms: Object.fromEntries(params.entries())
    };
  }

  function finalizar(btn) {
    var sec = btn.closest("section");
    if (state.pay === "cartao" && !validateCard(sec)) return;
    btn.disabled = true;
    btn.textContent = "Processando…";

    /*
     * TODO (Claude Code): criar o endpoint /api/pedido no servidor.
     * Ele recebe este JSON, cria a cobrança no gateway (Pix ou cartão)
     * usando as chaves do .env e devolve { ok, pix_qrcode, pix_copia_cola }.
     * O Purchase é enviado pelo servidor/Utmify quando o gateway confirmar
     * o pagamento (webhook), nunca daqui.
     */
    fetch("/api/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coletarPedido())
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .catch(function () { return {}; })
      .then(function (res) {
        res = res || {};
        if (res.ok === false && res.erro) {
          sec.querySelector(".err").textContent = res.erro;
          btn.disabled = false;
          renderSummary();
          return;
        }
        concluir(res);
      });
  }

  function validateCard(sec) {
    var bad = null;
    sec.querySelectorAll("#cardBox input").forEach(function (i) {
      var ok = i.value.trim() !== "";
      i.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !bad) bad = i;
    });
    if (bad) { sec.querySelector(".err").textContent = "Preencha os dados do cartão para continuar."; bad.focus(); }
    return !bad;
  }

  function concluir(res) {
    $("doneText").textContent = state.pay === "pix"
      ? "Pague o Pix abaixo para confirmar. Assim que cair, você recebe o rastreio por e-mail e WhatsApp."
      : "Pagamento em análise. Você recebe a confirmação e o rastreio por e-mail e WhatsApp.";
    var qr = $("qr");
    qr.hidden = state.pay !== "pix";
    if (res.pix_qrcode) qr.innerHTML = '<img src="' + res.pix_qrcode + '" alt="QR Code Pix" style="width:100%;height:100%">';
    go(5);
  }

  render();
  window.trackKit("InitiateCheckout", state.kit);
})();
