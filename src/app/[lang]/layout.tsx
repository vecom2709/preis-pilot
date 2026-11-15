import "@fontsource-variable/archivo/wdth.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { isLocale, locales } from "@/i18n/config";
import { Suspense } from "react";
import { Header, HeaderView } from "@/components/shell/Header";
import { BottomNav, BottomNavView } from "@/components/shell/BottomNav";
import { themeBootScript } from "@/components/shell/theme";
import { ServiceWorker } from "@/components/shell/ServiceWorker";
import { SITE_URL, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Preis-Pilot",
    title: { default: t.meta.title, template: "%s – Preis-Pilot" },
    appleWebApp: { capable: true, title: "Preis-Pilot", statusBarStyle: "default" },
    formatDetection: { telephone: false },
    ...pageMetadata(lang, "", t.meta.title, t.meta.description),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b3a45" },
    { media: "(prefers-color-scheme: dark)", color: "#07242c" },
  ],
};

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={lang} dictionary={t}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-paper focus:px-4 focus:py-2">
            {t.common.skip}
          </a>
          <Suspense fallback={<HeaderView pathname="" />}>
            <Header />
          </Suspense>
          <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pt-10 xl:pb-16">
            {children}
          </main>
          <footer className="border-t border-line bg-paper pb-24 xl:pb-0">
            <div className="mx-auto flex max-w-[1560px] flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:px-6 md:flex-row md:items-start md:justify-between lg:px-10">
              <div className="max-w-xl space-y-1">
                <p>{t.footer.attribution}</p>
                <p>{t.footer.independent}</p>
              </div>
              <ul className="flex gap-5">
                <li><Link className="underline-offset-4 hover:underline" href={`/${lang}/sources`}>{t.footer.sources}</Link></li>
                <li><Link className="underline-offset-4 hover:underline" href={`/${lang}/radar`}>{t.nav.radar}</Link></li>
                <li><Link className="underline-offset-4 hover:underline" href={`/${lang}/privacy`}>{t.footer.privacy}</Link></li>
              </ul>
            </div>
          </footer>
          <Suspense fallback={<BottomNavView pathname="" />}>
            <BottomNav />
          </Suspense>
          <ServiceWorker />
        </I18nProvider>
      </body>
    </html>
  );
}
