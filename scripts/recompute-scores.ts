/**
 * Recalcula a Nota de todas as partidas gravadas e o Score diário de todos os dias, para depois de
 * uma mudança nas regras de pontuação (server/plays.ts, `recomputeScores`).
 *
 *   DATABASE_URL=… pnpm db:recompute           # só mostra o que mudaria
 *   DATABASE_URL=… pnpm db:recompute --apply   # grava
 *
 * Roda numa transação só: ou muda tudo, ou nada.
 */
import { getDb } from "../server/db";
import { recomputeScores } from "../server/plays";

if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL.");
  process.exit(1);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const report = await recomputeScores(getDb(), { apply });
  const games = Object.entries(report.plays).map(([slug, n]) => `${slug}: ${n}`);
  console.log(apply ? "Gravado." : "Simulação (nada foi gravado; use --apply para gravar).");
  console.log(`Partidas com Nota nova: ${games.length ? games.join(", ") : "nenhuma"}`);
  console.log(`Dias com Score diário novo: ${report.days}`);
  console.log(`Contas com Conquistas recontadas: ${report.accounts}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
