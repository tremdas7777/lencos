import { getRouteApi } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import type { LogoMeta } from "@/lib/logo.functions";

const rootApi = getRouteApi("__root__");

/** Logo enviado no /admin (ou null: a loja usa o logo em texto). */
export function useLogo(): LogoMeta | null {
  return (rootApi.useLoaderData() as { logo?: LogoMeta | null }).logo ?? null;
}

/**
 * Logo da loja. Com imagem enviada no /admin, ela se ajusta à caixa (altura máxima e largura
 * máxima), sem distorcer: logo largo fica limitado pela largura, logo alto pela altura.
 * Sem imagem, mostra o nome da marca em texto.
 */
export function BrandLogo({
  className,
  height = 48,
  maxWidth = 260,
}: {
  className?: string;
  /** Altura máxima do logo em imagem (px). */
  height?: number;
  /** Largura máxima do logo em imagem (px). */
  maxWidth?: number;
}) {
  const logo = useLogo();
  if (logo) {
    // Tamanho final já calculado: o navegador reserva o espaço e a página não pula ao carregar.
    const scale = Math.min(height / logo.h, maxWidth / logo.w);
    const w = Math.round(logo.w * scale);
    const h = Math.round(logo.h * scale);
    return (
      <img
        src={`/api/public/logo?v=${logo.version}`}
        alt={brand.name}
        width={w}
        height={h}
        className={cn("inline-block max-w-full object-contain", className)}
        style={{ width: w, height: "auto", maxHeight: h }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center font-black leading-none tracking-tight text-[#0B5957] whitespace-nowrap",
        className,
      )}
      style={{ fontFamily: '"Nunito Sans", system-ui, sans-serif' }}
      aria-label={brand.name}
    >
      {brand.name}
    </span>
  );
}
