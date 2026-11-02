import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#FFD54A", "#F5B301", "#FFF1B8", "#E8B931", "#FF8A3D", "#7DD3FC", "#F472B6"];
const PIECES = 48;

/** Um número de 0 a 1 fixo para cada pedaço: o confete não muda de lugar a cada render. */
const noise = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const confetti = Array.from({ length: PIECES }, (_, i) => {
  const wide = noise(i, 1) > 0.5;
  return {
    left: `${noise(i, 2) * 100}%`,
    width: wide ? 10 : 6,
    height: wide ? 6 : 12,
    background: COLORS[i % COLORS.length],
    borderRadius: noise(i, 3) > 0.7 ? 9999 : 2,
    animationDuration: `${5 + noise(i, 4) * 5}s`,
    // Atraso negativo: já abre com confete espalhado pela tela, não todo saindo do topo.
    animationDelay: `${-noise(i, 5) * 10}s`,
    "--sway": `${(noise(i, 6) - 0.5) * 160}px`,
    "--spin": `${(noise(i, 7) > 0.5 ? 1 : -1) * (360 + noise(i, 8) * 720)}deg`,
  } as CSSProperties;
});

/*
 * As animações moram aqui, junto do único lugar que as usa. `--sway` é o quanto cada pedaço vai de
 * lado; `--spin`, quanto gira. Com movimento reduzido, fica só o brilho, sem confete.
 */
const CSS = `
@keyframes champion-glow {
  from { opacity: 0; transform: translateY(-40%); }
  to { opacity: 1; transform: none; }
}
@keyframes confetti-fall {
  from { transform: translate3d(0, -10vh, 0) rotate(0deg); }
  to { transform: translate3d(var(--sway, 0px), 110vh, 0) rotate(var(--spin, 720deg)); }
}
.champion-glow { animation: champion-glow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
.confetti { animation-name: confetti-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
@media (prefers-reduced-motion: reduce) {
  .champion-glow { animation-duration: 0.01ms; }
  .confetti { display: none; }
}
`;

/** Só a área do conteúdo: no desktop, a sidebar (248px) fica de fora. */
const AREA = "pointer-events-none fixed inset-y-0 right-0 left-0 overflow-hidden lg:left-[248px]";

/**
 * Para quem está em 1º no ranking aberto: o topo do conteúdo fica dourado, atrás do texto, e cai
 * confete por cima. Vai direto no `body`: dentro de um painel com `transform` ou `filter` (a troca
 * de Grupo, a de aba), o `fixed` passaria a valer para o painel, não para a tela.
 */
export function Champion() {
  // Só aparece depois que o ranking chega, sempre no navegador.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div aria-hidden="true">
      <style href="champion" precedence="default">
        {CSS}
      </style>
      <div className={`${AREA} -z-10`}>
        <div
          className="champion-glow absolute inset-x-0 top-0 h-[45vh]"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, rgb(232 185 49 / 0.38), rgb(232 185 49 / 0.12) 45%, transparent 75%)",
          }}
        />
      </div>
      <div className={`${AREA} z-40`}>
        {confetti.map((style, i) => (
          <span key={i} className="confetti absolute top-0" style={style} />
        ))}
      </div>
    </div>,
    document.body,
  );
}
