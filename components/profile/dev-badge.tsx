"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/*
 * Borda no degradê do Diamante, texto no mesmo degradê e, com o mouse em cima (ou o foco), um
 * brilho que atravessa a pílula. Com movimento reduzido, sem o brilho.
 */
const CSS = `
@keyframes dev-shine {
  0% { transform: translateX(-120%) skewX(-20deg); }
  60%, 100% { transform: translateX(320%) skewX(-20deg); }
}
.dev-shine { transform: translateX(-120%) skewX(-20deg); }
.dev-badge:hover .dev-shine, .dev-badge:focus-visible .dev-shine { animation: dev-shine 1.4s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .dev-shine { display: none; } }
`;

const GRADIENT = "linear-gradient(90deg, #CCE8FE, #CDA0FF, #8489F5, #CDF1FF, #B591E9)";

/**
 * A pílula "Dev" ao lado do nome, no ranking e no Perfil, para quem tem `dev` no banco; o hover
 * conta o que ela quer dizer.
 */
export function DevBadge({ dev, className }: { dev: boolean; className?: string }) {
  if (!dev) return null;
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "dev-badge relative inline-flex shrink-0 cursor-default items-center overflow-hidden rounded-full p-px align-middle outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          style={{ background: GRADIENT, boxShadow: "0 0 12px rgb(132 137 245 / 0.35)" }}
        >
          <style href="dev-badge" precedence="default">
            {CSS}
          </style>
          {/* Altura fixa e flex: o texto fica no meio da pílula, sem depender da linha da fonte. */}
          <span className="relative flex h-4 items-center rounded-full bg-background px-1.5">
            <span
              className="bg-clip-text text-[10px] font-bold leading-none text-transparent"
              style={{ backgroundImage: GRADIENT, WebkitBackgroundClip: "text" }}
            >
              {t.dev.label}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="dev-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-56 text-center">
        {t.dev.hint}
      </TooltipContent>
    </Tooltip>
  );
}
