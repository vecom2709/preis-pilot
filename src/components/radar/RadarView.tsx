"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { useJson } from "@/lib/use-json";
import { evaluateAlerts } from "@/lib/alerts";
import type { PricesResponse } from "@/lib/api-types";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { updateData, useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { IconTrash } from "@/components/ui/icons";

export function RadarView() {
  const { t, locale } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  // Alarme werden je Land geprüft; in dieser Version gemeinsam für das Land des ersten Alarms je Gruppe
  const byCountry = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of data.alerts) m.set(a.country, [...new Set([...(m.get(a.country) ?? []), a.productCode])]);
    return [...m.entries()];
  }, [data.alerts]);

  return (
    <div className="space-y-8">
      <p className="prose-narrow -mt-4 text-ink-soft">{t.radar.intro}</p>
      {hydrated && data.alerts.length === 0 && <Notice>{t.radar.empty}</Notice>}
      {byCountry.map(([country, codes]) => <CountryAlerts key={country} country={country} codes={codes} />)}

      <section aria-labelledby="fav-title">
        <h2 id="fav-title" className="text-lg font-bold">{t.radar.favorites}</h2>
        {hydrated && !data.favorites.length && <p className="mt-2 text-ink-soft">{t.radar.noFavorites}</p>}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.favorites.map((f) => (
            <li key={f.code} className="panel flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/${locale}/product/${f.code}`} className="min-w-0 hover:text-pine">
                <span className="block truncate font-medium">{f.name}</span>
                <span className="text-sm text-ink-soft">{f.quantityText ?? f.code}</span>
              </Link>
              <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger" aria-label={`${t.common.delete}: ${f.name}`}
                onClick={() => updateData((d) => ({ ...d, favorites: d.favorites.filter((x) => x.code !== f.code) }))}>
                <IconTrash width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-ink-soft">{t.radar.pushNote}</p>
    </div>
  );
}

function CountryAlerts({ country, codes }: { country: string; codes: string[] }) {
    const { t, intl, locale } = useI18n();
    const data = useAppData();
    const res = useJson<PricesResponse>(`/api/prices?codes=${codes.join(",")}&country=${country}`);
    const alerts = data.alerts.filter((a) => a.country === country);
    const matches = res.status === "ok" ? evaluateAlerts(alerts, res.data.observations.filter((o) => o.quality.usable)) : [];
    return (
      <section aria-label={t.common.countries[country as "DE" | "IT"]} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t.common.countries[country as "DE" | "IT"]}</h2>
          <button className="btn btn-quiet btn-sm" onClick={res.reload} disabled={res.status === "loading"}>{res.status === "loading" ? t.radar.checking : t.radar.check}</button>
        </div>
        {res.status === "error" && <Notice tone="danger">{t.common.sourceDown}</Notice>}
        {res.status === "ok" && (matches.length ? <Notice tone="success">{fmt(t.radar.matches, { n: matches.length })}</Notice> : <p className="text-sm text-ink-soft">{t.radar.noMatches}</p>)}
        <ul className="panel divide-y divide-line">
          {alerts.map((a) => {
            const hits = matches.filter((m) => m.alertId === a.id);
            return (
              <li key={a.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link href={`/${locale}/product/${a.productCode}`} className="min-w-0 flex-1 font-semibold hover:text-pine">{a.productName}</Link>
                  <span className="text-sm text-ink-soft">{t.radar.threshold} <span className="num font-semibold text-ink">{formatCents(a.thresholdCents, intl)}</span>, {fmt(t.radar.since, { date: formatDate(a.createdAt, intl) })}</span>
                  <button className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger" aria-label={`${t.common.delete}: ${a.productName}`}
                    onClick={() => updateData((d) => ({ ...d, alerts: d.alerts.filter((x) => x.id !== a.id) }))}>
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
                {hits.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {hits.map(({ observation: o }) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-pine-tint px-3 py-2 text-sm">
                        <span><span className="num font-bold">{formatCents(o.priceCents, intl)}</span>, {o.store.name}{o.store.city ? `, ${o.store.city}` : ""}, {formatDate(o.date, intl)}, {t.dataType[o.dataType]}</span>
                        <button className="btn btn-quiet btn-sm" onClick={() => updateData((d) => ({ ...d, alerts: d.alerts.map((x) => (x.id === a.id ? { ...x, notifiedIds: [...x.notifiedIds, o.id] } : x)) }))}>{t.radar.markSeen}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }
