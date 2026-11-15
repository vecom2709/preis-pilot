import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getMediaDictionary } from "@/i18n/media/server";
import { MediaI18nProvider } from "@/i18n/media";

// Produktbereich aller Rubriken außer Lebensmittel: eigene Texte (Datenblätter, Angebote, Abos).
export default async function MediaLayout({ children, params }: LayoutProps<"/[lang]/produkte">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <MediaI18nProvider dict={getMediaDictionary(lang)}>{children}</MediaI18nProvider>
  );
}
