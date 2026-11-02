"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, LogOut, Users } from "lucide-react";
import { useToday } from "@/lib/daily/hooks";
import { trackEvent } from "@/lib/analytics";
import {
  createGroup,
  joinGroup,
  lastGroup,
  leaveGroup,
  rememberGroup,
  useGroup,
  useGroups,
  useMe,
  type Me,
} from "@/lib/ranking/client";
import type { GroupDetail, GroupSummary } from "@/server/groups";
import { t } from "@/lib/i18n";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Boards, SectionTitle, YouTag } from "./boards";
import { InlineForm } from "./inline-form";
import { SignInCard } from "./sign-in";

/** Os Grupos da Conta: escolhe um e vê os membros, o convite e o ranking do dia só entre eles. */
export function GroupsScreen() {
  const today = useToday();
  const me = useMe();
  const { groups, error } = useGroups(me);
  const [id, setId] = useState<string | null>(null);
  if (!today || me === undefined) return null;

  const selected = groups?.find((g) => g.id === (id ?? lastGroup())) ?? groups?.[0];
  const select = (next: string) => {
    setId(next);
    rememberGroup(next);
  };

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-6xl leading-[0.9]">{t.groups.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.groups.subtitle}</p>
        {groups && groups.length > 1 && selected && (
          <PillTabs
            label={t.groups.title}
            className="mt-8"
            value={selected.id}
            onChange={select}
            options={groups.map((g) => ({ key: g.id, label: g.name }))}
          />
        )}
      </header>

      {me === null ? (
        <SignInCard title={t.login.groupsTitle} text={t.login.groupsText} from="groups" />
      ) : !groups ? (
        <p className="text-muted-foreground">{error ?? t.groups.loading}</p>
      ) : selected ? (
        <>
          {/* Cada grupo começa da primeira página e do geral. */}
          <div key={selected.id} role="tabpanel" className="flex flex-col gap-14">
            <GroupPanel summary={selected} me={me} onLeft={() => setId(null)} />
            <Boards dateKey={today} group={selected.id} />
          </div>
          <NewGroup onDone={select} />
        </>
      ) : (
        <div className="flex max-w-xl flex-col items-start gap-2 rounded-xl bg-card p-6">
          <Users size={22} className="text-primary" />
          <p className="mt-1 font-semibold">{t.groups.none}</p>
          <p className="text-sm text-muted-foreground">{t.groups.noneHint}</p>
          <NewGroup onDone={select} bare />
        </div>
      )}
    </div>
  );
}

/** Os membros, o convite e a saída. Os membros chegam num segundo pedido; até lá, só o resumo. */
function GroupPanel({ summary, me, onLeft }: { summary: GroupSummary; me: Me; onLeft: () => void }) {
  const detail = useGroup(summary.id);
  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <div>
        <SectionTitle players={summary.memberCount}>{t.groups.members}</SectionTitle>
        {detail ? <Members detail={detail} me={me} /> : <p className="text-sm text-muted-foreground">{t.groups.loading}</p>}
      </div>
      <Invite summary={summary} onLeft={onLeft} />
    </section>
  );
}

function Members({ detail, me }: { detail: GroupDetail; me: Me }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {detail.members.map((member) => (
        <li key={member.id} className="flex items-center gap-3 rounded-lg bg-card/60 px-3 py-2.5">
          {member.image ? (
            // Foto do Google ou do Blob: sem otimização do Next, que pediria cada domínio na config.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold uppercase">
              {member.name.charAt(0)}
            </span>
          )}
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{member.name}</span>
              {member.id === me.id && <YouTag />}
              {member.id === detail.ownerId && (
                <span className="shrink-0 text-[11px] font-semibold text-primary">{t.groups.owner}</span>
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">@{member.handle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Invite({ summary, onLeft }: { summary: GroupSummary; onLeft: () => void }) {
  const copy = async () => {
    const link = `${window.location.origin}/grupos/convite?c=${summary.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      trackEvent("invite_copied", {});
      toast.success(t.groups.copied);
    } catch {
      toast.error(t.game.copyFailed);
    }
  };
  const leave = async () => {
    if (!window.confirm(t.groups.leaveConfirm(summary.name))) return;
    try {
      await leaveGroup(summary.id);
      onLeft();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t.groups.invite}</p>
        <p className="text-xs text-muted-foreground">{t.groups.inviteHint}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
      >
        <Link2 size={15} /> {t.groups.copyLink}
      </button>
      <button
        type="button"
        onClick={leave}
        className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut size={14} /> {t.groups.leave}
      </button>
    </div>
  );
}

/** Criar um Grupo ou entrar num pelo código do convite. `bare`: dentro do cartão de quem não tem nenhum. */
function NewGroup({ onDone, bare = false }: { onDone: (id: string) => void; bare?: boolean }) {
  const forms = (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      <InlineForm
        label={t.groups.namePlaceholder}
        placeholder={t.groups.namePlaceholder}
        submit={t.groups.create}
        maxLength={40}
        onSubmit={async (name) => {
          try {
            const group = await createGroup(name);
            trackEvent("group_created", {});
            onDone(group.id);
          } catch (error) {
            return (error as Error).message;
          }
        }}
      />
      <InlineForm
        label={t.groups.codePlaceholder}
        placeholder={t.groups.codePlaceholder}
        submit={t.groups.join}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        onSubmit={async (code) => {
          try {
            const group = await joinGroup(code);
            trackEvent("group_joined", { from: "code" });
            onDone(group.id);
          } catch (error) {
            return (error as Error).message;
          }
        }}
      />
    </div>
  );
  if (bare) return <div className="mt-4 w-full">{forms}</div>;
  return (
    <section className="max-w-2xl">
      <SectionTitle players={0}>{t.groups.newGroup}</SectionTitle>
      <div className="mt-4">{forms}</div>
    </section>
  );
}
