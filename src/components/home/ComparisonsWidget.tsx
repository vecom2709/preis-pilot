"use client";
import Image from "next/image";
import Link from "next/link";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/ui/Notice";

interface Comparison {
  code: string;
  name: string;
  quantityText: string | null;
  imageUrl: string | null;
  offers: { chain: string; priceCents: number; date: string }[];
  spreadPercent: number;
}

/** Echte Preisvergleiche: nur geprüfte Preise aus Open Prices, Kettennamen als Text (keine Logos). */
export function ComparisonsList({ limit, showNote = true }: { limit: number; showNote?: boolean }) {
  const { t, intl, locale } = useI18n();
  const country = useCountry();
  const res = useJson<{ comparisons: Comparison[] }>(`/api/comparisons?country=${country}`);
  const list = res.status === "ok" ? res.data.comparisons.slice(0, limit) : [];

  return (
    <div>
      {res.status === "loading" && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: Math.min(limit, 3) }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-mist-strong" />)}
        </div>
      )}
      {res.status === "error" && <Notice tone="danger" action={<button className="btn btn-quiet btn-sm" onClick={res.reload}>{t.common.retry}</button>}>{t.common.sourceDown}</Notice>}
      {res.status === "ok" && list.length === 0 && <p className="text-ink-soft">{fmt(t.landing.comparisonsEmpty, { country: t.common.countries[country] })}</p>}
      {list.length > 0 && (
        <ul className="divide-y divide-line">
          {list.map((c) => (
            <li key={c.code} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2.5 md:grid-cols-[3rem_minmax(0,8.5rem)_1fr_auto]">
              <div className="relative h-12 w-12 overflow-hidden rounded-md bg-paper">
                {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="48px" className="object-contain" />}
              </div>
              <Link href={`/${locale}/product/${c.code}`} className="min-w-0 hover:text-pine">
                <span className="block truncate font-bold leading-tight">{c.name}</span>
                {c.quantityText && <span className="text-sm text-ink-soft">{c.quantityText}</span>}
              </Link>
              <ul className="col-span-2 flex flex-wrap gap-1.5 md:col-span-1 xl:flex-nowrap">
                {c.offers.slice(0, 3).map((o, i) => (
                  <li
                    key={o.chain}
                    title={`${o.chain}, ${t.common.observedOn} ${formatDate(o.date, intl)}`}
                    className={`flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 ${i === 0 ? "bg-saving/12 ring-1 ring-saving/30" : "bg-mist"}`}
                  >
                    <span className="max-w-[5.6rem] truncate rounded bg-paper px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-ink ring-1 ring-line">{o.chain}</span>
                    <span className="num whitespace-nowrap text-[0.92rem] font-semibold">{formatCents(o.priceCents, intl)}</span>
                    {i === 0 && <span className="sr-only">{t.landing.cheapest}</span>}
                  </li>
                ))}
              </ul>
              <span className={`col-span-2 justify-self-start rounded-md px-2.5 py-1 text-[1.2rem] font-extrabold leading-none text-white md:col-span-1 md:justify-self-end ${c.spreadPercent > 0 ? "bg-saving" : "bg-[#4b5d68]"}`}>
                {c.spreadPercent > 0 ? `-${c.spreadPercent} %` : "±0 %"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {showNote && list.length > 0 && <p className="mt-2 text-xs text-ink-soft">{t.landing.comparisonsNote}</p>}
    </div>
  );
}
