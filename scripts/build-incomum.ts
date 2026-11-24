/**
 * Gera as categorias do Incomum: para cada uma, todas as respostas aceitas, com os nomes
 * alternativos e o quão comum cada resposta é.
 *
 *   pnpm data:incomum
 *
 * Para cada categoria:
 *  1. junta candidatos de várias fontes: consultas ao Wikidata, listas e categorias da Wikipédia,
 *     IBGE (cidades), IMDb (filmes) e nomes escritos à mão em scripts/incomum-list.ts;
 *  2. confere no Wikidata se cada candidato é do tipo certo (dança, comida, especialidade médica…),
 *     o que tira o ruído das listas ("Bodas" na lista de danças, "Amazônia" na de frutas);
 *  3. junta os nomes: rótulos e apelidos do Wikidata em português e inglês e o título do artigo da
 *     Wikipédia em português;
 *  4. mede o quão comum é (a "fama"): em quantos projetos Wikimedia o item tem página, mais quantas
 *     informações o Wikidata tem sobre ele; nas cidades, a população; nos filmes e séries, os votos
 *     no IMDb.
 *
 * Quase tudo sai do serviço de consultas do Wikidata (query.wikidata.org): a API da Wikipédia
 * bloqueia o IP depois de alguns milhares de pedidos, e fica só para categorias e listas da Wikipédia.
 *
 * As respostas de todas as fontes ficam em cache em data-raw/incomum/ (não versionado); apague a
 * pasta para buscar tudo de novo.
 *
 * Saída: um arquivo por categoria em public/incomum/<id>.json (só os nomes, da mais óbvia à mais
 * rara), baixado só no dia em que a categoria cai, e o índice games/incomum/data/index.json (título,
 * total, a mais óbvia e as raras de exemplo), que vai junto com o jogo.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- respostas JSON das APIs (Wikidata, Wikipédia, IBGE), lidas campo a campo */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { createWriteStream } from "node:fs";
import { answerKey } from "../games/incomum/match";
import { TIERS, rareStart } from "../games/incomum/tiers";
import type { IncomumCategoryRef } from "../games/incomum/types";
import { CATEGORIES, type CategorySpec, type Source } from "./incomum-list";

const ROOT = join(import.meta.dirname, "..");
const RAW = join(ROOT, "data-raw", "incomum");
const CACHE = join(RAW, "cache");
const PUBLIC = join(ROOT, "public/incomum");
const INDEX = join(ROOT, "games/incomum/data/index.json");
/** Formato antigo (tudo num arquivo só): convertido na primeira rodada e apagado. */
const LEGACY = [join(ROOT, "games/incomum/data/categories.json"), join(RAW, "categories.partial.json")];
const UA = "wiki-category-builder/0.1";

mkdirSync(CACHE, { recursive: true });

// ---------- progresso ----------

const PHASES = ["buscando fontes", "lendo o Wikidata", "conferindo tipos", "juntando nomes"];
const progress = {
  index: 0,
  total: 0,
  title: "",
  phase: 0,
  requests: 0,
  retries: 0,
  started: Date.now(),
};

function setPhase(phase: number) {
  progress.phase = phase;
  renderProgress();
}

/** Uma linha: barra geral (categorias e etapa da atual), etapa, pedidos feitos e tempo. */
function renderProgress() {
  const done = progress.total ? (progress.index + progress.phase / PHASES.length) / progress.total : 0;
  const width = 24;
  const bar = "█".repeat(Math.round(done * width)).padEnd(width, "░");
  const min = Math.floor((Date.now() - progress.started) / 60_000);
  const line =
    `${bar} ${String(Math.round(done * 100)).padStart(3)}%  [${progress.index + 1}/${progress.total}] ${progress.title} · ` +
    `${PHASES[progress.phase]} · ${progress.requests} pedidos${progress.retries ? `, ${progress.retries} repetidos` : ""} · ${min} min`;
  if (process.stdout.isTTY) process.stdout.write(`\r\x1b[K${line}`);
  else console.log(line);
}

/** Linha fixa (resultado de uma categoria) sem misturar com a barra. */
function logLine(text: string) {
  if (process.stdout.isTTY) process.stdout.write("\r\x1b[K");
  console.log(text);
}

// ---------- rede, com cache em disco e nova tentativa ----------

