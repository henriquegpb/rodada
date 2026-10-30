"use client";

import { loadEngine, peekEngine } from "@/games/engines";
import { getGame } from "@/games";
import type { GameEngine, GameRules, Guess, PlayStatus, PlayView } from "@/games/types";
import { addDays, challengeNumber } from "@/lib/daily/date";
import { playCount } from "./result";
import { dailyStore, practiceStore, type PlayStore, type StoredPlay } from "./store";

/**
 * Ponto único por onde a UI fala com o "servidor" dos jogos.
 *
 * Hoje roda no navegador, chamando a engine direto. Quando o backend existir, estas funções
 * viram chamadas às route handlers com a mesma assinatura, e nenhum componente precisa mudar.
 * O relógio dos jogos com tempo também passa a valer pelo horário do servidor.
 *
 * Toda função recebe `practice`: o treino usa o desafio de um dia qualquer, guardado à parte,
 * e nunca conta para sequência, estatística ou histórico.
 */

/** Folga para a latência entre o fim do relógio na tela e a última tentativa chegar. */
const CLOCK_GRACE_MS = 1500;

/** O treino sorteia o desafio de um dia qualquer entre estes dois extremos. */
const PRACTICE_FROM = "2000-01-01";
const PRACTICE_DAYS = 20_000;

const storeFor = (practice: boolean): PlayStore => (practice ? practiceStore : dailyStore);

function rulesOf(slug: string): GameRules {
  const game = getGame(slug);
  if (!game) throw new Error(`jogo desconhecido: ${slug}`);
  return game.meta.rules;
}

function timeIsUp(rules: GameRules, play: StoredPlay, now = Date.now()): boolean {
  return rules.type === "timed" && now > Date.parse(play.startedAt) + rules.seconds * 1000 + CLOCK_GRACE_MS;
}

function toView(slug: string, dateKey: string, puzzle: unknown, practice: boolean, stored?: StoredPlay): PlayView {
  return {
    slug,
    dateKey,
    number: challengeNumber(dateKey),
    puzzle,
    guesses: stored?.guesses ?? [],
    status: stored?.status ?? "playing",
    startedAt: stored?.startedAt,
    answerLabel: stored?.answerLabel,
    practice,
  };
}

function close(store: PlayStore, stored: StoredPlay, status: PlayStatus, answerLabel: string): StoredPlay {
  const closed = { ...stored, status, answerLabel, finishedAt: new Date().toISOString() };
  store.savePlay(closed);
  return closed;
}

function fresh(slug: string, dateKey: string): StoredPlay {
  return {
    slug,
    dateKey,
    number: challengeNumber(dateKey),
    guesses: [],
    status: "playing",
    startedAt: new Date().toISOString(),
  };
}

/**
 * Desafio para o próximo treino: continua o treino em andamento, se houver; senão sorteia um dia.
 * Chamado só em resposta a um clique, nunca durante o render.
 */
export function nextPracticeKey(slug: string): string {
  const current = Object.values(practiceStore.getPlays()).find((p) => p.slug === slug && p.status === "playing");
  if (current) return current.dateKey;
  return addDays(PRACTICE_FROM, Math.floor(Math.random() * PRACTICE_DAYS));
}

/**
 * A partida salva ainda é deste desafio? Refaz cada tentativa contra a resposta atual: se alguma
 * der outro resultado, o desafio mudou desde que ela foi jogada (nova data de estreia, lista de
 * palavras atualizada…) e as cores salvas não valem mais.
 */
function matchesChallenge(engine: GameEngine, answer: unknown, stored: StoredPlay): boolean {
  const replayed: Guess[] = [];
  for (const guess of stored.guesses) {
    const result = engine.checkGuess(guess.input, answer, replayed);
    if (!result.ok || JSON.stringify(result.feedback) !== JSON.stringify(guess.feedback)) return false;
    replayed.push({ input: guess.input, feedback: result.feedback });
  }
  return true;
}

/**
 * Abre a partida salva. Com `persist: false` só lê: a partida velha é ignorada sem ser apagada, e a
 * de relógio vencido aparece encerrada sem ser gravada. É o modo do `peekPlay`, que roda durante o
 * render: gravar avisa os componentes inscritos no armazenamento, e o React não aceita atualizar um
 * componente no meio do render de outro. O `startPlay` que vem logo depois faz a limpeza.
 */
