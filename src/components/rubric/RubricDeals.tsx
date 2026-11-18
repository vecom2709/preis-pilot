"use client";
// Live-Angebote einer Rubrik: oben drei Top-Angebote im Vorlagen-Kasten, unten eine Angebotsreihe.
// Ohne angebundene Quelle für die Rubrik bleiben die selbst erfassten Händlerangebote (RubricOffers).
import Link from "next/link";
import { useCountry, useI18n } from "@/i18n/client";
import { formatCents } from "@/lib/money";
import { categoriesOfRubric } from "@/lib/deals/categories";
import type { ScoredDeal } from "@/lib/deals/types";
import { useJson } from "@/lib/use-json";
import { DealRow } from "@/components/deals/DealSections";
import { DealImage, ScoreBadge } from "@/components/deals/DealCard";
import { RubricOffers } from "./RubricOffers";

function useRubricDeals(rubric: string, limit: number) {
  const country = useCountry();
  const cats = categoriesOfRubric(rubric).join(",");
  return useJson<{ total: number; items: ScoredDeal[] }>(cats ? `/api/deals?country=${country}&categories=${cats}&limit=${limit}&sort=score` : null);
}

export function RubricTop({ rubric, productCategories }: { rubric: string; productCategories: string[] }) {
  const { t, locale, intl } = useI18n();
  const { status, data } = useRubricDeals(rubric, 3);
  if (status !== "ok" && status !== "error") return <div className="h-40 animate-pulse rounded-lg bg-mist-strong" />;
  if (!data?.items.length) return <RubricOffers categories={productCategories} rubric={rubric} />;
  return (
    <ul className="divide-y divide-line">
      {data.items.map((d) => (
        <li key={d.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
          <span className="relative block aspect-[4/3] overflow-hidden rounded-md bg-white ring-1 ring-line"><DealImage deal={d} sizes="72px" /></span>
          <Link href={`/${locale}/deal?id=${encodeURIComponent(d.id)}&country=${d.country}`} className="min-w-0 hover:text-pine">
            <span className="block truncate font-bold leading-tight">{d.title}</span>
            <span className="block truncate text-sm text-ink-soft">{d.merchant} · <span className="num font-semibold text-ink">{formatCents(d.totalCents ?? d.priceCents, intl)}</span>{d.basis && <> <del className="num">{formatCents(d.basis.cents, intl)}</del></>}</span>
          </Link>
          <span className="flex items-center gap-2">
            {d.discountPercent !== null && <span className="rounded-md bg-saving px-2 py-1 text-[1.05rem] font-extrabold leading-none text-white">-{d.discountPercent} %</span>}
            <ScoreBadge score={d.score} />
          </span>
        </li>
      ))}
      <li className="pt-2 text-xs text-ink-soft">{t.deals.liveIntro}</li>
    </ul>
  );
}

export function RubricDealRow({ rubric, title }: { rubric: string; title: string }) {
  const { locale } = useI18n();
  const { data } = useRubricDeals(rubric, 12);
  if (!data?.items.length) return null;
  return <DealRow title={`${title} (${data.total})`} href={`/${locale}/offers?categories=${categoriesOfRubric(rubric).join(",")}`} items={data.items} />;
}
