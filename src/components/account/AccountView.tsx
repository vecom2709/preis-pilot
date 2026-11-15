"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { clearData, replaceData, useAppData, useHydrated } from "@/lib/store/local";
import { SettingsPanel } from "@/components/shell/SettingsPanel";
import { Notice } from "@/components/ui/Notice";
import { IconDownload, IconTrash, IconUpload } from "@/components/ui/icons";

// Datenexport und vollständige Löschung (DSGVO Art. 15, 17, 20) – lokal, ohne Konto.
export function AccountView() {
  const { t, locale } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  function exportAll() {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preispilot-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importAll(file: File) {
    if (!window.confirm(t.account.importConfirm)) return;
    try {
      const json = JSON.parse(await file.text());
      delete json.exportedAt;
      const r = replaceData(json);
      setNotice(r.ok ? { tone: "success", text: t.account.importDone } : { tone: "danger", text: t.account.importError });
    } catch {
      setNotice({ tone: "danger", text: t.account.importError });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <p className="prose-narrow -mt-4 text-ink-soft">{t.account.intro}</p>
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        <section className="panel p-5" aria-labelledby="acc-data">
          <h2 id="acc-data" className="text-lg font-bold">{t.account.dataTitle}</h2>
          {hydrated && (
            <p className="mt-1 text-ink-soft">
              {fmt(t.account.summary, { lists: data.lists.length, budgets: data.budgets.length, purchases: data.purchases.length, alerts: data.alerts.length })}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={exportAll}><IconDownload width={18} height={18} />{t.account.export}</button>
            <button className="btn btn-quiet" onClick={() => fileRef.current?.click()}><IconUpload width={18} height={18} />{t.account.import}</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importAll(f); e.target.value = ""; }} />
            <button className="btn btn-danger" onClick={() => { if (window.confirm(t.account.deleteConfirm)) { clearData(); setNotice({ tone: "success", text: t.account.deleted }); } }}>
              <IconTrash width={18} height={18} />{t.account.delete}
            </button>
          </div>
        </section>
        <section className="panel p-5" aria-labelledby="acc-account">
          <h2 id="acc-account" className="text-lg font-bold">{t.account.accountTitle}</h2>
          <p className="mt-1 text-ink-soft">{t.account.accountText}</p>
          <p className="mt-3 text-sm">
            <Link className="font-semibold text-pine underline underline-offset-4" href={`/${locale}/privacy`}>{t.footer.privacy}</Link>
          </p>
        </section>
      </div>
      <aside className="panel h-fit p-5" aria-labelledby="acc-settings">
        <h2 id="acc-settings" className="mb-4 text-lg font-bold">{t.account.settings}</h2>
        <SettingsPanel />
      </aside>
    </div>
  );
}
