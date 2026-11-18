import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { allConnectors, pendingSources } from "@/lib/deals/connectors";
import { dealCategories } from "@/lib/deals/categories";
import { connectorState, defaultConfig, loadDeals } from "@/lib/deals/runner";
import { getDealStore, keys } from "@/lib/deals/store";
import type { AdminConfig, RunLog } from "@/lib/deals/types";
import { runNow, saveInterval, toggleMerchant, toggleSource } from "./actions";

export const metadata: Metadata = { title: "Admin – Angebots-Engine", robots: { index: false, follow: false } };

const dt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" }) : "–");
const STATE = { active: ["aktiv", "bg-saving text-white"], needs_key: ["Zugangsdaten fehlen", "bg-saffron-tint text-saffron-text"], disabled: ["deaktiviert", "bg-mist-strong text-ink-soft"] } as const;

async function Dashboard() {
  await connection();
  const store = await getDealStore();
  const cfg = { ...defaultConfig, ...((await store.get<AdminConfig>(keys.config)) ?? {}) };
  const runs = (await store.get<RunLog[]>(keys.runs)) ?? [];
  const [de, it] = await Promise.all([loadDeals("DE", store), loadDeals("IT", store)]);
  const all = [...de, ...it];
  const connectors = allConnectors();
  const last = runs[0];
  const lastOk = runs.find((r) => r.sources.some((s) => s.ok));
  const problems = last?.sources.filter((s) => !s.ok) ?? [];
  const merchants = [...all.reduce((m, d) => m.set(d.merchant, (m.get(d.merchant) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const kpis: [string, string | number][] = [
    ["Datenquellen angebunden / aktiv", `${connectors.length} / ${connectors.filter((c) => connectorState(c, cfg, process.env) === "active").length}`],
    ["Aktive Shops", merchants.length],
    ["Angebote verfügbar", `${all.length} (DE ${de.length} · IT ${it.length})`],
    ["Neu im letzten Lauf", last?.added ?? 0],
    ["Entfernt / abgelaufen", last?.removed ?? 0],
    ["Fehlerhafte Produktdaten (verworfen)", last?.sources.reduce((n, s) => n + s.rejected, 0) ?? 0],
    ["Letzte erfolgreiche Aktualisierung", dt(lastOk?.finishedAt)],
    ["Verbindungsprobleme (letzter Lauf)", problems.length],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft">Speicher: {store.kind === "blobs" ? "Netlify Blobs (serverseitig)" : "lokale Dateien (.data)"} · Zeitplan: alle 30 Minuten (Netlify-Funktion „deal-update“)</p>
        <form action={runNow}><button type="submit" className="btn btn-primary">Jetzt aktualisieren</button></form>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([k, v]) => (
          <div key={k} className="bg-paper p-4">
            <dt className="text-sm text-ink-soft">{k}</dt>
            <dd className="price mt-1 text-2xl">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="panel overflow-x-auto p-4">
        <h2 className="mb-3 text-lg font-bold">API- und Datenfeed-Status</h2>
        <table className="w-full min-w-[56rem] text-sm">
          <thead><tr className="border-b border-line text-left text-ink-soft"><th className="py-2">Quelle</th><th>Art</th><th>Status</th><th>Intervall (Min.)</th><th>Letzte erfolgreiche Abfrage</th><th>Letzter Fehler</th><th className="text-right">DE</th><th className="text-right">IT</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {connectors.map((c) => {
              const state = connectorState(c, cfg, process.env);
              const ok = runs.find((r) => r.sources.some((s) => s.source === c.key && s.ok));
              const err = last?.sources.find((s) => s.source === c.key && !s.ok);
              return (
                <tr key={c.key}>
                  <td className="py-2"><a href={c.homepage} className="font-semibold text-pine underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">{c.label}</a><span className="block text-xs text-ink-soft">{c.terms}</span></td>
                  <td>{c.kind === "public" ? "öffentlich" : c.kind === "api" ? "API (Schlüssel)" : "Feed"}</td>
                  <td><span className={`chip ${STATE[state][1]}`}>{STATE[state][0]}</span>{state === "needs_key" && <span className="block text-xs text-ink-soft">{c.env.join(", ")}</span>}</td>
                  <td>
                    <form action={saveInterval.bind(null, c.key)} className="flex items-center gap-1">
                      <input name="minutes" type="number" min={30} max={1440} defaultValue={cfg.intervals[c.key] ?? c.intervalMinutes} className="field num !h-9 !w-24" aria-label={`Intervall ${c.label}`} />
                      <button className="btn btn-quiet btn-sm !h-9">OK</button>
                    </form>
                  </td>
                  <td>{dt(ok?.finishedAt)}</td>
                  <td className="max-w-[14rem] text-danger">{err ? `${err.country}: ${err.error} (${err.attempts} Versuche)` : "–"}</td>
                  <td className="num text-right">{de.filter((d) => d.source === c.key).length}</td>
                  <td className="num text-right">{it.filter((d) => d.source === c.key).length}</td>
                  <td className="text-right"><form action={toggleSource.bind(null, c.key)}><button className="btn btn-quiet btn-sm">{state === "disabled" ? "Aktivieren" : "Deaktivieren"}</button></form></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="panel p-4">
        <h2 className="mb-2 text-lg font-bold">Noch nicht freigeschaltet</h2>
        <ul className="space-y-1 text-sm">
          {pendingSources.filter((p) => !connectors.some((c) => c.key === p.key && connectorState(c, cfg, process.env) === "active")).map((p) => (
            <li key={p.key}><a href={p.url} className="font-semibold text-pine underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">{p.label}</a> – {p.need}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="mb-2 text-lg font-bold">Händler</h2>
          <form action={toggleMerchant} className="mb-3 flex gap-2">
            <input name="merchant" placeholder="Händlername zum Sperren/Freigeben" className="field !h-10" />
            <button className="btn btn-quiet btn-sm !h-10">Umschalten</button>
          </form>
          {cfg.disabledMerchants.length > 0 && <p className="mb-2 text-sm">Gesperrt: {cfg.disabledMerchants.map((m) => <form key={m} action={toggleMerchant.bind(null, m)} className="inline"><button className="chip mr-1 bg-danger-tint text-danger">{m} ×</button></form>)}</p>}
          <ul className="max-h-80 divide-y divide-line overflow-y-auto text-sm">
            {merchants.map(([m, n]) => (
              <li key={m} className="flex items-center justify-between gap-2 py-1.5">
                <span>{m}</span>
                <span className="flex items-center gap-2"><span className="num text-ink-soft">{n}</span><form action={toggleMerchant.bind(null, m)}><button className="text-xs text-danger underline-offset-4 hover:underline">sperren</button></form></span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-4">
          <h2 className="mb-2 text-lg font-bold">Angebote nach Kategorie</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink-soft"><th>Kategorie</th><th className="text-right">DE</th><th className="text-right">IT</th></tr></thead>
            <tbody className="divide-y divide-line">
              {dealCategories.map((c) => ({ c, d: de.filter((x) => x.category === c.slug).length, i: it.filter((x) => x.category === c.slug).length })).filter((r) => r.d + r.i > 0).map(({ c, d, i }) => (
                <tr key={c.slug}><td className="py-1">{c.label.de}</td><td className="num text-right">{d}</td><td className="num text-right">{i}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-soft">Kategorien ohne Angebote sind ausgeblendet ({dealCategories.length} insgesamt).</p>
        </section>
      </div>

      <section className="panel overflow-x-auto p-4">
        <h2 className="mb-2 text-lg font-bold">Historie der automatischen Aktualisierungen</h2>
        <table className="w-full min-w-[48rem] text-sm">
          <thead><tr className="border-b border-line text-left text-ink-soft"><th className="py-2">Zeit</th><th>Auslöser</th><th>Quellen ok / Fehler</th><th className="text-right">Neu</th><th className="text-right">Entfernt</th><th className="text-right">Gesamt</th><th className="text-right">Dauer</th></tr></thead>
          <tbody className="divide-y divide-line">
            {runs.slice(0, 40).map((r) => (
              <tr key={r.id}>
                <td className="py-1.5">{dt(r.startedAt)}</td>
                <td>{r.trigger}</td>
                <td>{r.sources.filter((s) => s.ok).length} / <span className={r.sources.some((s) => !s.ok) ? "font-semibold text-danger" : ""}>{r.sources.filter((s) => !s.ok).length}</span>{r.sources.length === 0 && " (nichts fällig)"}</td>
                <td className="num text-right">{r.added}</td>
                <td className="num text-right">{r.removed}</td>
                <td className="num text-right">{r.total}</td>
                <td className="num text-right">{((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 1000).toFixed(1)} s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <h1 className="display mb-6 text-[2rem]">Admin – Angebots-Engine</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-mist-strong" />}>
        <Dashboard />
      </Suspense>
    </>
  );
}
