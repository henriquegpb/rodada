/** O Sentido não mostra nada antes do primeiro chute: o desafio é só a palavra secreta. */
export type SentidoPuzzle = Record<string, never>;

export interface SentidoFeedback {
  /** A palavra como está no vocabulário: o lema, com acento ("carros" vira "carro"). */
  word: string;
  /** Posição na lista de proximidade com a palavra secreta: 1 é ela mesma. */
  rank: number;
  /** Veio de uma dica, não de um chute. */
  hint?: true;
}
