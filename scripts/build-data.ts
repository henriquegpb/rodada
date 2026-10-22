/**
 * Gera os dados versionados dos jogos a partir das fontes abertas.
 *
 *   pnpm data:build
 *
 * Fontes (baixadas para data-raw/, que não é versionado):
 *  - Palavras: github.com/fserb/pt-br (MIT) — léxico, conjugações e frequência.
 *  - Países: Natural Earth 1:50m admin 0 (domínio público).
 *  - Bandeiras: pacote flag-icons (MIT).
 *  - Nomes em PT-BR: Unicode CLDR via Intl.DisplayNames.
 *
 * Saídas:
 *  - games/palavra/data/valid.json   palavras aceitas como tentativa
 *  - games/_shared/geo/countries.json
 *  - games/pais/data/shapes.json     silhuetas em path SVG (viewBox 0 0 100 100)
 *  - games/mundo/data/map.json       mapa-múndi: um path por país, ou um ponto para os minúsculos
 *  - public/flags/<code>.svg
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { geoArea, geoAzimuthalEqualArea, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import { normalize } from "../lib/normalize";
import { COUNTRY_ALIASES, COUNTRY_NAME_OVERRIDES, COUNTRY_CODES } from "./country-list";

const ROOT = join(import.meta.dirname, "..");
const RAW = join(ROOT, "data-raw");

const SOURCES: Record<string, string> = {
  "ptbr-lexico": "https://raw.githubusercontent.com/fserb/pt-br/master/lexico",
  "ptbr-conjugacoes": "https://raw.githubusercontent.com/fserb/pt-br/master/conjuga%C3%A7%C3%B5es",
  "ptbr-icf": "https://raw.githubusercontent.com/fserb/pt-br/master/icf",
  "ne_50m.geojson":
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
  "ne_110m.geojson":
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
};

async function fetchSources() {
  mkdirSync(RAW, { recursive: true });
  for (const [file, url] of Object.entries(SOURCES)) {
    const path = join(RAW, file);
    if (existsSync(path)) continue;
    console.log(`baixando ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`falha ao baixar ${url}: ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
}

const readLines = (file: string) =>
  readFileSync(join(RAW, file), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function writeJson(path: string, data: unknown) {
  writeFileSync(join(ROOT, path), JSON.stringify(data) + "\n");
  console.log(`✓ ${path}`);
}

// ---------------------------------------------------------------- palavras

/** Corte de raridade do corpus: acima disso só entra se estiver no léxico ou nas conjugações. */
const ICF_CUTOFF = 15.5;
const WORD_RE = /^[a-záàâãéêíóôõúüç]{5}$/;

function buildWords() {
  const icf = new Map<string, number>();
  for (const line of readLines("ptbr-icf")) {
    const [word, score] = line.split(",");
    icf.set(word, Number(score));
  }
  const lexico = readLines("ptbr-lexico");
  const pool = new Set<string>();
  for (const w of [...lexico, ...readLines("ptbr-conjugacoes")]) {
    if (WORD_RE.test(w)) pool.add(w);
  }
  // O léxico só tem a forma base; os plurais regulares são gerados: mesa → mesas, mar → mares.
  for (const w of lexico) {
    if (/^[a-zçãõáéíóúâêô]{4}$/.test(w) && /[aeiouáéíóúâêô]$/.test(w)) pool.add(`${w}s`);
    if (/^[a-zç]{3}$/.test(w) && /[rz]$/.test(w)) pool.add(`${w}es`);
  }
  for (const [w, score] of icf) if (score < ICF_CUTOFF && WORD_RE.test(w)) pool.add(w);

  // Respostas são curadas à mão e sempre válidas.
  const answers: string[] = JSON.parse(
    readFileSync(join(ROOT, "games/palavra/data/answers.json"), "utf8"),
  );
  for (const a of answers) pool.add(a);

  // Uma grafia por forma normalizada: a resposta, se houver; senão a mais frequente.
  const answerByNorm = new Map(answers.map((a) => [normalize(a), a]));
  const best = new Map<string, string>();
  for (const w of pool) {
    const key = normalize(w);
    const current = best.get(key);
    const rank = (x: string) => icf.get(x) ?? 99;
    if (!current || rank(w) < rank(current)) best.set(key, w);
  }
  for (const [key, a] of answerByNorm) best.set(key, a);

  writeJson("games/palavra/data/valid.json", [...best.values()].sort());
  console.log(`  ${best.size} palavras válidas, ${answers.length} respostas`);
}

// ---------------------------------------------------------------- países

type NEProps = {
  ISO_A2_EH: string;
  NAME: string;
  NAME_PT: string;
  NAME_EN: string;
  NAME_ES: string;
  CONTINENT: string;
  LABEL_X: number;
  LABEL_Y: number;
};

