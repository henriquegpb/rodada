import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.nav.profile };

export default function ProfilePage() {
  return <ProfileScreen />;
}
