
/**
 * Order bumps do checkout (ofertas logo acima do botão de finalizar).
 * Preços usados no servidor — o cliente só exibe. Lista vazia = checkout sem bump.
 */
export type OrderBumpItem = {
  id: string;
  name: string;
  fullName: string;
  /** Nome enviado ao gateway (fatura). */
  gatewayName: string;
  price: number;
  /** Preço "de" (riscado). Sem ele, a oferta mostra só o preço. */
  compareAt?: number;
  img: string;
  /** Texto de venda exibido no checkout. */
  question: string;
  body: string;
  benefits: string[];
  /** Texto do checkbox; `{preco}` vira o preço formatado. */
  cta: string;
};

export type BumpId = OrderBumpItem["id"];

export const ORDER_BUMPS: readonly OrderBumpItem[] = [
  {
    id: "pacotes5",
    name: "+5 pacotes",
    fullName: "+5 pacotes Mumm Baby (500 lenços)",
    gatewayName: "Pedido Mumm Baby",
    price: 17.9,
    compareAt: 24.9,
    img: "/img/10-pacotes.jpg",
    question: "Leve mais 5 pacotes com desconto.",
    body: "Lenço umedecido acaba rápido: troca de fralda, mãozinha, rosto, passeio. Leve mais 500 lenços agora, no mesmo envio, com o desconto que só aparece nesta tela.",
    benefits: [
      "Mais 500 lenços (5 pacotes de 100)",
      "Mesmo envio do kit, sem frete extra",
      "Cada pacote com tampa, não resseca",
    ],
    cta: "Sim! Quero +5 pacotes por + {preco}",
  },
];

/** Bumps escolhidos, na ordem do checkout (ids repetidos ou desconhecidos são ignorados). */
export const getBumps = (ids: readonly string[]) => ORDER_BUMPS.filter((b) => ids.includes(b.id));

/** Soma dos bumps escolhidos, em reais. */
export const bumpsTotal = (ids: readonly string[]) =>
  Math.round(getBumps(ids).reduce((s, b) => s + b.price * 100, 0)) / 100;
