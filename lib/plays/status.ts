import { getGame } from "@/games";
import type { GameRules, PlayStatus } from "@/games/types";
import { t } from "@/lib/i18n";
import { formatResult, isFinished, playCount } from "./result";
import type { StoredPlay } from "./store";

export type DayStatus = { kind: "new" } | { kind: PlayStatus; count: number };

/** O placar da partida salva (veja `playCount`). */
export function scoreOf(play: StoredPlay): number {
  const rules = getGame(play.slug)?.meta.rules;
  return rules ? playCount(rules, play.guesses) : play.guesses.length;
}

export function statusOf(play: StoredPlay | undefined): DayStatus {
  if (!play) return { kind: "new" };
  return { kind: play.status, count: scoreOf(play) };
}

export const isDone = (status: DayStatus) => status.kind !== "new" && isFinished(status.kind);

export function statusLabel(status: DayStatus, rules: GameRules): string {
  if (status.kind === "new") return t.status.play;
  if (status.kind === "playing") return t.status.playing;
  return formatResult(rules, status.kind, status.count);
}
