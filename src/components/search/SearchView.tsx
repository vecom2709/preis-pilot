"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import { Notice } from "@/components/ui/Notice";
import { IconSearch } from "@/components/ui/icons";

interface Hit { code: string; name: string; brand: string | null; quantityText: string | null; imageUrl: string | null; priceCount: number }
type SearchResponse = { barcode: string } | { total: number; page: number; hits: Hit[] };

export function SearchView() {
  const { t, locale } = useI18n();
  const country = useCountry();
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const onlyCountry = params.get("all") !== "1";

  function toggleCountry(checked: boolean) {
    const sp = new URLSearchParams(params);
    if (checked) sp.delete("all"); else sp.set("all", "1");
    router.replace(`/${locale}/search?${sp}`);
  }

  return (
    <div>
      <SearchForm key={q} initial={q} onSearch={(value) => {
        const sp = new URLSearchParams(params);
        sp.set("q", value);
        router.push(`/${locale}/search?${sp}`);
      }} />
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" className="h-4 w-4 accent-[var(--pine)]" checked={onlyCountry} onChange={(e) => toggleCountry(e.target.checked)} />
        {fmt(t.search.countryFilter, { country: t.common.countries[country] })}
      </label>
      {/* Neuer Schlüssel = neue Suche: Seitenzählung und Treffer beginnen von vorn */}
      <SearchResults key={`${q}|${onlyCountry}|${country}`} q={q} onlyCountry={onlyCountry} country={country} />
    </div>
  );
}

function SearchForm({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const { t } = useI18n();
  const [input, setInput] = useState(initial);
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch(input.trim()); }} className="flex gap-2">
      <label htmlFor="q" className="sr-only">{t.search.title}</label>
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input id="q" type="search" enterKeyHint="search" autoComplete="off" className="field !min-h-[52px] !pl-10 !text-[1.05rem]"
          placeholder={t.search.placeholder} value={input} onChange={(e) => setInput(e.target.value)} minLength={2} required />
      </div>
      <button className="btn btn-primary !min-h-[52px]" type="submit">{t.search.submit}</button>
    </form>
  );
}

function SearchResults({ q, onlyCountry, country }: { q: string; onlyCountry: boolean; country: string }) {
  const { t, locale, intl } = useI18n();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [earlier, setEarlier] = useState<Hit[]>([]);
  const url = q.trim().length >= 2
    ? `/api/search?${new URLSearchParams({ q, lang: locale, country, onlyCountry: onlyCountry ? "1" : "0", page: String(page) })}`
    : null;
  const res = useJson<SearchResponse>(url);
  const barcode = res.status === "ok" && "barcode" in res.data ? res.data.barcode : null;

  useEffect(() => {
    if (barcode) router.replace(`/${locale}/product/${barcode}`);
  }, [barcode, locale, router]);

  const current = res.status === "ok" && "hits" in res.data ? res.data.hits : [];
  const hits = [...earlier, ...current.filter((h) => !earlier.some((e) => e.code === h.code))];
  const total = res.status === "ok" && "total" in res.data ? res.data.total : 0;
  const nf = new Intl.NumberFormat(intl);

  return (
    <div className="mt-6" aria-live="polite">
      {res.status === "loading" && page === 1 && <p className="text-ink-soft">{t.search.searching}</p>}
      {res.status === "error" && (
        <Notice tone="danger" action={<button className="btn btn-quiet btn-sm" onClick={res.reload}>{t.common.retry}</button>}>
          {res.error.code === "invalid_request" ? t.search.minChars : t.common.sourceDown}
        </Notice>
      )}
      {barcode && <p className="text-ink-soft">{t.search.barcodeDetected}</p>}
      {hits.length > 0 && <p className="mb-3 text-sm text-ink-soft">{fmt(t.search.results, { n: nf.format(total) })}</p>}
      {res.status === "ok" && "hits" in res.data && hits.length === 0 && <Notice>{t.search.noResults}</Notice>}
      {hits.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {hits.map((h) => (
            <li key={h.code}>
              <Link href={`/${locale}/product/${h.code}`} className="panel flex gap-3 p-3 transition-colors hover:border-pine">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
                  {h.imageUrl && <Image src={h.imageUrl} alt="" fill sizes="80px" className="object-contain p-1" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold leading-snug">{h.name}</p>
                  <p className="truncate text-sm text-ink-soft">{[h.brand, h.quantityText].filter(Boolean).join(", ")}</p>
                  <p className="mt-1.5">
                    {h.priceCount > 0 ? (
                      <span className="chip bg-pine-tint text-pine-strong">{fmt(t.product.observations, { n: h.priceCount })}</span>
                    ) : (
                      <span className="chip border border-dashed border-line text-slate">{t.common.priceUnavailable}</span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {hits.length > 0 && hits.length < total && (
        <button className="btn btn-quiet mt-5" disabled={res.status === "loading"} onClick={() => { setEarlier(hits); setPage((p) => p + 1); }}>
          {res.status === "loading" ? t.common.loading : t.search.loadMore}
        </button>
      )}
    </div>
  );
}
