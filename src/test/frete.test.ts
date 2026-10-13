import { afterEach, describe, expect, it } from "vitest";
import { applyPrices, DEFAULT_PRICES } from "@/lib/prices";
import { bumpsTotal, ORDER_BUMPS } from "@/lib/order-bump";
import {
  FREE_SHIPPING_MIN,
  getBundle,
  getUpgradeBundle,
  isFreeShippingEligible,
} from "@/lib/bundles";

describe("frete grátis", () => {
  afterEach(() => applyPrices(null));

  it("só libera a partir de R$ 50 em produtos", () => {
    expect(FREE_SHIPPING_MIN).toBe(50);
    expect(isFreeShippingEligible(49.99)).toBe(false);
    expect(isFreeShippingEligible(50)).toBe(true);
  });

  it("o kit de 1.000 não ganha frete; o upgrade sugerido é o de 2.000, que ganha", () => {
    applyPrices(structuredClone(DEFAULT_PRICES));
    const entrada = getBundle("1");
    const upgrade = getUpgradeBundle(entrada)!;
    expect(isFreeShippingEligible(entrada.price)).toBe(false);
    expect(upgrade.name).toBe("Kit 2.000 lenços");
    expect(isFreeShippingEligible(upgrade.price)).toBe(true);
  });

  it("o kit de 1.000 com o order bump (+5 pacotes) libera o frete", () => {
    applyPrices(structuredClone(DEFAULT_PRICES));
    expect(isFreeShippingEligible(getBundle("1").price + bumpsTotal([ORDER_BUMPS[0]!.id]))).toBe(true);
  });
});
