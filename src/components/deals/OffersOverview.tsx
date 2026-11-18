"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { dealCategories } from "@/lib/deals/categories";
import { DealFinder } from "./DealFinder";

/** Angebotsübersicht: alle Kategorien als Einstieg, darunter die Suche mit Filtern */
export function OffersOverview() {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-8">
      <DealFinder />
      <section aria-labelledby="cats-all">
        <h2 id="cats-all" className="mb-3 text-lg font-bold">{t.deals.finder.categoriesTitle}</h2>
        <ul className="flex flex-wrap gap-2">
          {dealCategories.map((c) => (
            <li key={c.slug}>
              <Link href={`/${locale}/offers/${c.slug}`} className="chip border border-line bg-paper py-1.5 text-[0.9rem] hover:border-pine hover:text-pine">{c.label[locale]}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
