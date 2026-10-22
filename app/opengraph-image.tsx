import { t } from "@/lib/i18n";
import { OG_SIZE, ogImage } from "@/lib/og-image";

export const alt = `${t.brand.name}: jogos diários de palavras e geografia`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ title: t.brand.name, subtitle: "Jogos diários de palavras e geografia" });
}
