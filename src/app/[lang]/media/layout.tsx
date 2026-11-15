import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getMediaDictionary } from "@/i18n/media/server";
import { MediaI18nProvider } from "@/i18n/media";

// Multimedia-Welt: eigene Texte und dunkleres, technisches Erscheinungsbild (.world-media steuert die Farben).
export default async function MediaLayout({ children, params }: LayoutProps<"/[lang]/media">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div className="world-media">
      <MediaI18nProvider dict={getMediaDictionary(lang)}>{children}</MediaI18nProvider>
    </div>
  );
}
