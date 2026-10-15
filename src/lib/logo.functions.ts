// Logo da loja enviado pelo /admin. A imagem já chega ajustada pelo navegador (recortada, fundo
// branco removido e redimensionada) e fica no banco; a loja a busca em /api/public/logo?v=<versão>.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const LOGO_META_KEY = "logo_meta";
export const LOGO_DATA_KEY = "logo_data";

/** Dados públicos do logo (sem a imagem): versão para o cache e proporção para reservar espaço. */
export type LogoMeta = { version: string; w: number; h: number };

const metaSchema = z.object({
  version: z.string().min(1).max(40),
  w: z.number().int().min(1).max(4000),
  h: z.number().int().min(1).max(4000),
});

function assertAdmin(password: string) {
  if (password !== process.env["ADMIN_PASSWORD"]) throw new Error("Não autorizado");
}

/** Público: versão e proporção do logo, ou null quando a loja usa o logo em texto. */
export const getLogoMeta = createServerFn({ method: "GET" }).handler(
  async (): Promise<LogoMeta | null> => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", LOGO_META_KEY)
      .maybeSingle();
    const parsed = metaSchema.safeParse(data?.value);
    return parsed.success ? parsed.data : null;
  },
);

// Só PNG ou WebP (o painel sempre converte); SVG não, para não servir script dentro de imagem.
const dataUrlSchema = z
  .string()
  .max(3_000_000, "Imagem grande demais.")
  .regex(/^data:image\/(png|webp);base64,[A-Za-z0-9+/=]+$/, "Formato de imagem inválido.");

export const saveLogo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        password: z.string().min(1).max(200),
        dataUrl: dataUrlSchema,
        w: z.number().int().min(1).max(4000),
        h: z.number().int().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<LogoMeta> => {
    assertAdmin(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const meta: LogoMeta = { version: Date.now().toString(36), w: data.w, h: data.h };
    const { error } = await supabaseAdmin.from("site_settings").upsert([
      { key: LOGO_DATA_KEY, value: { dataUrl: data.dataUrl }, updated_at: now },
      { key: LOGO_META_KEY, value: meta, updated_at: now },
    ]);
    if (error) throw new Error(error.message);
    return meta;
  });

/** Volta ao logo em texto. */
export const deleteLogo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .delete()
      .in("key", [LOGO_META_KEY, LOGO_DATA_KEY]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
