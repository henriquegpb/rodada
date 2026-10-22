import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { games, getGame } from "@/games";
import { GameScreen } from "@/components/game/game-screen";
import { GameGuide } from "@/components/game/game-guide";
import { LOCALE, t } from "@/lib/i18n";
import { JsonLd, absoluteUrl, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return games.map((g) => ({ game: g.meta.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[game]">): Promise<Metadata> {
  const game = getGame((await params).game);
  if (!game) return {};
  const { slug, seo } = game.meta;
  return {
    title: seo.title,
    ...pageMetadata({ title: `${seo.title} · ${t.brand.name}`, description: seo.description, path: `/${slug}` }),
  };
}

export default function GamePage({ params }: PageProps<"/[game]">) {
  // O slug vem da URL: fica atrás do Suspense para a casca da página sair na hora.
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{t.game.loading}</p>}>
      <Game params={params} />
    </Suspense>
  );
}

async function Game({ params }: Pick<PageProps<"/[game]">, "params">) {
  const { game: slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: game.meta.name,
          description: game.meta.seo.description,
          url: absoluteUrl(`/${slug}`),
          applicationCategory: "GameApplication",
          operatingSystem: "Web",
          inLanguage: LOCALE,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: 0, priceCurrency: "BRL" },
          isPartOf: { "@type": "WebSite", name: t.brand.name, url: absoluteUrl("/") },
        }}
      />
      <GameScreen slug={slug} />
      <GameGuide slug={slug} />
    </>
  );
}
