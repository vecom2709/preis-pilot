"use client";
// Startseiten-Bereiche der Live-Angebote. Leere Bereiche werden ausgeblendet – es gibt keine Platzhalter-Angebote.
import Link from "next/link";
import { useI18n, useCountry } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import type { Section } from "@/lib/deals/query";
import type { ScoredDeal } from "@/lib/deals/types";
import { IconChevron } from "@/components/ui/icons";
import { DealCard, useAgo } from "./DealCard";

const ORDER: Section[] = ["top", "drops", "mega", "under10", "under25", "under50", "discount", "food", "tech", "auto", "new"];

export function DealRow({ title, href, items }: { title: string; href: string; items: ScoredDeal[] }) {
  const { t } = useI18n();
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h3 className="text-[1.3rem] font-extrabold tracking-[-0.015em]">{title}</h3>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-pine hover:text-pine-strong">{t.deals.seeAll}<IconChevron width={16} height={16} /></Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {items.map((d) => (
          <li key={d.id} className="w-[78%] max-w-[300px] shrink-0 snap-start sm:w-[290px]"><DealCard deal={d} /></li>
        ))}
      </ul>
    </section>
  );
}

export function DealSections() {
  const { t, locale } = useI18n();
  const country = useCountry();
  const ago = useAgo();
  const { status, data } = useJson<{ updatedAt: string | null; sections: Record<Section, { total: number; items: ScoredDeal[] }> }>(`/api/deals/sections?country=${country}`);
  return (
    <section aria-labelledby="live-title" className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="live-title" className="text-[1.8rem] font-extrabold tracking-[-0.02em]">{t.deals.liveTitle}</h2>
          <p className="max-w-2xl text-ink-soft">{t.deals.liveIntro}</p>
        </div>
        {data?.updatedAt && <p className="text-sm text-ink-soft">{fmt(t.deals.finder.updated, { ago: ago(data.updatedAt) })}</p>}
      </div>
      {status !== "ok" && status !== "error" && <div className="h-80 animate-pulse rounded-2xl bg-mist-strong" />}
      {data && ORDER.filter((s) => data.sections[s]?.items.length).map((s) => (
        <DealRow key={s} title={`${t.deals.sections[s]} (${data.sections[s].total})`} href={`/${locale}/offers?section=${s}`} items={data.sections[s].items} />
      ))}
    </section>
  );
}
