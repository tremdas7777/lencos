# Mumm Baby — página de produto + checkout

Página estilo marketplace para a oferta de lenços umedecidos Mumm Baby, com checkout em 4 etapas e rastreamento (Meta Pixel + Utmify).

## Oferta

| Kit | Preço | Por lenço | Frete |
|---|---|---|---|
| 1.000 (10 pacotes) | R$ 39,90 | 4,0 centavos | Padrão R$ 9,97 (5 dias) ou Sedex R$ 14,50 (2 dias) |
| 2.000 (20 pacotes) — **mais escolhida** | R$ 59,90 | 3,0 centavos | Grátis (7 dias), Padrão ou Sedex |
| 3.000 (30 pacotes) | R$ 72,90 | 2,4 centavos | Grátis (7 dias), Padrão ou Sedex |

Os preços ficam em `js/tracking.js` (objeto `KITS`) e os fretes em `js/checkout.js` (objeto `FRETES`).

## Estrutura

```
index.html        página do produto (galeria arrastável, kits, frete, vídeos, avaliações, FAQ, barra Comprar)
checkout.html     checkout: Kit → Dados → Entrega → Pagamento → Pedido recebido
css/style.css     estilos das duas páginas
js/tracking.js    Meta Pixel + Utmify, dados dos kits e função trackKit()
js/produto.js     galeria, troca de kit e link para o checkout (repassa as UTMs)
js/checkout.js    etapas, fretes, resumo, validação e envio do pedido para /api/pedido
img/              fotos do produto e das avaliações
video/            5 vídeos (mp4 com faststart) + capas
server.js         servidor: entrega o site e as rotas /api/evento e /api/pedido
servidor/         CAPI do Meta, Utmify, preços do servidor, pedidos e confirmarPagamento()
.env              TOKENS (só no servidor; fora do git). Modelo: .env.example
data/             pedidos.json (criado sozinho; fora da web e do git)
```

Para rodar: `npm start` (Node 20.12+) e abra `http://localhost:3020`.
Não use `npx serve`: sem o servidor, os tokens não são usados e o checkout não grava o pedido.

Em produção, cadastre as variáveis do `.env` no painel do host (Render etc.) e ajuste `APP_URL`.

## Rastreamento

Eventos do Meta Pixel já ligados:

| Evento | Quando |
|---|---|
| PageView | toda página (tracking.js) |
| ViewContent | ao abrir a página do produto |
| AddToCart | ao trocar de kit (produto e checkout) e ao aceitar o upsell |
| InitiateCheckout | ao abrir o checkout |
| AddPaymentInfo | ao chegar na etapa de pagamento |
| Purchase | **não está no front**: `confirmarPagamento()` (em `servidor/pagamento.js`) envia pelo servidor quando o gateway confirmar |

Cada evento acima sai do Pixel com um `event_id` e é repetido pelo servidor na API de Conversões
(`/api/evento`) com o mesmo id, IP, navegador e cookies `_fbp`/`_fbc`: o Meta deduplica e a
correspondência melhora. O valor dos eventos é calculado no servidor, não no navegador.

Utmify: o pedido entra como `waiting_payment` ao ser criado (`/api/pedido`) e como `paid` em
`confirmarPagamento()`, com o mesmo `orderId`.

Testando em `localhost`, o script da Utmify tenta falar com `localhost:3001` e dá erro no console:
é o comportamento deles fora de produção, no domínio real ele usa `tracking.utmify.com.br`.

As UTMs da URL são repassadas do produto para o checkout e enviadas no pedido (`utms`).

## O que falta

1. **Gateway:** em `apiPedido` (`server.js`), criar a cobrança com `GATEWAY_SECRET_KEY` e devolver `pix_qrcode` / `pix_copia_cola`.
2. **Webhook do gateway:** criar a rota, validar a assinatura com `GATEWAY_WEBHOOK_SECRET` e chamar `confirmarPagamento(pedidoId)`.
3. **Cartão:** trocar os campos de cartão de `checkout.html` pelos campos tokenizados do gateway (os dados do cartão não devem passar pelo seu servidor).
4. **Tela final do checkout:** hoje mostra "Pedido recebido" mesmo sem Pix gerado ou com erro no envio; ajustar quando o gateway estiver ligado.
5. **Dados da loja:** pelo Decreto 7.962/2013, nome, CNPJ e contato precisam aparecer em algum lugar do site (rodapé ou checkout).
6. **FAQ:** confirmar no rótulo do fornecedor a idade indicada para recém-nascidos (texto entre colchetes em `index.html`).
