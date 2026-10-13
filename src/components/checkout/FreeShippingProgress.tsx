import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import {
  FREE_SHIPPING_MIN,
  getUpgradeBundle,
  isFreeShippingEligible,
  type Bundle,
} from "@/lib/bundles";
import { cn } from "@/lib/utils";
import { brl } from "./parts";

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Frete grátis a partir de FREE_SHIPPING_MIN.
 * - Já liberado: "Você ganhou frete grátis".
 * - Na etapa do frete (`offerUpgrade`), abaixo do mínimo: uma frase curta oferecendo o kit
 *   seguinte, que libera o frete, com um botão para trocar.
 * - No resumo lateral: só uma linha curta, sem repetir a oferta.
 */
export function FreeShippingProgress({
  bundle,
  subtotal,
  className,
  offerUpgrade = true,
}: {
  bundle: Bundle;
  /** Produtos + order bump, sem frete. */
  subtotal: number;
  className?: string;
  /** Mostra a oferta de trocar de kit (etapa do frete). */
  offerUpgrade?: boolean;
}) {
  const eligible = isFreeShippingEligible(subtotal);
  const upgrade = getUpgradeBundle(bundle);
  const upgradeSubtotal = upgrade ? round(subtotal - bundle.price + upgrade.price) : 0;
  const canUpgrade = !!upgrade && isFreeShippingEligible(upgradeSubtotal);

  if (eligible) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-[var(--ck-ok)] bg-[var(--ck-badge)]/40 px-4 py-3 text-[13px]",
          className,
        )}
      >
        <Truck className="h-4 w-4 shrink-0 text-[var(--ck-ok)]" />
        <span>
          Você ganhou <b className="text-[var(--ck-ok)]">FRETE GRÁTIS</b> (pedido acima de{" "}
          {brl(FREE_SHIPPING_MIN)}).
        </span>
      </div>
    );
  }

  // Resumo lateral, ou não há kit maior que libere o frete: só a informação, sem oferta.
  if (!offerUpgrade || !canUpgrade || !upgrade) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px]",
          className,
        )}
      >
        <Truck className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Frete grátis a partir de <b>{brl(FREE_SHIPPING_MIN)}</b>. Faltam{" "}
          <b>{brl(round(FREE_SHIPPING_MIN - subtotal))}</b>.
        </span>
      </div>
    );
  }

  const extra = round(upgradeSubtotal - subtotal);

  return (
    <div
      className={cn("rounded-lg border border-amber-300 bg-amber-50 p-3 text-[13px]", className)}
    >
      <p className="flex gap-2 leading-snug">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Frete grátis a partir de {brl(FREE_SHIPPING_MIN)}. Por mais <b>{brl(extra)}</b> você leva
          o <b>{upgrade.name}</b> (+{(upgrade.wipes - bundle.wipes).toLocaleString("pt-BR")} lenços) e{" "}
          <b className="text-[var(--ck-ok)]">não paga frete</b>.
        </span>
      </p>
      <Link
        to="/checkout"
        search={{ plano: upgrade.id }}
        replace
        resetScroll={false}
        className="mt-2 flex w-full items-center justify-center rounded-md bg-[var(--ck-ok)] px-3 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
      >
        Trocar para o {upgrade.name}
      </Link>
    </div>
  );
}