/** Partes que o Natural Earth separa mas que contam como o país soberano. */
const MERGE_INTO: Record<string, string> = { Somaliland: "SO", "N. Cyprus": "CY" };

/** O Natural Earth põe estes no "alto-mar"; para o jogo, cada um fica no continente mais próximo. */
const CONTINENT_OVERRIDES: Record<string, string> = { MV: "Asia", MU: "Africa", SC: "Africa" };

/** Área mínima (km²) para um país ser resposta do jogo de silhueta. */
const MIN_SHAPE_AREA_KM2 = 10_000;
const EARTH_AREA_KM2 = 510_072_000;
/** Área mínima de uma ilha na silhueta, em unidades do viewBox 100×100. */
const MIN_ISLAND_AREA = 0.2;

function buildCountries() {
  const fc = JSON.parse(readFileSync(join(RAW, "ne_50m.geojson"), "utf8")) as FeatureCollection<
    Polygon | MultiPolygon,
    NEProps
  >;

  const byCode = new Map<string, Feature<Polygon | MultiPolygon, NEProps>[]>();
  for (const f of fc.features) {
    const code = MERGE_INTO[f.properties.NAME] ?? f.properties.ISO_A2_EH;
    if (!COUNTRY_CODES.includes(code)) continue;
    byCode.set(code, [...(byCode.get(code) ?? []), f]);
  }
  const missing = COUNTRY_CODES.filter((c) => !byCode.has(c));
  if (missing.length) throw new Error(`sem geometria para: ${missing.join(", ")}`);

  const displayNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });
  const foreignNames = ["en", "es"].map((lang) => new Intl.DisplayNames([lang], { type: "region" }));
  const countries = [];
  const shapes: Record<string, string> = {};
  const flagDir = join(ROOT, "public/flags");
  mkdirSync(flagDir, { recursive: true });

  for (const code of COUNTRY_CODES) {
    const parts = byCode.get(code)!;
    const main = parts.find((p) => p.properties.ISO_A2_EH === code) ?? parts[0];
    const geometry: MultiPolygon = {
      type: "MultiPolygon",
      coordinates: parts.flatMap((p) =>
        p.geometry.type === "Polygon" ? [p.geometry.coordinates] : p.geometry.coordinates,
      ),
    };
    const feature: Feature<Geometry> = { type: "Feature", properties: {}, geometry };
    const areaKm2 = Math.round(geoArea(feature) * (EARTH_AREA_KM2 / (4 * Math.PI)));
    const [lng, lat] = [main.properties.LABEL_X, main.properties.LABEL_Y];

    const name = COUNTRY_NAME_OVERRIDES[code] ?? displayNames.of(code) ?? main.properties.NAME_PT;
    countries.push({
      code: code.toLowerCase(),
      name,
      aliases: [
        ...(COUNTRY_ALIASES[code] ?? []),
        // Também vale em inglês e espanhol: CLDR + os nomes do Natural Earth ("Germany", "Alemania").
        ...foreignNames.map((d) => d.of(code) ?? ""),
        main.properties.NAME_EN,
        main.properties.NAME_ES,
      ],
      lat: round(lat, 3),
      lng: round(lng, 3),
      continent: CONTINENT_OVERRIDES[code] ?? main.properties.CONTINENT,
      areaKm2,
      shapeEligible: areaKm2 >= MIN_SHAPE_AREA_KM2,
    });

    // Projeção azimutal centrada no país: silhueta sem a distorção do Mercator.
    const projection = geoAzimuthalEqualArea()
      .rotate([-lng, -lat])
      .fitExtent(
        [
          [4, 4],
          [96, 96],
        ],
        feature,
      );
    // Ilhotas menores que um pixel só pesam no arquivo; a maior parte sempre fica.
    const path = geoPath(projection).digits(1);
    const polygons = geometry.coordinates
      .map((coordinates) => ({ type: "Polygon" as const, coordinates }))
      .sort((a, b) => path.area(b) - path.area(a));
    const visible = polygons.filter((p, i) => i === 0 || path.area(p) >= MIN_ISLAND_AREA);
    shapes[code.toLowerCase()] =
      path({ type: "MultiPolygon", coordinates: visible.map((p) => p.coordinates) }) ?? "";

    copyFileSync(
      join(ROOT, "node_modules/flag-icons/flags/4x3", `${code.toLowerCase()}.svg`),
      join(flagDir, `${code.toLowerCase()}.svg`),
    );
  }

  dedupeAliases(countries);
  countries.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  writeJson("games/_shared/geo/countries.json", countries);
  writeJson("games/pais/data/shapes.json", shapes);
  console.log(
    `  ${countries.length} países, ${countries.filter((c) => c.shapeEligible).length} elegíveis para silhueta`,
  );
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Limpa os apelidos: tira "(Birmânia)" e variantes com " - " do CLDR, repetidos e iguais ao nome.
 * Um apelido que bate com o nome ou apelido de outro país é descartado: nunca aceitar o país errado.
 */
