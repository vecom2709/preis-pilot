import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/privacy", t.privacyPage.title, t.privacyPage.intro);
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const p = getDictionary(lang).privacyPage;
  return (
    <div className="prose-narrow">
      <PageHeader title={p.title} intro={p.intro} />
      <div className="space-y-7">
        {p.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-bold">{s.h}</h2>
            <p className="mt-2 text-ink-soft">{s.p}</p>
          </section>
        ))}
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-soft">{p.operatorNote}</p>
      </div>
    </div>
  );
}