/** Intervalo mínimo entre pedidos ao mesmo servidor: as APIs da Wikimedia devolvem 429 se correr. */
const MIN_GAP_MS: Record<string, number> = {
  "wikimedia.org": 120,
  "query.wikidata.org": 500,
  "pt.wikipedia.org": 250,
  "en.wikipedia.org": 250,
  "www.wikidata.org": 150,
};
const nextSlot = new Map<string, number>();

async function throttle(host: string) {
  const gap = MIN_GAP_MS[host] ?? 50;
  const now = Date.now();
  const slot = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, slot + gap);
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}

async function getJson<T = any>(url: string): Promise<T> {
  const file = join(CACHE, createHash("sha1").update(url).digest("hex") + ".json");
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const host = new URL(url).host;
  for (let attempt = 0; ; attempt++) {
    await throttle(host);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(90_000),
    }).catch(
      // Sem resposta (tempo esgotado, conexão caiu): conta como 599, o "timeout de rede" convencional.
      () =>
        ({
          ok: false,
          status: 599,
          headers: new Headers(),
        }) as unknown as Response,
    );
    if (res.ok) {
      // A conexão às vezes cai no meio da resposta: tenta de novo.
      const data = await res.json().catch(() => undefined);
      if (data !== undefined) {
        writeFileSync(file, JSON.stringify(data));
        progress.requests++;
        return data;
      }
      // O Wikidata responde 200 e corta o JSON no meio quando a consulta estoura o tempo: repetir
      // não adianta, então desiste na segunda vez.
      if (attempt >= 1) throw new Error(`JSON cortado ${url}`);
      continue;
    }
    // Recurso que não existe: a API responde 404.
    if (res.status === 404) {
      writeFileSync(file, "null");
      return null as T;
    }
    // Limite de pedidos (429): espera o que o servidor pedir, sem gastar tentativa. No pior caso
    // (o Wikidata já limitou a 1 pedido por minuto), quem segura é o limite de tempo da categoria.
    if (res.status === 429) attempt--;
    // Consulta que estoura o tempo do Wikidata vai estourar de novo: desiste cedo.
    const timedOut = res.status === 599 || res.status === 500 || res.status === 504;
    if (attempt >= 8 || (timedOut && attempt >= 1)) throw new Error(`${res.status} ${url}`);
    const retryAfter = Math.min(300_000, Number(res.headers.get("retry-after")) * 1000);
    progress.retries++;
    await new Promise((r) => setTimeout(r, retryAfter || Math.min(60_000, 2000 * 2 ** Math.max(0, attempt))));
  }
}

/** Roda `fn` em cada item com no máximo `limit` ao mesmo tempo. */
async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const chunk = <T>(items: readonly T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

// ---------- Wikidata ----------

const qidOf = (uri: string) => uri.slice(uri.lastIndexOf("/") + 1);

async function sparql(query: string): Promise<Record<string, string>[]> {
  const url = "https://query.wikidata.org/sparql?" + new URLSearchParams({ query, format: "json" });
  const data = await getJson(url);
  return data.results.bindings.map((row: Record<string, { value: string }>) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v.value])),
  );
}

interface Entity {
  id: string;
  labels: Record<string, string>;
  aliases: string[];
  claims: { P495: string[]; P17: string[]; P105: string[] };
  /** Só ptwiki e enwiki. */
  sitelinks: Record<string, string>;
  /** Em quantos projetos Wikimedia (quase todos Wikipédias) o item tem página. */
  wikis: number;
  /** Quantas informações o Wikidata tem sobre o item: desempata o que só o Brasil conhece. */
  statements: number;
}

const LANGS = ["pt-br", "pt", "en"];

/**
 * Nomes, apelidos, artigos, país e fama de cada item, 200 por consulta ao Wikidata. Pela consulta
 * (query.wikidata.org) e não pela API da Wikipédia/Wikidata, que bloqueia o IP depois de alguns
 * milhares de pedidos.
 */
