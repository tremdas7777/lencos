// Chamar quando o gateway confirmar o pagamento (no webhook dele, depois de
// validar a assinatura com GATEWAY_WEBHOOK_SECRET). Envia o Purchase com o
// valor real do pedido para o Meta (CAPI) e marca como pago na Utmify.
import { buscarPedido, salvarPedido } from './pedidos.js';
import { enviarEvento } from './capi.js';
import { enviarPedido } from './utmify.js';
import config from './config.js';

export async function confirmarPagamento(pedidoId) {
  const pedido = buscarPedido(pedidoId);
  if (!pedido) return { ok: false, erro: 'pedido não encontrado' };
  if (pedido.status === 'pago') return { ok: true, repetido: true }; // webhook repetido

  pedido.status = 'pago';
  pedido.pagoEm = Date.now();
  salvarPedido(pedido);

  await Promise.all([
    enviarEvento({
      nome: 'Purchase',
      eventId: pedido.id,
      tempo: pedido.pagoEm,
      url: `${config.appUrl}/checkout.html`,
      cliente: pedido.cliente,
      ...pedido.fb,
      customData: {
        currency: 'BRL',
        value: pedido.total,
        content_type: 'product',
        content_ids: [pedido.kit],
        content_name: pedido.nome_produto,
        num_items: 1,
        order_id: pedido.id,
      },
    }),
    enviarPedido(pedido, 'paid'),
  ]);
  return { ok: true };
}
