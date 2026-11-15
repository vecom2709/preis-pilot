import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { defaultCountryFor, isLocale, type Locale } from "@/i18n/config";
import { normalizeBarcode } from "@/lib/barcode";
import { usableObservations } from "@/lib/price-quality";
import { getProduct } from "@/lib/sources/off";
import { getProductPrices } from "@/lib/sources/prices";
import { pageMetadata } from "@/lib/seo";
import { Notice } from "@/components/ui/Notice";
import { IconExternal } from "@/components/ui/icons";
import { ProductLive } from "@/components/product/ProductLive";

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[code]">) {
  const { lang, code } = await params;
  if (!isLocale(lang)) return {};
  const barcode = normalizeBarcode(code);
  const product = barcode ? await getProduct(barcode, lang).catch(() => null) : null;
  const t = getDictionary(lang);
  const title = product?.name ? [product.name, product.brand, product.quantityText].filter(Boolean).join(" – ") : t.search.title;
  return pageMetadata(lang, `/product/${code}`, title, t.search.intro);
}

export default function ProductPage({ params }: PageProps<"/[lang]/product/[code]">) {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-[var(--radius-panel)] bg-mist-strong" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/[lang]/product/[code]">["params"] }) {
  const { lang, code } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const barcode = normalizeBarcode(code);
  if (!barcode) notFound();

  let product = null;
  let failed = false;
  try {
    product = await getProduct(barcode, lang);
  } catch {
    failed = true;
  }

  if (!product) {
    return (
      <div className="space-y-5">
        <p className="num text-sm text-ink-soft">{t.product.barcode}: {barcode}</p>
        <Notice tone={failed ? "danger" : "info"}>
          <p className="font-semibold">{failed ? t.common.sourceDown : t.product.notFound}</p>
          {!failed && <p className="mt-1 text-ink-soft">{t.product.notFoundHint}</p>}
        </Notice>
        <ProductLive product={{ code: barcode, name: null, brand: null, quantityText: null, packageBase: null, packageDimension: null }} />
      </div>
    );
  }

  return (
    <article className="space-y-10">
      <JsonLd lang={lang} product={product} />
      <header className="grid gap-6 sm:grid-cols-[11rem_1fr] sm:items-start">
        <div className="relative aspect-square w-40 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-paper sm:w-44">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name ?? ""} fill sizes="176px" className="object-contain p-3" priority />
          ) : null}
        </div>
        <div>
          <h1 className="display text-[1.9rem] sm:text-[2.4rem]">{product.name ?? barcode}</h1>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-[0.95rem]">
            {product.brand && (<><dt className="text-ink-soft">{t.product.brand}</dt><dd className="font-medium">{product.brand}</dd></>)}
            <dt className="text-ink-soft">{t.product.content}</dt>
            <dd className="font-medium">{product.quantityText ?? "–"}</dd>
            <dt className="text-ink-soft">{t.product.barcode}</dt>
            <dd className="num font-medium">{product.code}</dd>
          </dl>
          <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pine underline underline-offset-4">
            {t.product.offLink} <IconExternal width={15} height={15} />
          </a>
        </div>
      </header>
      <ProductLive
        product={{
          code: product.code,
          name: product.name,
          brand: product.brand,
          quantityText: product.quantityText,
          packageBase: product.packageBase,
          packageDimension: product.packageDimension,
        }}
      />
      <p className="text-xs text-ink-soft">{t.product.attribution}</p>
      <p><Link href={`/${lang}/search`} className="text-sm font-semibold text-pine underline underline-offset-4">{t.search.title}</Link></p>
    </article>
  );
}

/** Strukturierte Daten: Produkt + belegte Preisspanne (nur echte, geprüfte Beobachtungen) */
async function JsonLd({ lang, product }: { lang: Locale; product: NonNullable<Awaited<ReturnType<typeof getProduct>>> }) {
  const prices = usableObservations(await getProductPrices(product.code, defaultCountryFor[lang]).catch(() => [])).filter((o) => o.pricePer === "item");
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name ?? product.code,
    gtin: product.code,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.imageUrl ? { image: product.imageUrl } : {}),
  };
  if (prices.length) {
    const cents = prices.map((p) => p.priceCents);
    data.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: (Math.min(...cents) / 100).toFixed(2),
      highPrice: (Math.max(...cents) / 100).toFixed(2),
      offerCount: prices.length,
    };
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
