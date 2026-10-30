import { createRainhasEngine } from "../rainhas/create-engine";
import boards from "../rainhas/data/10.json";

export const engine = createRainhasEngine("rainhas-10", 10, boards);
