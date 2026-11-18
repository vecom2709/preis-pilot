// Startet die gebaute Produktionsfassung lokal (Windows, macOS, Linux) – ohne Live-Neuladen.
// Aufruf: npm run preview   (vorher einmal: npm run build)
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

// Lokale Geheimnisse (z. B. ADMIN_TOKEN, API-Schlüssel) aus .env.local – die Datei ist vom Repository ausgeschlossen
const localEnv = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) localEnv[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const standalone = ".next/standalone";
if (!existsSync(`${standalone}/server.js`)) {
  console.error("Bitte zuerst bauen: npm run build");
  process.exit(1);
}
cpSync("public", `${standalone}/public`, { recursive: true });
cpSync(".next/static", `${standalone}/.next/static`, { recursive: true });
const port = process.env.PORT ?? "3000";
console.log(`Preis-Pilot läuft auf http://localhost:${port}`);
spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  // Angebotsdaten liegen im Projektordner (.data/deals) und überleben so jeden neuen Build
  env: { ...localEnv, ...process.env, PORT: port, HOSTNAME: process.env.HOSTNAME ?? "127.0.0.1", NEXT_TELEMETRY_DISABLED: "1", DEALS_DATA_DIR: process.env.DEALS_DATA_DIR ?? resolve(".data/deals") },
});
