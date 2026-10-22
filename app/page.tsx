import type { Metadata } from "next";
import { HomeScreen } from "@/components/home/home-screen";
import { roundGames } from "@/games";
import { t, LOCALE } from "@/lib/i18n";
import { JsonLd, SITE_DESCRIPTION, SITE_TITLE, absoluteUrl, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  ...pageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" }),
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: t.brand.name,
          url: absoluteUrl("/"),
          description: SITE_DESCRIPTION,
          inLanguage: LOCALE,
          hasPart: roundGames.map((g) => ({ "@type": "WebPage", name: g.meta.name, url: absoluteUrl(`/${g.meta.slug}`) })),
        }}
      />
      <HomeScreen />
    </>
  );
}
