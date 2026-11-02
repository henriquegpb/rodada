import { CalendarCheck, Flame, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { getGame } from "@/games";
import { LEVELS, type AchievementProgress, type Level } from "@/lib/achievements";
import { cn } from "@/lib/utils";

/** O aro de cada Nível, do mais fosco ao mais brilhante. */
const RINGS: Record<Level, string> = {
  bronze: "linear-gradient(135deg, #F0B98A, #8C5530)",
  prata: "linear-gradient(135deg, #F4F6FA, #8E97A3)",
  ouro: "linear-gradient(135deg, #FFE48F, #B8860B)",
  diamante: "linear-gradient(135deg, #E6FAFF, #38BDF8 50%, #A78BFA)",
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
