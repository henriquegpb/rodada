import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Microkit · Focus Field (https://microkit.co/components/focus-input), adaptado:
 * repassa props e ref para o input e usa os tokens do tema.
 */
export function FocusInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground shadow-[0_0_0_0_#f9731600] outline-none transition-[border-color,box-shadow] duration-[320ms] ease-[cubic-bezier(.22,1,.36,1)] placeholder:text-muted-foreground focus:border-[#f97316] focus:shadow-[0_0_0_4px_#f9731625] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
