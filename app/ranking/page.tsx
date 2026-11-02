import type { Metadata } from "next";
import { RankingScreen } from "@/components/ranking/ranking-screen";
import { t } from "@/lib/i18n";

// O ranking muda o dia todo e é montado no navegador: não há o que indexar.
export const metadata: Metadata = { title: t.nav.ranking, robots: { index: false } };

export default function RankingPage() {
  return <RankingScreen />;
}
