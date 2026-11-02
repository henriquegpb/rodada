"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A duração de `swap-in` e `swap-out` (app/globals.css). */
const SWAP_MS = 400;

interface Panel {
  id: string;
  node: ReactNode;
}

/**
 * Troca de conteúdo sem piscar, do Microkit · Blur Glide Menu: quando `id` muda, o painel de antes
 * sai deslizando e desfocando e o novo entra pelo outro lado; a altura acompanha. `direction` diz o
 * lado (1: o novo vem da direita). O painel que sai continua o mesmo componente (mesma `key`), então
 * sai como estava, na mesma página.
 */
export function GlideSwap({
  id,
  direction = 1,
  children,
  className,
}: {
  id: string;
  direction?: 1 | -1;
  children: ReactNode;
  className?: string;
}) {
  const [state, setState] = useState<{ current: Panel; leaving: Panel | null; dir: 1 | -1; moved: boolean }>({
    current: { id, node: children },
    leaving: null,
    dir: direction,
    moved: false,
  });
  // Estado derivado das props, no próprio render: o painel que sai é o último que estava na tela.
  if (id !== state.current.id) {
    setState({ current: { id, node: children }, leaving: state.current, dir: direction, moved: true });
  } else if (children !== state.current.node) {
    setState((s) => ({ ...s, current: { id, node: children } }));
  }

  const boxRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const sizedRef = useRef(false);

  // A caixa tem a altura do painel novo, e anima até ela (inclusive quando o conteúdo muda de tamanho).
  useLayoutEffect(() => {
    const box = boxRef.current;
    const active = activeRef.current;
    if (!box || !active) return;
    const fit = () => {
      if (!sizedRef.current) box.style.transition = "none";
      box.style.height = `${active.offsetHeight}px`;
      if (!sizedRef.current) {
        void box.offsetHeight;
        box.style.transition = "";
        sizedRef.current = true;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(active);
    return () => observer.disconnect();
  }, [state.current.id]);

  // O painel que sai some no fim da animação. Por relógio, não por `animationend`: numa aba em
  // segundo plano a animação fica parada e o evento nunca chegaria.
  const leavingId = state.leaving?.id;
  useEffect(() => {
    if (!leavingId) return;
    const timer = window.setTimeout(() => setState((s) => ({ ...s, leaving: null })), SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [leavingId, state.current.id]);

  const style = { "--swap-dir": state.dir } as CSSProperties;
  return (
    <div
      ref={boxRef}
      style={style}
      className={cn(
        "relative transition-[height] duration-[400ms] ease-[cubic-bezier(.45,.05,.15,1)] motion-reduce:transition-none",
        // Só corta durante a troca: parado, sombras e contornos de foco aparecem inteiros.
        state.leaving && "overflow-hidden",
        className,
      )}
    >
      {state.leaving && (
        <div key={state.leaving.id} inert aria-hidden="true" className="swap-out absolute inset-x-0 top-0">
          {state.leaving.node}
        </div>
      )}
      <div key={state.current.id} ref={activeRef} className={cn(state.moved && "swap-in")}>
        {state.current.node}
      </div>
    </div>
  );
}
