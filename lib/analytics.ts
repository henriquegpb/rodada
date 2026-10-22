"use client";

import { track } from "@vercel/analytics";

/**
 * Eventos do Vercel Web Analytics. A lista é fechada e tipada para os nomes e propriedades não
 * divergirem entre telas. Visualizações de página (qual jogo foi aberto) já são automáticas.
 *
 * Todo evento ligado a um jogo também leva as flags `game` e `practice`: no painel do Vercel dá
 * para segmentar qualquer evento por jogo e separar o desafio do dia do treino.
 */
export interface AnalyticsEvents {
  /** Primeira tentativa (ou "Começar", no Mundo) de uma partida. */
  game_started: { game: string; practice: boolean };
  /** Partida encerrada: ganhou, perdeu (ou desistiu) ou acabou o tempo. */
  game_finished: { game: string; practice: boolean; result: string; attempts: number };
  /** Desistiu antes do fim (Calor, Mundo). */
  game_given_up: { game: string; practice: boolean; attempts: number };
  result_shared: { game: string; method: string };
  play_another: { game: string };
  hint_used: { game: string; hint: number; practice: boolean };
  sound_toggled: { muted: boolean };
  theme_changed: { theme: string };
  github_star_clicked: Record<string, never>;
}

export function trackEvent<K extends keyof AnalyticsEvents>(name: K, properties: AnalyticsEvents[K]) {
  const props = properties as Record<string, string | number | boolean>;
  const flags =
    "game" in props ? { game: props.game, ...("practice" in props && { practice: props.practice }) } : undefined;
  try {
    track(name, props, flags ? { flags } : undefined);
  } catch {
    // Analytics nunca pode quebrar o jogo.
  }
}
