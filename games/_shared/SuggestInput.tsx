"use client";

import { useId, useMemo, useRef, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { FocusInput } from "@/components/microkit/focus-input";
import { cn } from "@/lib/utils";

export interface Suggestion {
  key: string;
  name: string;
}

/**
 * Campo com autocomplete: setas escolhem, Enter chuta. `search` diz o que sugerir para o texto
 * digitado (países, capitais…). `onGuess` resolve com a mensagem de erro (vira toast) ou null
 * quando a tentativa foi aceita.
 */
export function SuggestInput({
  onGuess,
  search,
  placeholder,
}: {
  onGuess(name: string): Promise<string | null>;
  search(query: string): Suggestion[];
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const suggestions = useMemo(() => search(query), [query, search]);

  async function submit(value: string) {
    if (!value.trim() || busy) return;
    setBusy(true);
    const error = await onGuess(value);
    setBusy(false);
    if (error) {
      toast(error);
      return;
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        submit(open && suggestions[highlight] ? suggestions[highlight].name : query);
      }}
    >
      <FocusInput
        ref={inputRef}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        className="h-14 rounded-md pr-14 text-[17px]"
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(0, h - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      <button
        type="submit"
        disabled={busy || !query.trim()}
        className="absolute right-2 top-2 grid size-10 place-items-center rounded-[5px] bg-primary text-primary-foreground transition-[opacity,transform] active:scale-95 disabled:opacity-30"
        aria-label="Chutar"
      >
        <CornerDownLeft size={18} strokeWidth={2.5} />
      </button>
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-2xl shadow-black/40 animate-rise"
        >
          {suggestions.map((c, i) => (
            <li
              key={c.key}
              role="option"
              aria-selected={i === highlight}
              onPointerDown={(e) => {
                e.preventDefault();
                submit(c.name);
              }}
              onPointerEnter={() => setHighlight(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between px-4 py-2.5 text-[15px]",
                i === highlight ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {c.name}
              {i === highlight && <CornerDownLeft size={14} className="text-muted-foreground" />}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
