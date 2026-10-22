// Capa dos jogos de várias palavras: N tabuleiros pequenos, cada um com uma linha já resolvida.
const SOLVED = ["#####", "#o.#.", ".#o.#", "o.##."];

export function MultiWordCover({ boards, className }: { boards: 2 | 4; className?: string }) {
  const tile = boards === 2 ? 15 : 11;
  const gap = boards === 2 ? 4 : 3;
  const rows = boards === 2 ? 4 : 3;
  const boardW = 5 * tile + 4 * gap;
  const boardH = rows * tile + (rows - 1) * gap;
  const cols = 2;
  const between = boards === 2 ? 18 : 14;
  const totalW = cols * boardW + (cols - 1) * between;
  const totalH = (boards / cols) * boardH + (boards / cols - 1) * between;
  const x0 = (240 - totalW) / 2;
  const y0 = (200 - totalH) / 2;

  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      {Array.from({ length: boards }, (_, b) => {
        const bx = x0 + (b % cols) * (boardW + between);
        const by = y0 + Math.floor(b / cols) * (boardH + between);
        return Array.from({ length: rows }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => {
            // Os tabuleiros alternam: uns resolvidos na última linha, outros na penúltima.
            const solvedRow = rows - 1 - (b % 2);
            const pattern = r === solvedRow ? "#####" : SOLVED[(r + b) % SOLVED.length];
            const mark = r > solvedRow ? " " : pattern[c];
            return (
              <rect
                key={`${b}-${r}-${c}`}
                x={bx + c * (tile + gap)}
                y={by + r * (tile + gap)}
                width={tile}
                height={tile}
                rx={2.5}
                fill={mark === "#" ? "currentColor" : mark === "o" ? "#fff" : "none"}
                stroke="currentColor"
                strokeWidth={mark === "#" || mark === "o" ? 0 : 2}
                opacity={mark === " " ? 0.35 : 1}
              />
            );
          }),
        );
      })}
    </svg>
  );
}
