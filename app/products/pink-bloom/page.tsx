import type { Metadata } from "next";
import ProductDetailView from "@/components/product-detail-view";

export const metadata: Metadata = {
  title: "Pink Bloom Ring — ROSÉ Diamonds",
  description: "Pink Bloom pairs an oval pink diamond with pink sapphires in polished 18K white gold.",
};

export default function PinkBloomProductPage() {
  return <ProductDetailView productId="pink-bloom" />;
}
