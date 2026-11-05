import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** O mostrador é desenhado num quadrado de 400 × 400, com o vértice no meio. */
export const VIEW = 400;
const C = VIEW / 2;
const FACE = 184;
export const ARM = 166;
const WEDGE = 58;

/** Ponto a `r` do vértice na direção `dir` (graus, anti-horário a partir das 3 horas). */
export function polar(dir: number, r: number): [number, number] {
  const rad = (dir * Math.PI) / 180;
  return [C + r * Math.cos(rad), C - r * Math.sin(rad)];
}

/** Direção (graus, 0–360) do vértice até um ponto da tela, para arrastar o braço. */
export function dirAt(svg: SVGSVGElement, clientX: number, clientY: number): number {
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * VIEW - C;
  const y = ((clientY - rect.top) / rect.height) * VIEW - C;
  return ((Math.atan2(-y, x) * 180) / Math.PI + 360) % 360;
}

/** Quantos graus vão do braço `from` até a direção `dir`, girando no sentido anti-horário (0–359). */
export const sweepBetween = (from: number, dir: number) => Math.round((((dir - from) % 360) + 360) % 360) % 360;

/** Fatia de pizza a partir do braço `from`, girando `sweep` graus no sentido anti-horário. */
function arcPath(from: number, sweep: number, r: number, closed: boolean): string {
  const [x0, y0] = polar(from, r);
  const [x1, y1] = polar(from + sweep, r);
  const arc = `A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  return closed
    ? `M${C} ${C} L${x0.toFixed(2)} ${y0.toFixed(2)} ${arc} Z`
    : `M${x0.toFixed(2)} ${y0.toFixed(2)} ${arc}`;
}

export function Dial({ className, children, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className={cn("block w-full select-none", className)} {...props}>
      <circle cx={C} cy={C} r={FACE} className="fill-card stroke-border" strokeWidth={3} />
      {children}
    </svg>
  );
}

export function Arm({
  dir,
  width = 7,
  length = ARM,
  dashed,
  className = "stroke-foreground",
  style,
}: {
  dir: number;
  width?: number;
  length?: number;
  dashed?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [x, y] = polar(dir, length);
  return (
    <line
      x1={C}
      y1={C}
      x2={x}
      y2={y}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? `1 ${width * 2.2}` : undefined}
      className={className}
      style={style}
    />
  );
}

/** A marca do ângulo no vértice: a fatia e o arco, do braço fixo até o outro. */
export function Wedge({ from, sweep, color, r = WEDGE, width = 4 }: { from: number; sweep: number; color: string; r?: number; width?: number }) {
  if (sweep <= 0) return null;
  return (
    <g>
      <path d={arcPath(from, sweep, r, true)} fill={color} fillOpacity={0.2} />
      <path d={arcPath(from, sweep, r, false)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </g>
  );
}

export function Hub({ r = 11 }: { r?: number }) {
  return <circle cx={C} cy={C} r={r} className="fill-foreground stroke-card" strokeWidth={r / 2.5} />;
}
