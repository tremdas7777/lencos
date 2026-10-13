// Preços do lado do servidor: quem cobra e quem informa o valor ao Meta/Utmify.
// Precisam bater com KITS em js/tracking.js e FRETES em js/checkout.js.
export const KITS = {
  'mumm-1000': { nome: 'Mumm Baby 1.000 lenços', valor: 39.90, freteGratis: false },
  'mumm-2000': { nome: 'Mumm Baby 2.000 lenços', valor: 59.90, freteGratis: true },
  'mumm-3000': { nome: 'Mumm Baby 3.000 lenços', valor: 72.90, freteGratis: true },
};

// O front identifica o kit por número (1, 2, 3).
export const KIT_POR_NUMERO = { 1: 'mumm-1000', 2: 'mumm-2000', 3: 'mumm-3000' };

export const FRETES = {
  gratis: { nome: 'Frete grátis', valor: 0 },
  padrao: { nome: 'Frete Padrão', valor: 9.97 },
  sedex: { nome: 'Sedex', valor: 14.50 },
};

export const centavos = (v) => Math.round(v * 100);
