import type { GameDefinition, PlayView } from "@/games/types";
import { formatResult } from "@/lib/plays/result";
import { t } from "@/lib/i18n";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Texto completo para colar no WhatsApp: cabeçalho, grade do jogo e link. */
export function buildShareText(game: GameDefinition, play: PlayView): string {
  const score = formatResult(game.meta.rules, play.status, play.guesses.length);
  const header = `${t.brand.name} · ${game.meta.name} #${play.number} · ${score}`;
  const url = `${SITE_URL.replace(/^https?:\/\//, "")}/${game.meta.slug}`;
  return `${header}\n\n${game.shareGrid(play)}\n\n${url}`;
}

/** Usa o compartilhamento nativo no celular e a área de transferência no resto. */
export async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
