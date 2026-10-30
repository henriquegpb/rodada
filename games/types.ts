import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Contrato de um jogo do Rodada. Cada jogo vive em games/<slug>/ e tem duas metades:
 *
 *  - engine.ts  — gera o desafio do dia e valida tentativas. Conhece a resposta.
 *                 Quando o backend existir, só roda no servidor.
 *  - index.ts   — metadados, componente de UI e grade do compartilhamento. Vai pro navegador
 *                 e nunca importa engine.ts nem os dados de resposta.
 *
 * `P` é o que o jogador vê do desafio (puzzle), `A` a resposta e `F` o feedback de cada tentativa.
 */

/**
 * - attempts: termina em "won" (acertou) ou "lost" (acabaram as tentativas).
 * - unlimited: termina em "won" (acertou) ou "lost" (desistiu).
 * - timed: termina em "won" (completou tudo) ou "done" (o tempo acabou ou desistiu).
 * - quiz: termina em "won" (acertou todas) ou "done" (respondeu todas, errando alguma).
 * - points: termina em "won" (achou tudo) ou "done" (a pessoa encerrou com os pontos que tinha).
 * - lives: termina em "won" (resolveu) ou "lost" (errou `lives` vezes, ou desistiu).
 */
export type PlayStatus = "playing" | "won" | "lost" | "done";

/** Como uma partida termina e como o resultado é contado. */
export type GameRules =
  /** Acertar uma resposta em até N tentativas. Resultado: tentativas usadas. */
  | { type: "attempts"; maxAttempts: number }
  /** Chutes sem limite até acertar (ou desistir). Resultado: quantos chutes levou. */
  | { type: "unlimited" }
  /** Achar o máximo de itens antes do tempo acabar. Resultado: itens achados de `total`. */
  | { type: "timed"; seconds: number; total: number }
  /**
   * `total` perguntas seguidas, uma resposta cada. Resultado: acertos de `total`. Cada tentativa
   * responde a pergunta da vez, e o feedback diz se acertou em `correct` (é o que o placar conta).
   */
  | { type: "quiz"; total: number }
  /**
   * Achar itens que valem pontos, sem errar nem tempo, até achar tudo ou encerrar. Resultado: a soma
   * de `points` no feedback de cada tentativa.
   */
  | { type: "points" }
  /**
   * Montar a solução peça por peça, errando no máximo `lives - 1` vezes. Cada tentativa diz em
   * `correct` se a peça estava certa. Resultado: quantos erros.
   */
  | { type: "lives"; lives: number };

export type AttemptRules = Extract<GameRules, { type: "attempts" }>;
export type TimedRules = Extract<GameRules, { type: "timed" }>;
export type UnlimitedRules = Extract<GameRules, { type: "unlimited" }>;
export type QuizRules = Extract<GameRules, { type: "quiz" }>;
export type PointsRules = Extract<GameRules, { type: "points" }>;
export type LivesRules = Extract<GameRules, { type: "lives" }>;

export interface Guess<F = unknown> {
  input: string;
  feedback: F;
}

export type GuessCheck<F> =
  | { ok: true; feedback: F; solved: boolean }
  /** Tentativa recusada sem gastar vida; `error` é a mensagem para o jogador. */
  | { ok: false; error: string };

export interface GameEngine<P = unknown, A = unknown, F = unknown> {
  /** Desafio do dia. Deve ser determinístico para o mesmo `dateKey`. */
  createChallenge(dateKey: string): { puzzle: P; answer: A };
  /** `solved` encerra a partida com vitória (acertou / completou tudo). */
  checkGuess(input: string, answer: A, previous: readonly Guess<F>[]): GuessCheck<F>;
  /** Texto da resposta revelado no fim da partida; vazio quando não há resposta secreta. */
  describeAnswer(answer: A): string;
}

export interface GameMeta<R extends GameRules = GameRules> {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  rules: R;
  /** Cor do card do jogo (qualquer cor CSS). */
  color: string;
  /** Usa o palco largo da página do jogo (padrão: estreito, exceto jogos com tempo). */
  wide?: boolean;
  /**
   * Slug do jogo do qual este é um modo (ex.: Dupla e Quadra são modos do Palavra). Modos têm
   * desafio, partida e estatísticas próprios, mas não aparecem na rodada: ficam numa aba do jogo pai.
   */
  parent?: string;
  /** O tabuleiro já mostra a resposta no fim; o resultado não repete o "Era …". */
  hideAnswer?: boolean;
  /** Dia em que o jogo entrou no site (YYYY-MM-DD). Sem ele, a estreia do Rodada (EPOCH_DATE). */
  launchedOn?: string;
  howToPlay: string[];
  /**
   * Título e descrição para buscadores e prévias de link, com as palavras que as pessoas buscam
   * ("palavra do dia", "adivinhe a bandeira"). Não aparecem na tela; o título ganha " · Rodada".
   */
  seo: { title: string; description: string };
}

/** Estado de uma partida como a UI enxerga: sem a resposta enquanto não acabar. */
export interface PlayView<P = unknown, F = unknown> {
  slug: string;
  dateKey: string;
  number: number;
  puzzle: P;
  guesses: Guess<F>[];
  status: PlayStatus;
  /** Jogos com tempo: quando o relógio começou (ISO). Vazio = ainda não começou. */
  startedAt?: string;
  /** Preenchido só quando a partida termina. */
  answerLabel?: string;
  /** Partida de treino ("Jogar outra"): não conta para sequência nem estatísticas. */
  practice?: boolean;
}

export interface BoardProps<P = unknown, F = unknown, R extends GameRules = GameRules> {
  play: PlayView<P, F>;
  rules: R;
  /** Envia uma tentativa. Resolve com a mensagem de erro, ou null se foi aceita. */
  submitGuess(input: string): Promise<string | null>;
  /** Jogos com tempo: começa o relógio. */
  begin(): Promise<void>;
  /** Encerra a partida antes da hora: tempo esgotado ou desistência. */
  finish(): Promise<void>;
}

export interface GameDefinition<P = unknown, F = unknown, R extends GameRules = GameRules> {
  meta: GameMeta<R>;
  Board: ComponentType<BoardProps<P, F, R>>;
  /** Ilustração da capa do jogo, desenhada com `currentColor` sobre a cor do jogo. */
  Cover: ComponentType<{ className?: string }>;
  /** Resumo visual da partida terminada, mostrado no modal de resultado. */
  Recap: ComponentType<{ play: PlayView<P, F> }>;
  /** Linhas de emoji do texto compartilhado (WhatsApp); cabeçalho e link são do Rodada. */
  shareGrid(play: PlayView<P, F>): string;
}
