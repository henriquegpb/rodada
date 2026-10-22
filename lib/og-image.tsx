import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { t } from "@/lib/i18n";

/**
 * Imagem das prévias de link (WhatsApp, X, Google): fundo escuro do site, logo, título na Archivo
 * esticada dos títulos e uma faixa embaixo na cor do jogo (ou nas três cores do logo, na home).
 */
export const OG_SIZE = { width: 1200, height: 630 };

const LOGO_COLORS = ["#ff6a1a", "#2f7cf6", "#19b46e"];

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/archivo-expanded-800.ttf")),
  readFile(join(process.cwd(), "assets/fonts/archivo-500.ttf")),
]);

export async function ogImage({ title, subtitle, colors = LOGO_COLORS }: { title: string; subtitle: string; colors?: string[] }) {
  const [display, text] = await fonts;
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#0b0f14", color: "#edf1f5" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 80px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="48" height="48" viewBox="0 0 28 28">
              <rect x="1" y="15" width="8" height="12" rx="1.5" fill={LOGO_COLORS[0]} />
              <rect x="10" y="8" width="8" height="19" rx="1.5" fill={LOGO_COLORS[1]} />
              <rect x="19" y="1" width="8" height="26" rx="1.5" fill={LOGO_COLORS[2]} />
            </svg>
            <span style={{ fontFamily: "Display", fontSize: 40 }}>{t.brand.name.toLowerCase()}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 20 }}>
            <span style={{ fontFamily: "Display", fontSize: title.length > 12 ? 84 : 132, lineHeight: 1 }}>{title}</span>
            <span style={{ fontFamily: "Text", fontSize: 44, color: "#9aa4b1" }}>{subtitle}</span>
          </div>
          <span style={{ fontFamily: "Text", fontSize: 28, color: "#5c6876", paddingBottom: 48 }}>
            Grátis · sem cadastro · em português
          </span>
        </div>
        <div style={{ display: "flex", height: 20 }}>
          {colors.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Display", data: display, weight: 800, style: "normal" },
        { name: "Text", data: text, weight: 500, style: "normal" },
      ],
    },
  );
}
