"use client";

import { Check, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "@/lib/utils";

/*
 * Do Microkit (`npx shadcn add @microkit/hold-to-delete-button`), adaptado ao Rodada: os textos vêm
 * por props e, quando a barra enche, roda `onConfirm`. Enquanto ela trabalha a barra fica cheia com
 * `pendingLabel`; se der certo aparece o check, se falhar volta ao começo.
 */

type DeleteState = "idle" | "holding" | "pending" | "deleted";

const HOLD_MS = 1600;
const RESET_MS = 1800;

const pulseKeyframes = `
@keyframes hold-delete-pulse {
  from { outline: 1px solid rgba(249, 115, 22, .9); outline-offset: 0; }
  to { outline: 1px solid rgba(249, 115, 22, 0); outline-offset: 12px; }
}`;

interface Labels {
  label: string;
  pendingLabel: string;
  doneLabel: string;
}

function ButtonContent({ state, labels }: { state: DeleteState; labels: Labels }) {
  const deleted = state === "deleted";
  const text = state === "pending" ? labels.pendingLabel : labels.label;
  return (
    <span className="inline-flex items-center gap-[10px]">
      <span className="grid shrink-0" aria-hidden="true">
        <Trash2
          className="[grid-area:1/1] [transition:opacity_.24s_ease,transform_.32s_cubic-bezier(.16,1,.3,1)] data-[active=false]:opacity-0 data-[active=false]:[transform:scale(.5)] motion-reduce:transition-none"
          data-active={!deleted}
          size={20}
          strokeWidth={2}
        />
        <Check
          className="[grid-area:1/1] [transition:opacity_.24s_ease,transform_.32s_cubic-bezier(.16,1,.3,1)] data-[active=false]:opacity-0 data-[active=false]:[transform:scale(.5)] motion-reduce:transition-none"
          data-active={deleted}
          size={20}
          strokeWidth={2.4}
        />
      </span>
      <span className="grid">
        <span
          className="justify-self-start whitespace-nowrap [grid-area:1/1] [transition:opacity_.24s_ease,transform_.32s_cubic-bezier(.16,1,.3,1),filter_.24s_ease,visibility_.24s] data-[active=false]:invisible data-[active=false]:opacity-0 data-[active=false]:[transform:translateY(6px)] data-[active=false]:[filter:blur(2px)] motion-reduce:transition-none"
          data-active={!deleted}
        >
          {text}
        </span>
        <span
          className="justify-self-start whitespace-nowrap [grid-area:1/1] [transition:opacity_.24s_ease,transform_.32s_cubic-bezier(.16,1,.3,1),filter_.24s_ease,visibility_.24s] data-[active=false]:invisible data-[active=false]:opacity-0 data-[active=false]:[transform:translateY(6px)] data-[active=false]:[filter:blur(2px)] motion-reduce:transition-none"
          data-active={deleted}
        >
          {labels.doneLabel}
        </span>
      </span>
    </span>
  );
}

export function HoldToDeleteButton({
  onConfirm,
  label = "Segure para excluir",
  pendingLabel = "Excluindo…",
  doneLabel = "Excluído",
  className,
}: {
  /** Roda quando a barra enche; se rejeitar, o botão volta ao começo. */
  onConfirm: () => Promise<unknown> | void;
  label?: string;
  pendingLabel?: string;
  doneLabel?: string;
  className?: string;
}) {
  const [state, setState] = useState<DeleteState>("idle");
  const confirm = useRef(onConfirm);
  useEffect(() => {
    confirm.current = onConfirm;
  });

  useEffect(() => {
    if (state === "idle" || state === "pending") return;
    if (state === "holding") {
      const timeout = window.setTimeout(() => {
        setState("pending");
        Promise.resolve()
          .then(() => confirm.current())
          .then(
            () => setState("deleted"),
            () => setState("idle"),
          );
      }, HOLD_MS);
      return () => window.clearTimeout(timeout);
    }
    const timeout = window.setTimeout(() => setState("idle"), RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [state]);

  const start = () => setState((current) => (current === "idle" ? "holding" : current));
  const cancel = () => setState((current) => (current === "holding" ? "idle" : current));

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button === 0) start();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) start();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") cancel();
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <button
        type="button"
        className={cn(
          "group relative inline-flex h-[52px] cursor-pointer appearance-none items-center justify-center overflow-hidden rounded-full border-0 bg-[light-dark(#ffffff,#121418)] px-[24px] [font-family:inherit] text-[17px] font-medium leading-none tracking-[-.01em] text-[light-dark(#14181e,#f2f4f6)] [box-shadow:inset_0_0_0_1px_light-dark(#dfe3ea,#2b2f36),0_10px_24px_light-dark(rgba(246,247,249,.35),rgba(0,0,0,.35)),0_8px_28px_rgba(249,115,22,0)] data-[state=holding]:[box-shadow:inset_0_0_0_1px_light-dark(#dfe3ea,#2b2f36),0_10px_24px_light-dark(rgba(246,247,249,.35),rgba(0,0,0,.35)),0_8px_28px_rgba(249,115,22,.55)] data-[state=pending]:[box-shadow:inset_0_0_0_1px_light-dark(#dfe3ea,#2b2f36),0_10px_24px_light-dark(rgba(246,247,249,.35),rgba(0,0,0,.35)),0_8px_28px_rgba(249,115,22,.55)] data-[state=pending]:cursor-progress data-[state=deleted]:[box-shadow:inset_0_0_0_1px_light-dark(#dfe3ea,#2b2f36),0_10px_24px_light-dark(rgba(246,247,249,.35),rgba(0,0,0,.35)),0_8px_28px_rgba(249,115,22,.55)] select-none [-webkit-touch-callout:none] touch-manipulation [transition:transform_.25s_cubic-bezier(.16,1,.3,1),background-color_.2s_ease,box-shadow_.5s_cubic-bezier(.16,1,.3,1)] data-[state=holding]:[transition:transform_.25s_cubic-bezier(.16,1,.3,1),background-color_.2s_ease,box-shadow_1.6s_linear] hover:data-[state=idle]:bg-[light-dark(#f0f2f5,#1b1e23)] motion-safe:data-[state=holding]:[transform:scale(.97)] data-[state=deleted]:cursor-default motion-safe:data-[state=deleted]:[animation:hold-delete-pulse_.8s_cubic-bezier(.16,1,.3,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f97316] motion-reduce:data-[state=idle]:[transition:none] motion-reduce:data-[state=deleted]:[transition:none] motion-reduce:data-[state=holding]:[transition:box-shadow_1.6s_linear]",
          className,
        )}
        data-state={state}
        aria-busy={state === "pending"}
        onPointerDown={handlePointerDown}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={cancel}
        onContextMenu={(event) => event.preventDefault()}
      >
        <ButtonContent state={state} labels={{ label, pendingLabel, doneLabel }} />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#f97316] text-white [clip-path:inset(0_100%_0_0)] [transition:clip-path_.5s_cubic-bezier(.16,1,.3,1)] group-data-[state=holding]:[clip-path:inset(0)] group-data-[state=holding]:[transition:clip-path_1.6s_linear] group-data-[state=pending]:[clip-path:inset(0)] group-data-[state=deleted]:[clip-path:inset(0)] motion-reduce:group-data-[state=idle]:[transition:none] motion-reduce:group-data-[state=deleted]:[transition:none]"
          aria-hidden="true"
        >
          <ButtonContent state={state} labels={{ label, pendingLabel, doneLabel }} />
        </span>
      </button>
    </>
  );
}
