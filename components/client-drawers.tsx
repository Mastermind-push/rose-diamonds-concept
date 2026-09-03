"use client";

import type { BagItem } from "@/components/client-commerce";
import { useStorefrontCatalog } from "@/components/use-storefront-catalog";

const assetPath = (path: string) => /^(?:blob:|data:|https?:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const formatBagPrice = (price: number) => `$${price.toLocaleString("en-US")}`;

type BagDrawerProps = {
  items: BagItem[];
  onClose: () => void;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
};

export function BagDrawer({ items, onClose, onQuantity, onRemove }: BagDrawerProps) {
  const products = useStorefrontCatalog();
  const entries = items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = entries.reduce((sum, item) => sum + (item.price ?? item.product.price) * item.quantity, 0);

  return (
    <div className="client-drawer-layer" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button className="client-drawer-backdrop" type="button" onClick={onClose} aria-label="Close bag" />
      <aside className="client-drawer">
        <header><h2>Your bag <sup>{entries.reduce((sum, item) => sum + item.quantity, 0)}</sup></h2><button className="nav-close" type="button" onClick={onClose} aria-label="Close bag"><span /><span /></button></header>
        {entries.length ? <>
          <div className="client-bag-items">{entries.map((item) => <article className="client-bag-item" key={item.key}>
            <a href={`/products/${item.product.id}`}><img src={assetPath(item.product.primary)} alt={item.product.name} /></a>
            <div><div className="client-bag-item-head"><h3><a href={`/products/${item.product.id}`}>{item.product.name}</a></h3><strong>{item.price ? formatBagPrice(item.price) : item.product.priceLabel}</strong></div>{item.option && <p>{item.option}</p>}<div className="client-quantity"><button type="button" onClick={() => onQuantity(item.key, item.quantity - 1)} aria-label={`Decrease ${item.product.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantity(item.key, item.quantity + 1)} aria-label={`Increase ${item.product.name} quantity`}>+</button></div><button className="client-remove" type="button" onClick={() => onRemove(item.key)}>Remove</button></div>
          </article>)}</div>
          <footer className="client-bag-total"><div><span>Subtotal</span><strong>${subtotal.toLocaleString("en-US")}</strong></div><p>Taxes, duties and insured delivery are confirmed before payment.</p><a className="button button-dark" href="/bag">View bag</a></footer>
        </> : <div className="client-drawer-empty"><p className="micro-label">Your bag</p><h3>Nothing here yet.</h3><p>Discover pieces chosen to be worn your way.</p><a className="button button-dark" href="/collections/all-jewellery">Explore jewellery</a></div>}
      </aside>
    </div>
  );
}

export function ConciergeDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="client-drawer-layer" role="dialog" aria-modal="true" aria-label="Concierge">
      <button className="client-drawer-backdrop" type="button" onClick={onClose} aria-label="Close concierge" />
      <aside className="client-drawer concierge-drawer">
        <header><span>Concierge</span><button className="nav-close" type="button" onClick={onClose} aria-label="Close concierge"><span /><span /></button></header>
        <div className="concierge-drawer-copy"><p className="micro-label">Personal assistance</p><h2>We&apos;re here<br />to help.</h2><p>Speak directly with our team about a piece, sizing, a gift or a bespoke request.</p></div>
        <nav className="concierge-contact-list" aria-label="Contact ROSÉ Concierge">
          <a className="concierge-contact-primary" href="https://wa.me/85292270884" target="_blank" rel="noreferrer"><span><small>WhatsApp</small><b>Message us on WhatsApp</b></span><span className="concierge-contact-value">+852 9227 0884 <img src={assetPath("icons/arrow-up-right.svg")} alt="" aria-hidden="true" /></span></a>
          <a href="tel:+85292270884"><span><small>Call us</small><b>Speak with a specialist</b></span><span className="concierge-contact-value">+852 9227 0884</span></a>
          <a href="mailto:hello@rosehk.com"><span><small>Email</small><b>Write to ROSÉ</b></span><span className="concierge-contact-value">hello@rosehk.com</span></a>
        </nav>
        <div className="concierge-drawer-footer"><a className="button button-dark" href="/consultation#book-consultation">Book a consultation</a><p>Hong Kong · Dubai · Paris</p></div>
      </aside>
    </div>
  );
}
