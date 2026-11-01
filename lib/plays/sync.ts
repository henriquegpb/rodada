"use client";

import type { PlayReceipt } from "@/server/plays";
import { dailyStore, type StoredPlay } from "./store";

/**
 * Envio das Partidas do dia para o servidor. Sem Conta logada o servidor responde 401 e nada
 * acontece; quem joga deslogado segue só com o navegador.
 *
 * Sem conexão (ou com o servidor fora), o envio fica pendente e é tentado de novo em `flushPending`.
 * O servidor só aceita a partida do dia, então uma pendência velha é recusada e descartada.
 */

const PENDING_KEY = "rodada:pending:v1";

interface Report {
  slug: string;
  dateKey: string;
  guesses: string[];
}

const sameReport = (a: Report, b: Report) => a.slug === b.slug && a.dateKey === b.dateKey;

function readPending(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]") as Report[];
  } catch {
    return [];
  }
}

function writePending(reports: Report[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(reports));
  } catch {
    // Modo privado ou cota cheia: a partida fica só no navegador.
  }
}

async function post(path: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return null;
  }
}

const listeners = new Set<(receipt: PlayReceipt) => void>();

/**
 * Avisa quando o servidor gravou uma partida: Nota, Score diário e Conquistas que subiram de Nível
 * (para o toast). Devolve a função que cancela a inscrição.
 */
export function onPlayReported(listener: (receipt: PlayReceipt) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function send(report: Report) {
  const response = await post("/api/plays", report);
  const retry = !response || response.status >= 500;
  const others = readPending().filter((p) => !sameReport(p, report));
  writePending(retry ? [...others, report] : others);
  if (response?.ok) {
    const receipt = (await response.json()) as PlayReceipt;
    listeners.forEach((l) => l(receipt));
  }
}

export function reportPlay(play: StoredPlay): Promise<void> {
  return send({ slug: play.slug, dateKey: play.dateKey, guesses: play.guesses.map((g) => g.input) });
}

/** Tenta de novo os envios pendentes. Chamado quando o app abre. */
export async function flushPending() {
  for (const report of readPending()) await send(report);
}

/** Jogos com tempo: avisa o servidor que o relógio começou. */
export function startClockOnServer(slug: string, dateKey: string) {
  void post("/api/plays/start", { slug, dateKey });
}

/**
 * Leva as Partidas do dia guardadas neste navegador para a Conta. O servidor só aceita uma
 * importação por Conta; chame logo depois do primeiro login. Devolve null se não foi possível
 * (sem login, já importado ou sem conexão).
 */
export async function importLocalPlays(): Promise<{ accepted: number; rejected: number } | null> {
  const plays = Object.values(dailyStore.getPlays())
    .filter((p) => p.status !== "playing")
    .map((p) => ({ slug: p.slug, dateKey: p.dateKey, guesses: p.guesses.map((g) => g.input), finishedAt: p.finishedAt }));
  const response = await post("/api/plays/import", { plays });
  return response?.ok ? response.json() : null;
}
