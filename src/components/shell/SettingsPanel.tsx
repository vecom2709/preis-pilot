"use client";
import { useRouter } from "next/navigation";
import { useI18n, useCountry } from "@/i18n/client";
import { countryCodes, locales, type Locale } from "@/i18n/config";
import { updateData, useAppData } from "@/lib/store/local";
import { applyTheme } from "./theme";

const localeNames: Record<Locale, string> = { de: "Deutsch", it: "Italiano", en: "English" };

export function SettingsPanel() {
  const { locale, t } = useI18n();
  const country = useCountry();
  const data = useAppData();
  const router = useRouter();

  function switchLocale(next: Locale) {
    document.cookie = `pp_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    router.push(window.location.pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${next}`) + window.location.search);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="set-lang">{t.common.language}</label>
        <select id="set-lang" className="field" value={locale} onChange={(e) => switchLocale(e.target.value as Locale)}>
          {locales.map((l) => (
            <option key={l} value={l} lang={l}>{localeNames[l]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="set-country">{t.common.country}</label>
        <select
          id="set-country"
          className="field"
          value={country}
          onChange={(e) => updateData((d) => ({ ...d, settings: { ...d.settings, country: e.target.value as "DE" | "IT" } }))}
        >
          {countryCodes.map((c) => (
            <option key={c} value={c}>{t.common.countries[c]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="set-theme">{t.common.theme}</label>
        <select
          id="set-theme"
          className="field"
          value={data.settings.theme}
          onChange={(e) => {
            const theme = e.target.value as "system" | "light" | "dark";
            updateData((d) => ({ ...d, settings: { ...d.settings, theme } }));
            applyTheme(theme);
          }}
        >
          {(["system", "light", "dark"] as const).map((th) => (
            <option key={th} value={th}>{t.common.themes[th]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
