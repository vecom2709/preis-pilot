import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { ListsView } from "@/components/lists/ListsView";

export async function generateMetadata({ params }: PageProps<"/[lang]/lists">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/lists", t.lists.title, t.lists.intro);
}

export default async function ListsPage({ params }: PageProps<"/[lang]/lists">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <PageHeader title={t.lists.title} intro={t.lists.intro} />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
        <ListsView />
      </Suspense>
    </>
  );
}
