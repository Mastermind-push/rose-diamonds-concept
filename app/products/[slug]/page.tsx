import type { Metadata } from "next";
import ProductDetailView from "@/components/product-detail-view";
import { products } from "@/data/catalog";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.filter((product) => product.id !== "pink-bloom").map((product) => ({ slug: product.id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.id === slug);
  if (!product) return { title: "Fine Jewellery — ROSÉ Diamonds" };
  return {
    title: `${product.name} — ROSÉ Diamonds`,
    description: `${product.detail}, crafted by ROSÉ Diamonds.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  return <ProductDetailView productId={slug} />;
}
