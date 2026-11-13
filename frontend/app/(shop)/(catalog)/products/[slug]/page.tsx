import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProduct } from "@/features/public/catalog/api";
import { Accordion } from "@/features/public/catalog/components/Accordion";
import { Gallery } from "@/features/public/catalog/components/Gallery";
import { SizeChartTable } from "@/features/public/catalog/components/SizeChartTable";
import { VariantSelector } from "@/features/public/catalog/components/VariantSelector";
import { formatYen } from "@/shared/lib/format";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  // メタデータ解決はレスポンス開始前なので、ここでnotFound()すると404ステータスが
  // 正しく返る（page側で呼ぶとloading.tsxのストリーミングで既に200が送られている）。
  if (!product) notFound();

  return { title: product.name };
}

/** 商品詳細（docs/frontend/routing.md）。読み取りのみなのでServer Component。未公開・存在しないslugはnotFound()（(shop)/not-found.tsx）。 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <nav className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <Gallery images={product.images} name={product.name} />

        {/* 右パネル（PCはスティッキー） */}
        <div className="md:sticky md:top-20 md:self-start">
          <p className="text-[11px] tracking-widest text-graphite uppercase">
            {product.category.name}
          </p>
          <h1 className="mt-2 text-2xl tracking-wide">{product.name}</h1>
          <p className="mt-2 text-lg">{formatYen(product.price)}</p>

          <div className="mt-6 border border-ink px-4 py-3 text-xs tracking-widest uppercase">
            Shipping: 3–5 Business Days
          </div>

          <div className="mt-8">
            <VariantSelector
              productSlug={product.slug}
              productName={product.name}
              price={product.price}
              imageUrl={product.images.find((image) => image.position === 0)?.url ?? null}
              colors={product.colors}
              variants={product.variants}
            />
          </div>

          <div className="mt-10 divide-y divide-ink border-t border-b border-ink">
            <Accordion title="Description">
              <p>{product.description}</p>
            </Accordion>

            <Accordion title="Material & Care">
              <p>{product.material}</p>
              {product.care && <p className="mt-2">{product.care}</p>}
            </Accordion>

            {product.size_chart && (
              <Accordion title="Size Guide">
                <SizeChartTable chart={product.size_chart} />
              </Accordion>
            )}

            <Accordion title="Shipping & Returns">
              <p>
                Standard shipping takes 3–5 business days. Returns are accepted within 14 days of
                delivery, unworn and in original packaging.
              </p>
            </Accordion>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-[11px] tracking-widest text-graphite uppercase">
            <p>Origin: {product.origin}</p>
            <p>Product Code: {product.product_code}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
