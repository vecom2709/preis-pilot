import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { PackCalculator } from "@/components/ui/PackCalculator";
import { SearchView } from "@/components/search/SearchView";

export async function generateMetadata({ params }: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/search", t.search.title, t.search.intro);
}

export default async function SearchPage({ params }: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <PageHeader title={t.search.title} intro={t.search.intro} />
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <Suspense fallback={<div className="h-14 animate-pulse rounded-xl bg-mist-strong" />}>
          <SearchView />
        </Suspense>
        <aside aria-labelledby="pack-tool" className="space-y-3">
          <h2 id="pack-tool" className="text-lg font-bold">{t.search.packTitle}</h2>
          <p className="text-sm text-ink-soft">{t.search.packIntro}</p>
          <PackCalculator compact />
        </aside>
      </div>
    </>
  );
}
