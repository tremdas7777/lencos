// Servidor da página Mumm Baby: entrega o site e guarda os segredos (.env).
// Rotas:
//   GET  /, /checkout.html, /css, /js, /img, /video  -> arquivos do site
//   POST /api/evento  -> repete no Meta (CAPI) o evento que o Pixel disparou
//   POST /api/pedido  -> registra o pedido e avisa a Utmify (aguardando pagamento)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import config, { RAIZ } from './servidor/config.js';
import { KITS, KIT_POR_NUMERO, FRETES } from './servidor/catalogo.js';
import { enviarEvento } from './servidor/capi.js';
import { enviarPedido } from './servidor/utmify.js';
import { salvarPedido } from './servidor/pedidos.js';
import { erroCliente } from './servidor/validacao.js';

/* ---------- arquivos do site ---------- */
// Só isto é público. .env, servidor/ e data/ nunca são entregues.
const PUBLICO = new Set(['index.html', 'checkout.html']);
const PASTAS_PUBLICAS = ['css/', 'js/', 'img/', 'video/'];
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
};

function servirArquivo(req, res, caminhoUrl) {
  let rel;
  try {
    rel = decodeURIComponent(caminhoUrl).replace(/^\/+/, '') || 'index.html';
  } catch {
    return responder(res, 400, 'Requisição inválida');
  }
  rel = path.posix.normalize(rel);
  const permitido = PUBLICO.has(rel) || PASTAS_PUBLICAS.some((p) => rel.startsWith(p));
  if (!permitido || rel.includes('..')) return responder(res, 404, 'Não encontrado');

  const arquivo = path.join(RAIZ, rel);
  fs.stat(arquivo, (err, st) => {
    if (err || !st.isFile()) return responder(res, 404, 'Não encontrado');
    const tipo = TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream';
    // HTML, CSS e JS: o navegador sempre confere se mudou (304 se não mudou),
    // senão quem já visitou fica com o checkout antigo depois de uma atualização.
    const codigo = /^text\/(html|css|javascript)/.test(tipo);
    const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const cabecalhos = {
      'content-type': tipo,
      'accept-ranges': 'bytes',
      etag,
      'cache-control': codigo ? 'no-cache' : 'public, max-age=86400',
    };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, cabecalhos);
      return res.end();
    }

    // Vídeo no iPhone exige resposta parcial (Range).
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      let inicio = range[1] === '' ? st.size - Number(range[2]) : Number(range[1]);
      let fim = range[1] !== '' && range[2] !== '' ? Number(range[2]) : st.size - 1;
      fim = Math.min(fim, st.size - 1);
      if (inicio < 0 || inicio > fim) {
        res.writeHead(416, { 'content-range': `bytes */${st.size}` });
        return res.end();
      }
      res.writeHead(206, { ...cabecalhos, 'content-range': `bytes ${inicio}-${fim}/${st.size}`, 'content-length': fim - inicio + 1 });
      return fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
    }
    res.writeHead(200, { ...cabecalhos, 'content-length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(arquivo).pipe(res);
  });
}

/* ---------- utilitários ---------- */
function responder(res, status, corpo) {
  const json = typeof corpo !== 'string';
  res.writeHead(status, { 'content-type': json ? 'application/json' : 'text/plain; charset=utf-8' });
  res.end(json ? JSON.stringify(corpo) : corpo);
}

