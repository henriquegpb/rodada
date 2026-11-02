"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Um número estável para cada Conta: a mesma pessoa tem sempre o mesmo avatar. */
function hash(seed: string) {
  let h = 0;
  for (const char of seed) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/** Até duas iniciais: "João Pedro" vira "JP", "mariana.s" vira "M". */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? "?");
  return letters.toUpperCase();
}

/**
 * A foto da Conta ou, sem ela (ou se não carregar), um avatar gerado: degradê de duas cores tiradas
 * do `seed` (o id ou o handle) com as iniciais. O tamanho e o texto vêm de `className`.
 */
export function Avatar({
  name,
  seed,
  image,
  className,
}: {
  name: string;
  seed: string;
  image: string | null;
  className?: string;
}) {
  const [broken, setBroken] = useState<string | null>(null);

  if (image && broken !== image) {
    return (
      // Foto do Google ou do Blob: sem otimização do Next, que pediria cada domínio na config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(image)}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const h = hash(seed || name);
  const hue = h % 360;
  const angle = (h >> 9) % 360;
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{
        background: `linear-gradient(${angle}deg, hsl(${hue} 70% 58%), hsl(${(hue + 50) % 360} 75% 42%))`,
        textShadow: "0 1px 2px rgb(0 0 0 / 0.25)",
      }}
    >
      {initials(name)}
    </span>
  );
}
