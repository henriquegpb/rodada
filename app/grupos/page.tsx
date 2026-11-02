import type { Metadata } from "next";
import { GroupsScreen } from "@/components/ranking/groups-screen";
import { t } from "@/lib/i18n";

// Os grupos são de cada pessoa e montados no navegador: não há o que indexar.
export const metadata: Metadata = { title: t.nav.groups, robots: { index: false } };

export default function GroupsPage() {
  return <GroupsScreen />;
}
