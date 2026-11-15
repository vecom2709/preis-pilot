"use client";
import Link from "next/link";
import { findMediaCategory } from "@/lib/media/specs";
import { rubrics } from "@/lib/rubrics";
import { subscriptionTotals } from "@/lib/subscriptions";
import { useAppData, useHydrated } from "@/lib/store/local";
import { fmt } from "@/i18n";
import { IconChevron, IconCompass, IconPlay, IconStar } from "@/components/ui/icons";
import { ProductRow, categoryIcons, useMedia } from "./shared";

export function MediaHub() {
  const { locale, t, money } = useMedia();
  const data = useAppData();
  const hydrated = useHydrated();
  const products = hydrated ? [...data.products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const wish = products.filter((p) => p.wishlist);
  const totals = subscriptionTotals(hydrated ? data.subscriptions : []);

  const sources: { label: string; state: "on" | "key" | "off" }[] = [
    { label: t.hub.sourceManual, state: "on" },
    { label: t.hub.sourceGames, state: "key" },
    { label: t.hub.sourceFilms, state: "key" },
    { label: t.hub.sourceElectronics, state: "off" },
  ];
  const dot = { on: "bg-saving", key: "bg-saffron", off: "bg-slate" } as const;

  return (
    <div className="space-y-10">
      <section aria-labelledby="cat-title" className="space-y-6">
        <h2 id="cat-title" className="sr-only">{t.hub.categories}</h2>
        {rubrics.filter((r) => r.products.length).map((r) => (
          <div key={r.slug}>
            <h3 className="mb-2 flex items-center justify-between gap-3 text-lg font-bold">
              {r.label[locale]}
              <Link href={`/${locale}/r/${r.slug}`} className="text-sm font-semibold text-pine hover:text-pine-strong">{t.hub.open}</Link>
            </h3>
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {r.products.map((slug) => {
                const c = findMediaCategory(slug)!;
                const Icon = categoryIcons[c.slug];
                const count = products.filter((p) => p.category === c.slug).length;
                return (
                  <li key={c.slug} className="bg-paper">
                    <Link href={`/${locale}/produkte/c/${c.slug}`} className="group flex h-full gap-4 p-4 transition-colors hover:bg-mist-strong">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-pine/40 text-pine transition-colors group-hover:border-pine">
                        <Icon width={22} height={22} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="font-bold">{c.label[locale]}</span>
                          {count > 0 && <span className="num whitespace-nowrap text-sm text-pine">{count === 1 ? t.product.countOne : fmt(t.product.count, { n: count })}</span>}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{c.sub.map((x) => x[locale]).join(", ")}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="mine-title">
          <h2 id="mine-title" className="mb-3 text-lg font-bold">{t.hub.myProducts}</h2>
          {products.length ? (
            <ul className="panel divide-y divide-line overflow-hidden">
              {products.slice(0, 8).map((p) => <ProductRow key={p.id} product={p} offers={data.offers} />)}
            </ul>
          ) : (
            <p className="panel p-5 text-ink-soft">{t.hub.noProducts}</p>
          )}
        </section>

        <div className="space-y-8">
          <section aria-labelledby="wish-title">
            <h2 id="wish-title" className="mb-3 flex items-center gap-2 text-lg font-bold"><IconStar width={18} height={18} />{t.hub.wishlist}</h2>
            {wish.length ? (
              <ul className="panel divide-y divide-line overflow-hidden">
                {wish.map((p) => <ProductRow key={p.id} product={p} offers={data.offers} />)}
              </ul>
            ) : (
              <p className="text-ink-soft">{t.hub.noWishlist}</p>
            )}
          </section>

          <Link href={`/${locale}/produkte/abos`} className="panel group flex items-start gap-4 p-5 transition-colors hover:border-pine">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine-tint text-pine-strong"><IconPlay width={22} height={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t.nav.abos}</span>
              {totals.activeCount > 0 ? (
                <span className="num mt-0.5 block text-ink-soft">
                  {money(totals.monthlyCents)} {t.abos.monthly} · {money(totals.yearlyCents)} {t.abos.yearly}
                </span>
              ) : (
                <span className="mt-0.5 block text-sm text-ink-soft">{t.hub.abosTeaser}</span>
              )}
            </span>
            <IconChevron width={18} height={18} className="mt-1 text-ink-soft" />
          </Link>

          <Link href={`/${locale}/produkte/advisor`} className="panel group flex items-start gap-4 p-5 transition-colors hover:border-pine">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine-tint text-pine-strong"><IconCompass width={22} height={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t.advisor.title}</span>
              <span className="mt-0.5 block text-sm text-ink-soft">{t.advisor.intro}</span>
            </span>
            <IconChevron width={18} height={18} className="mt-1 text-ink-soft" />
          </Link>
        </div>
      </div>

      <section aria-labelledby="src-title" className="panel p-5">
        <h2 id="src-title" className="text-lg font-bold">{t.hub.sources}</h2>
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span aria-hidden="true" className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dot[s.state]}`} />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">{t.hub.sourcesNote}</p>
      </section>
    </div>
  );
}
