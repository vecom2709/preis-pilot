import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { SourcesStatus } from "@/components/deals/SourcesStatus";

export async function generateMetadata({ params }: PageProps<"/[lang]/sources">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/sources", t.sourcesPage.title, t.sourcesPage.intro);
}

export default async function SourcesPage({ params }: PageProps<"/[lang]/sources">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const s = getDictionary(lang).sourcesPage;
  const blocks = [
    { h: s.offTitle, p: s.offText, href: "https://world.openfoodfacts.org/terms-of-use" },
    { h: s.pricesTitle, p: s.pricesText, href: "https://prices.openfoodfacts.org" },
    { h: s.ownTitle, p: s.ownText },
  ];
  return (
    <div className="prose-narrow">
      <PageHeader title={s.title} intro={s.intro} />
      <div className="mb-8"><SourcesStatus /></div>
      <div className="space-y-8">
        {blocks.map((b) => (
          <section key={b.h}>
            <h2 className="text-xl font-bold">{b.h}</h2>
            <p className="mt-2 text-ink-soft">{b.p}</p>
            {b.href && <a className="mt-1 inline-block text-sm font-semibold text-pine underline underline-offset-4" href={b.href} target="_blank" rel="noopener noreferrer">{new URL(b.href).host}</a>}
          </section>
        ))}
        <section>
          <h2 className="text-xl font-bold">{s.qualityTitle}</h2>
          <p className="mt-2 text-ink-soft">{s.qualityText}</p>
        </section>
        <section>
          <h2 className="text-xl font-bold">{s.limitsTitle}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">{s.limits.map((l) => <li key={l}>{l}</li>)}</ul>
        </section>
        <p className="rounded-xl border border-line bg-paper p-4 text-sm text-ink-soft">{s.shareAlike}</p>
      </div>
    </div>
  );
}
