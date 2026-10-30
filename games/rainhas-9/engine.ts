import { createRainhasEngine } from "../rainhas/create-engine";
import boards from "../rainhas/data/9.json";

export const engine = createRainhasEngine("rainhas-9", 9, boards);
