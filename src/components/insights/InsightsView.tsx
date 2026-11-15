"use client";
import { useI18n } from "@/i18n/client";
import { monthlyTotals, totalsByCategory } from "@/lib/budget";
import { formatCents, sumCents } from "@/lib/money";
import { formatMonth } from "@/lib/format";
import { useAppData, useHydrated } from "@/lib/store/local";
import { BarChart } from "@/components/charts/Charts";
import { Notice } from "@/components/ui/Notice";

export function InsightsView() {
  const { t, intl } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />;

  const months = monthlyTotals(data.purchases, 6);
  const fc = (c: number) => formatCents(c, intl);
  if (!data.purchases.length) {
    return (
      <div className="space-y-4">
        <p className="prose-narrow -mt-4 text-ink-soft">{t.insights.intro}</p>
        <Notice>{t.insights.empty}</Notice>
      </div>
    );
  }
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  const withData = months.filter((m) => m.paidCents > 0);
  const avg = withData.length ? Math.round(sumCents(withData.map((m) => m.paidCents)) / withData.length) : 0;
  const cats = totalsByCategory(data.purchases);
  const catMax = Math.max(1, ...cats.map((c) => c.paidCents));
  const kinds = (["planned", "estimated", "paid"] as const).map((k) => ({ k, cents: sumCents(data.purchases.filter((p) => p.kind === k && p.date.startsWith(current.month)).map((p) => p.amountCents)) }));

  return (
    <div className="space-y-8">
      <p className="prose-narrow -mt-4 text-ink-soft">{t.insights.intro}</p>
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: t.insights.thisMonth, value: current.paidCents },
          { label: t.insights.lastMonth, value: previous?.paidCents ?? 0 },
          { label: t.insights.average, value: avg },
        ].map((x) => (
          <div key={x.label} className="panel p-4">
            <dt className="text-sm text-ink-soft">{x.label}</dt>
            <dd className="price mt-1 text-[1.7rem] sm:text-[2.2rem]">{fc(x.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-4 sm:p-5" aria-labelledby="ins-month">
          <h2 id="ins-month" className="mb-4 text-lg font-bold">{t.insights.monthly}</h2>
          <BarChart label={t.insights.monthly} data={months.map((m) => ({ label: formatMonth(m.month, intl), value: m.paidCents, highlight: m.month === current.month }))} format={fc} />
        </section>
        <section className="panel p-4 sm:p-5" aria-labelledby="ins-cat">
          <h2 id="ins-cat" className="mb-4 text-lg font-bold">{t.insights.byCategory}</h2>
          <ul className="space-y-3">
            {cats.map((c) => (
              <li key={c.category || "_"}>
                <div className="flex justify-between text-sm"><span className="font-medium">{c.category || t.insights.noCategory}</span><span className="num font-semibold">{fc(c.paidCents)}</span></div>
                <div className="mt-1 h-2.5 rounded-full bg-mist-strong"><div className="h-full rounded-full bg-pine" style={{ width: `${(c.paidCents / catMax) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold text-ink-soft">{t.insights.kinds} ({t.insights.thisMonth})</h3>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
            {kinds.map(({ k, cents }) => (<div key={k}><dt className="text-ink-soft">{t.budget[k]}</dt><dd className="num font-semibold">{fc(cents)}</dd></div>))}
          </dl>
        </section>
      </div>
    </div>
  );
}