function openPlay(engine: GameEngine, slug: string, dateKey: string, practice: boolean, persist = true): PlayView {
  const store = storeFor(practice);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  let stored = store.getPlay(slug, dateKey);
  if (stored && !matchesChallenge(engine, answer, stored)) {
    if (persist) store.deletePlay(slug, dateKey);
    stored = undefined;
  }
  // Quem fechou a aba com o relógio correndo volta e encontra a partida encerrada.
  if (stored?.status === "playing" && timeIsUp(rulesOf(slug), stored)) {
    const answerLabel = engine.describeAnswer(answer);
    stored = persist ? close(store, stored, "done", answerLabel) : { ...stored, status: "done", answerLabel };
  }
  return toView(slug, dateKey, puzzle, practice, stored);
}

export async function startPlay(slug: string, dateKey: string, practice = false): Promise<PlayView> {
  return openPlay(await loadEngine(slug), slug, dateKey, practice);
}

/**
 * Igual a `startPlay`, mas na hora: só funciona se a engine já estiver carregada. Pode ser chamado
 * durante o render, por isso não grava nada (veja `openPlay`).
 */
export function peekPlay(slug: string, dateKey: string, practice = false): PlayView | null {
  const engine = peekEngine(slug);
  return engine ? openPlay(engine, slug, dateKey, practice, false) : null;
}

/** Jogos com tempo: cria a partida e começa o relógio. */
export async function beginPlay(slug: string, dateKey: string, practice = false): Promise<PlayView> {
  const store = storeFor(practice);
  const engine = await loadEngine(slug);
  const { puzzle } = engine.createChallenge(dateKey);
  const existing = store.getPlay(slug, dateKey);
  if (existing) return toView(slug, dateKey, puzzle, practice, existing);
  const stored = fresh(slug, dateKey);
  store.savePlay(stored);
  return toView(slug, dateKey, puzzle, practice, stored);
}

/** Encerra a partida antes da hora: tempo esgotado (jogos com tempo), parar de jogar (pontos) ou desistência. */
export async function finishPlay(slug: string, dateKey: string, practice = false): Promise<PlayView> {
  const store = storeFor(practice);
  const engine = await loadEngine(slug);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  // Com tempo, terminar é só o fim do relógio; por pontos, ficar com os que tem ("done").
  // Nos outros, desistir é perder.
  const type = rulesOf(slug).type;
  const status: PlayStatus = type === "timed" || type === "points" ? "done" : "lost";
  let stored = store.getPlay(slug, dateKey) ?? (type === "timed" ? undefined : fresh(slug, dateKey));
  if (stored?.status === "playing") stored = close(store, stored, status, engine.describeAnswer(answer));
  return toView(slug, dateKey, puzzle, practice, stored);
}

export async function submitGuess(
  slug: string,
  dateKey: string,
  input: string,
  practice = false,
): Promise<{ error: string } | { play: PlayView }> {
  const store = storeFor(practice);
  const rules = rulesOf(slug);
  const engine = await loadEngine(slug);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  const existing = store.getPlay(slug, dateKey);
  if (rules.type === "timed" && !existing) return { error: "O relógio ainda não começou" };
  const stored = existing ?? fresh(slug, dateKey);
  if (stored.status !== "playing") return { error: practice ? "Essa partida já acabou" : "Você já jogou hoje" };
  if (timeIsUp(rules, stored)) {
    const closed = close(store, stored, "done", engine.describeAnswer(answer));
    return { play: toView(slug, dateKey, puzzle, practice, closed) };
  }

  const result = engine.checkGuess(input, answer, stored.guesses);
  if (!result.ok) return { error: result.error };

  const guesses = [...stored.guesses, { input, feedback: result.feedback }];
  const outOfAttempts =
    (rules.type === "attempts" && guesses.length >= rules.maxAttempts) ||
    (rules.type === "lives" && playCount(rules, guesses) >= rules.lives);
  // No quiz a última resposta encerra; a engine marca `solved` quando acertou todas.
  const quizOver = rules.type === "quiz" && guesses.length >= rules.total;
  const status: PlayStatus = result.solved ? "won" : outOfAttempts ? "lost" : quizOver ? "done" : "playing";
  const next = { ...stored, guesses };
  if (status === "playing") {
    store.savePlay(next);
    return { play: toView(slug, dateKey, puzzle, practice, next) };
  }
  return { play: toView(slug, dateKey, puzzle, practice, close(store, next, status, engine.describeAnswer(answer))) };
}
