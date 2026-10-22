"use client";

import { loadEngine } from "@/games/engines";
import { getGame } from "@/games";
import type { GameRules, PlayStatus, PlayView } from "@/games/types";
import { challengeNumber } from "@/lib/daily/date";
import { getPlay, savePlay, type StoredPlay } from "./store";

/**
 * Ponto único por onde a UI fala com o "servidor" dos jogos.
 *
 * Hoje roda no navegador, chamando a engine direto. Quando o backend existir, estas funções
 * viram chamadas às route handlers com a mesma assinatura, e nenhum componente precisa mudar.
 * O relógio dos jogos com tempo também passa a valer pelo horário do servidor.
 */

/** Folga para a latência entre o fim do relógio na tela e a última tentativa chegar. */
const CLOCK_GRACE_MS = 1500;

function rulesOf(slug: string): GameRules {
  const game = getGame(slug);
  if (!game) throw new Error(`jogo desconhecido: ${slug}`);
  return game.meta.rules;
}

function timeIsUp(rules: GameRules, play: StoredPlay, now = Date.now()): boolean {
  return rules.type === "timed" && now > Date.parse(play.startedAt) + rules.seconds * 1000 + CLOCK_GRACE_MS;
}

function toView(slug: string, dateKey: string, puzzle: unknown, stored?: StoredPlay): PlayView {
  return {
    slug,
    dateKey,
    number: challengeNumber(dateKey),
    puzzle,
    guesses: stored?.guesses ?? [],
    status: stored?.status ?? "playing",
    startedAt: stored?.startedAt,
    answerLabel: stored?.answerLabel,
  };
}

function close(stored: StoredPlay, status: PlayStatus, answerLabel: string): StoredPlay {
  const closed = { ...stored, status, answerLabel, finishedAt: new Date().toISOString() };
  savePlay(closed);
  return closed;
}

export async function startPlay(slug: string, dateKey: string): Promise<PlayView> {
  const engine = await loadEngine(slug);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  let stored = getPlay(slug, dateKey);
  // Quem fechou a aba com o relógio correndo volta e encontra a partida encerrada.
  if (stored?.status === "playing" && timeIsUp(rulesOf(slug), stored)) {
    stored = close(stored, "done", engine.describeAnswer(answer));
  }
  return toView(slug, dateKey, puzzle, stored);
}

/** Jogos com tempo: cria a partida e começa o relógio. */
export async function beginPlay(slug: string, dateKey: string): Promise<PlayView> {
  const engine = await loadEngine(slug);
  const { puzzle } = engine.createChallenge(dateKey);
  const existing = getPlay(slug, dateKey);
  if (existing) return toView(slug, dateKey, puzzle, existing);
  const stored: StoredPlay = {
    slug,
    dateKey,
    number: challengeNumber(dateKey),
    guesses: [],
    status: "playing",
    startedAt: new Date().toISOString(),
  };
  savePlay(stored);
  return toView(slug, dateKey, puzzle, stored);
}

/** Jogos com tempo: encerra a partida (tempo esgotado ou desistência). */
export async function finishPlay(slug: string, dateKey: string): Promise<PlayView> {
  const engine = await loadEngine(slug);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  let stored = getPlay(slug, dateKey);
  if (stored?.status === "playing") stored = close(stored, "done", engine.describeAnswer(answer));
  return toView(slug, dateKey, puzzle, stored);
}

export async function submitGuess(
  slug: string,
  dateKey: string,
  input: string,
): Promise<{ error: string } | { play: PlayView }> {
  const rules = rulesOf(slug);
  const engine = await loadEngine(slug);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  const existing = getPlay(slug, dateKey);
  if (rules.type === "timed" && !existing) return { error: "O relógio ainda não começou" };
  const stored: StoredPlay = existing ?? {
    slug,
    dateKey,
    number: challengeNumber(dateKey),
    guesses: [],
    status: "playing",
    startedAt: new Date().toISOString(),
  };
  if (stored.status !== "playing") return { error: "Você já jogou hoje" };
  if (timeIsUp(rules, stored)) {
    return { play: toView(slug, dateKey, puzzle, close(stored, "done", engine.describeAnswer(answer))) };
  }

  const result = engine.checkGuess(input, answer, stored.guesses);
  if (!result.ok) return { error: result.error };

  const guesses = [...stored.guesses, { input, feedback: result.feedback }];
  const outOfAttempts = rules.type === "attempts" && guesses.length >= rules.maxAttempts;
  const status: PlayStatus = result.solved ? "won" : outOfAttempts ? "lost" : "playing";
  const next = { ...stored, guesses };
  if (status === "playing") {
    savePlay(next);
    return { play: toView(slug, dateKey, puzzle, next) };
  }
  return { play: toView(slug, dateKey, puzzle, close(next, status, engine.describeAnswer(answer))) };
}
