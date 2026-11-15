import { Suspense, type ComponentType } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getMediaDictionary } from "@/i18n/media/server";
import type { MediaDictionary } from "@/i18n/media/de";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";

type Params = { params: Promise<{ lang: string }> };

/** Multimedia-Seite mit Metadaten, Überschrift und Client-Ansicht (Daten liegen nur im Browser). */
export function makeMediaPage(path: string, pick: (t: MediaDictionary) => { title: string; intro: string }, View: ComponentType) {
  async function generateMetadata({ params }: Params) {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const { title, intro } = pick(getMediaDictionary(lang));
    return pageMetadata(lang, path, title, intro);
  }
  async function Page({ params }: Params) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();
    const { title, intro } = pick(getMediaDictionary(lang));
    return (
      <>
        <PageHeader title={title} intro={intro} />
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
          <View />
        </Suspense>
      </>
    );
  }
  return { generateMetadata, Page };
}