async function entities(ids: string[]): Promise<Map<string, Entity>> {
  const out = new Map<string, Entity>();
  for (const batch of chunk([...new Set(ids)], 200)) {
    const rows = await sparql(`SELECT ?x ?ptbr ?pt ?en ?ptTitle ?enTitle ?links ?statements
        (GROUP_CONCAT(DISTINCT ?alias; separator="|") AS ?aliases)
        (GROUP_CONCAT(DISTINCT ?country; separator=" ") AS ?countries)
        (GROUP_CONCAT(DISTINCT ?origin; separator=" ") AS ?origins)
        (GROUP_CONCAT(DISTINCT ?rank; separator=" ") AS ?ranks)
      WHERE {
        VALUES ?x { ${batch.map((id) => `wd:${id}`).join(" ")} }
        OPTIONAL { ?x rdfs:label ?ptbr. FILTER(LANG(?ptbr) = "pt-br") }
        OPTIONAL { ?x rdfs:label ?pt. FILTER(LANG(?pt) = "pt") }
        OPTIONAL { ?x rdfs:label ?en. FILTER(LANG(?en) = "en") }
        OPTIONAL { ?x skos:altLabel ?alias. FILTER(LANG(?alias) IN ("pt-br", "pt", "en")) }
        OPTIONAL { ?pa schema:about ?x; schema:isPartOf <https://pt.wikipedia.org/>; schema:name ?ptTitle. }
        OPTIONAL { ?ea schema:about ?x; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enTitle. }
        OPTIONAL { ?x wikibase:sitelinks ?links. }
        OPTIONAL { ?x wikibase:statements ?statements. }
        OPTIONAL { ?x wdt:P17 ?country. }
        OPTIONAL { ?x wdt:P495 ?origin. }
        OPTIONAL { ?x wdt:P105 ?rank. }
      } GROUP BY ?x ?ptbr ?pt ?en ?ptTitle ?enTitle ?links ?statements`);
    for (const row of rows) {
      const id = qidOf(row.x);
      if (out.has(id)) continue;
      const qids = (v?: string) => (v ? v.split(" ").filter(Boolean).map(qidOf) : []);
      out.set(id, {
        id,
        labels: Object.fromEntries(
          [
            ["pt-br", row.ptbr],
            ["pt", row.pt],
            ["en", row.en],
          ].filter((pair): pair is [string, string] => Boolean(pair[1])),
        ),
        aliases: row.aliases ? row.aliases.split("|") : [],
        claims: {
          P17: qids(row.countries),
          P495: qids(row.origins),
          P105: qids(row.ranks),
        },
        sitelinks: Object.fromEntries(
          [
            ["ptwiki", row.ptTitle],
            ["enwiki", row.enTitle],
          ].filter((pair) => Boolean(pair[1])),
        ),
        wikis: Number(row.links ?? 0),
        statements: Number(row.statements ?? 0),
      });
    }
  }
  return out;
}

/** Dos `ids`, os que são instância (ou subclasse) de alguma das `classes`, subindo pela árvore. */
async function ofClasses(ids: string[], classes: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  const values = classes.map((c) => `wd:${c}`).join(" ");
  await mapLimit(chunk([...new Set(ids)], 150), 2, async (batch) => {
    const rows = await sparql(
      `SELECT DISTINCT ?x WHERE { VALUES ?x { ${batch.map((id) => `wd:${id}`).join(" ")} }
         VALUES ?c { ${values} }
         { ?x wdt:P31/wdt:P279* ?c } UNION { ?x wdt:P279+ ?c } }`,
    );
    for (const row of rows) out.add(qidOf(row.x));
  });
  return out;
}

// ---------- Wikipédia ----------

