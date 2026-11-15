"use client";
// Treffer der Suche in den selbst erfassten Produkten aller Rubriken (z. B. digitale Produkte, Technik)
import { useI18n } from "@/i18n/client";
import { useAppData, useHydrated } from "@/lib/store/local";
import { MediaI18nProvider } from "@/i18n/media";
import de from "@/i18n/media/de";
import it from "@/i18n/media/it";
import en from "@/i18n/media/en";
import { ProductRow } from "@/components/media/shared";

export function ProductMatches({ q }: { q: string }) {
  const { t, locale } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  const needle = q.trim().toLowerCase();
  if (!hydrated || needle.length < 2) return null;
  const hits = data.products.filter((p) => `${p.brand} ${p.name} ${p.model}`.toLowerCase().includes(needle)).slice(0, 8);
  if (!hits.length) return null;
  return (
    <MediaI18nProvider dict={{ de, it, en }[locale]}>
      <section aria-labelledby="pm-title" className="mt-8">
        <h2 id="pm-title" className="mb-3 text-lg font-bold">{t.search.productMatches}</h2>
        <ul className="panel divide-y divide-line overflow-hidden">
          {hits.map((p) => <ProductRow key={p.id} product={p} offers={data.offers} />)}
        </ul>
      </section>
    </MediaI18nProvider>
  );
}
