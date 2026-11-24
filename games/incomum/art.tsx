import { useId, type ComponentType } from "react";
import type { MilestoneArt } from "./tiers";

/**
 * Os desenhos do Incomum, em SVG: o submarino e os bichos da Fossa das Marianas, da superfície ao
 * fundo. Traço grosso escuro e cor chapada, com um brilho de luz em cima. Os bichos olham para a
 * esquerda, para o submarino.
 */

const INK = "#0b1020";
const LINE = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** O submarino, de lado, olhando para a direita. `lamp` acende o farol (no fundo do mar). */
export function Submarine({ className, lamp = 0 }: { className?: string; lamp?: number }) {
  return (
    <svg viewBox="0 0 210 130" className={className} aria-hidden="true">
      {/* Hélice */}
      <g>
        <rect x="8" y="64" width="18" height="12" rx="4" fill="#94a3b8" {...LINE} />
        <ellipse cx="9" cy="56" rx="5" ry="12" fill="#cbd5e1" {...LINE} />
        <ellipse cx="9" cy="84" rx="5" ry="12" fill="#cbd5e1" {...LINE} />
      </g>
      {/* Leme em cima, atrás */}
      <path d="M38 50 L30 30 L56 30 L62 50 Z" fill="#f59e0b" {...LINE} />
      {/* Casco */}
      <rect x="22" y="44" width="168" height="62" rx="31" fill="#fbbf24" {...LINE} />
      <path d="M40 54 Q100 46 170 54" fill="none" stroke="#fde68a" strokeWidth="6" strokeLinecap="round" />
      <path d="M30 88 Q105 100 182 88" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
      {/* Torre e periscópio */}
      <path d="M118 22 L118 8 L136 8" fill="none" {...LINE} strokeWidth="5" />
      <rect x="84" y="20" width="56" height="30" rx="10" fill="#f59e0b" {...LINE} />
      <circle cx="112" cy="35" r="6" fill="#bae6fd" {...LINE} strokeWidth="2.5" />
      {/* Janelas */}
      {[70, 108, 146].map((x) => (
        <g key={x}>
          <circle cx={x} cy="74" r="12.5" fill="#94a3b8" {...LINE} />
          <circle cx={x} cy="74" r="7.5" fill="#7dd3fc" />
          <circle cx={x - 2.5} cy="71" r="2.5" fill="#fff" />
        </g>
      ))}
      {/* Farol na frente */}
      <circle cx="192" cy="76" r="7" fill={lamp > 0.05 ? "#fef9c3" : "#fde68a"} {...LINE} strokeWidth="3" />
    </svg>
  );
}

