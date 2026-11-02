"use client";

import { useState } from "react";
import { CalendarCheck, Flame, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { getGame } from "@/games";
import { LEVELS, LEVEL_NAMES, achievements, type AchievementProgress, type Level } from "@/lib/achievements";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** O aro de cada Nível, do mais fosco ao mais brilhante. */
export const RINGS: Record<Level, string> = {
  bronze: "linear-gradient(90deg, #885424, #AB7E4D, #EEB871, #F9C176, #9F5423, #DC702A, #733D19)",
  prata: "linear-gradient(90deg, #3A3A3A, #A4A4A4, #606060, #CECECE, #8F8F8F, #464646, #696969)",
  ouro: "linear-gradient(90deg, #8C421D, #FBE67B, #FCFBE7, #F7D14E, #D4A041)",
  diamante: "linear-gradient(90deg, #CCE8FE, #CDA0FF, #8489F5, #CDF1FF, #B591E9)",
};

/** A barra de progresso, no degradê do Nível que se está buscando. */
const BARS: Record<Level, string> = {
  bronze: "linear-gradient(90deg, #885424 0%, #AB7E4D 25%, #EEB871 50%, #9F5423 75%, #9C511F 100%)",
  prata: "linear-gradient(90deg, #3A3A3A 0%, #A4A4A4 20%, #CECECE 40%, #8F8F8F 60%, #464646 80%, #696969 100%)",
  ouro: "linear-gradient(90deg, #8C421D 0%, #FBE67B 25%, #FCFBE7 50%, #F7D14E 75%, #D4A041 100%)",
  diamante: "linear-gradient(90deg, #CCE8FE 0%, #CDA0FF 24%, #8489F5 40%, #CDF1FF 71%, #B591E9 100%)",
};

interface Art {
  icon: LucideIcon;
  color: string;
  /** Hexágono para os Jogos perfeitos; círculo para o resto. */
  hex?: boolean;
}

const GENERAL: Record<string, Art> = {
  "dias-jogados": { icon: CalendarCheck, color: "#10B981" },
  sequencia: { icon: Flame, color: "#F97316" },
  "rodada-completa": { icon: Trophy, color: "#8B5CF6" },
};

/** A arte de cada Conquista: as gerais têm a sua; as de jogo usam o ícone e a cor do jogo. */
function artOf(id: string): Art {
  if (GENERAL[id]) return GENERAL[id];
  const [kind, ...rest] = id.split("-");
  const meta = getGame(rest.join("-"))?.meta;
  return { icon: meta?.icon ?? Trophy, color: meta?.color ?? "#64748B", hex: kind === "perfeito" };
}

const HEX = "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/** Uma medalha: a arte no meio, o aro na cor do Nível e, acima do Bronze, o "x2", "x3", "x4". */
export function AchievementBadge({ achievement, className }: { achievement: AchievementProgress; className?: string }) {
  const { icon: Icon, color, hex } = artOf(achievement.id);
  const { level } = achievement;
  const tier = level ? LEVELS.indexOf(level) + 1 : 0;
  const shape = hex ? { clipPath: HEX } : undefined;

  return (
    <span className={cn("relative inline-block size-16", !level && "opacity-35 grayscale", className)}>
      <span
        className={cn("absolute inset-0", !hex && "rounded-full", !level && "bg-secondary")}
        style={{ ...shape, background: level ? RINGS[level] : undefined }}
      />
      <span
        className={cn("absolute inset-[3px] grid place-items-center text-white", !hex && "rounded-full")}
        style={{
          ...shape,
          background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 55%, white), ${color} 55%, color-mix(in srgb, ${color} 60%, black))`,
        }}
      >
        <Icon size={26} strokeWidth={2.25} className="drop-shadow-[0_1px_1px_rgb(0_0_0/0.35)]" />
      </span>
      {hex && level && (
        <Sparkles size={16} className="absolute -top-0.5 right-0 fill-yellow-200 text-yellow-100 drop-shadow" />
      )}
      {tier > 1 && (
        <span className="absolute -right-1 bottom-0 rounded-full bg-background px-1.5 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-border">
          x{tier}
        </span>
      )}
    </span>
  );
}

/** A cor sólida de cada Nível, para a barra e os marcos. */
const SOLID: Record<Level, string> = { bronze: "#DC702A", prata: "#CECECE", ouro: "#F7D14E", diamante: "#CDA0FF" };

/** A grade de medalhas com o nome embaixo; tocar numa abre o modal com o progresso. */
export function Achievements({ items }: { items: AchievementProgress[] }) {
  // Primeiro as conquistadas, do Nível mais alto para o mais baixo.
  const order = (a: AchievementProgress) => (a.level ? LEVELS.indexOf(a.level) : -1);
  const sorted = [...items].sort((a, b) => order(b) - order(a));
  const [selected, setSelected] = useState<string | null>(null);
  const open = sorted.find((a) => a.id === selected);

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-x-2 gap-y-4">
        {sorted.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setSelected(a.id)}
              className="group flex w-full flex-col items-center gap-2 rounded-xl px-1 py-2 transition-colors hover:bg-card/60"
            >
              <AchievementBadge achievement={a} className="transition-transform group-hover:scale-105" />
              <span
                className={cn(
                  "line-clamp-2 text-center text-xs leading-tight",
                  a.level ? "font-medium" : "text-muted-foreground",
                )}
              >
                {a.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={Boolean(open)} onOpenChange={(next) => !next && setSelected(null)}>
        <DialogContent className="sm:max-w-sm">{open && <AchievementDetail achievement={open} />}</DialogContent>
      </Dialog>
    </>
  );
}

/** A medalha grande, o Nível, a barra até o próximo e os quatro marcos. */
function AchievementDetail({ achievement }: { achievement: AchievementProgress }) {
  const { level, value, next } = achievement;
  const thresholds = achievements.find((a) => a.id === achievement.id)?.thresholds ?? [];
  const tier = level ? LEVELS.indexOf(level) + 1 : 0;
  // A barra vai do marco atual ao próximo; no Diamante, cheia.
  const from = tier > 0 ? thresholds[tier - 1] : 0;
  const pct = next === null ? 100 : Math.min(100, Math.max(0, ((value - from) / (next - from)) * 100));
  const target = LEVELS[tier] ?? "diamante";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="my-6 scale-[1.75]">
        <AchievementBadge achievement={achievement} />
      </div>
      <DialogTitle className="font-display text-xl">{achievement.name}</DialogTitle>
      <p className="mt-1 text-sm font-semibold" style={{ color: level ? SOLID[level] : undefined }}>
        {level ? LEVEL_NAMES[level] : t.profile.locked}
      </p>
      <DialogDescription className="mt-2">{achievement.description}</DialogDescription>

      <div className="mt-6 w-full">
        <div className="mb-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{next === null ? t.profile.maxLevel : t.profile.toNext(LEVEL_NAMES[target])}</span>
          <span>{next === null ? value : `${value}/${next}`}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%`, background: BARS[target] }}
          />
        </div>
      </div>

      <ol className="mt-5 grid w-full grid-cols-4 gap-2">
        {LEVELS.map((l, i) => {
          const reached = i < tier;
          return (
            <li key={l} className={cn("rounded-lg bg-secondary/60 px-1 py-2", !reached && "opacity-50")}>
              <span
                className="mx-auto block size-2.5 rounded-full"
                style={{ background: reached ? SOLID[l] : "var(--muted-foreground)" }}
              />
              <span className="mt-1.5 block text-[11px] font-medium">{LEVEL_NAMES[l]}</span>
              <span className="block text-[11px] tabular-nums text-muted-foreground">{thresholds[i]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
