"use client";
// Angebotssuche mit Filtern (Kategorie, Händler, Preis, Zustand, Versand, Score) und Sortierung.
// Der Zustand steht in der Adresse, damit Suchen teilbar und mit „Zurück“ erreichbar sind.
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { dealCategories, findDealCategory } from "@/lib/deals/categories";
import { SECTIONS, type Section } from "@/lib/deals/query";
import type { ScoredDeal } from "@/lib/deals/types";
import { useJson } from "@/lib/use-json";
import { IconSearch } from "@/components/ui/icons";
import { DealCard } from "./DealCard";

interface Result { total: number; items: ScoredDeal[]; facets: { categories: { value: string; n: number }[]; merchants: { value: string; n: number }[] } }
const KEYS = ["q", "section", "categories", "merchant", "max", "condition", "freeShipping", "minScore", "sort"] as const;

export function DealFinder({ fixedCategory }: { fixedCategory?: string }) {
  const { t, locale } = useI18n();
  const country = useCountry();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [limit, setLimit] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const F = t.deals.finder;
  const get = (k: string) => params.get(k) ?? "";
  const category = fixedCategory ?? get("category");
  const section = SECTIONS.includes(get("section") as Section) ? (get("section") as Section) : "";

  const qs = new URLSearchParams({ country, limit: String(limit) });
  for (const k of KEYS) if (get(k)) qs.set(k, get(k));
  if (category) qs.set("category", category);
  const { status, data } = useJson<Result>(`/api/deals?${qs}`);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setLimit(24);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    update({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} role="search" className="flex w-full max-w-3xl items-center rounded-full border border-line bg-paper p-1.5 pl-5 shadow-[0_8px_24px_-14px_rgba(11,58,69,0.35)]">
        <IconSearch width={20} height={20} className="shrink-0 text-ink-soft" />
        <label htmlFor="deal-q" className="sr-only">{F.search}</label>
        <input key={get("q")} id="deal-q" name="q" defaultValue={get("q")} placeholder={F.placeholder} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[1.02rem] outline-none" maxLength={100} />
        <button type="submit" className="btn btn-primary">{F.search}</button>
      </form>

      {section && (
        <p className="flex flex-wrap items-center gap-2">
          <span className="chip bg-pine-tint py-1 text-pine-strong">{t.deals.sections[section]}</span>
          <button type="button" onClick={() => update({ section: "" })} className="text-sm text-ink-soft underline-offset-4 hover:underline">×</button>
        </p>
      )}

      <button type="button" className="btn btn-quiet btn-sm lg:hidden" aria-expanded={showFilters} aria-controls="deal-filters" onClick={() => setShowFilters(!showFilters)}>{F.filters}</button>
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside id="deal-filters" aria-label={F.filters} className={`space-y-4 lg:sticky lg:top-36 lg:block lg:self-start ${showFilters ? "" : "hidden"}`}>
          {!fixedCategory && (
            <div>
              <label className="label" htmlFor="f-cat">{F.category}</label>
              <select id="f-cat" className="field" value={category} onChange={(e) => update({ category: e.target.value })}>
                <option value="">{F.allCategories}</option>
                {dealCategories.map((c) => <option key={c.slug} value={c.slug}>{c.label[locale]}{data ? ` (${data.facets.categories.find((x) => x.value === c.slug)?.n ?? 0})` : ""}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="f-merchant">{F.merchant}</label>
            <select id="f-merchant" className="field" value={get("merchant")} onChange={(e) => update({ merchant: e.target.value })}>
              <option value="">{F.allMerchants}</option>
              {(data?.facets.merchants ?? []).map((m) => <option key={m.value} value={m.value}>{m.value} ({m.n})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-max">{F.maxPrice}</label>
            <input id="f-max" className="field num" inputMode="decimal" defaultValue={get("max")} key={get("max")} onBlur={(e) => update({ max: e.target.value.replace(",", ".").trim() })} />
          </div>
          <div>
            <label className="label" htmlFor="f-cond">{F.condition}</label>
            <select id="f-cond" className="field" value={get("condition")} onChange={(e) => update({ condition: e.target.value })}>
              <option value="">{F.anyCondition}</option>
              {(["new", "refurbished", "bware", "used", "digital"] as const).map((c) => <option key={c} value={c}>{t.deals.condition[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-score">{F.minScore}</label>
            <select id="f-score" className="field" value={get("minScore")} onChange={(e) => update({ minScore: e.target.value })}>
              {["", "50", "60", "70", "80"].map((v) => <option key={v} value={v}>{v || "–"}</option>)}
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-[var(--pine)]" checked={get("freeShipping") === "1"} onChange={(e) => update({ freeShipping: e.target.checked ? "1" : "" })} />
            {F.freeShipping}
          </label>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => router.replace(pathname, { scroll: false })}>{F.reset}</button>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold" aria-live="polite">{data ? fmt(F.results, { n: data.total }) : "…"}</p>
            <div className="flex items-center gap-2">
              <label htmlFor="f-sort" className="text-sm text-ink-soft">{F.sort}</label>
              <select id="f-sort" className="field !w-auto" value={get("sort") || (section ? "" : "score")} onChange={(e) => update({ sort: e.target.value })}>
                {section && <option value="">–</option>}
                {(["score", "total", "discount", "new"] as const).map((s) => <option key={s} value={s}>{F.sorts[s]}</option>)}
              </select>
            </div>
          </div>
          {status !== "ok" && status !== "error" && !data && <div className="h-96 animate-pulse rounded-2xl bg-mist-strong" />}
          {data && data.total === 0 && <p className="panel p-5 text-ink-soft">{F.none}</p>}
          {data && data.total > 0 && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((d) => <li key={d.id}><DealCard deal={d} /></li>)}
            </ul>
          )}
          {data && data.total > data.items.length && (
            <button type="button" className="btn btn-quiet mx-auto flex" onClick={() => setLimit(Math.min(120, limit + 24))}>{F.more}</button>
          )}
          <p className="text-sm text-ink-soft">
            <Link href={`/${locale}/sources`} className="text-pine underline underline-offset-4">{F.sources}</Link>
            {category && findDealCategory(category) && ` · ${findDealCategory(category)!.label[locale]}`}
          </p>
        </div>
      </div>
    </div>
  );
}
