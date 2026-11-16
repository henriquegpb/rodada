import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { COLOR } from "./rules";
import { colOf, rowOf } from "./solver";
import type { TrilhaPuzzle } from "./types";

/**
 * Um traço do caminho, casa por casa (a primeira é de onde ele sai):
 * - locked: o que já foi conferido e vale;
 * - draft: o rascunho do trecho da vez, que ainda não foi conferido;
 * - solution: o resto da solução, mostrado no fim para quem não terminou;
 * - wrong: o último trecho errado, até a pessoa voltar a desenhar.
 */
export interface Stroke {
  cells: readonly number[];
  tone: "locked" | "draft" | "solution" | "wrong";
}

const TONES: Record<Stroke["tone"], { line: number; fill: number }> = {
  locked: { line: 1, fill: 0.3 },
  draft: { line: 0.55, fill: 0.16 },
  solution: { line: 0.3, fill: 0.1 },
  wrong: { line: 0.85, fill: 0 },
};

/** Espaço entre as casas, em frações de casa. */
const GAP = 0.08;

const center = (n: number, i: number) => `${colOf(n, i) + 0.5},${rowOf(n, i) + 0.5}`;

/**
 * O tabuleiro da Trilha em SVG, uma unidade por casa: casas, paredes, traços e números. Serve ao
 * tabuleiro de jogo (com os eventos de ponteiro e teclado no `<svg>`) e ao resumo do resultado.
 * `head` é a ponta do caminho, `next` a casa do próximo número a alcançar e `pop` a do número que
 * acabou de ser alcançado.
 */
export function TrilhaGrid({
  puzzle,
  strokes,
  head,
  next,
  pop,
  className,
  ...props
}: { puzzle: TrilhaPuzzle; strokes: Stroke[]; head?: number; next?: number; pop?: number } & ComponentProps<"svg">) {
  const { size: n, numbers, walls } = puzzle;
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className={cn("block aspect-square w-full select-none", className)} {...props}>
      {Array.from({ length: n * n }, (_, i) => (
        <rect
          key={i}
          x={colOf(n, i) + GAP / 2}
          y={rowOf(n, i) + GAP / 2}
          width={1 - GAP}
          height={1 - GAP}
          rx={0.14}
          className="fill-secondary"
        />
      ))}

      {/* A primeira casa de cada traço já foi pintada pelo anterior (é de onde ele sai). */}
      {strokes.map(({ cells, tone }, s) =>
        cells.map((i, k) =>
          TONES[tone].fill > 0 && (k > 0 || s === 0) ? (
            <rect
              key={`${s}-${k}`}
              x={colOf(n, i) + GAP / 2}
              y={rowOf(n, i) + GAP / 2}
              width={1 - GAP}
              height={1 - GAP}
              rx={0.14}
              fill={COLOR}
              opacity={TONES[tone].fill}
            />
          ) : null,
        ),
      )}

      {walls.map(([a, b]) => {
        // A parede fica na borda que as duas casas dividem.
        const [low, high] = a < b ? [a, b] : [b, a];
        const vertical = high === low + 1;
        const c = colOf(n, high);
        const r = rowOf(n, high);
        return (
          <line
            key={`${low}-${high}`}
            x1={c}
            y1={r}
            x2={vertical ? c : c + 1}
            y2={vertical ? r + 1 : r}
            strokeWidth={0.1}
            strokeLinecap="round"
            className="stroke-foreground"
          />
        );
      })}

      {strokes.map(({ cells, tone }, s) =>
        cells.length > 1 ? (
          <polyline
            key={s}
            points={cells.map((i) => center(n, i)).join(" ")}
            fill="none"
            stroke={tone === "wrong" ? "var(--destructive)" : COLOR}
            // O trecho errado vira uma fila de pontos: com a ponta redonda, um tracejado comum
            // fecha os vãos e parece uma linha cheia.
            strokeWidth={tone === "wrong" ? 0.2 : 0.34}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={tone === "wrong" ? "0 0.34" : undefined}
            opacity={TONES[tone].line}
          />
        ) : null,
      )}

      {head !== undefined && !numbers.includes(head) && (
        <circle cx={colOf(n, head) + 0.5} cy={rowOf(n, head) + 0.5} r={0.22} fill={COLOR} />
      )}

      {numbers.map((cell, k) => {
        const cx = colOf(n, cell) + 0.5;
        const cy = rowOf(n, cell) + 0.5;
        return (
          <g key={cell} className={cn(pop === cell && "animate-pop")} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            {(cell === next || cell === head) && (
              <circle
                cx={cx}
                cy={cy}
                r={0.4}
                fill="none"
                stroke={COLOR}
                strokeWidth={0.07}
                className={cn(cell === next && "animate-pulse")}
              />
            )}
            <circle cx={cx} cy={cy} r={0.3} className="fill-foreground" />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={k + 1 < 10 ? 0.36 : 0.3}
              fontWeight={700}
              className="fill-background tabular-nums"
            >
              {k + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
