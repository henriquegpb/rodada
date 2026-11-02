"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { joinGroup, rememberGroup, useInvite, useMe } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { SignInButtons } from "./sign-in";

/**
 * O link de convite (`/grupos/convite?c=CODIGO`): mostra o Grupo e entra nele; quem não entrou na
 * Conta entra antes e volta aqui.
 */
export function InviteScreen() {
  const code = useSearchParams().get("c") ?? "";
  const router = useRouter();
  const me = useMe();
  const { invite, error } = useInvite(code);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (error) return <p className="text-muted-foreground">{error}</p>;
  if (!invite || me === undefined) return <p className="text-muted-foreground">{t.groups.loading}</p>;

  const join = async () => {
    setBusy(true);
    try {
      const group = await joinGroup(code);
      trackEvent("group_joined", { from: "link" });
      rememberGroup(group.id);
      router.push("/grupos");
    } catch (e) {
      setJoinError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-6xl leading-[0.9]">{t.groups.joinTitle(invite.name)}</h1>
        <p className="mt-3 flex items-center gap-2 text-muted-foreground">
          <Users size={16} /> {t.groups.memberCount(invite.memberCount)}
        </p>
      </header>
      {invite.full ? (
        <p className="text-muted-foreground">{t.groups.full}</p>
      ) : me === null ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">{t.login.groupsTitle}</p>
          <SignInButtons from="invite" />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={join}
            disabled={busy}
            className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {t.groups.joinCta}
          </button>
          {joinError && <p className="text-sm text-destructive">{joinError}</p>}
        </div>
      )}
    </div>
  );
}
