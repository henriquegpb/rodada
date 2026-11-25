import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // O servidor refaz a partida do Incomum lendo as respostas do dia de public/incomum: elas entram
  // no pacote das rotas que gravam partidas (server/public-files.ts).
  outputFileTracingIncludes: {
    "/api/plays": ["./public/incomum/**/*"],
    "/api/plays/import": ["./public/incomum/**/*"],
    "/api/incomum/misses": ["./public/incomum/**/*"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
