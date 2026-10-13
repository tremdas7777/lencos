import { brand } from "@/lib/brand";

/** Kits: 1.000, 2.000 e 3.000 lenços (pacotes de 100). */
export type BundleId = "1" | "2" | "3";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Valor mínimo (produtos + order bump, sem frete) para liberar o frete grátis.
 * Os kits de 2.000 e 3.000 já passam; o de 1.000 libera com o order bump.
 */
export const FREE_SHIPPING_MIN = 50;
export const FREE_SHIPPING_LABEL = `Frete grátis acima de ${brl(FREE_SHIPPING_MIN)}`;

export const isFreeShippingEligible = (subtotal: number) => subtotal >= FREE_SHIPPING_MIN;

/** Selo de frete por kit: grátis quando o próprio kit já passa do mínimo. */
export const bundleShippingLabel = (b: { price: number }) =>
  isFreeShippingEligible(b.price) ? "Frete grátis" : FREE_SHIPPING_LABEL;

export type Bundle = {
  id: BundleId;
  name: string;
  /** Kits no pedido (usado em relatórios e no upsell). */
  units: number;
  /** Pacotes de 100 lenços no kit. */
  packs: number;
  /** Total de lenços no kit. */
  wipes: number;
  price: number;
  compareAtPrice?: number;
  description: string;
  checkoutProductName: string;
  checkoutProductDescription: string;
  checkoutUrl: string;
  featured?: boolean;
  badge?: string;
};

const PRODUCT_SUMMARY =
  "lenços umedecidos sem álcool etílico, livres de parabenos, com aloe vera e testados dermatologicamente";

const kit = (id: BundleId, packs: number, price: number, compareAtPrice?: number): Bundle => {
  const wipes = packs * 100;
  const label = wipes.toLocaleString("pt-BR");
  return {
    id,
    name: `Kit ${label} lenços`,
    units: 1,
    packs,
    wipes,
    price,
    compareAtPrice,
    description: `${packs} pacotes de 100 lenços`,
    checkoutProductName: `${brand.productName} — ${label} lenços`,
    checkoutProductDescription: `${packs} pacotes de 100 ${PRODUCT_SUMMARY}.`,
    checkoutUrl: `/checkout?plano=${id}`,
  };
};

export const bundles: Bundle[] = [
  kit("1", 10, 39.9),
  { ...kit("2", 20, 59.9, 79.8), featured: true, badge: "Mais escolhida" },
  kit("3", 30, 72.9, 119.7),
];

/** Kits visíveis na loja. */
export const availableBundles = bundles;

/** Kit que abre selecionado na loja. */
export const DEFAULT_BUNDLE_ID: BundleId = "2";

export function parseBundleId(raw: string | undefined): BundleId | undefined {
  if (raw === "1" || raw === "2" || raw === "3") return raw;
  return undefined;
}

export function getBundle(id: string | undefined): Bundle {
  const parsed = parseBundleId(id);
  return availableBundles.find((b) => b.id === parsed) ?? availableBundles[0]!;
}

export function getCheckoutUrl(id: string | undefined) {
  return getBundle(id).checkoutUrl;
}

/** Próximo kit para upsell (1→2, 2→3) */
export function getUpgradeBundle(current: Bundle): Bundle | null {
  if (current.id === "1") return availableBundles.find((b) => b.id === "2") ?? null;
  if (current.id === "2") return availableBundles.find((b) => b.id === "3") ?? null;
  return null;
}

/** "1 kit" / "3 kits" */
export const unitsLabel = (units: number) => `${units} ${units > 1 ? "kits" : "kit"}`;

/** "10 pacotes · 1.000 lenços" */
export function bundleDurationLabel(bundle: Bundle) {
  return `${bundle.packs} pacotes · ${bundle.wipes.toLocaleString("pt-BR")} lenços`;
}

/** Preço por lenço em centavos, com 1 casa ("4,0"). */
export const centsPerWipe = (b: Bundle) =>
  ((b.price * 100) / b.wipes).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
