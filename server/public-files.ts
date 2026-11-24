import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";

const PUBLIC = join(process.cwd(), "public");

/**
 * Lê um JSON de public/ no servidor, pelo mesmo caminho que o navegador baixaria ("incomum/cor.json?v=…").
 * Os arquivos que as rotas da API leem entram no deploy por `outputFileTracingIncludes` (next.config.ts).
 */
export async function readPublicFile(path: string): Promise<unknown> {
  const file = normalize(join(PUBLIC, path.replace(/[?#].*$/, "")));
  if (!file.startsWith(PUBLIC)) throw new Error(`fora de public/: ${path}`);
  return JSON.parse(await readFile(file, "utf8"));
}
