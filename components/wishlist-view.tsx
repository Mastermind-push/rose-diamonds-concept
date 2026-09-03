"use client";

import ClientPageHeader from "@/components/client-page-header";
import SiteFooter from "@/components/site-footer";
import { useClientCommerce } from "@/components/client-commerce";
import { useStorefrontCatalog } from "@/components/use-storefront-catalog";

const assetPath = (path: string) => /^(?:blob:|data:|https?:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function WishlistView() {
  const commerce = useClientCommerce();
  const products = useStorefrontCatalog();
  const wishedProducts = products.filter((product) => commerce.wishlist.has(product.id));

  return <main className="utility-page">
    <ClientPageHeader />
    <section className="utility-heading"><p className="micro-label">Your selection</p><h1>Wishlist</h1><span>{wishedProducts.length} {wishedProducts.length === 1 ? "piece" : "pieces"}</span></section>
    {wishedProducts.length ? <section className="wishlist-grid">{wishedProducts.map((product) => <article className="catalog-card" key={product.id}><div className="catalog-card-media"><img className="catalog-card-primary" src={assetPath(product.primary)} alt={product.name} /><img className="catalog-card-secondary" src={assetPath(product.secondary)} alt={`${product.name} worn`} /><a className="catalog-card-pdp-link" href={`/products/${product.id}`} aria-label={`View ${product.name}`} /><button className="wishlist-remove" type="button" onClick={() => commerce.toggleWishlist(product.id)} aria-label={`Remove ${product.name} from wishlist`}><span /><span /></button></div><div className="catalog-card-copy"><div className="catalog-card-heading"><h2><a href={`/products/${product.id}`}>{product.name}</a></h2><strong>{product.priceLabel}</strong></div><p>{product.detail}</p></div></article>)}</section> : <section className="utility-empty"><h2>Your wishlist is waiting.</h2><p>Save the pieces you want to return to, compare or share privately.</p><a className="button button-dark" href="/collections/all-jewellery">Explore jewellery</a></section>}
    <SiteFooter />
  </main>;
}
