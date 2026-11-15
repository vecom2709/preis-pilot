import de, { type Dictionary } from "./dictionaries/de";
import en from "./dictionaries/en";
import it from "./dictionaries/it";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { de, it, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Ersetzt {platzhalter} in Übersetzungstexten. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type { Dictionary };
