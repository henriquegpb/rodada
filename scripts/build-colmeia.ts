/**
 * Gera as colmeias do dia (o Spelling Bee em português).
 *
 *   pnpm data:colmeia
 *
 * Fontes (baixadas para data-raw/, que não é versionado):
 *  - Palavras e flexões: Wiktionary em inglês, seção de português, na extração do kaikki.org
 *    (CC BY-SA). Vale lema e forma flexionada (plural, feminino, verbo conjugado), menos grafia
 *    anterior ao acordo, uso só de Portugal ou da África, palavrão e nome próprio.
 *  - Frequência: github.com/fserb/pt-br (icf), para ficar só com palavras que as pessoas usam.
 *
 * Saída: games/colmeia/data/puzzles.json, uma colmeia por dia: as 7 letras, a do meio, a lista
 * oficial (palavras comuns: contam no total, nas dicas e no "achou todas") e as extras (palavras
 * válidas menos comuns, como "ciano": valem pontos, para ninguém ter palavra de verdade recusada).
 * Tudo na grafia mais comum ("ideia", "cidadã").
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { createRng, shuffle } from "../lib/daily/seed";
import { normalize } from "../lib/normalize";
import { MIN_LENGTH, isPangram } from "../games/colmeia/score";
import { type Entry, type Sense, isCurrentBrazilian, isOffensive } from "./wiktionary";

const ROOT = join(import.meta.dirname, "..");
const RAW = join(ROOT, "data-raw");

const WIKTIONARY = "https://kaikki.org/dictionary/Portuguese/kaikki.org-dictionary-Portuguese.jsonl.gz";
const ICF = "https://raw.githubusercontent.com/fserb/pt-br/master/icf";

/** Corte de frequência do icf (menor = mais comum) da lista oficial: deixa "receio" e "cadeira". */
const COMMON = 13;
/** Corte das extras, o mesmo das palavras aceitas no Palavra: "ciano", "canônico", "pelicano". */
const ACCEPTED = 15.5;
/** Um pangrama, pelo menos, tem que ser bem conhecido: é a palavra que a pessoa persegue. */
const COMMON_PANGRAM = 12;
/** Palavras por colmeia: menos fica sem graça, mais vira trabalho braçal. */
const MIN_WORDS = 25;
const MAX_WORDS = 65;
/** Como no original, fora das colmeias: S (dobraria tudo com plural) e as letras raras. */
const EXCLUDED = new Set(["s", "k", "w", "y"]);
const PUZZLES = 400;

const WORD = /^[a-záàâãéêíóôõúüç]+$/;
const KINDS = new Set(["noun", "adj", "verb", "adv", "pron", "prep", "conj", "num", "intj", "det", "article"]);
/**
 * Palavrões que o Wiktionary não marca em todas as acepções ("porra" também é porrete). Barra a
 * palavra e tudo que vem dela ("fode", "fodido").
 */
const BLOCKED = new Set([
  "foder", "fuder", "foda", "fodido", "porra", "caralho", "buceta", "boceta", "puta", "puto", "merda",
  "bosta", "cacete", "piroca", "punheta", "xoxota", "xereca", "siririca", "viado", "cuzão", "arrombado",
  "corno", "brocha", "broxa", "rola", "pica", "pau",
]);

