"use client";

import { formatCountdown, useSecondsToNext } from "@/lib/daily/hooks";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Só o relógio: "05:12:33". */
export function CountdownTime({ className }: { className?: string }) {
  const seconds = useSecondsToNext();
  return (
    <span className={cn("font-mono font-medium tabular-nums text-foreground", className)}>
      {seconds === null ? "--:--:--" : formatCountdown(seconds)}
    </span>
  );
}

/** "vira em 05:12:33" */
export function Countdown({ className, label = t.countdown.short }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-sm text-muted-foreground", className)}>
      {label}
      <CountdownTime className="text-[15px]" />
    </span>
  );
}
