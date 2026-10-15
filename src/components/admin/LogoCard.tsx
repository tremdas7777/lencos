import { useState, type ChangeEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLogo } from "@/components/site/BrandLogo";
import { brand } from "@/lib/brand";
import { deleteLogo, saveLogo } from "@/lib/logo.functions";

export interface LogoCardProps {
  password: string;
}

type Processed = { dataUrl: string; w: number; h: number };

/** Altura final do arquivo: o dobro do maior tamanho usado na loja (56 px), para ficar nítido. */
const OUT_HEIGHT = 240;
const OUT_MAX_WIDTH = 1200;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fail(new Error("Não foi possível abrir a imagem."));
    img.src = src;
  });
}

/**
 * Ajusta o logo para a loja: recorta as sobras em volta, deixa transparente um fundo branco
 * e redimensiona para um tamanho padrão nítido. Logos com fundo colorido (ex.: selo quadrado)
 * ficam como estão, só redimensionados.
 */
export async function processLogo(file: File): Promise<Processed> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    // SVG pode não ter tamanho próprio: desenha grande para não perder nitidez.
    let w = img.naturalWidth || 1600;
    let h = img.naturalHeight || Math.round(1600 * (img.height / (img.width || 1)) || 400);
    const big = Math.max(w, h);
    const k = big > 2400 ? 2400 / big : big < 1200 ? 1200 / big : 1;
    w = Math.round(w * k);
    h = Math.round(h * k);

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h);
    const px = id.data;

    // Cor dos cantos decide o tipo de fundo.
    const corner = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return [px[i]!, px[i + 1]!, px[i + 2]!, px[i + 3]!] as const;
    };
    const corners = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)];
    const transparentBg = corners.every((p) => p[3] < 16);
    const whiteBg = !transparentBg && corners.every((p) => p[3] > 240 && Math.min(p[0], p[1], p[2]) > 235);

    if (whiteBg) {
      // Branco vira transparente, com borda suave para não serrilhar.
      for (let i = 0; i < px.length; i += 4) {
        const m = Math.min(px[i]!, px[i + 1]!, px[i + 2]!);
        if (m >= 248) px[i + 3] = 0;
        else if (m > 228) px[i + 3] = Math.round(px[i + 3]! * ((248 - m) / 20));
      }
      ctx.putImageData(id, 0, 0);
    }

    // Recorte: caixa dos pixels visíveis (só quando o fundo era transparente ou branco).
    let x0 = 0;
    let y0 = 0;
    let x1 = w - 1;
    let y1 = h - 1;
    if (transparentBg || whiteBg) {
      x0 = w;
      y0 = h;
      x1 = -1;
      y1 = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (px[(y * w + x) * 4 + 3]! > 12) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) throw new Error("A imagem parece vazia (toda branca ou transparente).");
    }
    const cw = x1 - x0 + 1;
    const chh = y1 - y0 + 1;
    const pad = Math.round(Math.max(cw, chh) * 0.02);

    const scale = Math.min(OUT_HEIGHT / (chh + pad * 2), OUT_MAX_WIDTH / (cw + pad * 2));
    const ow = Math.max(1, Math.round((cw + pad * 2) * scale));
    const oh = Math.max(1, Math.round((chh + pad * 2) * scale));
    const out = document.createElement("canvas");
    out.width = ow;
    out.height = oh;
    const octx = out.getContext("2d")!;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(c, x0, y0, cw, chh, pad * scale, pad * scale, cw * scale, chh * scale);

    let dataUrl = out.toDataURL("image/webp", 0.92);
    if (!dataUrl.startsWith("data:image/webp")) dataUrl = out.toDataURL("image/png");
    return { dataUrl, w: ow, h: oh };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Mesmo cálculo de tamanho do logo na loja (BrandLogo). */
function fit(p: { w: number; h: number }, height: number, maxWidth: number) {
  const s = Math.min(height / p.h, maxWidth / p.w);
  return { width: Math.round(p.w * s), height: Math.round(p.h * s) };
}

/** Logo da loja e do checkout: envio da imagem, prévia e volta ao logo em texto. */
export function LogoCard({ password }: LogoCardProps) {
  const router = useRouter();
  const current = useLogo();
  const saveFn = useServerFn(saveLogo);
  const deleteFn = useServerFn(deleteLogo);
  const [draft, setDraft] = useState<Processed | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const shown: Processed | null =
    draft ??
    (current ? { dataUrl: `/api/public/logo?v=${current.version}`, w: current.w, h: current.h } : null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
      setMsg("Use PNG, JPG, WebP ou SVG.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMsg("Imagem acima de 8 MB. Use uma menor.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      setDraft(await processLogo(file));
      setMsg("Confira a prévia e clique em Salvar logo.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Não foi possível ajustar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setMsg(null);
    try {
      await saveFn({ data: { password, ...draft } });
      setDraft(null);
      await router.invalidate();
      setMsg("Logo salvo. Já aparece na loja e no checkout.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remover o logo? A loja volta a mostrar o nome em texto.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await deleteFn({ data: { password } });
      setDraft(null);
      await router.invalidate();
      setMsg("Logo removido. A loja mostra o nome em texto.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setBusy(false);
    }
  };

  const preview = (label: string, bg: string, height: number, maxWidth: number) => (
    <div className="space-y-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="flex h-[88px] items-center justify-center rounded-lg border" style={{ background: bg }}>
        {shown ? (
          <img src={shown.dataUrl} alt="" style={fit(shown, height, maxWidth)} />
        ) : (
          <span className="font-black text-[#0B5957]" style={{ fontSize: height * 0.55 }}>
            {brand.name}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Card className="mt-3 p-5">
      <div className="mb-4 flex items-center gap-3">
        <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
        <div>
          <div className="font-medium">Logo da loja</div>
          <div className="text-xs text-muted-foreground">
            Aparece no topo e no rodapé da loja, no checkout e nas páginas do pedido. A imagem é
            ajustada sozinha: sobras recortadas, fundo branco removido e tamanho padronizado.
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {preview("Topo da loja", "#ffffff", 40, 200)}
        {preview("Checkout", "#eef1f1", 56, 280)}
        {preview("Celular (topo da loja)", "#ffffff", 34, 160)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            onChange={onFile}
            disabled={busy}
          />
          <span className="inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">
            {busy ? "Ajustando…" : "Escolher imagem"}
          </span>
        </label>
        <Button size="sm" onClick={save} disabled={busy || !draft}>
          Salvar logo
        </Button>
        {draft && (
          <Button size="sm" variant="outline" onClick={() => setDraft(null)} disabled={busy}>
            Cancelar
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={remove} disabled={busy || !current}>
          Usar logo em texto
        </Button>
        {msg && <span className="text-xs text-foreground">{msg}</span>}
      </div>
    </Card>
  );
}