const wikiApi = (lang: string, params: Record<string, string>) =>
  getJson(
    `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params }),
  );

/** Artigos de uma categoria, descendo `depth` níveis de subcategoria. */
async function categoryMembers(
  lang: string,
  title: string,
  depth: number,
  seen = new Set<string>(),
): Promise<string[]> {
  if (seen.has(title)) return [];
  seen.add(title);
  const pages: string[] = [];
  let cont: Record<string, string> = {};
  do {
    const data = await wikiApi(lang, {
      action: "query",
      list: "categorymembers",
      cmtitle: title,
      cmlimit: "500",
      cmnamespace: "0|14",
      ...cont,
    });
    for (const m of data?.query?.categorymembers ?? []) {
      if (m.ns === 0) pages.push(m.title);
      else if (depth > 0) pages.push(...(await categoryMembers(lang, m.title, depth - 1, seen)));
    }
    cont = data?.continue ?? {};
  } while (cont.cmcontinue);
  return pages;
}

/** Artigos ligados a partir de uma página (ex.: "Lista de frutas"). */
async function pageLinks(lang: string, title: string): Promise<string[]> {
  const out: string[] = [];
  let cont: Record<string, string> = {};
  do {
    const data = await wikiApi(lang, {
      action: "query",
      prop: "links",
      titles: title,
      pllimit: "500",
      plnamespace: "0",
      redirects: "1",
      ...cont,
    });
    for (const p of data?.query?.pages ?? []) out.push(...(p.links ?? []).map((l: any) => l.title));
    cont = data?.continue ?? {};
  } while (cont.plcontinue);
  return out;
}

/**
 * Item do Wikidata de cada título (seguindo redirecionamentos). Título sem item fica de fora; com
 * `skipDisambiguation`, página de desambiguação também ("Coral" não é a cobra-coral).
 */
async function titlesToQids(lang: string, titles: string[], skipDisambiguation = false): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ppprop = skipDisambiguation ? "wikibase_item|disambiguation" : "wikibase_item";
  await mapLimit(chunk([...new Set(titles)], 50), 4, async (batch) => {
    const data = await wikiApi(lang, {
      action: "query",
      prop: "pageprops",
      ppprop,
      titles: batch.join("|"),
      redirects: "1",
    });
    const back = new Map<string, string[]>();
    for (const t of batch) back.set(t, [t]);
    for (const r of [...(data?.query?.normalized ?? []), ...(data?.query?.redirects ?? [])]) {
      back.set(r.to, [...(back.get(r.to) ?? []), ...(back.get(r.from) ?? [r.from])]);
    }
    for (const p of data?.query?.pages ?? []) {
      const qid = p.pageprops?.wikibase_item;
      if (skipDisambiguation && p.pageprops && "disambiguation" in p.pageprops) continue;
      if (qid) for (const t of back.get(p.title) ?? [p.title]) out.set(t, qid);
    }
  });
  return out;
}

// ---------- fontes específicas ----------

/** Municípios com população no Censo 2022 (IBGE, tabela 4709). */
async function ibgeCities(uf: number | "all", minPopulation: number) {
  const where = uf === "all" ? "N6[all]" : `N6[N3[${uf}]]`;
  const url = `https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=${where}`;
  const data = await getJson(url);
  return (data[0].resultados[0].series as any[])
    .map((s) => ({
      code: s.localidade.id as string,
      name: (s.localidade.nome as string).replace(/ - [A-Z]{2}$/, ""),
      population: Number(s.serie["2022"]),
    }))
    .filter((c) => c.population >= minPopulation);
}

async function download(file: string, url: string) {
  const path = join(RAW, file);
  if (existsSync(path)) return path;
  logLine(`baixando ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(path));
  return path;
}

async function* tsv(path: string) {
  const lines = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Infinity,
  });
  let header: string[] | undefined;
  for await (const line of lines) {
    const cols = line.split("\t");
    if (!header) header = cols;
    else yield Object.fromEntries(header.map((h, i) => [h, cols[i]]));
  }
}

interface ImdbTitle {
  imdb: string;
  type: string;
  title: string;
  original: string;
  genres: string[];
  votes: number;
}

/** Piso de votos do índice: nenhuma categoria pede menos que isso. */
const IMDB_FLOOR = 10_000;
let imdbIndex: Promise<ImdbTitle[]> | undefined;

/** Filmes e séries do IMDb com pelo menos IMDB_FLOOR avaliações (datasets.imdbws.com), lido uma vez. */
function loadImdb() {
  imdbIndex ??= (async () => {
    const ratingsPath = await download("title.ratings.tsv.gz", "https://datasets.imdbws.com/title.ratings.tsv.gz");
    const basicsPath = await download("title.basics.tsv.gz", "https://datasets.imdbws.com/title.basics.tsv.gz");
    const votes = new Map<string, number>();
    for await (const r of tsv(ratingsPath))
      if (Number(r.numVotes) >= IMDB_FLOOR) votes.set(r.tconst, Number(r.numVotes));
    const out: ImdbTitle[] = [];
    for await (const b of tsv(basicsPath)) {
      if (!votes.has(b.tconst) || !["movie", "tvSeries", "tvMiniSeries"].includes(b.titleType)) continue;
      out.push({
        imdb: b.tconst,
        type: b.titleType,
        title: b.primaryTitle,
        original: b.originalTitle,
        genres: b.genres.split(","),
        votes: votes.get(b.tconst)!,
      });
    }
    return out;
  })();
  return imdbIndex;
}

