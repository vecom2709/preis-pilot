import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { DealDetail } from "@/components/deals/DealDetail";

// Einzelnes Angebot – Inhalte ändern sich laufend, daher nicht indexiert.
export async function generateMetadata({ params }: PageProps<"/[lang]/deal">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).deals.details, robots: { index: false, follow: true } };
}

export default async function DealPage({ params }: PageProps<"/[lang]/deal">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-mist-strong" />}>
      <DealDetail />
    </Suspense>
  );
}
