"use client";

import { loadEngine, peekEngine } from "@/games/engines";
import { getGame } from "@/games";
import type { GameEngine, GameRules, Guess, PlayMode, PlayStatus, PlayView } from "@/games/types";
import { EPOCH_DATE, addDays, challengeNumber, daysBetween } from "@/lib/daily/date";
import { giveUpStatus, statusAfter } from "./result";
import { archiveStore, dailyStore, practiceStore, playKey, type PlayMap, type PlayStore, type StoredPlay } from "./store";
import { isDone, statusOf } from "./status";
import { reportPlay, startClockOnServer } from "./sync";

/**
 * Ponto único por onde a UI fala com o "servidor" dos jogos.
 *
 * O jogo roda no navegador, chamando a engine direto. Ao terminar, a Partida do dia vai para o
 * servidor (./sync.ts), que refaz a partida e calcula a Nota; quem não entrou na Conta joga igual,
 * só que fora dos Rankings. Nos jogos com tempo, o relógio que vale para o Ranking é o do servidor.
 *
 * Toda função recebe o `mode` da partida. O desafio de hoje ("daily") é o único que vai para o
 * servidor e conta para sequência e estatísticas. Um dia anterior jogado depois ("archive") e o
 * treino ("practice") ficam guardados à parte, só no navegador.
 */

/** Folga para a latência entre o fim do relógio na tela e a última tentativa chegar. */
const CLOCK_GRACE_MS = 1500;

/**
 * O treino usa os dias antes da estreia do Rodada: nunca é o desafio de um dia de verdade (nem
 * estraga um que ainda vem).
 */
const PRACTICE_FROM = "2000-01-01";
const PRACTICE_DAYS = daysBetween(PRACTICE_FROM, EPOCH_DATE);

const STORES: Record<PlayMode, PlayStore> = { daily: dailyStore, archive: archiveStore, practice: practiceStore };
const storeFor = (mode: PlayMode): PlayStore => STORES[mode];

function rulesOf(slug: string): GameRules {
  const game = getGame(slug);
  if (!game) throw new Error(`jogo desconhecido: ${slug}`);
  return game.meta.rules;
}

function timeIsUp(rules: GameRules, play: StoredPlay, now = Date.now()): boolean {
  return rules.type === "timed" && now > Date.parse(play.startedAt) + rules.seconds * 1000 + CLOCK_GRACE_MS;
}

function toView(slug: string, dateKey: string, puzzle: unknown, mode: PlayMode, stored?: StoredPlay): PlayView {
  return {
    slug,
    dateKey,
    number: challengeNumber(dateKey),
    puzzle,
    guesses: stored?.guesses ?? [],
    status: stored?.status ?? "playing",
    startedAt: stored?.startedAt,
    answerLabel: stored?.answerLabel,
    practice: mode === "practice",
    archive: mode === "archive",
  };
}

