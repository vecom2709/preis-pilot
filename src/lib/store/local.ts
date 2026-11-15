"use client";
// Lokaler Speicher mit Tab-Synchronisation. Daten verlassen das Gerät nicht.
import { useSyncExternalStore } from "react";
import { AppDataSchema, emptyData, STORAGE_KEY, type AppData } from "./schema";

let cache: AppData | null = null;
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT = emptyData();

function read(): AppData {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? AppDataSchema.safeParse(JSON.parse(raw)) : null;
    cache = parsed?.success ? parsed.data : emptyData();
  } catch {
    cache = emptyData();
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

export function updateData(mutator: (draft: AppData) => AppData): { ok: true } | { ok: false; error: string } {
  const next = mutator(structuredClone(read()));
  const check = AppDataSchema.safeParse(next);
  if (!check.success) return { ok: false, error: check.error.issues[0]?.message ?? "Ungültige Daten" };
  cache = check.data;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    return { ok: false, error: "storage_full" };
  }
  emit();
  return { ok: true };
}

export function replaceData(data: unknown): { ok: true } | { ok: false; error: string } {
  const check = AppDataSchema.safeParse(data);
  if (!check.success) return { ok: false, error: "invalid_file" };
  return updateData(() => check.data);
}

export function clearData() {
  window.localStorage.removeItem(STORAGE_KEY);
  cache = emptyData();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
}

/** true erst nach dem ersten Lesen im Browser – verhindert falsche „leer“-Anzeigen beim Laden */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function uid(): string {
  return crypto.randomUUID();
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
