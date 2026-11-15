import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { Scanner } from "@/components/scanner/Scanner";

export async function generateMetadata({ params }: PageProps<"/[lang]/scan">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/scan", t.scanner.title, t.scanner.intro);
}

export default async function ScanPage({ params }: PageProps<"/[lang]/scan">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <PageHeader title={t.scanner.title} intro={t.scanner.intro} />
      <Scanner />
    </>
  );
}
