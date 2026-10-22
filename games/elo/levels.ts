import type { EloLevel } from "./types";

/** Cor de cada nível de grupo, do mais fácil ao mais difícil; o texto por cima é branco. */
export const LEVEL_COLOR: Record<EloLevel, string> = {
  0: "#12965a",
  1: "#2f6fe0",
  2: "#e8590c",
  3: "#d63c6c",
};

export const LEVEL_EMOJI: Record<EloLevel, string> = { 0: "🟩", 1: "🟦", 2: "🟧", 3: "🟥" };
