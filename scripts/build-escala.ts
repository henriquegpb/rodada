/**
 * Gera as silhuetas e o catálogo do Escala a partir de scripts/escala-list.ts.
 *
 *   pnpm data:escala
 *
 * Fonte: PhyloPic (api.phylopic.org), só imagens em domínio público (CC0 ou Public Domain Mark).
 * Para cada bicho que ainda não tem public/escala/<id>.png: baixa a maior imagem, gira se precisar,
 * recorta rente (o tamanho do bicho é o tamanho da imagem) e reduz para no máximo 640 px.
 *
 * Saída: public/escala/<id>.png e games/escala/data/animals.json (com autor, licença e link).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ESCALA_LIST } from "./escala-list";

const ROOT = join(import.meta.dirname, "..");
const OUT_DIR = join(ROOT, "public/escala");
const DATA = join(ROOT, "games/escala/data/animals.json");
const MAX_SIDE = 640;

interface Row {
  id: string;
  name: string;
  measure: string;
  size: number;
  w: number;
  h: number;
  credit: string;
  license: string;
  source: string;
}

interface ImageMeta {
  _links: {
    license: { href: string };
    contributor?: { title: string };
    rasterFiles: { href: string; sizes: string }[];
  };
  attribution?: string | null;
}

const LICENSES: Record<string, string> = {
  "https://creativecommons.org/publicdomain/zero/1.0/": "CC0 1.0",
  "https://creativecommons.org/publicdomain/mark/1.0/": "Public Domain Mark 1.0",
};

async function meta(uuid: string): Promise<ImageMeta> {
  const res = await fetch(`https://api.phylopic.org/images/${uuid}`);
  if (!res.ok) throw new Error(`PhyloPic ${uuid}: ${res.status}`);
  return res.json() as Promise<ImageMeta>;
}

async function silhouette(rasterUrl: string, rotate = 0): Promise<Buffer> {
  const res = await fetch(rasterUrl);
  if (!res.ok) throw new Error(`falha ao baixar ${rasterUrl}: ${res.status}`);
  let image = Buffer.from(await res.arrayBuffer());
  if (rotate) image = await sharp(image).rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  image = await sharp(image).trim().png().toBuffer();
  // Silhueta chapada: algumas vêm com sombra ou asa semitransparente, e no jogo a imagem vira
  // máscara. Preto onde tem desenho, transparente no resto; a redução depois suaviza a borda.
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] = data[i + 3] >= 24 ? 255 : 0;
  }
  return sharp(data, { raw: info }).resize(MAX_SIDE, MAX_SIDE, { fit: "inside" }).png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  const previous = new Map<string, Row>(
    existsSync(DATA) ? (JSON.parse(readFileSync(DATA, "utf8")) as Row[]).map((r) => [r.id, r]) : [],
  );
  const rows: Row[] = [];
  for (const entry of ESCALA_LIST) {
    const png = join(OUT_DIR, `${entry.id}.png`);
    const source = `https://www.phylopic.org/images/${entry.image}`;
    const old = previous.get(entry.id);
    let credit = old?.source === source ? old.credit : undefined;
    let license = old?.source === source ? old.license : undefined;

    if (!existsSync(png) || credit === undefined || license === undefined) {
      const m = await meta(entry.image);
      license = LICENSES[m._links.license.href];
      if (!license) throw new Error(`${entry.id}: licença ${m._links.license.href} não é domínio público`);
      credit = m.attribution ?? m._links.contributor?.title ?? "";
      if (!existsSync(png)) {
        const largest = [...m._links.rasterFiles].sort((a, b) => parseInt(b.sizes) - parseInt(a.sizes))[0];
        writeFileSync(png, await silhouette(largest.href, entry.rotate));
        console.log(`✓ public/escala/${entry.id}.png`);
      }
    }
    const { width, height } = await sharp(png).metadata();
    rows.push({ id: entry.id, name: entry.name, measure: entry.measure, size: entry.size, w: width!, h: height!, credit, license, source });
  }
  writeFileSync(DATA, JSON.stringify(rows, null, 1) + "\n");
  console.log(`✓ games/escala/data/animals.json (${rows.length} bichos)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