function lerJson(req, limite = 20_000) {
  return new Promise((ok, falha) => {
    let tam = 0;
    const partes = [];
    req.on('data', (c) => {
      tam += c.length;
      if (tam > limite) { falha(new Error('grande demais')); req.destroy(); } else partes.push(c);
    });
    req.on('end', () => {
      try { ok(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}')); } catch (e) { falha(e); }
    });
    req.on('error', falha);
  });
}

function cookies(req) {
  const out = {};
  for (const par of (req.headers.cookie || '').split(';')) {
    const i = par.indexOf('=');
    if (i > 0) out[par.slice(0, i).trim()] = decodeURIComponent(par.slice(i + 1).trim());
  }
  return out;
}

// IP, navegador e cookies do Meta: melhoram a correspondência do evento.
function dadosNavegador(req, urlPagina) {
  const c = cookies(req);
  let fbc = c._fbc;
  if (!fbc && urlPagina) {
    try {
      const fbclid = new URL(urlPagina).searchParams.get('fbclid');
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch { /* url inválida: ignora */ }
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  return { ip, ua: req.headers['user-agent'] || '', fbp: c._fbp, fbc };
}

const texto = (v, max = 200) => String(v ?? '').trim().slice(0, max);

/* ---------- /api/evento ---------- */
// O Purchase NÃO entra aqui: só o servidor o envia, quando o gateway confirma.
const EVENTOS_DO_NAVEGADOR = new Set(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo']);

async function apiEvento(req, res) {
  const b = await lerJson(req);
  const nome = texto(b.event_name, 40);
  const eventId = texto(b.event_id, 80);
  if (!EVENTOS_DO_NAVEGADOR.has(nome) || !eventId) return responder(res, 400, { ok: false });

  // Valor calculado aqui, a partir do kit; o navegador não define preço.
  let customData;
  const kitId = KIT_POR_NUMERO[b.kit];
  if (kitId) {
    const k = KITS[kitId];
    let valor = k.valor;
    const comFrete = Object.values(FRETES).map((f) => Number((k.valor + f.valor).toFixed(2)));
    if (nome === 'AddPaymentInfo' && comFrete.includes(Number(b.value))) valor = Number(b.value);
    customData = { content_ids: [kitId], content_name: k.nome, content_type: 'product', value: valor, currency: 'BRL' };
  }

  const url = texto(b.url, 1000);
  enviarEvento({ nome, eventId, url, customData, ...dadosNavegador(req, url) });
  responder(res, 202, { ok: true });
}

/* ---------- /api/pedido ---------- */
const CAMPOS_CLIENTE = ['nome', 'email', 'telefone', 'cpf', 'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];
const CAMPOS_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid'];

async function apiPedido(req, res) {
  const b = await lerJson(req);
  const kit = KITS[b.kit];
  const frete = FRETES[b.frete];
  if (!kit || !frete) return responder(res, 400, { ok: false, erro: 'kit ou frete inválido' });
  if (b.frete === 'gratis' && !kit.freteGratis) return responder(res, 400, { ok: false, erro: 'frete grátis indisponível para este kit' });

  // Só os campos esperados; dados de cartão nunca são guardados.
  const cliente = {};
  for (const c of CAMPOS_CLIENTE) cliente[c] = texto(b.cliente?.[c]);
  const erro = erroCliente(cliente);
  if (erro) return responder(res, 400, { ok: false, erro });
  const utms = {};
  for (const c of CAMPOS_UTM) if (b.utms?.[c]) utms[c] = texto(b.utms[c], 500);

  const pedido = {
    id: 'MB' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase(),
    status: 'aguardando_pagamento',
    criadoEm: Date.now(),
    kit: b.kit,
    nome_produto: kit.nome,
    valor_produto: kit.valor,
    frete: b.frete,
    valor_frete: frete.valor,
    total: Number((kit.valor + frete.valor).toFixed(2)),
    pagamento: b.pagamento === 'cartao' ? 'cartao' : 'pix',
    cliente,
    utms,
    fb: dadosNavegador(req, req.headers.referer),
  };
  salvarPedido(pedido);
  enviarPedido(pedido, 'waiting_payment');

  // TODO gateway: criar a cobrança aqui com GATEWAY_SECRET_KEY e devolver o Pix.
  responder(res, 200, { ok: true, pedido_id: pedido.id, total: pedido.total, pix_qrcode: null, pix_copia_cola: null });
}

/* ---------- servidor ---------- */
const ROTAS = { '/api/evento': apiEvento, '/api/pedido': apiPedido };

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  const rota = ROTAS[pathname];
  if (rota) {
    if (req.method !== 'POST') return responder(res, 405, { ok: false });
    try {
      await rota(req, res);
    } catch (e) {
      console.error(`[${pathname}]`, e.message);
      if (!res.headersSent) responder(res, 400, { ok: false });
    }
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, 'Método não permitido');
  servirArquivo(req, res, pathname);
}).listen(config.porta, () => {
  console.log(`Mumm Baby em http://localhost:${config.porta}`);
  if (!config.meta.token) console.warn('Aviso: META_CAPI_ACCESS_TOKEN vazio — eventos só pelo Pixel.');
  if (!config.utmify.token) console.warn('Aviso: UTMIFY_API_TOKEN vazio — pedidos não vão para a Utmify.');
});
