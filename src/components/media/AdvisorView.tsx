"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toCents } from "@/lib/money";
import { advise } from "@/lib/media/engine";
import { mediaCategories, specSchemas } from "@/lib/media/specs";
import { useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { PriorityPicker } from "./CompareView";
import { productTitle, unitLabel, useMedia } from "./shared";

type Result = ReturnType<typeof advise>;

export function AdvisorView() {
  const { locale, t, money } = useMedia();
  const data = useAppData();
  const hydrated = useHydrated();
  const [category, setCategory] = useState(mediaCategories[0].slug);
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  const cat = mediaCategories.find((c) => c.slug === category)!;
  const defs = specSchemas[cat.schema] ?? [];
  const numericDefs = defs.filter((d) => d.type === "number" && d.better !== "lower");
  const label = (key: string) => defs.find((d) => d.key === key)?.label[locale] ?? key;

  function run(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const minimums: Record<string, number> = {};
    for (const d of numericDefs) {
      const raw = String(f.get(`min:${d.key}`) ?? "").trim();
      const n = Number(raw.replace(",", "."));
      if (raw && Number.isFinite(n)) minimums[d.key] = n;
    }
    const budgetRaw = String(f.get("budget") ?? "").trim();
    setResult(
      advise(data.products, data.offers, {
        category,
        budgetCents: budgetRaw ? toCents(budgetRaw) : null,
        minimums,
        priorities,
        allowUsed: f.get("allowUsed") === "on",
      }),
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="panel space-y-5 p-4 sm:p-5" onChange={() => setResult(null)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="adv-cat">{t.advisor.category}</label>
            <select id="adv-cat" className="field" value={category} onChange={(e) => { setCategory(e.target.value); setPriorities({}); }}>
              {mediaCategories.map((c) => <option key={c.slug} value={c.slug}>{c.label[locale]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="adv-budget">{t.advisor.budget}</label>
            <input id="adv-budget" name="budget" className="field num" inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" />
          </div>
        </div>
        {numericDefs.length > 0 && (
          <fieldset key={category}>
            <legend className="mb-3 font-bold">{t.advisor.minimum}</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {numericDefs.map((d) => (
                <div key={d.key}>
                  <label className="label" htmlFor={`adv-min-${d.key}`}>{d.label[locale]}{d.unit ? ` (${unitLabel(d, t.units)})` : ""}</label>
                  <input id={`adv-min-${d.key}`} name={`min:${d.key}`} className="field num" type="number" min={0} step="any" />
                </div>
              ))}
            </div>
          </fieldset>
        )}
        <PriorityPicker defs={defs} value={priorities} onChange={setPriorities} idPrefix="adv-prio" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowUsed" className="h-5 w-5 accent-[var(--pine)]" />
          {t.advisor.allowUsed}
        </label>
        <button type="submit" className="btn btn-primary">{t.advisor.run}</button>
      </form>

      {result && (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section aria-labelledby="adv-picks" className="space-y-3">
            <h2 id="adv-picks" className="text-lg font-bold">{t.advisor.picks}</h2>
            {!result.picks.length && <Notice>{t.advisor.noPicks}</Notice>}
            <ol className="space-y-3">
              {result.picks.map((p, i) => (
                <li key={p.product.id} className={`panel p-4 ${i === 0 ? "border-pine" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/${locale}/produkte/product?id=${encodeURIComponent(p.product.id)}`} className="font-bold underline-offset-4 hover:underline">
                        {i + 1}. {productTitle(p.product)}
                      </Link>
                      <p className="num text-sm text-ink-soft">{p.product.model}</p>
                    </div>
                    <div className="text-right">
                      {p.bestTotalCents !== null ? (
                        <>
                          <p className="price text-2xl">{money(p.bestTotalCents)}</p>
                          {p.bestCondition && <p className="text-xs text-ink-soft">{t.offers.conditions[p.bestCondition]}</p>}
                        </>
                      ) : (
                        <p className="text-sm text-ink-soft">{t.compare.noPrice}</p>
                      )}
                      {p.score !== null && <p className="num mt-1 text-sm text-ink-soft">{t.compare.score}: {p.score}</p>}
                    </div>
                  </div>
                  {(p.pros.length > 0 || p.cons.length > 0) && (
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {p.pros.length > 0 && <div><dt className="font-semibold text-pine-strong">{t.advisor.pros}</dt><dd>{p.pros.map(label).join(", ")}</dd></div>}
                      {p.cons.length > 0 && <div><dt className="font-semibold text-ink-soft">{t.advisor.cons}</dt><dd>{p.cons.map(label).join(", ")}</dd></div>}
                    </dl>
                  )}
                </li>
              ))}
            </ol>
            <p className="text-sm text-ink-soft">{t.advisor.note}</p>
          </section>
          {result.excluded.length > 0 && (
            <section aria-labelledby="adv-excl">
              <h2 id="adv-excl" className="mb-3 text-lg font-bold">{t.advisor.excluded}</h2>
              <ul className="panel divide-y divide-line">
                {result.excluded.map((e) => (
                  <li key={e.product.id} className="flex justify-between gap-3 px-4 py-2.5 text-[0.95rem]">
                    <span className="truncate">{productTitle(e.product)}</span>
                    <span className="shrink-0 text-ink-soft">{t.advisor.reasons[e.reason]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
