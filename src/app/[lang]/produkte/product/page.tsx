import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getMediaDictionary } from "@/i18n/media/server";
import { ProductView } from "@/components/media/ProductView";

// Produktdaten liegen nur im Browser des Nutzers – die Seite wird daher nicht indexiert.
export async function generateMetadata({ params }: PageProps<"/[lang]/produkte/product">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getMediaDictionary(lang).product.specs, robots: { index: false, follow: true } };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/produkte/product">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
      <ProductView />
    </Suspense>
  );
}
