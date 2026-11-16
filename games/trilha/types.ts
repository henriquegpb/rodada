import type { Wall } from "./solver";

export interface TrilhaPuzzle {
  size: number;
  /** A casa de cada número, em ordem: o caminho começa no primeiro (o 1) e termina no último. */
  numbers: number[];
  /** Pares de casas vizinhas com uma parede no meio: o caminho não passa entre elas. */
  walls: Wall[];
}

/** O desafio com a solução: o caminho inteiro, casa por casa, do 1 até o último número. */
export interface TrilhaAnswer extends TrilhaPuzzle {
  path: number[];
}

export interface TrilhaFeedback {
  /** As casas do trecho, da primeira depois do número de onde saiu até o número em que chegou. */
  cells: number[];
  /** O trecho era o da solução. Errado, custa uma vida e o caminho volta ao número de onde saiu. */
  correct: boolean;
  /** Veio de uma dica: o trecho foi revelado, não desenhado. */
  hint?: true;
}
