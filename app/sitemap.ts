import type { MetadataRoute } from "next";
import { games } from "@/games";
import { absoluteUrl } from "@/lib/seo";

/** A home e todos os jogos (modos inclusive); o desafio muda todo dia. O perfil fica de fora. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...games.map((g) => ({
      url: absoluteUrl(`/${g.meta.slug}`),
      changeFrequency: "daily" as const,
      priority: g.meta.parent ? 0.6 : 0.8,
    })),
  ];
}
