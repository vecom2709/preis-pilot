import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { categories } from "@/lib/categories";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Notice";
import { IconBasket, IconChevron } from "@/components/ui/icons";

export async function generateMetadata({ params }: PageProps<"/[lang]/categories">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, "/categories", t.categoriesPage.title, t.categoriesPage.intro);
}

export default async function CategoriesPage({ params }: PageProps<"/[lang]/categories">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <PageHeader title={t.categoriesPage.title} intro={t.categoriesPage.intro} />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/${lang}/category/${c.slug}`} className="flex h-[72px] items-center gap-3 rounded-xl border border-line bg-paper px-4 transition-colors hover:border-pine">
              {c.image ? (
                <Image src={c.image} alt="" width={56} height={56} className="h-12 w-14 object-contain" />
              ) : (
                <span className="grid h-12 w-14 place-items-center rounded-lg bg-pine-tint text-pine"><IconBasket width={26} height={26} /></span>
              )}
              <span className="flex-1 text-[1.05rem] font-bold">{c.label[lang]}</span>
              <IconChevron width={20} height={20} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