/** Títulos do IMDb de um tipo ("movie" ou "series") e gênero (opcional) com pelo menos `minVotes`. */
async function imdbTitles(type: "movie" | "series", genre: string | undefined, minVotes: number) {
  const types = type === "movie" ? ["movie"] : ["tvSeries", "tvMiniSeries"];
  return (await loadImdb()).filter(
    (t) => types.includes(t.type) && t.votes >= minVotes && (!genre || t.genres.includes(genre)),
  );
}

// ---------- montagem ----------

export interface Item {
  /** Como a resposta aparece na tela. */
  name: string;
  /** Todos os nomes aceitos (o `name` incluso), já sem repetir chave. */
  names: string[];
  /** Quão comum: a fama (Wikipédias com artigo + tamanho do artigo) ou votos no IMDb. Maior = mais óbvia. */
  views: number;
}

interface Candidate {
  qid?: string;
  /** Nome escolhido pela fonte (IBGE, IMDb, lista à mão); sem ele, vem do Wikidata. */
  name?: string;
  extraNames?: string[];
  /** Popularidade dada pela fonte (votos no IMDb); sem ela, a fama na Wikipédia. */
  views?: number;
  /** Veio de uma consulta que já garante o tipo certo: não passa pela conferência de tipo. */
  trusted?: boolean;
  /** Veio da lista à mão: nome que todo mundo fala. */
  fromList?: boolean;
  /** Posição na lista à mão (as listas `ordered` vêm da mais comum à menos comum). */
  listIndex?: number;
  /** Lista à mão: o artigo de cada nome, na ordem. Fica o primeiro do tipo certo. */
  options?: string[];
}

/** Espécie, gênero, variedade, subespécie, cultivar. */
const TAXON_RANKS = new Set(["Q7432", "Q34740", "Q767728", "Q68947", "Q4886"]);

const stripParens = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();

async function collect(source: Source): Promise<Candidate[]> {
  switch (source.kind) {
    case "sparql":
      // ?pop opcional: popularidade dada pela consulta (ex.: em quantas Wikipédias o item tem artigo).
      return (await sparql(source.query)).map((r) => ({
        qid: qidOf(r.x),
        trusted: true,
        views: r.pop ? Number(r.pop) : undefined,
      }));
    case "category": {
      const titles = (
        await Promise.all(source.titles.map((t) => categoryMembers(source.lang ?? "pt", t, source.depth ?? 1)))
      ).flat();
      return [...(await titlesToQids(source.lang ?? "pt", titles)).values()].map((qid) => ({ qid }));
    }
    case "links": {
      const titles = (await Promise.all(source.titles.map((t) => pageLinks(source.lang ?? "pt", t)))).flat();
      return [...(await titlesToQids(source.lang ?? "pt", titles)).values()].map((qid) => ({ qid }));
    }
    case "manual": {
      // Nomes à mão: o primeiro é o que aparece na tela; o artigo da Wikipédia é o do primeiro nome
      // que tiver um (para a fama e os apelidos). Com `classes` na categoria, o primeiro do tipo
      // certo: "Barcelona" é a cidade, "FC Barcelona" é o time.
      const qids = await titlesToQids("pt", source.items.flat(), true);
      return source.items.map(([title, ...extra], listIndex) => {
        const options = [...new Set([title, ...extra].flatMap((t) => (qids.has(t) ? [qids.get(t)!] : [])))];
        return {
          qid: options[0],
          options,
          name: stripParens(title),
          extraNames: extra,
          fromList: true,
          listIndex,
        };
      });
    }
    case "ibge": {
      const cities = await ibgeCities(source.uf, source.minPopulation);
      const rows = await sparql(
        `SELECT ?x ?code WHERE { VALUES ?code { ${cities.map((c) => `"${c.code}"`).join(" ")} } ?x wdt:P1585 ?code }`,
      );
      const byCode = new Map(rows.map((r) => [r.code, qidOf(r.x)]));
      // A população mede melhor que a fama: quem pensa em cidade lembra primeiro das grandes.
      return cities.map((c) => ({
        qid: byCode.get(c.code),
        name: c.name,
        views: c.population,
      }));
    }
    case "imdb": {
      const movies = await imdbTitles(source.type ?? "movie", source.genre, source.minVotes);
      const ids = new Map<string, string>();
      for (const batch of chunk(movies, 200)) {
        const rows = await sparql(
          `SELECT ?x ?imdb WHERE { VALUES ?imdb { ${batch.map((m) => `"${m.imdb}"`).join(" ")} } ?x wdt:P345 ?imdb }`,
        );
        // Mais de um item com o mesmo IMDb (relançamento, versão estendida): fica o mais antigo, que é o filme.
        for (const r of rows) {
          const qid = qidOf(r.x);
          const prev = ids.get(r.imdb);
          if (!prev || Number(qid.slice(1)) < Number(prev.slice(1))) ids.set(r.imdb, qid);
        }
      }
      return movies.map((m) => ({
        qid: ids.get(m.imdb),
        extraNames: [m.title, m.original],
        views: m.votes,
        name: undefined,
      }));
    }
  }
}

