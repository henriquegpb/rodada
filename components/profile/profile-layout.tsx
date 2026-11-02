import type { ReactNode } from "react";
import type { AchievementProgress } from "@/lib/achievements";
import { FlameArt } from "@/components/streak/streak-flame";
import { t } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { Achievements } from "./achievement-badge";
import { Avatar } from "./avatar";
import { DevBadge } from "./dev-badge";

/**
 * O Perfil em duas colunas, como no GitHub: à esquerda quem é (foto, nome, bio, números,
 * Conquistas), parada enquanto a direita (histórico e estatísticas) rola. No celular, uma embaixo
 * da outra.
 */
export function ProfileLayout({ side, children }: { side: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-8 lg:self-start">{side}</aside>
      <div className="flex min-w-0 flex-col gap-10">{children}</div>
    </div>
  );
}

export function ProfileSide({
  account,
  meta,
  action,
  stats,
  achievements,
  footer,
}: {
  account: { id: string; name: string; handle: string; image: string | null; bio?: string; dev?: boolean };
  /** A linha embaixo do @handle ("Joga desde…"). */
  meta?: string;
  /** O botão embaixo da bio ("Editar perfil"). */
  action?: ReactNode;
  /** `flame`: a chama da Sequência ao lado do número, acesa quando hoje já conta. */
  stats: { label: string; value: number; flame?: boolean }[];
  /** null: ainda carregando (mostra a forma); sem a prop, a seção não aparece. */
  achievements?: AchievementProgress[] | null;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 lg:flex-col lg:items-start">
        <Avatar
          name={account.name}
          seed={account.id}
          image={account.image}
          className="size-20 font-display text-2xl lg:size-40 lg:text-5xl"
        />
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none [overflow-wrap:anywhere]">{account.name}</h1>
          {account.handle && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-muted-foreground">
              @{account.handle}
              <DevBadge dev={Boolean(account.dev)} />
            </p>
          )}
          {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
        </div>
      </div>
      {(account.bio || action) && (
        <div className="-mt-2 flex flex-col gap-4">
          {account.bio && <p className="text-sm">{account.bio}</p>}
          {action}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dd className="flex items-end gap-1 font-display text-2xl leading-none tabular-nums">
              {s.flame !== undefined && <FlameArt lit={s.flame} className="h-7 w-[18px]" />}
              {s.value}
            </dd>
            <dt className="mt-1 text-xs text-muted-foreground">{s.label}</dt>
          </div>
        ))}
      </dl>

      {achievements !== undefined && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">{t.profile.achievements}</h2>
          {achievements ? <Achievements items={achievements} compact /> : <BadgesSkeleton />}
        </section>
      )}
      {footer}
    </div>
  );
}

/** As medalhas compactas da coluna, só a forma. */
function BadgesSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-4 gap-x-1 gap-y-2">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 py-1.5">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-2 w-10" />
        </div>
      ))}
    </div>
  );
}

/** O Perfil inteiro enquanto carrega: a coluna (foto, nome, números, medalhas) e o histórico. */
export function ProfileSkeleton() {
  return (
    <div role="status" aria-label={t.profile.loading}>
      <ProfileLayout
        side={
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <Skeleton className="size-20 shrink-0 rounded-full lg:size-40" />
              <div className="flex w-full flex-col gap-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              ))}
            </div>
            <div>
              <Skeleton className="mb-3 h-3.5 w-24" />
              <BadgesSkeleton />
            </div>
          </div>
        }
      >
        <ActivitySkeleton />
      </ProfileLayout>
    </div>
  );
}

/** Os 14 dias (uma linha por jogo) e a pílula dos jogos, só a forma. */
export function ActivitySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-10">
      <section>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid gap-1" style={{ gridTemplateColumns: "7rem repeat(14, minmax(1.25rem, 2.75rem))" }}>
          {Array.from({ length: 8 }, (_, row) => (
            <div key={row} className="contents">
              <Skeleton className="my-auto h-3.5 w-16" />
              {Array.from({ length: 14 }, (_, col) => (
                <Skeleton key={col} className="aspect-square rounded-[5px]" />
              ))}
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="mb-3 h-6 w-48" />
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="mt-6 grid max-w-xl grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
