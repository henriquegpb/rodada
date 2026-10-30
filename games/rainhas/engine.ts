import { createRainhasEngine } from "./create-engine";
import boards from "./data/8.json";

export const engine = createRainhasEngine("rainhas", 8, boards);