function close(store: PlayStore, stored: StoredPlay, status: PlayStatus, answerLabel: string): StoredPlay {
  const closed = { ...stored, status, answerLabel, finishedAt: new Date().toISOString() };
  store.savePlay(closed);
  // Partida do dia terminada: vai para o servidor, se houver Conta logada. Dia anterior e treino nunca vão.
  if (store === dailyStore) void reportPlay(closed);
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
 * Desafio para o próximo treino: continua o treino em andamento, se houver; senão o dia seguinte ao
 * último treino, e só sorteia um dia no primeiro. Dias seguidos não se repetem (o Incomum, por
 * exemplo, tira as categorias de um mesmo embaralhamento), dias sorteados um a um repetiam muito.
 * Chamado só em resposta a um clique, nunca durante o render.
 */
export function nextPracticeKey(slug: string): string {
  const last = Object.values(practiceStore.getPlays()).find((p) => p.slug === slug);
  if (last?.status === "playing") return last.dateKey;
  const next = last && addDays(last.dateKey, 1);
  if (next && next >= PRACTICE_FROM && next < EPOCH_DATE) return next;
  return addDays(PRACTICE_FROM, Math.floor(Math.random() * PRACTICE_DAYS));
}

/** Os dias anteriores do jogo, do mais recente ao mais antigo: da estreia dele até ontem. */
export function pastDays(slug: string, today: string): string[] {
  const first = getGame(slug)?.meta.launchedOn ?? EPOCH_DATE;
  return Array.from({ length: Math.max(0, daysBetween(first, today)) }, (_, i) => addDays(today, -(i + 1)));
}

/** A partida de um dia anterior: a jogada no próprio dia, se houver; senão a jogada depois. */
export const pastPlay = (daily: PlayMap, archived: PlayMap, slug: string, dateKey: string) =>
  daily[playKey(slug, dateKey)] ?? archived[playKey(slug, dateKey)];

/** Os dias anteriores ainda não terminados, do mais recente ao mais antigo. O treino só libera sem nenhum. */
export const pendingDays = (daily: PlayMap, archived: PlayMap, slug: string, today: string) =>
  pastDays(slug, today).filter((d) => !isDone(statusOf(pastPlay(daily, archived, slug, d))));

/** Como abrir um dia anterior: a partida do próprio dia, se a pessoa jogou nele; senão como dia anterior. */
export const modeForPastDay = (slug: string, dateKey: string): PlayMode =>
  dailyStore.getPlay(slug, dateKey) ? "daily" : "archive";

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
function openPlay(engine: GameEngine, slug: string, dateKey: string, mode: PlayMode, persist = true): PlayView {
  const store = storeFor(mode);
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
  return toView(slug, dateKey, puzzle, mode, stored);
}

/** No navegador, os arquivos de public/ são baixados do próprio site. */
async function readPublic(path: string): Promise<unknown> {
  const res = await fetch(`/${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

/** A engine, com o que o desafio do dia precisa já baixado (veja `GameEngine.prepare`). */
async function engineFor(slug: string, dateKey: string): Promise<GameEngine> {
  const engine = await loadEngine(slug);
  await engine.prepare?.(dateKey, readPublic);
  return engine;
}

export async function startPlay(slug: string, dateKey: string, mode: PlayMode = "daily"): Promise<PlayView> {
  return openPlay(await engineFor(slug, dateKey), slug, dateKey, mode);
}

/**
 * Igual a `startPlay`, mas na hora: só funciona se a engine já estiver carregada. Pode ser chamado
 * durante o render, por isso não grava nada (veja `openPlay`).
 */
export function peekPlay(slug: string, dateKey: string, mode: PlayMode = "daily"): PlayView | null {
  const engine = peekEngine(slug);
  // Sem as respostas do dia, refazer as jogadas salvas falharia: espera o `startPlay`.
  if (!engine || engine.isReady?.(dateKey) === false) return null;
  return openPlay(engine, slug, dateKey, mode, false);
}

/**
 * Fecha as Partidas do dia que ficaram em andamento num dia que já passou: quem estava jogando na
 * virada da meia-noite, ou largou a partida no meio, desistiu (é o que o servidor faz com toda
 * partida enviada sem terminar). Nos primeiros minutos do dia novo o servidor ainda aceita a de
 * ontem; depois disso ela fica só no navegador, encerrada em vez de "jogando" para sempre.
 *
 * Jogo com tempo só fecha quando o relógio acaba: quem começou às 23:59 termina a partida.
 */
export async function closeStalePlays(today: string): Promise<void> {
  const stale = Object.values(dailyStore.getPlays()).filter((p) => p.status === "playing" && p.dateKey < today);
  for (const { slug, dateKey } of stale) {
    const game = getGame(slug);
    if (!game) continue;
    const engine = await engineFor(slug, dateKey);
    // Relê depois do await: outra aba (ou a própria tela) pode ter fechado a partida nesse meio-tempo.
    const stored = dailyStore.getPlay(slug, dateKey);
    if (stored?.status !== "playing") continue;
    const { rules } = game.meta;
    if (rules.type === "timed" && !timeIsUp(rules, stored)) continue;
    close(dailyStore, stored, giveUpStatus(rules), engine.describeAnswer(engine.createChallenge(dateKey).answer));
  }
}

/** Jogos com tempo: cria a partida e começa o relógio. */
export async function beginPlay(slug: string, dateKey: string, mode: PlayMode = "daily"): Promise<PlayView> {
  const store = storeFor(mode);
  const engine = await engineFor(slug, dateKey);
  const { puzzle } = engine.createChallenge(dateKey);
  const existing = store.getPlay(slug, dateKey);
  if (existing) return toView(slug, dateKey, puzzle, mode, existing);
  const stored = fresh(slug, dateKey);
  store.savePlay(stored);
  if (mode === "daily") startClockOnServer(slug, dateKey);
  return toView(slug, dateKey, puzzle, mode, stored);
}

/** Encerra a partida antes da hora: tempo esgotado (jogos com tempo), parar de jogar (pontos) ou desistência. */
export async function finishPlay(slug: string, dateKey: string, mode: PlayMode = "daily"): Promise<PlayView> {
  const store = storeFor(mode);
  const engine = await engineFor(slug, dateKey);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  const rules = rulesOf(slug);
  const status = giveUpStatus(rules);
  let stored = store.getPlay(slug, dateKey) ?? (rules.type === "timed" ? undefined : fresh(slug, dateKey));
  if (stored?.status === "playing") stored = close(store, stored, status, engine.describeAnswer(answer));
  return toView(slug, dateKey, puzzle, mode, stored);
}

export async function submitGuess(
  slug: string,
  dateKey: string,
  input: string,
  mode: PlayMode = "daily",
): Promise<{ error: string } | { play: PlayView }> {
  const store = storeFor(mode);
  const rules = rulesOf(slug);
  const engine = await engineFor(slug, dateKey);
  const { puzzle, answer } = engine.createChallenge(dateKey);
  const existing = store.getPlay(slug, dateKey);
  if (rules.type === "timed" && !existing) return { error: "O relógio ainda não começou" };
  const stored = existing ?? fresh(slug, dateKey);
  if (stored.status !== "playing") return { error: mode === "daily" ? "Você já jogou hoje" : "Essa partida já acabou" };
  if (timeIsUp(rules, stored)) {
    const closed = close(store, stored, "done", engine.describeAnswer(answer));
    return { play: toView(slug, dateKey, puzzle, mode, closed) };
  }

  const result = engine.checkGuess(input, answer, stored.guesses);
  if (!result.ok) return { error: result.error };

  const guesses = [...stored.guesses, { input, feedback: result.feedback }];
  const status = statusAfter(rules, guesses, result.solved);
  const next = { ...stored, guesses };
  if (status === "playing") {
    store.savePlay(next);
    return { play: toView(slug, dateKey, puzzle, mode, next) };
  }
  return { play: toView(slug, dateKey, puzzle, mode, close(store, next, status, engine.describeAnswer(answer))) };
}
