// Geplante Netlify-Funktion: aktualisiert die Angebote alle 30 Minuten serverseitig – unabhängig von Besuchern.
// Jede Quelle wird nur nach ihrem eigenen Intervall abgefragt (Rate-Limits), Fehler werden protokolliert.
import type { Config } from "@netlify/functions";
import { runUpdate } from "../../src/lib/deals/runner";

export default async function dealUpdate() {
  const log = await runUpdate({ trigger: "zeitplan" });
  console.log(JSON.stringify({ lauf: log.id, neu: log.added, entfernt: log.removed, gesamt: log.total, quellen: log.sources.map((s) => `${s.source}/${s.country}:${s.ok ? s.fetched : "FEHLER " + s.error}`) }));
  return new Response("ok");
}

export const config: Config = { schedule: "*/30 * * * *" };
