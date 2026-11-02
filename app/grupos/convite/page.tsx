import { Suspense } from "react";
import type { Metadata } from "next";
import { InviteScreen } from "@/components/ranking/invite-screen";
import { t } from "@/lib/i18n";

// O convite é de um Grupo privado: o link circula, mas não é para indexar.
export const metadata: Metadata = { title: t.nav.groups, robots: { index: false } };

export default function InvitePage() {
  // O código vem na query (?c=): só a tela do convite espera por ela, a casca sai na hora.
  return (
    <Suspense fallback={<p className="text-muted-foreground">{t.groups.loading}</p>}>
      <InviteScreen />
    </Suspense>
  );
}
