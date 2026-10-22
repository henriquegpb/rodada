import type { EloGroup, EloLevel } from "./types";

/** Um chute é uma string só (`submitGuess`): as 4 palavras separadas por isto. */
export const GUESS_SEPARATOR = "|";

const GROUP_SEPARATOR = " · ";
const LABEL_SEPARATOR = ": ";
const WORD_SEPARATOR = ", ";

/**
 * Os grupos em texto, na ordem de nível: "Frutas: MANGA, CAJU, PERA, FIGO · …".
 * É o que aparece como resposta no fim da partida.
 */
export function formatGroups(groups: readonly EloGroup[]): string {
  return groups.map((g) => `${g.label}${LABEL_SEPARATOR}${g.words.join(WORD_SEPARATOR)}`).join(GROUP_SEPARATOR);
}

/**
 * O caminho de volta: a resposta é tudo o que o tabuleiro recebe do desafio quando a pessoa desiste,
 * e é daqui que ele remonta os grupos que faltaram.
 */
export function parseGroups(text: string): EloGroup[] {
  return text.split(GROUP_SEPARATOR).map((part, i) => {
    const at = part.indexOf(LABEL_SEPARATOR);
    return {
      label: part.slice(0, at),
      level: i as EloLevel,
      words: part.slice(at + LABEL_SEPARATOR.length).split(WORD_SEPARATOR),
    };
  });
}

/** Nada que separa o texto pode aparecer dentro de um rótulo ou palavra (checado nos testes). */
export const SEPARATORS = [GUESS_SEPARATOR, GROUP_SEPARATOR, LABEL_SEPARATOR, WORD_SEPARATOR];