/** Peixe-diabo, com a lanterninha acesa: 3.000 m. */
export function Anglerfish({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 190 150" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#ecfeff" />
          <stop offset="40%" stopColor="#5eead4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* A luz da isca */}
      <circle cx="26" cy="22" r="34" fill={`url(#${id})`} className="animate-glow" />
      <path d="M78 46 Q64 6 30 20" fill="none" {...LINE} strokeWidth="4" />
      <circle cx="26" cy="22" r="8" fill="#ccfbf1" {...LINE} strokeWidth="3" />
      {/* Cauda e barbatanas */}
      <path d="M150 80 L184 56 Q176 82 184 108 Z" fill="#334155" {...LINE} />
      <path d="M96 42 L112 24 L124 46 Z" fill="#334155" {...LINE} />
      {/* Corpo */}
      <path d="M154 80 Q150 30 96 36 Q52 40 40 74 Q42 122 100 124 Q150 122 154 80 Z" fill="#1e293b" {...LINE} />
      <path d="M70 108 Q110 122 146 96" fill="none" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
      {/* Boca com dentes */}
      <path d="M40 74 Q56 100 92 98 Q70 88 66 70 Z" fill="#7f1d1d" {...LINE} />
      {[46, 54, 62, 70, 78].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${78 + i * 3} l4 10 l4 -9`}
          fill="#fff"
          stroke={INK}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      ))}
      {[58, 68].map((x) => (
        <path key={x} d={`M${x} 96 l4 -9 l4 9`} fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      ))}
      {/* Olho */}
      <circle cx="96" cy="60" r="9" fill="#fef9c3" {...LINE} strokeWidth="2.5" />
      <circle cx="94" cy="61" r="4" fill={INK} />
    </svg>
  );
}

/** Braço ou tentáculo: contorno escuro grosso com a cor por cima. */
function Arm({ d, color, width = 10 }: { d: string; color: string; width?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 7} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  );
}

/** Olho redondo, olhando para a esquerda. */
function Eye({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="#fff" {...LINE} strokeWidth="2.5" />
      <circle cx={x - r * 0.25} cy={y + r * 0.1} r={r * 0.48} fill={INK} />
    </>
  );
}

/** Água-viva-coroa: 1.500 m. */
export function Jellyfish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 170" className={className} aria-hidden="true">
      {[
        "M44 84 Q34 112 48 134 Q58 150 46 166",
        "M68 88 Q62 120 76 150",
        "M92 88 Q100 118 88 148",
        "M116 84 Q128 110 114 136 Q104 152 116 164",
      ].map((d) => (
        <Arm key={d} d={d} color="#f0abfc" width={6} />
      ))}
      <path
        d="M20 82 Q18 14 80 14 Q142 14 140 82 Q130 74 120 84 Q110 74 100 84 Q90 74 80 84 Q70 74 60 84 Q50 74 40 84 Q30 74 20 82 Z"
        fill="#f9a8d4"
        {...LINE}
      />
      <path d="M40 46 Q52 28 76 26" fill="none" stroke="#fce7f3" strokeWidth="6" strokeLinecap="round" />
      {[52, 108].map((x) => (
        <ellipse key={x} cx={x} cy="66" rx="9" ry="6" fill="#ec4899" opacity="0.55" />
      ))}
      <Eye x={66} y={52} r={7} />
      <Eye x={96} y={52} r={7} />
    </svg>
  );
}

/** Peixe-lanterna, com as luzinhas da barriga: 600 m. */
export function Lanternfish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 110" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <path d="M138 55 L172 30 Q162 55 172 80 Z" fill="#475569" {...LINE} />
      <path d="M86 32 L102 14 L112 34 Z" fill="#475569" {...LINE} />
      <ellipse cx="84" cy="55" rx="60" ry="25" fill="#64748b" {...LINE} />
      <path d="M38 46 Q80 28 128 44" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      {[52, 66, 80, 94, 108, 122].map((x) => (
        <g key={x} className="animate-glow">
          <circle cx={x} cy="70" r="8" fill="#7dd3fc" opacity="0.35" />
          <circle cx={x} cy="70" r="3.5" fill="#e0f2fe" />
        </g>
      ))}
      <Eye x={44} y={50} r={11} />
      <path d="M26 62 Q32 66 40 63" fill="none" {...LINE} strokeWidth="2.5" />
    </svg>
  );
}

/** Lula-gigante: 1.000 m. */
export function GiantSquid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 230 130" className={className} aria-hidden="true">
      {[
        "M70 54 Q46 38 24 46 Q12 50 8 40",
        "M70 60 Q42 58 16 64",
        "M70 66 Q46 80 22 82",
        "M70 62 Q38 100 14 108 Q4 110 6 120",
        "M70 58 Q36 22 10 20 Q2 20 4 10",
      ].map((d) => (
        <Arm key={d} d={d} color="#f87171" width={7} />
      ))}
      <path d="M184 65 L218 34 L222 65 L218 96 Z" fill="#dc2626" {...LINE} />
      <path d="M190 65 Q188 36 128 40 L94 46 Q84 65 94 84 L128 90 Q188 94 190 65 Z" fill="#ef4444" {...LINE} />
      <path d="M108 50 Q150 42 178 54" fill="none" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />
      {[
        [130, 72],
        [152, 60],
        [166, 76],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="4" fill="#b91c1c" />
      ))}
      <ellipse cx="82" cy="64" rx="20" ry="22" fill="#f87171" {...LINE} />
      <Eye x={82} y={60} r={12} />
    </svg>
  );
}

/** Cachalote: 2.000 m. */
export function SpermWhale({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 130" className={className} aria-hidden="true">
      <path d="M196 66 Q210 54 230 30 Q220 64 234 92 Q212 78 196 72 Z" fill="#475569" {...LINE} />
      <path
        d="M14 44 Q14 18 58 18 L146 26 Q190 36 204 66 Q184 92 126 96 L58 98 Q16 98 14 76 Z"
        fill="#64748b"
        {...LINE}
      />
      <path d="M30 30 Q60 24 110 30" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 84 Q60 92 104 88" fill="none" {...LINE} strokeWidth="3" />
      <ellipse cx="112" cy="94" rx="16" ry="7" transform="rotate(18 112 94)" fill="#475569" {...LINE} />
      {[140, 156, 172].map((x) => (
        <path key={x} d={`M${x} 40 q4 8 0 16`} fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      ))}
      <circle cx="72" cy="68" r="5" fill={INK} />
      <circle cx="70.5" cy="66.5" r="1.6" fill="#fff" />
    </svg>
  );
}

/** Polvo-dumbo, com as nadadeiras de orelha: 4.000 m. */
export function DumboOctopus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 150" className={className} aria-hidden="true">
      <ellipse cx="30" cy="50" rx="24" ry="13" transform="rotate(-28 30 50)" fill="#fdba74" {...LINE} />
      <ellipse cx="140" cy="50" rx="24" ry="13" transform="rotate(28 140 50)" fill="#fdba74" {...LINE} />
      <path
        d="M36 86 Q30 128 52 134 Q60 120 70 136 Q80 122 90 136 Q100 120 110 136 Q120 122 130 132 Q140 106 134 86 Z"
        fill="#fdba74"
        {...LINE}
      />
      <path d="M36 92 Q28 18 85 16 Q142 18 134 92 Q85 106 36 92 Z" fill="#fb923c" {...LINE} />
      <path d="M52 40 Q64 26 86 26" fill="none" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" />
      <Eye x={68} y={66} r={10} />
      <Eye x={104} y={66} r={10} />
      <path d="M78 84 Q86 90 94 84" fill="none" {...LINE} strokeWidth="2.5" />
    </svg>
  );
}

/** Porquinho-do-mar (um pepino-do-mar com perninhas): 5.500 m. */
export function SeaPig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 190 120" className={className} aria-hidden="true">
      {[52, 72, 92, 112, 132, 152].map((x) => (
        <Arm key={x} d={`M${x} 82 Q${x - 5} 98 ${x} 108`} color="#f9a8d4" width={7} />
      ))}
      <Arm d="M122 40 Q116 18 128 8" color="#f9a8d4" width={6} />
      <Arm d="M142 42 Q144 22 156 14" color="#f9a8d4" width={6} />
      <path
        d="M28 64 Q28 32 80 32 L140 34 Q178 38 178 64 Q178 88 140 88 L72 90 Q28 90 28 64 Z"
        fill="#fbcfe8"
        {...LINE}
      />
      <path d="M44 44 Q80 34 130 40" fill="none" stroke="#fdf2f8" strokeWidth="6" strokeLinecap="round" />
      {[
        [100, 56],
        [126, 68],
        [148, 54],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="4.5" fill="#f472b6" opacity="0.7" />
      ))}
      <Eye x={50} y={56} r={7} />
      <Eye x={70} y={54} r={7} />
      <path d="M34 72 Q40 78 48 74" fill="none" {...LINE} strokeWidth="2.5" />
    </svg>
  );
}

/** Peixe-caracol, mole e transparente: 8.000 m. */
export function Snailfish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 210 110" className={className} aria-hidden="true">
      <path
        d="M22 56 Q22 24 64 24 Q106 26 152 44 Q190 54 204 56 Q190 62 152 70 Q106 88 64 88 Q22 88 22 56 Z"
        fill="#fecdd3"
        fillOpacity="0.9"
        {...LINE}
      />
      <path d="M96 34 Q150 42 198 54 M96 80 Q150 70 198 58" fill="none" stroke="#fda4af" strokeWidth="3" />
      <ellipse cx="70" cy="64" rx="15" ry="9" fill="#fb7185" opacity="0.55" />
      <path d="M36 38 Q52 28 74 30" fill="none" stroke="#fff1f2" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="86" cy="78" rx="13" ry="6" transform="rotate(28 86 78)" fill="#fda4af" {...LINE} strokeWidth="2.5" />
      <Eye x={44} y={50} r={6} />
      <path d="M26 64 Q32 68 40 65" fill="none" {...LINE} strokeWidth="2.5" />
    </svg>
  );
}

/** Anfípode-gigante, parente do camarão: 9.500 m. */
export function Amphipod({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <path d="M40 48 Q22 20 4 16" fill="none" {...LINE} strokeWidth="3" />
      <path d="M42 54 Q18 40 2 44" fill="none" {...LINE} strokeWidth="3" />
      {[58, 76, 94, 112, 130, 148].map((x) => (
        <path key={x} d={`M${x} 78 L${x - 8} 100`} fill="none" {...LINE} strokeWidth="4" />
      ))}
      <path d="M168 62 L194 50 L192 80 Z" fill="#e2e8f0" {...LINE} />
      <path
        d="M34 60 Q38 34 84 32 Q138 32 168 50 Q182 62 174 76 Q140 84 100 80 Q58 82 40 76 Q30 70 34 60 Z"
        fill="#f1f5f9"
        {...LINE}
      />
      {[64, 86, 108, 130, 150].map((x) => (
        <path key={x} d={`M${x} 34 Q${x + 5} 58 ${x} 80`} fill="none" stroke="#94a3b8" strokeWidth="3" />
      ))}
      <path d="M48 44 Q80 32 120 36" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="46" cy="54" r="4.5" fill={INK} />
    </svg>
  );
}

/** O fundo da fossa: 10.994 m, só com os 700 pontos. Uma bandeira fincada nas pedras. */
export function TrenchFloor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 150" className={className} aria-hidden="true">
      <path d="M6 146 Q28 112 58 122 Q86 102 118 120 Q150 106 176 146 Z" fill="#475569" {...LINE} />
      <path d="M86 124 L86 26" fill="none" {...LINE} strokeWidth="5" />
      <path d="M88 28 L146 42 L88 60 Z" fill="#facc15" {...LINE} />
      <circle cx="86" cy="22" r="6" fill="#fde68a" {...LINE} strokeWidth="3" />
      <path d="M30 136 Q60 126 84 132" fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

const ART: Record<MilestoneArt, ComponentType<{ className?: string }>> = {
  lanterna: Lanternfish,
  lula: GiantSquid,
  "agua-viva": Jellyfish,
  cachalote: SpermWhale,
  diabo: Anglerfish,
  dumbo: DumboOctopus,
  porquinho: SeaPig,
  caracol: Snailfish,
  anfipode: Amphipod,
  fundo: TrenchFloor,
};

/** O desenho de um marco da descida. */
export function Creature({ art, className }: { art: MilestoneArt; className?: string }) {
  const Art = ART[art];
  return <Art className={className} />;
}
