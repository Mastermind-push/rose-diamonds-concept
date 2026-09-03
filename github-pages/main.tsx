import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import Home from "../app/page";
import CatalogView from "../components/catalog-view";
import ProductDetailView from "../components/product-detail-view";
import PhilosophyView from "../components/philosophy-view";
import DesignYourPieceView from "../components/design-your-piece-view";
import ConsultationView from "../components/consultation-view";
import WishlistView from "../components/wishlist-view";
import BagView from "../components/bag-view";
import AdminCatalogView from "../components/admin-catalog-view";
import PolicyView from "../components/policy-view";
import { catalogConfigs, type CatalogSlug } from "../data/catalog";
import { policies } from "../data/policies";

const base = import.meta.env.BASE_URL;

// Shared storefront components use root-relative links for the local server.
// Keep all anchors (including newly opened drawers) inside the Pages project.
function scopeLinks(root: ParentNode) {
  const anchors = [...root.querySelectorAll<HTMLAnchorElement>("a[href]")];
  if (root instanceof HTMLAnchorElement) anchors.push(root);
  for (const anchor of anchors) {
    const href = anchor.getAttribute("href")!;
    if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith(base)) {
      anchor.setAttribute("href", `${base}${href.slice(1)}`);
    }
  }
}

if (base !== "/") {
  new MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type === "attributes") scopeLinks(change.target as Element);
      for (const node of change.addedNodes) if (node instanceof Element) scopeLinks(node);
    }
  }).observe(document.getElementById("root")!, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["href"],
  });
}

function Page() {
  const path = decodeURIComponent(window.location.pathname)
    .slice(base.length).replace(/^\/+|\/+$/g, "");
  const [section, slug] = path.split("/");
  if (!path || path === "index.html") return <Home />;
  if (section === "collections" && Object.hasOwn(catalogConfigs, slug)) {
    return <CatalogView slug={slug as CatalogSlug} />;
  }
  if (section === "products" && slug) return <ProductDetailView productId={slug} />;
  if (section === "policies") {
    const policy = policies.find((item) => item.slug === slug);
    if (policy) return <PolicyView policy={policy} />;
  }
  if (path === "our-philosophy") return <PhilosophyView />;
  if (path === "design-your-piece") return <DesignYourPieceView />;
  if (path === "consultation") return <ConsultationView />;
  if (path === "wishlist") return <WishlistView />;
  if (path === "bag") return <BagView />;
  if (path === "admin") return <AdminCatalogView />;
  return <main className="utility-page"><h1>Page not found</h1><a href={base}>Back to ROSÉ</a></main>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
