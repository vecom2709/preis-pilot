// Startet die gebaute Produktionsfassung lokal (Windows, macOS, Linux) – ohne Live-Neuladen.
// Aufruf: npm run preview   (vorher einmal: npm run build)
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

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
  env: { ...process.env, PORT: port, HOSTNAME: process.env.HOSTNAME ?? "127.0.0.1", NEXT_TELEMETRY_DISABLED: "1" },
});
