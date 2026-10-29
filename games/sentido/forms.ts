/**
 * Do que a pessoa digitou ao lema que está no vocabulário: "carros" → "carro", "correndo" → "correr".
 * As regras cobrem o regular; o que elas não resolvem vem numa tabela de exceções
 * (scripts/build-sentido.ts), que usa estas mesmas regras para saber o que precisa guardar.
 */

/** Fim da palavra → fim do lema. Na ordem: plurais, feminino, formas de verbo. */
const RULES: [suffix: string, lemma: string][] = [
  ["ões", "ão"],
  ["ães", "ão"],
  ["ãos", "ão"],
  ["ais", "al"],
  ["éis", "el"],
  ["eis", "il"],
  ["óis", "ol"],
  ["uis", "ul"],
  ["ns", "m"],
  ["es", ""],
  ["s", ""],
  ["as", "o"],
  ["a", "o"],
  ["ando", "ar"],
  ["endo", "er"],
  ["indo", "ir"],
  ["amos", "ar"],
  ["emos", "er"],
  ["imos", "ir"],
  ["aram", "ar"],
  ["eram", "er"],
  ["iram", "ir"],
  ["avam", "ar"],
  ["ava", "ar"],
  ["ou", "ar"],
  ["eu", "er"],
  ["iu", "ir"],
  ["ados", "ar"],
  ["adas", "ar"],
  ["ado", "ar"],
  ["ada", "ar"],
  ["idos", "er"],
  ["idos", "ir"],
  ["ido", "er"],
  ["ido", "ir"],
  ["ida", "er"],
  ["ida", "ir"],
  ["aria", "ar"],
  ["eria", "er"],
  ["iria", "ir"],
  ["ará", "ar"],
  ["erá", "er"],
  ["irá", "ir"],
  ["arão", "ar"],
  ["erão", "er"],
  ["irão", "ir"],
  ["asse", "ar"],
  ["esse", "er"],
  ["isse", "ir"],
  ["am", "ar"],
  ["em", "er"],
  ["em", "ir"],
  ["a", "ar"],
  ["e", "er"],
  ["e", "ir"],
  ["o", "ar"],
  ["o", "er"],
  ["o", "ir"],
  ["ei", "ar"],
  ["i", "er"],
  ["i", "ir"],
];

/** Lemas possíveis para uma forma flexionada, do mais provável ao menos. Quem chama vê qual existe. */
export function lemmaCandidates(word: string): string[] {
  return RULES.filter(([suffix]) => word.length > suffix.length + 1 && word.endsWith(suffix)).map(
    ([suffix, lemma]) => word.slice(0, -suffix.length) + lemma,
  );
}
