import { games, getGame } from "@/games";
import { t } from "@/lib/i18n";
import { OG_SIZE, ogImage } from "@/lib/og-image";

export const alt = `Jogo diário do ${t.brand.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return games.map((g) => ({ game: g.meta.slug }));
}

export default async function Image({ params }: { params: Promise<{ game: string }> }) {
  const { meta } = getGame((await params).game)!;
  return ogImage({ title: meta.name, subtitle: meta.tagline, colors: [meta.color] });
}
