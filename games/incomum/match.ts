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
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Quantas letras erradas cabem numa sugestão ("Você quis dizer…?"): nenhuma até 3 letras, 1 até 5,
 * 2 até 9 e 3 daí pra cima. Folgado porque a pessoa confirma antes de valer.
 */
export const typoBudget = (key: string) => (key.length <= 3 ? 0 : key.length <= 5 ? 1 : key.length <= 9 ? 2 : 3);

/** A recusa com sugestão: o motor escreve, o tabuleiro lê o nome para o botão "Usar sugestão". */
export const suggestionMessage = (name: string) => `Você quis dizer “${name}”?`;

/** O nome sugerido numa mensagem de recusa, ou null se a recusa não tem sugestão. */
export function suggestionIn(error: string): string | null {
  return /^Você quis dizer “(.+)”\?$/.exec(error)?.[1] ?? null;
}
