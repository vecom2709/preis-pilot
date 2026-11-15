"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useAppData, useHydrated } from "@/lib/store/local";
import { budgetStatus } from "@/lib/budget";
import { computeListTotals } from "@/lib/list-totals";
import { formatCents } from "@/lib/money";
import { ProgressBar } from "@/components/charts/Charts";

// Persönliches Spar-Dashboard auf der Startseite – erscheint erst, wenn eigene Daten vorhanden sind.
export function HomeSnapshot() {
  const { t, intl, locale } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  if (!hydrated) return null;

  const hasData = data.lists.length || data.budgets.length || data.alerts.length || data.scans.length;
  if (!hasData) {
    return <p className="panel px-5 py-4 text-ink-soft">{t.home.snapshotEmpty}</p>;
  }
  const budget = data.budgets.find((b) => b.period === "month") ?? data.budgets[0];
  const status = budget ? budgetStatus(budget, data.purchases) : null;
  const openLists = data.lists.filter((l) => l.kind !== "pantry");

  return (
    <section aria-labelledby="snapshot" className="panel p-5 sm:p-6">
      <h2 id="snapshot" className="text-lg font-bold">{t.home.snapshotTitle}</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-soft">{t.home.snapshotBudget}</h3>
          {budget && status ? (
            <Link href={`/${locale}/budget`} className="mt-2 block">
              <p className="price text-[2rem]">{formatCents(status.remainingCents, intl)}</p>
              <p className="mb-2 text-sm text-ink-soft">{t.budget.remaining} {t.common.of} {formatCents(budget.limitCents, intl)}</p>
              <ProgressBar value={status.paidCents} max={budget.limitCents} level={status.level} label={budget.name} />
            </Link>
          ) : (
            <Link href={`/${locale}/budget`} className="mt-2 inline-block font-semibold text-pine underline underline-offset-4">{t.budget.newBudget}</Link>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink-soft">{t.home.snapshotLists}</h3>
          <ul className="mt-2 space-y-1.5">
            {openLists.slice(0, 3).map((l) => {
              const tot = computeListTotals(l.items);
              return (
                <li key={l.id}>
                  <Link href={`/${locale}/lists?list=${l.id}`} className="flex items-baseline justify-between gap-3 hover:text-pine">
                    <span className="truncate font-medium">{l.name}</span>
                    <span className="num shrink-0 font-semibold">{formatCents(tot.confirmedCents, intl)}</span>
                  </Link>
                  {tot.missingCount > 0 && <p className="text-xs text-slate">{fmt(t.lists.missing, { n: tot.missingCount })}</p>}
                </li>
              );
            })}
            {!openLists.length && <li className="text-ink-soft">–</li>}
          </ul>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-soft">{t.home.snapshotAlerts}</h3>
            <Link href={`/${locale}/radar`} className="price mt-1 block text-[2rem]">{data.alerts.length}</Link>
          </div>
          {data.scans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink-soft">{t.home.snapshotScans}</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {data.scans.slice(0, 3).map((s) => (
                  <li key={s.code + s.at}>
                    <Link href={`/${locale}/product/${s.code}`} className="hover:text-pine">{s.name ?? s.code}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
