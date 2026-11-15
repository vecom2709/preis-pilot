"use client";
import { useMemo, useState } from "react";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import { optimizeBasket, type StoreBasket } from "@/lib/basket";
import { formatCents, toCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import type { PricesResponse } from "@/lib/api-types";
import type { ListItem, ShoppingList } from "@/lib/store/schema";
import { updateData, useAppData } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";

// Supermarkt-Vergleich und Smart Basket für eine Liste – ausschließlich mit belegten Preisen.
export function BasketCompare({ list, onApplyPrice }: { list: ShoppingList; onApplyPrice: (id: string, p: Partial<ListItem>) => void }) {
  const { t, intl } = useI18n();
  const country = useCountry();
  const data = useAppData();
  const [run, setRun] = useState(false);
  const linked = list.items.filter((i) => i.productCode);
  const codes = [...new Set(linked.map((i) => i.productCode!))].sort().join(",");
  const res = useJson<PricesResponse>(run && codes ? `/api/prices?codes=${codes}&country=${country}` : null);
  const { minSavingsCents, basketGroupBy } = data.settings;
  const [minInput, setMinInput] = useState((minSavingsCents / 100).toFixed(2).replace(".", ","));

  const usable = useMemo(() => (res.status === "ok" ? res.data.observations.filter((o) => o.quality.usable) : []), [res.status, res.data]);
  const result = useMemo(
    () => optimizeBasket(list.items.map((i) => ({ id: i.id, productCode: i.productCode, packs: i.quantity })), usable, { groupBy: basketGroupBy, minSavingsCents }),
    [list.items, usable, basketGroupBy, minSavingsCents],
  );
  const nameOf = (id: string) => list.items.find((i) => i.id === id)?.name ?? "";
  const labelOf = (key: string) => result.stores.find((s) => s.key === key)?.label ?? key;
  const fc = (c: number) => formatCents(c, intl);

  function applyCheapest() {
    for (const item of linked) {
      const best = usable.filter((o) => o.productCode === item.productCode && o.pricePer === "item").sort((a, b) => a.priceCents - b.priceCents || b.date.localeCompare(a.date))[0];
      if (best) onApplyPrice(item.id, { priceCents: best.priceCents, priceSource: "open_prices", priceDate: best.date, priceStore: best.store.name });
    }
  }

  const setSetting = (patch: Partial<typeof data.settings>) => updateData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  return (
    <section aria-labelledby="compare-title" className="panel p-4 sm:p-5">
      <h2 id="compare-title" className="text-lg font-bold">{t.lists.compareTitle}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t.lists.compareIntro}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="bc-group">{t.lists.groupBy}</label>
          <select id="bc-group" className="field !w-auto" value={basketGroupBy} onChange={(e) => setSetting({ basketGroupBy: e.target.value as "chain" | "location" })}>
            <option value="chain">{t.lists.groupChain}</option>
            <option value="location">{t.lists.groupLocation}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="bc-min">{t.lists.minSavings} (€)</label>
          <input id="bc-min" className="field num !w-28" inputMode="decimal" value={minInput} onChange={(e) => setMinInput(e.target.value)}
            onBlur={() => { const c = toCents(minInput); if (c !== null && c >= 0) setSetting({ minSavingsCents: c }); }} />
        </div>
        <button className="btn btn-primary" disabled={!linked.length} onClick={() => (run ? res.reload() : setRun(true))}>{t.lists.compareRun}</button>
      </div>

      <div className="mt-5 space-y-4" aria-live="polite">
        {!linked.length && <Notice>{t.lists.compareNoLinked}</Notice>}
        {res.status === "loading" && <p className="text-ink-soft">{t.common.loading}</p>}
        {res.status === "error" && <Notice tone="danger">{t.common.sourceDown}</Notice>}
        {res.status === "ok" && result.stores.length === 0 && <Notice>{fmt(t.lists.compareNoData, { country: t.common.countries[country] })}</Notice>}

        {res.status === "ok" && result.single && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[var(--radius-tag)] border border-pine p-4">
              <h3 className="text-sm font-semibold text-ink-soft">{t.lists.variantA}</h3>
              <p className="mt-1 text-lg font-bold">{result.single.store.label}</p>
              <p className="price mt-1 text-[2.3rem]">{fc(result.single.store.subtotalCents)}</p>
              <p className={`mt-1 text-sm ${result.single.complete ? "text-pine-strong" : "text-saffron-text"}`}>
                {result.single.complete ? t.lists.variantAComplete : fmt(t.lists.variantAPartial, { covered: result.single.store.lines.length, total: result.linkedCount })}
              </p>
              {result.single.store.oldestDate && <p className="text-xs text-ink-soft">{fmt(t.lists.oldest, { date: formatDate(result.single.store.oldestDate, intl) })}</p>}
            </div>
            <div className="rounded-[var(--radius-tag)] border border-line p-4">
              <h3 className="text-sm font-semibold text-ink-soft">{t.lists.variantB}</h3>
              {result.split && result.split.savingsCents > 0 ? (
                <>
                  <p className="mt-1 text-lg font-bold">{labelOf(result.split.stores[0])} + {labelOf(result.split.stores[1])}</p>
                  <p className="price mt-1 text-[2.3rem]">{fc(result.split.subtotalCents)}</p>
                  <p className={`mt-1 text-sm font-semibold ${result.split.worthIt ? "text-pine-strong" : "text-ink-soft"}`}>
                    {result.split.worthIt
                      ? fmt(t.lists.variantBSaves, { amount: fc(result.split.savingsCents) })
                      : fmt(t.lists.variantBNotWorth, { amount: fc(result.split.savingsCents), min: fc(minSavingsCents) })}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-ink-soft">{t.lists.variantBNone}</p>
              )}
            </div>
          </div>
        )}

        {res.status === "ok" && result.stores.length > 0 && (
          <>
            {basketGroupBy === "chain" && <p className="text-xs text-ink-soft">{t.lists.chainNote}</p>}
            <details className="rounded-[var(--radius-tag)] border border-line">
              <summary className="cursor-pointer px-4 py-3 font-semibold">{t.lists.allStores} ({result.stores.length})</summary>
              <ul className="divide-y divide-line border-t border-line">
                {result.stores.map((s: StoreBasket) => (
                  <li key={s.key} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="num font-semibold">{fc(s.subtotalCents)} <span className="font-normal text-ink-soft">({s.lines.length}/{result.linkedCount})</span></span>
                    {s.missingItemIds.length > 0 && (
                      <span className="w-full text-xs text-slate">{fmt(t.lists.storeMissing, { items: s.missingItemIds.map(nameOf).join(", ") })}</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
            <button className="btn btn-quiet btn-sm" onClick={applyCheapest}>{t.lists.useCheapest}</button>
          </>
        )}
      </div>
    </section>
  );
}
