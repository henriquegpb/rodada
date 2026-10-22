import type { RotaVerdict } from "./types";

export const START_COLOR = "#ff5f8f";
export const END_COLOR = "#2ec4b6";

export const VERDICT_COLOR: Record<RotaVerdict, string> = {
  route: "#22c47e",
  near: "#ffc21a",
  far: "#f2555a",
};

export const VERDICT_LABEL: Record<RotaVerdict, string> = {
  route: "no caminho",
  near: "perto",
  far: "longe",
};
