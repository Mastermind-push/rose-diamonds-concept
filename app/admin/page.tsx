import type { Metadata } from "next";
import AdminCatalogView from "@/components/admin-catalog-view";

export const metadata: Metadata = {
  title: "Catalogue administration — ROSÉ Diamonds",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminCatalogView />;
}
