
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
    id: "portalenco",
    name: "+ porta-lenço",
    fullName: "Porta-lenço Mumm Baby (estojo com tampa)",
    gatewayName: "Pedido Mumm Baby",
    price: 14.9,
    compareAt: 24.9,
    img: "/img/porta-lenco.svg",
    question: "Leve um porta-lenço para a bolsa do bebê.",
    body: "Pacote aberto na bolsa resseca e amassa. No estojo, os lenços ficam úmidos e protegidos, e saem um de cada vez com uma mão só, na hora da troca. Leve agora, no mesmo envio, com o desconto desta tela.",
    benefits: [
      "Mantém os lenços úmidos por mais tempo",
      "Tampa que abre com uma mão só",
      "Cabe na bolsa, sem frete extra",
    ],
    cta: "Sim! Quero o porta-lenço por + {preco}",
  },
];

/** Bumps escolhidos, na ordem do checkout (ids repetidos ou desconhecidos são ignorados). */
export const getBumps = (ids: readonly string[]) => ORDER_BUMPS.filter((b) => ids.includes(b.id));

/** Soma dos bumps escolhidos, em reais. */
export const bumpsTotal = (ids: readonly string[]) =>
  Math.round(getBumps(ids).reduce((s, b) => s + b.price * 100, 0)) / 100;
