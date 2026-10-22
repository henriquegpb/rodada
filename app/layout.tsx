import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell/app-shell";
import { SITE_URL } from "@/lib/share";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";
import { LOCALE, t } from "@/lib/i18n";
import "./globals.css";

// Archivo tem eixo de largura: o mesmo arquivo serve o texto normal e os títulos esticados.
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["wdth"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${t.brand.name}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: t.brand.name,
  // Prévia padrão para páginas sem a sua (a home e os jogos montam a própria com pageMetadata).
  openGraph: { type: "website", siteName: t.brand.name, locale: "pt_BR", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
    { media: "(prefers-color-scheme: light)", color: "#f1f2f4" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={LOCALE} suppressHydrationWarning className={`${archivo.variable} ${mono.variable} antialiased`}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
