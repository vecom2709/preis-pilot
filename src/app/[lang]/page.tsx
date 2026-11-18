import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { categories } from "@/lib/categories";
import { HeroSearch } from "@/components/home/HeroSearch";
import { ComparisonsList } from "@/components/home/ComparisonsWidget";
import { BottomStrip, BrandTitle, FeatureRow } from "@/components/home/Blocks";
import { mediaTiles } from "@/components/home/MediaTileIcons";
import { DealSections } from "@/components/deals/DealSections";
import { IconBasket, IconChart, IconChecklist, IconChevron, IconPlay } from "@/components/ui/icons";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const L = t.landing;
  const featured = categories.filter((c) => c.featured);

  return (
    <div className="full-bleed -mb-28 -mt-6 lg:-mt-10 xl:-mb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#eef5f6] via-[#f2f8f8] to-[#e6f1f2] dark:from-mist dark:via-mist dark:to-mist-strong">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden aspect-[7/3] h-full max-w-[48%] md:block">
          <Image
            src="/images/hero-home.webp"
            alt=""
            fill
            priority
            sizes="74vw"
            className="object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_12%)]"
          />
        </div>
        <div className="relative mx-auto max-w-[1560px] px-4 pb-9 pt-7 sm:px-6 md:min-h-[380px] md:pb-10 md:pt-8 lg:px-10">
          <p className="max-w-[42rem] text-[0.74rem] font-bold uppercase tracking-[0.2em] text-ink sm:text-[0.78rem] sm:tracking-[0.3em]">{[...L.eyebrow, L.homeEyebrow].join("  ·  ")}</p>
          <h1 className="mt-3">
            <BrandTitle suffix="Multimedia" />
            <span className="mt-5 block max-w-[34rem] text-[1.55rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[1.9rem]">{L.homeTitle}</span>
          </h1>
          <p className="mt-2.5 max-w-[33rem] text-[1rem] text-ink-soft sm:text-[1.05rem]">{L.homeText}</p>
          <div className="mt-5"><HeroSearch home /></div>
        </div>
        <div className="relative aspect-[16/7] w-full md:hidden">
          <Image src="/images/hero-home.webp" alt="" fill sizes="100vw" className="object-cover" />
        </div>
      </section>

      <FeatureRow lang={lang} t={t} withMedia />

      <div className="mx-auto max-w-[1560px] space-y-8 px-4 py-8 sm:px-6 lg:px-10">
        {/* Einkaufs- und Multimedia-Kategorien */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <section aria-labelledby="shop-title" className="overflow-hidden rounded-2xl border border-line bg-[#eef5f6] shadow-[0_10px_30px_-18px_rgba(11,58,69,0.45)] dark:bg-paper">
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-petrol to-[#0d5560] px-5 py-3 text-white">
              <h2 id="shop-title" className="flex items-center gap-3 text-[1.3rem] font-extrabold"><IconBasket width={28} height={28} />{L.shopTitle}</h2>
              <Link href={`/${lang}/categories`} className="inline-flex items-center gap-1 text-sm font-semibold hover:text-aqua">{L.shopAll}<IconChevron width={16} height={16} /></Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {featured.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${lang}/category/${c.slug}`} className="flex h-[62px] items-center gap-2 rounded-xl bg-paper px-2.5 shadow-[0_4px_14px_-8px_rgba(11,58,69,0.3)] ring-1 ring-line transition-colors hover:ring-pine">
                    {c.image && <Image src={c.image} alt="" width={56} height={56} className="h-9 w-9 shrink-0 object-contain" />}
                    <span className="min-w-0 flex-1 text-[0.93rem] font-bold leading-tight">{c.label[lang]}</span>
                    <IconChevron width={18} height={18} className="hidden shrink-0 text-ink sm:block lg:max-2xl:hidden" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="mm-title" className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a1d6e] via-[#4b2fb0] to-[#7044df] shadow-[0_10px_30px_-14px_rgba(60,30,140,0.6)]">
            <div className="flex items-center justify-between gap-3 px-5 py-3 text-white">
              <h2 id="mm-title" className="flex items-center gap-3 text-[1.3rem] font-extrabold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20"><IconPlay width={20} height={20} /></span>{L.mediaTitle}
              </h2>
              <Link href={`/${lang}/r/multimedia-entertainment`} className="inline-flex items-center gap-1 text-sm font-semibold hover:text-[#d8ccff]">{L.mediaAll}<IconChevron width={16} height={16} /></Link>
            </div>
            <ul className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
              {mediaTiles.map(({ slug, Icon }, i) => (
                <li key={slug}>
                  <Link href={`/${lang}/produkte/c/${slug}`} className="flex min-h-[62px] items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 text-[#14123a] shadow-[0_6px_16px_-10px_rgba(20,10,60,0.6)] transition-transform hover:-translate-y-0.5">
                    <Icon />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.95rem] font-bold leading-tight">{L.mediaTiles[i].title}</span>
                      <span className="block text-[0.78rem] leading-tight text-[#4b4870]">{L.mediaTiles[i].text}</span>
                    </span>
                    <IconChevron width={18} height={18} className="shrink-0 text-[#6b5bd6]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Live-Angebote (Preis-Pilot 3.0) */}
        <DealSections />

        {/* Planer + Vergleiche */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
          <section aria-labelledby="planner-title" className="grid overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d4f5a] via-[#0b6f6c] to-[#0f9d93] text-white shadow-[0_10px_30px_-14px_rgba(11,58,69,0.55)] sm:grid-cols-[0.95fr_1.25fr]">
            <div className="relative min-h-[11rem]">
              <Image src="/images/planner.webp" alt="" fill sizes="(min-width: 1024px) 18vw, 40vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-6">
              <h2 id="planner-title" className="flex items-center gap-3 text-[1.6rem] font-extrabold leading-tight">
                <IconChecklist width={34} height={34} strokeWidth={1.6} className="shrink-0" />{L.plannerTitle}
              </h2>
              <p className="mt-3 text-white/90">{L.plannerText}</p>
              <Link href={`/${lang}/lists`} className="btn btn-aqua mt-5 self-start !px-7 !text-[1.08rem] font-bold">
                {L.plannerCta}<IconChevron width={20} height={20} />
              </Link>
            </div>
          </section>

          <section aria-labelledby="cmp-title" className="rounded-2xl border border-line bg-paper p-5 shadow-[0_10px_30px_-18px_rgba(11,58,69,0.45)]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 id="cmp-title" className="flex items-center gap-2.5 text-[1.35rem] font-extrabold">
                <IconChart width={26} height={26} className="text-saving" />{L.comparisonsTitle}
              </h2>
              <Link href={`/${lang}/comparisons`} className="inline-flex items-center gap-1 text-sm font-semibold text-pine hover:text-pine-strong">
                {L.moreComparisons}<IconChevron width={16} height={16} />
              </Link>
            </div>
            <ComparisonsList limit={3} />
          </section>
        </div>
      </div>

      <BottomStrip lang={lang} t={t} withMedia />
    </div>
  );
}
