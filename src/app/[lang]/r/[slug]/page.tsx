import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { categories } from "@/lib/categories";
import { findMediaCategory } from "@/lib/media/specs";
import { findRubric, rubrics } from "@/lib/rubrics";
import { pageMetadata } from "@/lib/seo";
import { HeroSearch } from "@/components/home/HeroSearch";
import { BottomStrip, BrandTitle, FeatureRow } from "@/components/home/Blocks";
import { ComparisonsList } from "@/components/home/ComparisonsWidget";
import { RubricOffers } from "@/components/rubric/RubricOffers";
import { RubricCategoryIcon } from "@/components/rubric/RubricCategoryIcon";
import { IconChart, IconChevron, IconCompare, IconCompass, IconPlay } from "@/components/ui/icons";

export function generateStaticParams() {
  return rubrics.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/r/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const r = findRubric(slug);
  if (!isLocale(lang) || !r) return {};
  return pageMetadata(lang, `/r/${slug}`, r.label[lang], r.text[lang]);
}

export default async function RubricPage({ params }: PageProps<"/[lang]/r/[slug]">) {
  const { lang, slug } = await params;
  const r = findRubric(slug);
  if (!isLocale(lang) || !r) notFound();
  const t = getDictionary(lang);
  const L = t.landing;
  const R = t.rubrics;
  const food = categories.filter((c) => r.food.includes(c.slug));
  const products = r.products.map((s) => findMediaCategory(s)!).filter(Boolean);
  const hero = `/images/rubrik/${r.slug}-hero.webp`;

  return (
    <div className="full-bleed -mb-28 -mt-6 lg:-mt-10 xl:-mb-16">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#eef5f6] via-[#f2f8f8] to-[#e6f1f2] dark:from-mist dark:via-mist dark:to-mist-strong">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden aspect-[840/330] h-full max-w-[56%] md:block">
          <Image src={hero} alt="" fill priority sizes="62vw" className="object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_24%)]" />
        </div>
        <div className="relative mx-auto max-w-[1560px] px-4 pb-9 pt-7 sm:px-6 md:min-h-[360px] md:pb-10 md:pt-8 lg:px-10">
          <p className="max-w-[42rem] text-[0.74rem] font-bold uppercase tracking-[0.2em] text-ink sm:text-[0.78rem] sm:tracking-[0.3em]">{[...L.eyebrow, r.label[lang]].join("  ·  ")}</p>
          <h1 className="mt-3">
            <BrandTitle />
            <span className="sr-only"> – {r.label[lang]}: </span>
            <span className="mt-5 block max-w-[30rem] text-[1.55rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[1.9rem]">{R.heroTitle}</span>
          </h1>
          <p className="mt-2.5 max-w-[31rem] text-[1rem] text-ink-soft sm:text-[1.05rem]">{R.heroText}</p>
          <div className="mt-5"><HeroSearch /></div>
        </div>
        <div className="relative aspect-[16/7] w-full md:hidden">
          <Image src={hero} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      </section>

      <FeatureRow lang={lang} t={t} />

      <div className="mx-auto max-w-[1560px] space-y-8 px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
          <section aria-labelledby="rubric-title" className="grid overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d4f5a] via-[#0b6f6c] to-[#0f9d93] text-white shadow-[0_10px_30px_-14px_rgba(11,58,69,0.55)] sm:grid-cols-[0.8fr_1.3fr]">
            <div className="relative min-h-[10rem]">
              <Image src={`/images/rubrik/${r.slug}-card.webp`} alt="" fill sizes="(min-width: 1024px) 14vw, 40vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-6">
              <h2 id="rubric-title" className="text-[1.75rem] font-extrabold leading-tight">{r.label[lang]}</h2>
              <p className="mt-2 text-white/90">{r.text[lang]}</p>
              <Link href="#kategorien" className="btn btn-aqua mt-5 self-start !px-7 !text-[1.05rem] font-bold">
                {R.cta}<IconChevron width={20} height={20} />
              </Link>
            </div>
          </section>

          <section aria-labelledby="top-title" className="rounded-2xl border border-line bg-paper p-5 shadow-[0_10px_30px_-18px_rgba(11,58,69,0.45)]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 id="top-title" className="flex items-center gap-2.5 text-[1.3rem] font-extrabold">
                <IconChart width={26} height={26} className="text-saving" />{R.topTitle}
              </h2>
              <Link href={r.food.length ? `/${lang}/comparisons` : `/${lang}/produkte/compare?cat=${r.products[0]}`} className="inline-flex items-center gap-1 text-sm font-semibold text-pine hover:text-pine-strong">
                {R.more}<IconChevron width={16} height={16} />
              </Link>
            </div>
            {r.slug === "lebensmittel" ? <ComparisonsList limit={3} /> : <RubricOffers categories={r.products} rubric={r.slug} />}
          </section>
        </div>

        <section id="kategorien" aria-labelledby="cats-title" className="scroll-mt-40">
          <h2 id="cats-title" className="mb-3 text-[1.5rem] font-extrabold tracking-[-0.015em]">{R.categories}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {food.map((c) => (
              <li key={c.slug}>
                <Link href={`/${lang}/category/${c.slug}`} className="flex h-[66px] items-center gap-3 rounded-xl border border-line bg-paper px-3 shadow-[0_4px_14px_-8px_rgba(11,58,69,0.25)] transition-colors hover:border-pine">
                  {c.image ? <Image src={c.image} alt="" width={56} height={56} className="h-10 w-10 shrink-0 object-contain" /> : <RubricCategoryIcon slug={c.slug} kind="food" />}
                  <span className="min-w-0 flex-1 text-[0.98rem] font-bold leading-tight">{c.label[lang]}</span>
                  <IconChevron width={18} height={18} className="shrink-0 text-ink" />
                </Link>
              </li>
            ))}
            {products.map((c) => (
              <li key={c.slug}>
                <Link href={`/${lang}/produkte/c/${c.slug}`} className="flex h-[66px] items-center gap-3 rounded-xl border border-line bg-paper px-3 shadow-[0_4px_14px_-8px_rgba(11,58,69,0.25)] transition-colors hover:border-pine">
                  <RubricCategoryIcon slug={c.slug} kind="products" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.98rem] font-bold leading-tight">{c.label[lang]}</span>
                    <span className="block truncate text-[0.8rem] text-ink-soft">{c.sub.map((s) => s[lang]).join(", ")}</span>
                  </span>
                  <IconChevron width={18} height={18} className="shrink-0 text-ink" />
                </Link>
              </li>
            ))}
          </ul>
          {products.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${lang}/produkte/compare?cat=${r.products[0]}`} className="btn btn-quiet btn-sm"><IconCompare width={16} height={16} />{R.compare}</Link>
              <Link href={`/${lang}/produkte/advisor`} className="btn btn-quiet btn-sm"><IconCompass width={16} height={16} />{R.advisor}</Link>
              {r.slug === "multimedia-entertainment" && <Link href={`/${lang}/produkte/abos`} className="btn btn-quiet btn-sm"><IconPlay width={16} height={16} />{R.abos}</Link>}
            </div>
          )}
        </section>
      </div>

      <BottomStrip lang={lang} t={t} />
    </div>
  );
}