async function download(file: string, url: string) {
  const path = join(RAW, file);
  if (existsSync(path)) return path;
  console.log(`baixando ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`falha ao baixar ${url}: ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  return path;
}

/** A acepção vale no Brasil hoje: não é grafia antiga, uso só de fora, nem palavrão. */
const senseOk = (sense: Sense) => isCurrentBrazilian(sense) && !isOffensive(sense);

/**
 * Palavras que valem. Uma forma flexionada vale se vier de um lema que vale ("protectores" não,
 * porque "protector" é grafia antiga; "fode" não, porque "foder" é palavrão).
 */
async function readWords(path: string): Promise<{ words: Set<string>; lemmasOf: Map<string, Set<string>> }> {
  const lemmas = new Set<string>();
  const forms = new Map<string, Set<string>>();
  const names = new Set<string>();
  const lines = createInterface({ input: createReadStream(path).pipe(createGunzip()) });
  for await (const line of lines) {
    const entry: Entry = JSON.parse(line);
    if (entry.pos === "name") names.add(entry.word.toLowerCase());
    if (!entry.pos || !KINDS.has(entry.pos) || !WORD.test(entry.word)) continue;
    for (const sense of entry.senses ?? []) {
      if (!senseOk(sense)) continue;
      if (!sense.form_of) lemmas.add(entry.word);
      for (const { word } of sense.form_of ?? []) {
        if (!forms.has(entry.word)) forms.set(entry.word, new Set());
        forms.get(entry.word)!.add(word);
      }
    }
  }
  for (const word of BLOCKED) lemmas.delete(word);
  const words = new Set(lemmas);
  for (const [form, of] of forms) {
    if (BLOCKED.has(form) || [...of].some((l) => BLOCKED.has(l))) continue;
    // Forma que também é nome próprio ("ceará", de "cear") só aparece no texto por causa do nome.
    if (names.has(form) && !lemmas.has(form)) continue;
    if ([...of].some((l) => lemmas.has(l))) words.add(form);
  }
  return { words, lemmasOf: forms };
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  const { words, lemmasOf } = await readWords(await download("wiktionary-pt.jsonl.gz", WIKTIONARY));
  const icf = new Map<string, number>();
  for (const line of readFileSync(await download("ptbr-icf", ICF), "utf8").split("\n")) {
    const [word, score] = line.split(",");
    if (word) icf.set(word, Number(score));
  }

  // Forma sem frequência própria ("canônica") fica com a do lema ("canônico"), mas só para entrar
  // como extra: a lista oficial é de palavras que aparecem de fato no texto.
  const frequency = (word: string) =>
    icf.get(word) ?? Math.max(COMMON, Math.min(...[...(lemmasOf.get(word) ?? [])].map((l) => icf.get(l) ?? Infinity)));

  // Uma grafia por chave sem acento: a mais frequente ("pais" e "país" viram "pais" → "país").
  const best = new Map<string, { word: string; freq: number }>();
  for (const word of words) {
    const freq = frequency(word);
    if (freq >= ACCEPTED || word.length < MIN_LENGTH) continue;
    const key = normalize(word);
    if ([...key].some((c) => EXCLUDED.has(c))) continue;
    if (!best.has(key) || freq < best.get(key)!.freq) best.set(key, { word, freq });
  }
  const accepted = [...best.keys()];
  const keys = accepted.filter((k) => best.get(k)!.freq < COMMON);
  console.log(`  ${keys.length} palavras comuns, ${accepted.length - keys.length} extras`);

  // Cada conjunto de 7 letras que forma um pangrama comum, com cada letra possível no meio.
  const sets = new Set(
    keys.filter((k) => isPangram(k) && best.get(k)!.freq < COMMON_PANGRAM).map((k) => [...new Set(k)].sort().join("")),
  );
  const rng = createRng("colmeia:build");
  const puzzles: { letters: string; center: string; words: string[]; extra: string[] }[] = [];
  const spell = (keys: string[]) => keys.map((k) => best.get(k)!.word).sort((a, b) => a.localeCompare(b, "pt-BR"));
  for (const letters of shuffle([...sets], rng)) {
    const inSet = keys.filter((k) => [...k].every((c) => letters.includes(c)));
    const options = shuffle([...letters], rng)
      .map((center) => ({ center, found: inSet.filter((k) => k.includes(center)) }))
      .filter(({ found }) => found.length >= MIN_WORDS && found.length <= MAX_WORDS);
    if (!options.length) continue;
    const { center, found } = options[0];
    const extra = accepted.filter(
      (k) => best.get(k)!.freq >= COMMON && k.includes(center) && [...k].every((c) => letters.includes(c)),
    );
    puzzles.push({ letters, center, words: spell(found), extra: spell(extra) });
    if (puzzles.length === PUZZLES) break;
  }

  writeFileSync(join(ROOT, "games/colmeia/data/puzzles.json"), JSON.stringify(puzzles));
  console.log(`  ${puzzles.length} colmeias de ${sets.size} conjuntos de letras`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
