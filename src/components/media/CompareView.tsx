"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { fmt } from "@/i18n";
import { compareProducts } from "@/lib/media/engine";
import { mediaCategories, specSchemas, type SpecDef } from "@/lib/media/specs";
import { useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { bestNew, productTitle, specValue, useMedia } from "./shared";

/** Prioritäten 0–3 für alle vergleichbaren Merkmale eines Datenblatts */
export function PriorityPicker({ defs, value, onChange, idPrefix }: { defs: SpecDef[]; value: Record<string, number>; onChange: (v: Record<string, number>) => void; idPrefix: string }) {
  const { locale, t } = useMedia();
  const levels = t.compare.levels;
  return (
    <fieldset>
      <legend className="mb-3 font-bold">{t.compare.priorities}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {defs.filter((d) => d.better).map((d) => (
          <div key={d.key}>
            <label className="label" htmlFor={`${idPrefix}-${d.key}`}>{d.label[locale]}</label>
            <select
              id={`${idPrefix}-${d.key}`}
              className="field"
              value={value[d.key] ?? 1}
              onChange={(e) => onChange({ ...value, [d.key]: Number(e.target.value) })}
            >
              {levels.map((l, i) => <option key={l} value={i}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function CompareView() {
  const params = useSearchParams();
  const { locale, intl, t, money } = useMedia();
  const data = useAppData();
  const hydrated = useHydrated();
  const initialIds = (params.get("ids") ?? "").split(",").filter(Boolean);
  const paramCat = params.get("cat");
  const [category, setCategory] = useState<string>(mediaCategories.some((c) => c.slug === paramCat) ? paramCat! : mediaCategories[0].slug);
  const [picked, setPicked] = useState<string[]>(initialIds);
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [onlyDiff, setOnlyDiff] = useState(false);
  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  const cat = mediaCategories.find((c) => c.slug === category)!;
  const inCat = data.products.filter((p) => p.category === category);
  const selected = inCat.filter((p) => picked.includes(p.id));
  const defs = specSchemas[cat.schema] ?? [];
  const result = selected.length >= 2 ? compareProducts(selected, priorities) : null;
  const rows = result ? result.rows.filter((r) => !onlyDiff || r.differs) : [];

  return (
    <div className="space-y-8">
      <div className="panel space-y-5 p-4 sm:p-5">
        <div className="max-w-sm">
          <label className="label" htmlFor="cmp-cat">{t.advisor.category}</label>
          <select id="cmp-cat" className="field" value={category} onChange={(e) => { setCategory(e.target.value); setPicked([]); }}>
            {mediaCategories.map((c) => <option key={c.slug} value={c.slug}>{c.label[locale]}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-2 font-bold">{t.compare.select}</legend>
          {inCat.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {inCat.map((p) => (
                <li key={p.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2 has-[:checked]:border-pine has-[:checked]:bg-pine-tint">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[var(--pine)]"
                      checked={picked.includes(p.id)}
                      onChange={(e) => setPicked(e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id))}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{productTitle(p)}</span>
                      <span className="num block truncate text-sm text-ink-soft">{p.model}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft">
              {t.hub.noProducts}{" "}
              <Link className="text-pine underline underline-offset-4" href={`/${locale}/media/c/${category}`}>{t.product.add}</Link>
            </p>
          )}
        </fieldset>
        {selected.length >= 2 && <PriorityPicker defs={defs} value={priorities} onChange={setPriorities} idPrefix="cmp-prio" />}
      </div>

      {!result ? (
        <Notice>{t.compare.needTwo}</Notice>
      ) : (
        <section aria-labelledby="cmp-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="cmp-title" className="text-lg font-bold">{t.compare.title}</h2>
            <label className="flex items-center gap-2 text-[0.95rem]">
              <input type="checkbox" className="h-5 w-5 accent-[var(--pine)]" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
              {t.compare.onlyDiff}
            </label>
          </div>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-[0.95rem]">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-48 p-3 text-left text-sm font-semibold text-ink-soft"><span className="sr-only">{t.product.specs}</span></th>
                  {selected.map((p) => (
                    <th key={p.id} scope="col" className="p-3 text-left align-bottom">
                      <Link href={`/${locale}/media/product?id=${encodeURIComponent(p.id)}`} className="font-bold underline-offset-4 hover:underline">{productTitle(p)}</Link>
                      <span className="num block text-sm font-normal text-ink-soft">{p.model}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <th scope="row" className="p-3 text-left font-semibold">{t.compare.score}</th>
                  {result.scores.map((s, i) => <td key={i} className="price p-3 text-2xl">{s ?? "–"}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="p-3 text-left font-semibold">{t.compare.bestPrice}</th>
                  {selected.map((p) => {
                    const b = bestNew(data.offers, p.id);
                    return <td key={p.id} className="num p-3">{b ? `${money(b.totalCents!)} · ${b.merchant}` : <span className="text-ink-soft">{t.compare.noPrice}</span>}</td>;
                  })}
                </tr>
                {rows.map((r) => (
                  <tr key={r.def.key}>
                    <th scope="row" className="p-3 text-left font-normal text-ink-soft">{r.def.label[locale]}</th>
                    {r.values.map((v, i) => {
                      const shown = specValue(r.def, v, t, intl);
                      const best = r.bestIdx.includes(i) && r.bestIdx.length < selected.length;
                      return (
                        <td key={i} className={`num p-3 ${best ? "font-bold text-pine-strong" : ""} ${shown === null ? "text-slate" : ""}`}>
                          {shown ?? t.product.unknown}
                          {best && <span className="sr-only"> ✓</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="p-3 text-left font-normal text-ink-soft">{t.product.specs}</th>
                  {result.coverage.map((c, i) => <td key={i} className="num p-3 text-sm text-ink-soft">{fmt(t.compare.coverage, { pct: Math.round(c * 100) })}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
