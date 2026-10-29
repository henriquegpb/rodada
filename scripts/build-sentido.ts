/**
 * Gera os dados do Sentido a partir de vetores de palavras abertos.
 *
 *   pnpm data:sentido
 *
 * Fontes (baixadas para data-raw/, que não é versionado):
 *  - Vetores: word2vec skip-gram 300d do NILC/USP (repositório de word embeddings em português),
 *    na cópia do Hugging Face (pt-mteb/average_pt_nilc_word2vec_skip_s300). O vocabulário vem
 *    ordenado por frequência, então baixamos só as primeiras linhas da matriz (~180 MB de 1,1 GB).
 *  - Lemas: Wiktionary em inglês, seção de português, na extração do kaikki.org (CC BY-SA). Só
 *    substantivos, adjetivos, verbos e advérbios com sentido próprio: tira nomes próprios
 *    ("Caxangá") e flexões ("carros", "correndo"), que viram a tabela de formas.
 *
 * Entrada: games/sentido/data/answers.json, as palavras secretas (lista curada à mão).
 *
 * Saídas:
 *  - games/sentido/data/words.json  vocabulário, vetores reduzidos (PCA, int8, base64) e as formas
 *                                   flexionadas comuns que as regras do engine não resolvem
 *  - games/sentido/data/near.json   para cada resposta, as palavras mais próximas na ordem exata
 *                                   do modelo completo (índices uint16, base64)
 *
 * Por que dois níveis: os vetores completos (34 mil × 300) teriam ~10 MB. Os reduzidos acertam a
 * ordem de grandeza ("3000" ou "20000"), e o topo, onde a pessoa decide o jogo, sai exato.
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { lemmaCandidates } from "../games/sentido/forms";

const ROOT = join(import.meta.dirname, "..");
const RAW = join(ROOT, "data-raw", "sentido");
const OUT = join(ROOT, "games", "sentido", "data");

const MODEL = "https://huggingface.co/pt-mteb/average_pt_nilc_word2vec_skip_s300/resolve/main/0_WordEmbeddings";
const WIKTIONARY = "https://kaikki.org/dictionary/Portuguese/kaikki.org-dictionary-Portuguese.jsonl.gz";
/** Onde começam os floats dentro do pytorch_model.bin (um zip sem compressão: pytorch_model/data/0). */
const MATRIX_OFFSET = 576;
const DIMS = 300;
/** Palavras mais frequentes do modelo consideradas. Cobre "betoneira" e "rotatório". */
const TOP_WORDS = 150_000;
/** Dimensões depois da redução. 48 erra o ranking aproximado quase tão pouco quanto 96. */
const REDUCED = 48;
/** Formas flexionadas na tabela de exceções: só as que aparecem entre as mais frequentes do modelo. */
const FORM_WORDS = 60_000;
/** Quantas palavras mais próximas de cada resposta saem na ordem exata. */
const EXACT = 500;

const WORD = /^[a-zà-úç]+(-[a-zà-úç]+)*$/;
const KINDS = new Set(["noun", "adj", "verb", "adv"]);

/**
 * Lemas (com algum sentido próprio) e, para cada forma flexionada, de que lemas ela vem.
 * Grafia alternativa ("sector", "controle") conta como lema, não como forma.
 */
async function readWiktionary(path: string) {
  const lemmas = new Set<string>();
  const formOf = new Map<string, Set<string>>();
  const lines = createInterface({ input: createReadStream(path).pipe(createGunzip()) });
  for await (const line of lines) {
    const entry: { word: string; pos?: string; senses?: { form_of?: { word: string }[] }[] } = JSON.parse(line);
    if (!entry.pos || !KINDS.has(entry.pos)) continue;
    for (const sense of entry.senses ?? []) {
      if (!sense.form_of) lemmas.add(entry.word);
      for (const { word } of sense.form_of ?? []) {
        if (!formOf.has(entry.word)) formOf.set(entry.word, new Set());
        formOf.get(entry.word)!.add(word);
      }
    }
  }
  return { lemmas, formOf };
}

