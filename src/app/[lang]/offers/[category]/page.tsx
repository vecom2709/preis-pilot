import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { dealCategories, findDealCategory } from "@/lib/deals/categories";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { DealFinder } from "@/components/deals/DealFinder";

export function generateStaticParams() {
  return dealCategories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/offers/[category]">): Promise<Metadata> {
  const { lang, category } = await params;
  const c = findDealCategory(category);
  if (!isLocale(lang) || !c) return {};
  return pageMetadata(lang, `/offers/${category}`, `${c.label[lang]} – ${getDictionary(lang).deals.finder.title}`, getDictionary(lang).deals.finder.intro);
}

export default async function CategoryOffersPage({ params }: PageProps<"/[lang]/offers/[category]">) {
  const { lang, category } = await params;
  const c = findDealCategory(category);
  if (!isLocale(lang) || !c) notFound();
  return (
    <>
      <PageHeader title={c.label[lang]} intro={getDictionary(lang).deals.finder.intro} />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-mist-strong" />}>
        <DealFinder fixedCategory={c.slug} />
      </Suspense>
    </>
  );
}
