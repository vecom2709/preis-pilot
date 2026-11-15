"use client";
import { useCountry, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { ComparisonsList } from "@/components/home/ComparisonsWidget";

export function ComparisonsView() {
  const { t } = useI18n();
  const country = useCountry();
  return (
    <div className="space-y-4">
      <p className="prose-narrow -mt-4 text-ink-soft">{fmt(t.comparisonsPage.intro, { country: t.common.countries[country] })}</p>
      <div className="panel p-4 sm:p-5"><ComparisonsList limit={12} /></div>
    </div>
  );
}
