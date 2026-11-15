import { Suspense, type ComponentType } from "react";
import { notFound } from "next/navigation";
import { getDictionary, fmt, type Dictionary } from "@/i18n";
import { defaultCountryFor, isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";

type Params = { params: Promise<{ lang: string }> };

/** Erzeugt eine Sprachseite mit Metadaten, Überschrift und einer Client-Ansicht. */
export function makePage(path: string, pick: (t: Dictionary) => { title: string; intro: string }, View: ComponentType) {
  async function generateMetadata({ params }: Params) {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const t = getDictionary(lang);
    const { title, intro } = pick(t);
    return pageMetadata(lang, path, title, fmt(intro, { country: t.common.countries[defaultCountryFor[lang]] }));
  }
  async function Page({ params }: Params) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();
    const { title } = pick(getDictionary(lang));
    return (
      <>
        <PageHeader title={title} />
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
          <View />
        </Suspense>
      </>
    );
  }
  return { generateMetadata, Page };
}
