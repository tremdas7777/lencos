// Utmify: lança o pedido no painel com a campanha que trouxe a venda.
// Dois envios por pedido, com o mesmo orderId: waiting_payment quando o pedido
// é criado e paid quando o gateway confirma (é assim que eles medem a conversão).
import config from './config.js';
import { centavos } from './catalogo.js';

// A Utmify espera "YYYY-MM-DD HH:MM:SS" em UTC.
const utc = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
// Campo ausente vai como null: com '' o painel mostra "sem campanha".
const ouNulo = (v) => (String(v ?? '').trim() === '' ? null : String(v).trim());
const digitos = (v) => String(v ?? '').replace(/\D/g, '') || null;

function corpo(pedido, status) {
  const u = pedido.utms || {};
  const total = centavos(pedido.total);
  const frete = centavos(pedido.valor_frete);
  return {
    orderId: pedido.id,
    platform: 'MummBaby',
    paymentMethod: pedido.pagamento === 'cartao' ? 'credit_card' : 'pix',
    status,
    createdAt: utc(pedido.criadoEm),
    approvedDate: status === 'paid' ? utc(pedido.pagoEm || Date.now()) : null,
    refundedAt: null,
    customer: {
      name: pedido.cliente.nome || '',
      email: pedido.cliente.email || '',
      phone: digitos(pedido.cliente.telefone),
      document: digitos(pedido.cliente.cpf),
      country: 'BR',
      ip: pedido.fb?.ip || '',
    },
    products: [{
      id: pedido.kit,
      name: pedido.nome_produto,
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: centavos(pedido.valor_produto),
    }],
    trackingParameters: {
      src: ouNulo(u.src),
      sck: ouNulo(u.sck),
      utm_source: ouNulo(u.utm_source),
      utm_campaign: ouNulo(u.utm_campaign),
      utm_medium: ouNulo(u.utm_medium),
      utm_content: ouNulo(u.utm_content),
      utm_term: ouNulo(u.utm_term),
    },
    // Frete como custo: sem isso o painel conta o frete como receita e infla o ROAS.
    commission: {
      totalPriceInCents: total,
      gatewayFeeInCents: frete,
      userCommissionInCents: Math.max(0, total - frete),
    },
    isTest: false,
  };
}

// Nunca lança: Utmify fora do ar não pode derrubar o checkout nem o webhook.
export async function enviarPedido(pedido, status) {
  const { token, apiUrl } = config.utmify;
  if (!token) return { pulado: 'sem UTMIFY_API_TOKEN' };
  try {
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-token': token },
      body: JSON.stringify(corpo(pedido, status)),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error(`[utmify] ${status} ${pedido.id}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[utmify] ${status} ${pedido.id} falhou:`, e.message);
    return { ok: false };
  }
}
