import type { Metadata } from "next";
import { PublicProfile } from "@/components/profile/public-profile";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/perfil/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${decodeURIComponent(handle)} · ${t.nav.profile}`, robots: { index: false } };
}

export default async function PublicProfilePage({ params }: PageProps<"/perfil/[handle]">) {
  const { handle } = await params;
  return <PublicProfile handle={decodeURIComponent(handle)} />;
}
