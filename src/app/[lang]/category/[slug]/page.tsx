import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { categories, findCategory } from "@/lib/categories";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { CategoryProducts } from "@/components/catalog/CategoryProducts";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/category/[slug]">) {
  const { lang, slug } = await params;
  const c = findCategory(slug);
  if (!isLocale(lang) || !c) return {};
  return pageMetadata(lang, `/category/${slug}`, c.label[lang], getDictionary(lang).categoriesPage.intro);
}

export default async function CategoryPage({ params }: PageProps<"/[lang]/category/[slug]">) {
  const { lang, slug } = await params;
  const c = findCategory(slug);
  if (!isLocale(lang) || !c) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <p className="mb-2 text-sm"><Link href={`/${lang}/categories`} className="font-semibold text-pine underline underline-offset-4">{t.categoriesPage.title}</Link></p>
      <PageHeader title={c.label[lang]} intro={t.categoriesPage.intro} />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
        <CategoryProducts slug={c.slug} />
      </Suspense>
    </>
  );
}
