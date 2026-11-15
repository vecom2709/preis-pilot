import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { categories } from "@/lib/categories";
import { HeroSearch } from "@/components/home/HeroSearch";
import { ComparisonsList } from "@/components/home/ComparisonsWidget";
import {
  IconCalculator, IconCalendar, IconChart, IconChecklist, IconChevron, IconLeaf, IconPiggy, IconScale, IconScan, IconWallet,
} from "@/components/ui/icons";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const L = t.landing;
  const featureLinks = [`/${lang}/search`, `/${lang}/search`, `/${lang}/budget`, `/${lang}/insights`];
  const featureIcons = [IconPiggy, IconLeaf, IconCalculator, IconChart];
  const stripLinks = [`/${lang}/scan`, `/${lang}/search`, `/${lang}/lists`, `/${lang}/budget`, `/${lang}/insights`, `/${lang}/search`];
  const stripIcons = [IconScan, IconScale, IconCalendar, IconWallet, IconChart, IconLeaf];
  const featured = categories.filter((c) => c.featured);

  return (
    <div className="full-bleed -mb-28 -mt-6 lg:-mt-10 xl:-mb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#eef5f6] via-[#f2f8f8] to-[#e6f1f2] dark:from-mist dark:via-mist dark:to-mist-strong">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden aspect-[932/312] h-full max-w-[74%] md:block">
          <Image
            src="/images/hero.webp"
            alt=""
            fill
            priority
            sizes="74vw"
            className="object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_26%)]"
          />
        </div>
        <div className="relative mx-auto max-w-[1560px] px-4 pb-9 pt-7 sm:px-6 md:min-h-[380px] md:pb-10 md:pt-8 lg:px-10">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.32em] text-ink">{L.eyebrow.join("  ·  ")}</p>
          <h1 className="mt-3">
            <span className="relative inline-block text-[3.2rem] font-extrabold leading-[0.95] tracking-[-0.035em] text-ink sm:text-[4.2rem] lg:text-[4.6rem]">
              Preis-<span className="bg-gradient-to-r from-[#0b8f86] to-[#19b8ad] bg-clip-text text-transparent">Pilot</span>
              <svg aria-hidden="true" viewBox="0 0 300 24" className="absolute -bottom-3 right-0 h-5 w-[58%]" preserveAspectRatio="none">
                <path d="M4 18 C 90 6, 200 4, 296 12" fill="none" stroke="url(#pp-swoosh)" strokeWidth="5" strokeLinecap="round" />
                <defs><linearGradient id="pp-swoosh" x1="0" x2="1"><stop offset="0" stopColor="#0b7d78" stopOpacity="0.3" /><stop offset="1" stopColor="#19b8ad" /></linearGradient></defs>
              </svg>
            </span>
            <span className="mt-5 block max-w-[32rem] text-[1.6rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[1.95rem]">{L.heroTitle}</span>
          </h1>
          <p className="mt-2.5 max-w-[31rem] text-[1rem] text-ink-soft sm:text-[1.05rem]">{L.heroText}</p>
          <div className="mt-5"><HeroSearch /></div>
        </div>
        <div className="relative aspect-[16/7] w-full md:hidden">
          <Image src="/images/hero.webp" alt="" fill sizes="100vw" className="object-cover" />
        </div>
      </section>

      {/* Vorteile */}
      <section aria-label={L.eyebrow.join(", ")} className="border-y border-line bg-[#f5f9f9] dark:bg-paper">
        <ul className="mx-auto grid max-w-[1560px] grid-cols-1 gap-y-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
          {L.features.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <li key={f.title} className={`lg:px-6 ${i > 0 ? "lg:border-l lg:border-line" : "lg:pl-0"}`}>
                <Link href={featureLinks[i]} className="group flex items-center gap-4">
                  <Icon width={44} height={44} strokeWidth={1.5} className="shrink-0 text-pine" />
                  <span>
                    <span className="block text-[1.1rem] font-bold group-hover:text-pine">{f.title}</span>
                    <span className="block text-sm text-ink-soft">{f.text}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mx-auto max-w-[1560px] space-y-8 px-4 py-8 sm:px-6 lg:px-10">
        {/* Kategorien */}
        <section aria-labelledby="cats-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 id="cats-title" className="text-[1.6rem] font-extrabold tracking-[-0.015em]">{L.categoriesTitle}</h2>
            <Link href={`/${lang}/categories`} className="inline-flex items-center gap-1 font-semibold text-pine hover:text-pine-strong">
              {L.allCategories}<IconChevron width={18} height={18} />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {featured.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${lang}/category/${c.slug}`}
                  className="flex h-[66px] items-center gap-2.5 rounded-xl border border-line bg-paper px-3 shadow-[0_4px_14px_-8px_rgba(11,58,69,0.25)] transition-colors hover:border-pine"
                >
                  {c.image && <Image src={c.image} alt="" width={56} height={56} className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-12" />}
                  <span className="min-w-0 flex-1 break-words text-[0.9rem] font-bold leading-tight sm:text-[1rem]">{c.label[lang]}</span>
                  <IconChevron width={20} height={20} className="hidden shrink-0 text-ink sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

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

      {/* Leiste unten */}
      <section aria-label={t.nav.main} className="bg-gradient-to-r from-petrol via-[#0d5560] to-[#0f6f6c] text-white">
        <ul className="mx-auto grid max-w-[1560px] grid-cols-2 gap-y-5 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-10">
          {L.strip.map((s, i) => {
            const Icon = stripIcons[i];
            return (
              <li key={s.title} className={`lg:px-5 ${i > 0 ? "lg:border-l lg:border-white/20" : "lg:pl-0"}`}>
                <Link href={stripLinks[i]} className="group flex items-center gap-3">
                  <Icon width={38} height={38} strokeWidth={1.5} className="shrink-0 text-white" />
                  <span className="min-w-0">
                    <span className="block font-bold group-hover:text-aqua">{s.title}</span>
                    <span className="block text-[0.82rem] text-white/80">{s.text}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