function displayName(e: Entity | undefined, fallback?: string): string | undefined {
  if (fallback) return fallback;
  if (!e) return undefined;
  const pt = e.sitelinks.ptwiki ? stripParens(e.sitelinks.ptwiki) : undefined;
  const name = pt ?? e.labels["pt-br"] ?? e.labels.pt ?? e.labels.en;
  return name && name[0].toUpperCase() + name.slice(1);
}

async function buildCategory(spec: CategorySpec) {
  setPhase(0);
  const candidates = (
    await Promise.all(
      spec.sources.map((source) =>
        collect(source).catch((err) => {
          // Fonte extra que estoura o tempo não derruba a categoria; a principal derruba.
          if (!("optional" in source && source.optional)) throw err;
          logLine(`  ${spec.id}: fonte opcional falhou (${(err as Error).message.slice(0, 80)})`);
          return [];
        }),
      ),
    )
  ).flat();
  setPhase(1);
  const info = await entities(candidates.flatMap((c) => c.options ?? (c.qid ? [c.qid] : [])));

  // Tipo certo e fora das exclusões (ex.: dança brasileira em "danças do mundo sem brasileiras").
  setPhase(2);
  // Só quem não veio de consulta de confiança precisa de conferência: com o Wikidata limitando
  // pedidos, conferir as 8 mil espécies de uma categoria levaria uma hora.
  const unchecked = candidates.flatMap((c) => (c.trusted ? [] : (c.options ?? (c.qid ? [c.qid] : []))));
  const typed = spec.classes
    ? await ofClasses(
        unchecked.filter((q) => info.has(q)),
        spec.classes,
      )
    : undefined;
  const excluded = spec.excludeClasses ? await ofClasses([...info.keys()], spec.excludeClasses) : new Set<string>();
  if (spec.exclude) {
    for (const src of spec.exclude) for (const c of await collect(src)) if (c.qid) excluded.add(c.qid);
  }
  // Lista à mão: fica o primeiro artigo do tipo certo; sem nenhum, o nome entra sem artigo.
  if (typed) {
    for (const c of candidates) {
      if (c.options) c.qid = c.options.find((q) => typed.has(q));
    }
  }
  const keep = (c: Candidate) => {
    if (!c.qid) return Boolean(c.name);
    const e = info.get(c.qid);
    if (!e || excluded.has(c.qid)) return false;
    if (spec.excludeCountry && [...e.claims.P495, ...e.claims.P17].includes(spec.excludeCountry)) return false;
    // Fontes de confiança (IBGE, IMDb, lista à mão) não precisam passar pela conferência de tipo.
    if (c.name !== undefined || c.views !== undefined) return true;
    // Táxon só vale como espécie, gênero ou variedade: família ("Annonaceae") não é fruta. Nos
    // bichos vale qualquer nível: morcego é uma ordem, formiga é uma família.
    if (!spec.anyRank && e.claims.P105.length && !e.claims.P105.some((r) => TAXON_RANKS.has(r))) return false;
    if (!e.sitelinks.ptwiki && !(spec.allowEnglishOnly && e.sitelinks.enwiki)) return false;
    // Página de lista da Wikipédia ("Lista de favelas da cidade do Rio de Janeiro") não é resposta.
    if (/^(Lista|List) (de|of) /.test(e.sitelinks.ptwiki ?? e.sitelinks.enwiki ?? "")) return false;
    return c.trusted || !typed || typed.has(c.qid);
  };

  // Junta candidatos do mesmo item vindos de fontes diferentes.
  const merged = new Map<string, Candidate>();
  for (const c of candidates.filter(keep)) {
    const id = c.qid ?? `manual:${c.name}`;
    const prev = merged.get(id);
    merged.set(id, {
      qid: c.qid,
      name: prev?.name ?? c.name,
      // O nome à mão de quem chega depois vira apelido: "Marimbondo" leva ao mesmo artigo que "Vespa".
      extraNames: [...(prev?.extraNames ?? []), ...(prev && c.name ? [c.name] : []), ...(c.extraNames ?? [])],
      views: prev?.views ?? c.views,
      trusted: prev?.trusted || c.trusted,
      fromList: prev?.fromList || c.fromList,
      listIndex: Math.min(prev?.listIndex ?? Infinity, c.listIndex ?? Infinity),
    });
  }

  const list = [...merged.values()];
  setPhase(3);

  const items: (Item & { fromList: boolean; listIndex: number })[] = list.flatMap((c) => {
    const e = c.qid ? info.get(c.qid) : undefined;
    const name = displayName(e, c.name) ?? c.extraNames?.[0];
    // Item sem nome em português nem inglês: ninguém vai digitar.
    if (!name) return [];
    const pt = e?.sitelinks.ptwiki;
    const raw = [
      name,
      ...(c.extraNames ?? []),
      ...(e ? [...LANGS.map((l) => e.labels[l]), ...e.aliases] : []),
      ...(pt ? [pt] : []),
    ];
    const seen = new Set<string>();
    const names = raw.filter((n): n is string => {
      if (!n) return false;
      const key = answerKey(n);
      if (key.length < 2 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Fama: em quantos projetos Wikimedia tem página, mais 1 a cada 10 informações no Wikidata
    // (desempata o que só o Brasil conhece: novelas, bairros, cidades do interior).
    const views = c.views ?? (e ? e.wikis + Math.round(e.statements / 10) : -1);
    return [{ name, names, views, fromList: Boolean(c.fromList), listIndex: c.listIndex ?? Infinity }];
  });

  const byFame = (a: { views: number; name: string }, b: { views: number; name: string }) =>
    b.views - a.views || a.name.localeCompare(b.name, "pt");
  const total = Math.min(items.length, MAX_ITEMS);
  const fromList = items.filter((i) => i.fromList);

  if (spec.ordered) {
    // Lista escrita da mais comum à menos comum: vale o mais comum entre a posição na lista e a fama
    // (serrote tem pouca Wikipédia, mas todo mundo fala; tesoura vem tarde na lista, mas é famosa).
    const fameRank = new Map([...items].sort(byFame).map((item, i) => [item, i]));
    const score = (item: (typeof items)[number]) => Math.min(item.listIndex, fameRank.get(item)!);
    items.sort((a, b) => score(a) - score(b) || fameRank.get(a)! - fameRank.get(b)!);
  } else {
    // Nome da lista à mão é o que todo mundo fala: nunca passa do recife (os primeiros 15%). Pesa
    // quando a categoria mistura a lista com milhares de espécies, em que a lagartixa perde em fama
    // para bicho que ninguém conhece. Sem artigo na Wikipédia ("sapo-cururu"), fica no limite.
    const others = items.filter((i) => !i.fromList && i.views >= 0).sort(byFame);
    const room = Math.max(0, Math.floor(total * TIERS[1].upTo) - fromList.length - 1);
    const floor = others.length ? others[Math.min(room, others.length - 1)].views + 0.5 : 0;
    for (const item of fromList) item.views = item.views < 0 ? floor : Math.max(item.views, floor);
    for (const item of items) if (item.views < 0) item.views = 0;
    items.sort(byFame);
  }

  return {
    id: spec.id,
    title: spec.title,
    items: items.slice(0, MAX_ITEMS).map(({ name, names, views }) => ({ name, names, views })),
  };
}

/** Tempo máximo de uma categoria. As mais longas levam uns 5 min. */
const CATEGORY_LIMIT_MIN = 15;

/** Categoria com menos respostas que isso não entra no sorteio: ficaria fácil achar a rara. */
const MIN_ITEMS = 25;
/** Além disso, só espécies e nomes que ninguém digita: corta para o arquivo do dia ficar leve. */
const MAX_ITEMS = 3000;
const MAX_ALIASES = 8;

/** Uma resposta no arquivo da categoria: [nome na tela, ...outros nomes que valem]. */
type Compact = string[];

function writeCategory(id: string, items: Item[]) {
  const compact: Compact[] = items
    .slice(0, MAX_ITEMS)
    .map((i) => [i.name, ...i.names.filter((n) => n !== i.name).slice(0, MAX_ALIASES)]);
  writeFileSync(join(PUBLIC, `${id}.json`), JSON.stringify(compact));
}

/** O índice que vai com o jogo, montado dos arquivos de categoria que existem. */
function writeIndex() {
  const index: IncomumCategoryRef[] = [];
  for (const spec of CATEGORIES) {
    const file = join(PUBLIC, `${spec.id}.json`);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    const items: Compact[] = JSON.parse(text);
    if (items.length < MIN_ITEMS) continue;
    const first = rareStart(items.length);
    index.push({
      id: spec.id,
      title: spec.title,
      total: items.length,
      obvious: items[0][0],
      rare: items.slice(first, first + 3).map((i) => i[0]),
      // Muda quando o arquivo muda: o navegador não usa a versão velha do cache.
      v: createHash("sha1").update(text).digest("hex").slice(0, 10),
    });
  }
  // Categoria tirada da lista: o arquivo sai junto.
  const ids = new Set(CATEGORIES.map((c) => c.id));
  for (const f of readdirSync(PUBLIC)) {
    if (f.endsWith(".json") && !ids.has(f.slice(0, -5))) rmSync(join(PUBLIC, f));
  }
  writeFileSync(INDEX, JSON.stringify(index, null, 1) + "\n");
  return index.length;
}

/** Converte o arquivo único antigo em um arquivo por categoria. */
function migrateLegacy() {
  for (const file of LEGACY) {
    if (!existsSync(file)) continue;
    const old: { id: string; items: Item[] }[] = JSON.parse(readFileSync(file, "utf8"));
    for (const c of old) {
      if (!existsSync(join(PUBLIC, `${c.id}.json`))) writeCategory(c.id, c.items);
    }
    rmSync(file);
  }
}

async function main() {
  // Sem argumento, todas; com ids ("pnpm data:incomum prato-nordeste"), só essas. Cada categoria é
  // gravada assim que fica pronta: se a rodada cair, as prontas ficam.
  const only = process.argv.slice(2);
  mkdirSync(PUBLIC, { recursive: true });
  migrateLegacy();
  const todo = CATEGORIES.filter((spec) => !only.length || only.includes(spec.id));
  progress.total = todo.length;
  const timer = setInterval(renderProgress, process.stdout.isTTY ? 500 : 10_000);
  const failed: string[] = [];
  for (const spec of todo) {
    progress.title = spec.title;
    let cat;
    try {
      // Nada pode travar a rodada: categoria que passa do limite falha e a próxima começa.
      cat = await Promise.race([
        buildCategory(spec),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`passou de ${CATEGORY_LIMIT_MIN} min`)),
            CATEGORY_LIMIT_MIN * 60_000,
          ).unref();
        }),
      ]);
    } catch (err) {
      // Uma consulta que estoura o tempo não derruba as outras: a categoria fica como estava.
      progress.index++;
      failed.push(spec.id);
      logLine(`${spec.id}: FALHOU (${(err as Error).message.slice(0, 120)})`);
      continue;
    }
    progress.index++;
    const aliases = cat.items.reduce((s, i) => s + i.names.length, 0);
    logLine(`${cat.id}: ${cat.items.length} respostas, ${aliases} nomes aceitos`);
    logLine(
      `  mais comuns: ${cat.items
        .slice(0, 8)
        .map((i) => i.name)
        .join(", ")}`,
    );
    logLine(
      `  mais raras:  ${cat.items
        .slice(-8)
        .map((i) => i.name)
        .join(", ")}`,
    );
    const missing = (spec.mustHave ?? []).filter(
      (name) => !cat.items.some((i) => i.names.some((n) => answerKey(n) === answerKey(name))),
    );
    if (missing.length) logLine(`  FALTANDO: ${missing.join(", ")}`);
    writeCategory(cat.id, cat.items);
  }
  // O índice só muda no fim: regravá-lo recarrega o jogo no `next dev` no meio da partida.
  const count = writeIndex();
  clearInterval(timer);
  logLine(
    `pronto: ${todo.length - failed.length} de ${todo.length} categorias montadas; ${count} no sorteio (${INDEX})`,
  );
  if (failed.length) logLine(`falharam: ${failed.join(" ")}`);
}

// Sai na hora: categoria que passou do limite de tempo pode ter deixado pedidos pendurados, e eles
// segurariam o processo aberto depois do "pronto".
main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
