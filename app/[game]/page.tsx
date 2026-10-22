import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { games, getGame } from "@/games";
import { GameScreen } from "@/components/game/game-screen";
import { t } from "@/lib/i18n";

export function generateStaticParams() {
  return games.map((g) => ({ game: g.meta.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[game]">): Promise<Metadata> {
  const game = getGame((await params).game);
  return game ? { title: game.meta.name, description: game.meta.description } : {};
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
  if (!getGame(slug)) notFound();
  return <GameScreen slug={slug} />;
}
