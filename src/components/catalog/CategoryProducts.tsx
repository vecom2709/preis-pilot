"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import { Notice } from "@/components/ui/Notice";

interface Item { code: string; name: string; brand: string | null; quantityText: string | null; imageUrl: string | null; priceCount: number }

export function CategoryProducts({ slug }: { slug: string }) {
  const { t, locale, intl } = useI18n();
  const [page, setPage] = useState(1);
  const [earlier, setEarlier] = useState<Item[]>([]);
  const res = useJson<{ items: Item[]; total: number }>(`/api/category?slug=${slug}&page=${page}`);
  const items = [...earlier, ...(res.status === "ok" ? res.data.items : [])];
  const total = res.status === "ok" ? res.data.total : 0;
  return (
    <div>
      {res.status === "loading" && page === 1 && <div className="h-48 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}
      {res.status === "error" && <Notice tone="danger" action={<button className="btn btn-quiet btn-sm" onClick={res.reload}>{t.common.retry}</button>}>{t.common.sourceDown}</Notice>}
      {res.status === "ok" && items.length === 0 && <Notice>{t.categoriesPage.empty}</Notice>}
      {total > 0 && <p className="mb-3 text-sm text-ink-soft">{fmt(t.categoriesPage.products, { n: new Intl.NumberFormat(intl).format(total) })}</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((h) => (
          <li key={h.code}>
            <Link href={`/${locale}/product/${h.code}`} className="panel flex gap-3 p-3 transition-colors hover:border-pine">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
                {h.imageUrl && <Image src={h.imageUrl} alt="" fill sizes="80px" className="object-contain p-1" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold leading-snug">{h.name}</p>
                <p className="truncate text-sm text-ink-soft">{[h.brand, h.quantityText].filter(Boolean).join(", ")}</p>
                <p className="mt-1.5"><span className="chip bg-pine-tint text-pine-strong">{fmt(t.product.observations, { n: h.priceCount })}</span></p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > 0 && items.length < total && (
        <button className="btn btn-quiet mt-5" disabled={res.status === "loading"} onClick={() => { setEarlier(items); setPage((p) => p + 1); }}>
          {res.status === "loading" ? t.common.loading : t.categoriesPage.loadMore}
        </button>
      )}
    </div>
  );
}
