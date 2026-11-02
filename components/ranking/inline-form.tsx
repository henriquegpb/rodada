"use client";

import { useId, useState, type ComponentProps } from "react";
import { FocusInput } from "@/components/microkit/focus-input";
import { cn } from "@/lib/utils";

/**
 * Um campo e um botão na mesma linha (e-mail do login, nome do Grupo, código do convite). `onSubmit`
 * devolve a mensagem de erro para mostrar embaixo, ou nada se deu certo; enquanto roda, trava.
 */
export function InlineForm({
  label,
  submit,
  onSubmit,
  className,
  ...input
}: {
  label: string;
  submit: string;
  onSubmit: (value: string) => Promise<string | void>;
  className?: string;
} & Omit<ComponentProps<"input">, "onSubmit" | "value" | "onChange" | "className">) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={cn("flex flex-col gap-2", className)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim() || busy) return;
        setBusy(true);
        const message = await onSubmit(value);
        setBusy(false);
        setError(message || null);
        if (!message) setValue("");
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex gap-2">
        <FocusInput
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          className="h-11 py-0"
          {...input}
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {submit}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
