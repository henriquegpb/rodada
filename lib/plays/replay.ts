import type { GameEngine, GameRules, Guess, PlayStatus } from "@/games/types";
import { giveUpStatus, playCount, statusAfter } from "./result";

export type Replay =
  | { ok: true; guesses: Guess[]; status: Exclude<PlayStatus, "playing">; count: number }
  | { ok: false; error: string };

/**
 * Refaz uma partida terminada a partir só dos chutes, com as mesmas regras de término do serviço.
 * É assim que o servidor chega ao resultado sem confiar no que o cliente diz (ADR 0001).
 * `gaveUp`: a partida acabou antes da hora (desistência, relógio zerado, encerrar a Colmeia).
 */
export function replayPlay(
  engine: GameEngine,
  rules: GameRules,
  answer: unknown,
  inputs: readonly string[],
  gaveUp: boolean,
): Replay {
  const guesses: Guess[] = [];
  let status: PlayStatus = "playing";
  for (const input of inputs) {
    if (status !== "playing") return { ok: false, error: "Tem chute depois do fim da partida" };
    const result = engine.checkGuess(input, answer, guesses);
    if (!result.ok) return { ok: false, error: `Chute recusado: ${input}` };
    guesses.push({ input, feedback: result.feedback });
    status = statusAfter(rules, guesses, result.solved);
  }
  if (status === "playing" && gaveUp) status = giveUpStatus(rules);
  if (status === "playing") return { ok: false, error: "A partida não terminou" };
  return { ok: true, guesses, status, count: playCount(rules, guesses) };
}