function dedupeAliases(countries: { code: string; name: string; aliases: string[] }[]) {
  const clean = (n: string) => n.replace(/\s*\(.*?\)\s*/g, " ").trim();
  for (const c of countries) {
    c.aliases = c.aliases.map(clean).filter((a) => a && !a.includes(" - "));
  }
  const owners = new Map<string, Set<string>>();
  for (const c of countries) {
    for (const n of [c.name, ...c.aliases]) {
      const key = normalize(n);
      owners.set(key, (owners.get(key) ?? new Set()).add(c.code));
    }
  }
  for (const c of countries) {
    const seen = new Set([normalize(c.name)]);
    c.aliases = c.aliases.filter((a) => {
      const key = normalize(a);
      if (seen.has(key)) return false;
      seen.add(key);
      if (owners.get(key)!.size > 1) {
        console.log(`  apelido ambíguo descartado: "${a}" (${[...owners.get(key)!].join(", ")})`);
        return false;
      }
      return true;
    });
  }
}

// ---------------------------------------------------------------- mapa-múndi

const MAP_WIDTH = 1000;
/** Abaixo desta área (px² no mapa) o país vira um ponto clicável em vez de um contorno invisível. */
const MIN_MAP_AREA = 8;

/**
 * Mapa-múndi do jogo Mundo. Usa a escala 1:110m (leve) e, para os países que ela não tem
 * ou que ficariam minúsculos, desenha um ponto no centro do país.
 */
function buildWorldMap() {
  const coarse = JSON.parse(readFileSync(join(RAW, "ne_110m.geojson"), "utf8")) as FeatureCollection<
    Polygon | MultiPolygon,
    NEProps
  >;
  const countries: { code: string; lat: number; lng: number }[] = JSON.parse(
    readFileSync(join(ROOT, "games/_shared/geo/countries.json"), "utf8"),
  );

  const byCode = new Map<string, Feature<Polygon | MultiPolygon, NEProps>[]>();
  for (const f of coarse.features) {
    const code = (MERGE_INTO[f.properties.NAME] ?? f.properties.ISO_A2_EH).toLowerCase();
    byCode.set(code, [...(byCode.get(code) ?? []), f]);
  }

  const world: FeatureCollection = {
    type: "FeatureCollection",
    features: coarse.features.filter((f) => f.properties.CONTINENT !== "Antarctica"),
  };
  const projection = geoNaturalEarth1().fitWidth(MAP_WIDTH, world);
  const path = geoPath(projection).digits(1);
  const [[, y0], [, y1]] = path.bounds(world);
  projection.translate([projection.translate()[0], projection.translate()[1] - y0]);

  const paths: Record<string, string> = {};
  const dots: Record<string, [number, number]> = {};
  for (const c of countries) {
    const parts = byCode.get(c.code);
    const geometry: MultiPolygon | null = parts
      ? {
          type: "MultiPolygon",
          coordinates: parts.flatMap((p) =>
            p.geometry.type === "Polygon" ? [p.geometry.coordinates] : p.geometry.coordinates,
          ),
        }
      : null;
    if (geometry && path.area(geometry) >= MIN_MAP_AREA) {
      paths[c.code] = path(geometry) ?? "";
    } else {
      const [x, y] = projection([c.lng, c.lat])!;
      dots[c.code] = [round(x, 1), round(y, 1)];
    }
  }

  // Territórios fora da lista (Groenlândia, Saara Ocidental…) entram só como fundo, para o mapa não ter buracos.
  const listed = new Set(countries.map((c) => c.code));
  const others: FeatureCollection = {
    type: "FeatureCollection",
    features: world.features.filter((f) => {
      const props = f.properties as NEProps;
      return !listed.has((MERGE_INTO[props.NAME] ?? props.ISO_A2_EH).toLowerCase());
    }),
  };

  writeJson("games/mundo/data/map.json", {
    width: MAP_WIDTH,
    height: Math.ceil(y1 - y0),
    background: path(others) ?? "",
    paths,
    dots,
  });
  console.log(`  mapa: ${Object.keys(paths).length} contornos, ${Object.keys(dots).length} pontos`);
}

fetchSources()
  .then(() => {
    buildWords();
    buildCountries();
    buildWorldMap();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
