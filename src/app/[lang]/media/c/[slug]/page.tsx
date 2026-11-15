import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getMediaDictionary } from "@/i18n/media/server";
import { findMediaCategory, mediaCategories } from "@/lib/media/specs";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { CategoryView } from "@/components/media/CategoryView";

export function generateStaticParams() {
  return mediaCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/media/c/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const cat = findMediaCategory(slug);
  if (!isLocale(lang) || !cat) return {};
  const t = getMediaDictionary(lang);
  return pageMetadata(lang, `/media/c/${slug}`, cat.label[lang], `${cat.sub.map((s) => s[lang]).join(", ")} – ${t.hub.intro}`);
}

export default async function MediaCategoryPage({ params }: PageProps<"/[lang]/media/c/[slug]">) {
  const { lang, slug } = await params;
  const cat = findMediaCategory(slug);
  if (!isLocale(lang) || !cat) notFound();
  return (
    <>
      <PageHeader title={cat.label[lang]} />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
        <CategoryView slug={slug} />
      </Suspense>
    </>
  );
}