async function download(file: string, url: string, range?: [number, number]) {
  const path = join(RAW, file);
  if (existsSync(path)) return path;
  console.log(`baixando ${url}`);
  const res = await fetch(url, range ? { headers: { Range: `bytes=${range[0]}-${range[1]}` } } : undefined);
  if (!res.ok) throw new Error(`falha ao baixar ${url}: ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  return path;
}

function unit(v: Float32Array) {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

function dot(a: Float32Array, b: Float32Array) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** As `k` direções de maior variância (iteração ortogonal sobre a matriz de covariância). */
function principalAxes(rows: Float32Array[], k: number): Float32Array[] {
  const d = rows[0].length;
  const cov = new Float64Array(d * d);
  for (const r of rows) {
    for (let i = 0; i < d; i++) {
      const ri = r[i];
      for (let j = i; j < d; j++) cov[i * d + j] += ri * r[j];
    }
  }
  for (let i = 0; i < d; i++) for (let j = 0; j < i; j++) cov[i * d + j] = cov[j * d + i];

  let axes = Array.from({ length: k }, (_, a) => Float64Array.from({ length: d }, (_, i) => Math.sin(a * 7.1 + i * 1.3)));
  for (let iter = 0; iter < 150; iter++) {
    axes = axes.map((q) => {
      const out = new Float64Array(d);
      for (let i = 0; i < d; i++) {
        let s = 0;
        for (let j = 0; j < d; j++) s += cov[i * d + j] * q[j];
        out[i] = s;
      }
      return out;
    });
    // Gram-Schmidt: cada eixo sem a parte dos anteriores.
    for (let a = 0; a < k; a++) {
      for (let b = 0; b < a; b++) {
        let p = 0;
        for (let i = 0; i < d; i++) p += axes[a][i] * axes[b][i];
        for (let i = 0; i < d; i++) axes[a][i] -= p * axes[b][i];
      }
      let n = 0;
      for (let i = 0; i < d; i++) n += axes[a][i] ** 2;
      n = Math.sqrt(n);
      for (let i = 0; i < d; i++) axes[a][i] /= n;
    }
  }
  return axes.map((a) => Float32Array.from(a));
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  const tokPath = await download("tok.json", `${MODEL}/whitespacetokenizer_config.json`);
  const matPath = await download("w2v_top150k.f32", `${MODEL}/pytorch_model.bin`, [
    MATRIX_OFFSET,
    MATRIX_OFFSET + TOP_WORDS * DIMS * 4 - 1,
  ]);
  const wikiPath = await download("wiktionary-pt.jsonl.gz", WIKTIONARY);

  const tok: { vocab: string[]; stop_words: string[] } = JSON.parse(readFileSync(tokPath, "utf8"));
  const matrix = new Float32Array(readFileSync(matPath).buffer.slice(0));
  const stop = new Set(tok.stop_words.map((w) => w.toLowerCase()));
  const { lemmas, formOf } = await readWiktionary(wikiPath);

  // Vocabulário: lema do dicionário, entre as palavras frequentes do modelo, sem palavras vazias.
  const picked: { word: string; row: number }[] = [];
  for (let row = 0; row < TOP_WORDS; row++) {
    const word = tok.vocab[row];
    if (WORD.test(word) && word.length >= 2 && lemmas.has(word) && !stop.has(word)) picked.push({ word, row });
  }
  // Fica na ordem de frequência do modelo: o engine usa isso para dar dicas só com palavras comuns.
  const words = picked.map((p) => p.word);
  const full = picked.map((p) => unit(matrix.slice(p.row * DIMS, (p.row + 1) * DIMS)));
  console.log(`  ${words.length} palavras no vocabulário`);

  // Vetores reduzidos: centraliza, projeta nos eixos principais, normaliza e quantiza em int8.
  const mean = new Float32Array(DIMS);
  for (const v of full) for (let i = 0; i < DIMS; i++) mean[i] += v[i] / full.length;
  const centered = full.map((v) => v.map((x, i) => x - mean[i]));
  const axes = principalAxes(centered, REDUCED);
  const packed = new Int8Array(words.length * REDUCED);
  centered.forEach((v, w) => {
    const r = unit(Float32Array.from(axes, (a) => dot(v, a)));
    for (let i = 0; i < REDUCED; i++) packed[w * REDUCED + i] = Math.round(r[i] * 127);
  });

  // Formas comuns que as regras do engine não levam ao lema certo ("vai" → "ir", "meses" → "mês").
  const index = new Map(words.map((w, i) => [w, i]));
  const frequency = new Map(tok.vocab.slice(0, TOP_WORDS).map((w, i) => [w, i]));
  const forms: Record<string, string> = {};
  for (const form of tok.vocab.slice(0, FORM_WORDS)) {
    if (index.has(form) || stop.has(form) || form.length < 3 || !WORD.test(form)) continue;
    const options = [...(formOf.get(form) ?? [])].filter((l) => index.has(l));
    if (!options.length) continue;
    if (lemmaCandidates(form).some((c) => options.includes(c))) continue;
    // Mais de um lema possível: fica o mais frequente.
    forms[form] = options.sort((a, b) => frequency.get(a)! - frequency.get(b)!)[0];
  }
  console.log(`  ${Object.keys(forms).length} formas na tabela de exceções`);

  // Respostas: o ranking exato do topo, com o modelo completo.
  const answers: string[] = JSON.parse(readFileSync(join(OUT, "answers.json"), "utf8"));
  const missing = answers.filter((a) => !index.has(a));
  if (missing.length) throw new Error(`respostas fora do vocabulário: ${missing.join(", ")}`);
  const near: Record<string, string> = {};
  for (const answer of answers) {
    const a = full[index.get(answer)!];
    const sims = full.map((v) => dot(a, v));
    const order = sims
      .map((_, i) => i)
      .filter((i) => words[i] !== answer)
      .sort((x, y) => sims[y] - sims[x])
      .slice(0, EXACT);
    near[answer] = Buffer.from(Uint16Array.from(order).buffer).toString("base64");
  }

  writeFileSync(
    join(OUT, "words.json"),
    JSON.stringify({ dims: REDUCED, words, forms, vectors: Buffer.from(packed.buffer).toString("base64") }),
  );
  writeFileSync(join(OUT, "near.json"), JSON.stringify(near));
  console.log(`  ${answers.length} respostas, ${EXACT} vizinhas exatas cada`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
