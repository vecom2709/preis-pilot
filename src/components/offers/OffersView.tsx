"use client";
import Link from "next/link";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import type { OffersResponse } from "@/lib/api-types";
import { formatCents } from "@/lib/money";
import { formatDate, relativeDays } from "@/lib/format";
import { PriceTag } from "@/components/ui/PriceTag";
import { Notice } from "@/components/ui/Notice";

// Dokumentierte reduzierte Preise. Ohne belegte Laufzeit wird nichts als „aktuell“ beworben.
export function OffersView() {
  const { t, intl, locale } = useI18n();
  const country = useCountry();
  const res = useJson<OffersResponse>(`/api/offers?country=${country}`);
  const countryName = t.common.countries[country];
  const types = t.offers.discountTypes as Record<string, string>;

  return (
    <div className="space-y-6">
      <p className="prose-narrow -mt-4 text-ink-soft">{fmt(t.offers.intro, { country: countryName })}</p>
      {res.status === "loading" && <div className="h-40 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}
      {res.status === "error" && <Notice tone="danger" action={<button className="btn btn-quiet btn-sm" onClick={res.reload}>{t.common.retry}</button>}>{t.common.sourceDown}</Notice>}
      {res.status === "ok" && res.data.offers.length === 0 && <Notice>{fmt(t.offers.none, { country: countryName })}</Notice>}
      {res.status === "ok" && res.data.offers.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {res.data.offers.map((o) => {
            const title = o.productName ?? o.productCode ?? "–";
            return (
              <li key={o.id}>
                <PriceTag
                  price={formatCents(o.priceCents, intl)}
                  unitPrice={o.priceWithoutDiscountCents ? fmt(t.product.regular, { price: formatCents(o.priceWithoutDiscountCents, intl) }) : null}
                  store={
                    <span className="block">
                      {o.productCode ? (
                        <Link href={`/${locale}/product/${o.productCode}`} className="block font-bold text-ink hover:text-pine">{title}</Link>
                      ) : (
                        <span className="block font-bold text-ink">{title}</span>
                      )}
                      <span>{o.store.name}{o.store.city ? `, ${o.store.city}` : ""}</span>
                    </span>
                  }
                  badge={<span className="chip shrink-0 bg-saffron-tint text-saffron-text">{(o.discountType && types[o.discountType]) || t.product.discounted}</span>}
                  footer={
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <span>{fmt(t.offers.documented, { date: formatDate(o.date, intl) })} ({relativeDays(o.date, t)})</span>
                      <span className="font-semibold">{t.offers.validity}</span>
                    </div>
                  }
                  emptyLabel={t.common.priceUnavailable}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
