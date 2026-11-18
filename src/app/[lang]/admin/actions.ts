"use server";
// Admin-Aktionen. Der Zugriff ist durch die Basic-Anmeldung im Proxy geschützt; hier wird sie zusätzlich geprüft.
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { defaultConfig, runUpdate } from "@/lib/deals/runner";
import { getDealStore, keys } from "@/lib/deals/store";
import type { AdminConfig } from "@/lib/deals/types";

async function assertAdmin() {
  const token = process.env.ADMIN_TOKEN;
  const auth = (await headers()).get("authorization") ?? "";
  if (!token || auth !== `Basic ${btoa(`admin:${token}`)}`) throw new Error("Nicht angemeldet");
}

async function patchConfig(fn: (c: AdminConfig) => AdminConfig) {
  const store = await getDealStore();
  const cfg = { ...defaultConfig, ...((await store.get<AdminConfig>(keys.config)) ?? {}) };
  await store.set(keys.config, fn(cfg));
}

export async function runNow() {
  await assertAdmin();
  await runUpdate({ trigger: "admin", force: true });
  revalidatePath("/[lang]/admin", "page");
}

export async function toggleSource(key: string) {
  await assertAdmin();
  await patchConfig((c) => ({ ...c, disabledSources: c.disabledSources.includes(key) ? c.disabledSources.filter((k) => k !== key) : [...c.disabledSources, key] }));
  revalidatePath("/[lang]/admin", "page");
}

export async function toggleMerchant(name: string | FormData) {
  await assertAdmin();
  const n = (typeof name === "string" ? name : String(name.get("merchant") ?? "")).trim().slice(0, 80);
  if (!n) return;
  await patchConfig((c) => ({ ...c, disabledMerchants: c.disabledMerchants.includes(n) ? c.disabledMerchants.filter((m) => m !== n) : [...c.disabledMerchants, n] }));
  revalidatePath("/[lang]/admin", "page");
}

export async function saveInterval(key: string, form: FormData) {
  await assertAdmin();
  const m = Math.round(Number(form.get("minutes")));
  if (!Number.isFinite(m) || m < 30 || m > 1440) return;
  await patchConfig((c) => ({ ...c, intervals: { ...c.intervals, [key]: m } }));
  revalidatePath("/[lang]/admin", "page");
}
