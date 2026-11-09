import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * O contrato do CONTRIBUTING: o que vai para o navegador (o index.ts de cada jogo e tudo o que ele
 * importa) nunca alcança uma engine nem os dados de resposta (games/<jogo>/data/). Este teste segue
 * os imports de verdade, então pega também a violação indireta (um componente que importa um
 * arquivo que importa a engine).
 */

const ROOT = resolve(__dirname, "..");
const GAMES = resolve(__dirname);
const IMPORT = /^\s*(?:import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(ROOT, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null; // pacote do node_modules
  for (const ext of EXTENSIONS) if (existsSync(base + ext) && /\.(tsx?|json)$/.test(base + ext)) return base + ext;
  return null;
}

/** Os arquivos de games/ alcançados a partir de `entry`, com o caminho de imports até cada um. */
function reachable(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>([[entry, [entry]]]);
  const queue = [entry];
  while (queue.length) {
    const file = queue.shift()!;
    if (file.endsWith(".json")) continue;
    for (const [, spec] of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const target = resolveImport(file, spec);
      if (!target || seen.has(target) || !target.startsWith(GAMES)) continue;
      seen.set(target, [...seen.get(file)!, target]);
      queue.push(target);
    }
  }
  return seen;
}

const isForbidden = (file: string) => {
  const rel = relative(GAMES, file).replaceAll("\\", "/");
  return /(^|\/)(create-)?engine\.ts$/.test(rel) || /^[^/_][^/]*\/data\//.test(rel);
};

const entries = [...new Set(
  readFileSync(join(GAMES, "index.ts"), "utf8")
    .matchAll(/from "\.\/([^"]+)"/g)
    .map(([, dir]) => resolveImport(join(GAMES, "index.ts"), `./${dir}`))
    .filter((f): f is string => f !== null),
)];

describe("contrato: a UI não conhece a resposta", () => {
  it.each(entries.map((e) => [relative(GAMES, e).replaceAll("\\", "/"), e]))("%s não alcança engine nem dados de resposta", (_, entry) => {
    const leaks = [...reachable(entry)]
      .filter(([file]) => isForbidden(file))
      .map(([, path]) => path.map((f) => relative(GAMES, f).replaceAll("\\", "/")).join(" → "));
    expect(leaks).toEqual([]);
  });
});
