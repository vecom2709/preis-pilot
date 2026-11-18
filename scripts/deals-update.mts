// Lokaler Aktualisierungslauf (Vorschau auf dem PC oder Windows-Aufgabe): npm run deals:update [-- --alle]
import { runUpdate } from "../src/lib/deals/runner";

const log = await runUpdate({ trigger: "lokal", force: process.argv.includes("--alle") });
for (const s of log.sources) console.log(`${s.ok ? "ok    " : "FEHLER"} ${s.source.padEnd(14)} ${s.country}  ${s.ok ? `${s.fetched} Angebote` : s.error}  (${s.attempts} Versuch(e), ${s.ms} ms)`);
console.log(`Neu: ${log.added} · Entfernt: ${log.removed} · Aktualisiert: ${log.updated} · Gesamt: ${log.total}`);
