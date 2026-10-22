import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { t } from "@/lib/i18n";

// As estatísticas são de cada aparelho: não há o que buscar aqui.
export const metadata: Metadata = { title: t.nav.profile, robots: { index: false } };

export default function ProfilePage() {
  return <ProfileScreen />;
}
