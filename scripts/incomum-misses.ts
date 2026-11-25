/**
 * As respostas que os jogadores digitaram e o Incomum recusou, por categoria, das mais repetidas.
 * É a revisão das listas: o que aparece aqui e vale entra em scripts/incomum-lists/.
 *
 *   npx tsx scripts/incomum-misses.ts            (as que alguém digitou 2+ vezes)
 *   npx tsx scripts/incomum-misses.ts --min 1    (todas)
 *
 * Lê o banco de DATABASE_URL (.env.local). O que já entrou na lista depois de recusado não aparece.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { desc, gte } from "drizzle-orm";
import { CATEGORIES, findAnswer, type IncomumItems } from "../games/incomum/engine";
import { getDb } from "../server/db";
import { incomumMisses } from "../server/db/schema";

process.loadEnvFile?.(join(import.meta.dirname, "../.env.local"));

async function main() {
  const min = Number(process.argv[process.argv.indexOf("--min") + 1]) || 2;
  const rows = await getDb()
    .select()
    .from(incomumMisses)
    .where(gte(incomumMisses.count, min))
    .orderBy(desc(incomumMisses.count));

  const titles = new Map(CATEGORIES.map((c) => [c.id, c.title]));
  const byCategory = new Map<string, typeof rows>();
  for (const row of rows) {
    let items: IncomumItems = [];
    try {
      items = JSON.parse(readFileSync(join(import.meta.dirname, "../public/incomum", `${row.category}.json`), "utf8"));
    } catch {
      // Categoria que saiu do jogo: mostra mesmo assim.
    }
    if (findAnswer(items, row.text)) continue;
    byCategory.set(row.category, [...(byCategory.get(row.category) ?? []), row]);
  }

  const sorted = [...byCategory].sort((a, b) => sum(b[1]) - sum(a[1]));
  for (const [category, list] of sorted) {
    console.log(`\n${titles.get(category) ?? category} (${category}) — ${sum(list)} recusas`);
    for (const row of list.slice(0, 30)) console.log(`  ${String(row.count).padStart(4)}  ${row.text}`);
  }
  if (!sorted.length) console.log(`Nenhuma resposta recusada ${min}+ vezes que ainda falte.`);
}

void main().then(() => process.exit(0));

function sum(list: { count: number }[]) {
  return list.reduce((s, r) => s + r.count, 0);
}
