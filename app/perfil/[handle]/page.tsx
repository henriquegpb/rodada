import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicProfile } from "@/components/profile/public-profile";
import { t } from "@/lib/i18n";

// Qualquer handle vale, então não há o que pré-renderizar: a casca (que lê o pathname) sai no pedido.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/perfil/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${decodeURIComponent(handle)} · ${t.nav.profile}`, robots: { index: false } };
}

export default function PublicProfilePage({ params }: PageProps<"/perfil/[handle]">) {
  // O handle vem da URL: fica atrás do Suspense para a casca da página sair na hora.
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{t.profile.loading}</p>}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<PageProps<"/perfil/[handle]">, "params">) {
  const { handle } = await params;
  return <PublicProfile handle={decodeURIComponent(handle)} />;
}
