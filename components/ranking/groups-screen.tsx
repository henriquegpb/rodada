"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Plus, Users } from "lucide-react";
import { Check as CheckIcon, Link2 as LinkIcon } from "lucide";
import { MorphIcon } from "morphicons/react";
import { useToday } from "@/lib/daily/hooks";
import { trackEvent } from "@/lib/analytics";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  pickGroup,
  rememberGroup,
  useGroup,
  useGroups,
  useMe,
  type Me,
} from "@/lib/ranking/client";
import type { GroupDetail, GroupSummary } from "@/server/groups";
import { t } from "@/lib/i18n";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { GlideSwap } from "@/components/ui/glide-swap";
import { Skeleton } from "@/components/ui/skeleton";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Boards, RankingSkeleton, SectionTitle, YouTag } from "./boards";
import { Avatar } from "@/components/profile/avatar";
import { DevBadge } from "@/components/profile/dev-badge";
import { ProfileLink } from "@/components/profile/profile-link";
import { InlineForm } from "./inline-form";
import { SignInButtons } from "./sign-in";

/**
 * Os Grupos da Conta: escolhe um (pela pílula, pela sidebar ou pela URL `?g=`) e vê os membros, o
 * convite e o ranking do dia só entre eles.
 */
export function GroupsScreen() {
  const today = useToday();
  const me = useMe();
  const { groups, error } = useGroups(me);
  const router = useRouter();
  const search = useSearchParams();
  const param = search.get("g");
  const [creating, setCreating] = useState(false);

  const selected = groups ? pickGroup(groups, param) : undefined;
  // De que lado o grupo novo entra: o da ordem na pílula. Estado derivado, no próprio render.
  const [previous, setPrevious] = useState(selected?.id);
  const [direction, setDirection] = useState<1 | -1>(1);
  if (groups && selected && selected.id !== previous) {
    const from = groups.findIndex((g) => g.id === previous);
    setDirection(groups.indexOf(selected) >= from ? 1 : -1);
    setPrevious(selected.id);
  }

  if (!today) return null;

  const select = (id: string) => {
    rememberGroup(id);
    // Troca só o grupo; o resto da query (o `?mock`, por exemplo) fica.
    const next = new URLSearchParams(search);
    next.set("g", id);
    router.replace(`/grupos?${next}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-10">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-6xl leading-[0.9]">{t.groups.title}</h1>
            <p className="mt-3 text-muted-foreground">{t.groups.subtitle}</p>
          </div>
          {me === null && <SignInButtons from="groups" />}
          {me && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} /> {t.groups.newGroup}
            </button>
          )}
        </div>
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
        <p className="text-muted-foreground">{t.login.groupsText}</p>
      ) : !me || !groups ? (
        error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : (
          <GroupsSkeleton />
        )
      ) : selected ? (
        <GlideSwap id={selected.id} direction={direction}>
          <div role="tabpanel" className="flex flex-col gap-14">
            <GroupPanel summary={selected} me={me} onLeft={() => router.replace("/grupos", { scroll: false })} />
            <Boards dateKey={today} group={selected.id} />
          </div>
        </GlideSwap>
      ) : (
        <div className="flex max-w-xl flex-col items-start gap-2 rounded-xl bg-card p-6">
          <Users size={22} className="text-primary" />
          <p className="mt-1 font-semibold">{t.groups.none}</p>
          <p className="text-sm text-muted-foreground">{t.groups.noneHint}</p>
          <NewGroupForms className="mt-4" onDone={select} />
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="font-display text-xl">{t.groups.newGroup}</DialogTitle>
          <DialogDescription>{t.groups.noneHint}</DialogDescription>
          <NewGroupForms
            stacked
            className="mt-2"
            onDone={(id) => {
              setCreating(false);
              select(id);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Os membros, o convite e a saída. Os membros chegam num segundo pedido; até lá, só o resumo. */
function GroupPanel({ summary, me, onLeft }: { summary: GroupSummary; me: Me; onLeft: () => void }) {
  const detail = useGroup(summary.id);
  return (
    <section className="flex flex-col gap-6">
      <div>
        <SectionTitle players={summary.memberCount}>{t.groups.members}</SectionTitle>
        {detail ? <Members detail={detail} me={me} /> : <MembersSkeleton count={summary.memberCount} />}
      </div>
      <Invite summary={summary} onLeft={onLeft} />
    </section>
  );
}

/** Enquanto a sessão e os Grupos chegam: os membros, o convite e o ranking, só a forma. */
function GroupsSkeleton() {
  return (
    <div role="status" aria-label={t.groups.loading} className="flex flex-col gap-14">
      <section className="flex flex-col gap-6">
        <div>
          <Skeleton className="mb-2 h-6 w-32" />
          <MembersSkeleton count={4} />
        </div>
        <Skeleton className="h-[72px] w-full rounded-xl" />
      </section>
      <section>
        <Skeleton className="h-10 w-full max-w-2xl rounded-full" />
        <div className="mt-6">
          <RankingSkeleton rows={5} />
        </div>
      </section>
    </div>
  );
}

/** Os cards dos membros: foto, nome e @handle. */
function MembersSkeleton({ count }: { count: number }) {
  return (
    <ul aria-hidden="true" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg bg-card/60 px-3 py-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5" style={{ width: `${[60, 45, 70, 52, 38, 64][i]}%` }} />
            <Skeleton className="h-2.5 w-1/3" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Members({ detail, me }: { detail: GroupDetail; me: Me }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {detail.members.map((member) => (
        <li key={member.id}>
          <ProfileLink
            handle={member.handle}
            className="flex items-center gap-3 rounded-lg bg-card/60 px-3 py-2.5 transition-colors hover:bg-card"
          >
            <Avatar name={member.name} seed={member.id} image={member.image} className="size-8 text-xs" />
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{member.name}</span>
                <DevBadge dev={member.dev} />
                {member.id === me.id && <YouTag />}
                {member.id === detail.ownerId && (
                  <span className="shrink-0 text-[11px] font-semibold text-primary">{t.groups.owner}</span>
                )}
              </span>
              <span className="block truncate text-xs text-muted-foreground">@{member.handle}</span>
            </span>
          </ProfileLink>
        </li>
      ))}
    </ul>
  );
}

function Invite({ summary, onLeft }: { summary: GroupSummary; onLeft: () => void }) {
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
      <CopyLink code={summary.inviteCode} />
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

/** Copia o link do convite; o ícone do link vira um visto por um instante. */
function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/grupos/convite?c=${code}`);
      trackEvent("invite_copied", {});
      setCopied(true);
      toast.success(t.groups.copied);
    } catch {
      toast.error(t.game.copyFailed);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
    >
      <MorphIcon icon={copied ? CheckIcon : LinkIcon} size={15} strokeWidth={2.25} />
      {t.groups.copyLink}
    </button>
  );
}

/** Criar um Grupo ou entrar num pelo código do convite. `stacked`: um embaixo do outro (no diálogo). */
function NewGroupForms({
  onDone,
  stacked = false,
  className,
}: {
  onDone: (id: string) => void;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div className={stacked ? `flex flex-col gap-3 ${className ?? ""}` : `grid w-full gap-3 sm:grid-cols-2 ${className ?? ""}`}>
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
}
