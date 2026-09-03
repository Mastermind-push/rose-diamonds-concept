"use client";

import ClientPageHeader from "@/components/client-page-header";
import SiteFooter from "@/components/site-footer";
import { useClientCommerce } from "@/components/client-commerce";
import { useStorefrontCatalog } from "@/components/use-storefront-catalog";

const assetPath = (path: string) => /^(?:blob:|data:|https?:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function BagView() {
  const commerce = useClientCommerce();
  const products = useStorefrontCatalog();
  const entries = commerce.bag.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = entries.reduce((sum, item) => sum + (item.price ?? item.product.price) * item.quantity, 0);

  return <main className="utility-page">
    <ClientPageHeader />
    <section className="utility-heading"><p className="micro-label">Your selection</p><h1>Your bag</h1><span>{commerce.bagCount} {commerce.bagCount === 1 ? "piece" : "pieces"}</span></section>
    {entries.length ? <section className="bag-page-layout"><div className="bag-page-items">{entries.map((item) => <article className="bag-page-item" key={item.key}><a href={`/products/${item.product.id}`}><img src={assetPath(item.product.primary)} alt={item.product.name} /></a><div><h2><a href={`/products/${item.product.id}`}>{item.product.name}</a></h2>{item.option && <p>{item.option}</p>}<strong>{item.price ? `$${item.price.toLocaleString("en-US")}` : item.product.priceLabel}</strong><div className="client-quantity"><button type="button" onClick={() => commerce.setQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity">−</button><span>{item.quantity}</span><button type="button" onClick={() => commerce.setQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity">+</button></div><button className="client-remove" type="button" onClick={() => commerce.removeFromBag(item.key)}>Remove</button></div></article>)}</div><aside className="bag-summary"><p className="micro-label">Order summary</p><div><span>Subtotal</span><strong>${subtotal.toLocaleString("en-US")}</strong></div><p>Taxes, duties and complimentary insured delivery will be confirmed by our concierge before payment.</p><a className="button button-dark" href="/consultation?reason=order">Continue with concierge</a><a className="underlined-link" href="/collections/all-jewellery">Continue shopping</a></aside></section> : <section className="utility-empty"><h2>Your bag is currently empty.</h2><p>Discover fine diamonds, expressive colour and pieces chosen to become part of your everyday life.</p><a className="button button-dark" href="/collections/all-jewellery">Explore jewellery</a></section>}
    <SiteFooter />
  </main>;
}
