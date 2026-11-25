import { normalize } from "@/lib/normalize";

const ARTICLES = /^(o|a|os|as|um|uma|the|el|la|los|las|le|les)\s+/;

/**
 * Chave de comparação de uma resposta: sem acento, maiúscula, pontuação, espaço, parênteses
 * ("Cascavel (Paraná)") nem artigo no começo. "O Exterminador do Futuro", "exterminador do futuro"
 * e "Exterminador-do-Futuro" viram a mesma chave; "Br'oz" e "broz" também.
 */
export function answerKey(text: string): string {
  return normalize(text)
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(ARTICLES, "")
    .replace(/ /g, "");
}

/** Palavras que não identificam nada sozinhas ("Rio", "de", "the"): fora da busca por parte do nome. */
const STOPWORDS = new Set(["dos", "das", "del", "der", "the", "and", "von", "van", "san", "santa", "santo", "sao"]);

/**
 * As palavras de um nome que servem para achá-lo pela metade ("Cocielo" em "Júlio Cocielo"): sem
 * acento, com 4 letras ou mais e fora das que aparecem em tudo.
 */
export function nameWords(text: string): string[] {
  return normalize(text)
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

/** Palavras que só ligam outras ("da", "de"): não contam na busca por parte do nome. */
const PARTICLES = new Set(["a", "o", "e", "y", "da", "de", "do", "di", "du", "la", "le", "el", "of"]);

/**
 * Todas as palavras de um nome, até as curtas ("Bia", "Zé", "MC"), sem as que só ligam outras. Na
 * busca por parte do nome, cada uma tem que estar no nome achado: "Bia Ferreira" não é o Rivaldo
 * (Rivaldo Vítor Borba Ferreira), só porque "Bia" é curta demais para procurar.
 */
export function allWords(text: string): string[] {
  return normalize(text)
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !PARTICLES.has(w));
}

/** Distância de edição (Levenshtein) com limite: devolve `max + 1` assim que passa dele. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let before: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // Duas letras trocadas de lugar ("philosohper") são um erro só, o mais comum de digitação.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], before[j - 2] + 1);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    before = prev;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Quantas letras erradas cabem numa sugestão ("Você quis dizer…?"): uma a cada 5 letras (nenhuma até
 * 4, 1 até 9, 2 até 14, 3 daí pra cima). Mais que isso sugeria outra coisa: "filosofo" virava "Filopono".
 */
export const typoBudget = (key: string) => Math.min(3, Math.floor(key.length / 5));

/** A recusa com sugestão: o motor escreve, o tabuleiro lê o nome para o botão "Usar sugestão". */
/** O que o jogo responde quando a resposta não está na lista (e não parece com nenhuma). */
export const NOT_IN_LIST = "Essa não está na lista. Tenta outra!";

export const suggestionMessage = (name: string) => `Você quis dizer “${name}”?`;

/** O nome sugerido numa mensagem de recusa, ou null se a recusa não tem sugestão. */
export function suggestionIn(error: string): string | null {
  return /^Você quis dizer “(.+)”\?$/.exec(error)?.[1] ?? null;
}
