import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { SITE_URL } from "@/lib/share";

/** Título da home e o padrão das prévias de link (WhatsApp, X, Google). */
export const SITE_TITLE = `${t.brand.name}: jogos diários de palavras e geografia em português`;
export const SITE_DESCRIPTION =
  "Palavra do dia, bandeira, país pelo mapa e mais: jogos diários grátis em português, no estilo Termo e Wordle. Os mesmos desafios para todo mundo.";

/**
 * Endereço canônico e prévia de link de uma página. O Next não junta o `openGraph` do layout com
 * o da página (o da página substitui tudo), então cada página leva o conjunto inteiro. A imagem
 * vem dos arquivos `opengraph-image` de cada rota.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: t.brand.name, locale: "pt_BR", url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Dados estruturados (schema.org) para o Google entender a página; o `<` escapado evita fechar o script. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
