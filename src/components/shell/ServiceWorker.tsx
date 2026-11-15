"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

// Registriert den Service Worker (Offline-Fähigkeit) und zeigt einen Hinweis, wenn die Verbindung fehlt.
export function ServiceWorker() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-40 rounded-xl bg-ink px-4 py-3 text-sm text-paper shadow-lg xl:bottom-6 xl:left-auto xl:right-6 xl:max-w-sm">
      {t.common.offline}
    </div>
  );
}
