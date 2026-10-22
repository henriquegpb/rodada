import Link from "next/link";
import { games, getGame } from "@/games";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Regras do jogo em texto, abaixo do tabuleiro. Sai pronto do servidor: é o que o Google lê da
 * página (o tabuleiro só aparece com JavaScript e o "Como jogar" fica num diálogo). Os links para
 * os outros jogos ajudam o buscador a achar o site inteiro.
 */
export function GameGuide({ slug }: { slug: string }) {
  const { meta } = getGame(slug)!;
  const others = games.filter((g) => g.meta.slug !== slug);
  return (
    <section
      className={cn(
        "mx-auto mt-16 border-t border-border pt-8 text-sm leading-relaxed text-muted-foreground",
        // Mesma largura do palco do jogo (ver GameScreen).
        meta.wide || meta.rules.type === "timed" ? "max-w-5xl" : "max-w-[620px]",
      )}
    >
      <h2 className="font-semibold text-foreground">
        {t.game.howToPlay} {meta.name}
      </h2>
      <p className="mt-2">
        {meta.description} {t.brand.tagline}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {meta.howToPlay.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-6">
        Outros jogos:{" "}
        {others.map((g, i) => (
          <span key={g.meta.slug}>
            {i > 0 && " · "}
            <Link href={`/${g.meta.slug}`} className="underline-offset-2 hover:text-foreground hover:underline">
              {g.meta.name}
            </Link>
          </span>
        ))}
      </p>
    </section>
  );
}
