import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Um bloco cinza pulsando no lugar do que ainda está carregando; a forma vem de `className`. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-md bg-secondary/70", className)} style={style} />;
}
