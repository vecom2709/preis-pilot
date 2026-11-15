"use client";
import { createContext, useContext, type ReactNode } from "react";
import { countries, defaultCountryFor, intlLocale, type Country, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/de";
import { useAppData } from "@/lib/store/local";

interface I18nValue {
  locale: Locale;
  intl: string;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, intl: intlLocale[locale], t: dictionary }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider fehlt");
  return ctx;
}

/** Gewähltes Land (Einstellung) oder Standard passend zur Sprache. */
export function useCountry(): Country {
  const { locale } = useI18n();
  const data = useAppData();
  const c = data.settings.country;
  return c && c in countries ? c : defaultCountryFor[locale];
}
