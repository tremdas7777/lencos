import { createFileRoute } from "@tanstack/react-router";

// Imagem do logo enviado no /admin. A URL leva ?v=<versão>, então pode ficar em cache para sempre:
// um logo novo muda a versão e o navegador busca de novo.
export const Route = createFileRoute("/api/public/logo")({
  server: {
    handlers: {
      GET: async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { LOGO_DATA_KEY } = await import("@/lib/logo.functions");
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", LOGO_DATA_KEY)
          .maybeSingle();
        const dataUrl = (data?.value as { dataUrl?: string } | null)?.dataUrl ?? "";
        const m = /^data:(image\/(?:png|webp));base64,(.+)$/.exec(dataUrl);
        if (!m) return new Response("Logo não encontrado", { status: 404 });
        const bytes = Uint8Array.from(atob(m[2]!), (c) => c.charCodeAt(0));
        return new Response(bytes, {
          headers: {
            "content-type": m[1]!,
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
