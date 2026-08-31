"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useRef, useState } from "react";
import SiteFooter from "@/components/site-footer";
import { products } from "@/data/catalog";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const product = products.find((item) => item.id === "pink-bloom")!;
const relatedProducts = products.filter((item) => item.collection === "ROSÉ Dopamine" && item.id !== product.id).slice(0, 4);
const sizes = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];

const BagIcon = () => <img className="ui-bag" src={assetPath("icons/shopping-bag.svg")} alt="" aria-hidden="true" />;
const MenuArrowIcon = () => <img className="menu-arrow" src={assetPath("icons/menu-arrow-right.svg")} alt="" aria-hidden="true" />;

function BrandLogo() {
  return <span className="brand-logo" aria-hidden="true"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="" /></span>;
}

function ProductAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="pdp-accordion">
      <summary><span>{title}</span><i aria-hidden="true" /></summary>
      <div className="pdp-accordion-content">{children}</div>
    </details>
  );
}

export default function ProductDetailView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [wished, setWished] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [bagCount, setBagCount] = useState(0);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen || bagOpen ? "hidden" : "";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); setBagOpen(false); }
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [menuOpen, bagOpen]);

  const addToBag = () => {
    if (!selectedSize || added) return;
    setBagCount((count) => count + 1);
    setAdded(true);
  };

  const updateMobileGallery = () => {
    const gallery = mobileGalleryRef.current;
    if (!gallery) return;
    const index = Math.round(gallery.scrollLeft / Math.max(gallery.clientWidth, 1));
    setActiveImage(Math.max(0, Math.min(1, index)));
  };

  const galleryImages = [
    { src: product.primary, alt: `${product.name} ring, product view` },
    { src: product.secondary, alt: `${product.name} ring worn on hand` },
  ];

  return (
    <main className="pdp-page">
      <header className="site-header pdp-header">
        <button className="mobile-menu-trigger" aria-label="Open menu" onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
        <nav className="desktop-nav desktop-nav-left" aria-label="Primary navigation">
          <button onClick={() => setMenuOpen(true)}>Shop</button>
          <a href="/#our-world">Our World</a>
          <a href="/collections/all-jewellery">Search</a>
        </nav>
        <a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a>
        <nav className="desktop-nav desktop-nav-right" aria-label="Client navigation">
          <a href="/#concierge">Concierge</a>
          <a href="#pdp-details">My Account</a>
          <button onClick={() => setBagOpen(true)}>Bag <sup>{bagCount}</sup></button>
        </nav>
        <button className="mobile-bag" aria-label={`Shopping bag, ${bagCount} items`} onClick={() => setBagOpen(true)}><BagIcon /><sup>{bagCount}</sup></button>
      </header>

      <section className="pdp-main" aria-labelledby="pdp-title">
        <div className="pdp-gallery-desktop" aria-label="Product gallery">
          {galleryImages.map((image, index) => (
            <figure className="pdp-media" key={image.src}>
              <img src={assetPath(image.src)} alt={image.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
            </figure>
          ))}
        </div>

        <div className="pdp-gallery-mobile-wrap">
          <div className="pdp-gallery-mobile" ref={mobileGalleryRef} onScroll={updateMobileGallery}>
            {galleryImages.map((image, index) => (
              <figure className="pdp-mobile-slide" key={image.src}>
                <img src={assetPath(image.src)} alt={image.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
              </figure>
            ))}
          </div>
          <span className="pdp-image-count" aria-live="polite">{String(activeImage + 1).padStart(2, "0")} / 02</span>
          <div className="pdp-image-dots" aria-hidden="true"><i className={activeImage === 0 ? "is-active" : ""} /><i className={activeImage === 1 ? "is-active" : ""} /></div>
        </div>

        <aside className="pdp-info-column" id="pdp-details">
          <div className="pdp-info-panel">
            <p className="pdp-collection">ROSÉ Dopamine</p>
            <div className="pdp-title-row">
              <h1 id="pdp-title">{product.name}</h1>
              <button className={`pdp-wishlist${wished ? " is-active" : ""}`} type="button" onClick={() => setWished((value) => !value)} aria-pressed={wished} aria-label={wished ? "Remove Pink Bloom from wish list" : "Add Pink Bloom to wish list"}><span aria-hidden="true">{wished ? "♥" : "♡"}</span></button>
            </div>
            <p className="pdp-price">{product.priceLabel}</p>
            <p className="pdp-description">Pink Bloom brings a clear pulse of colour to the everyday. A vivid oval pink diamond rests above a fine line of pink sapphires, set in polished 18K white gold. Delicate worn alone and expressive within a stack, the ring balances playful energy with the precision and refinement of fine jewellery.</p>

            <div className="pdp-size-block">
              <div className="pdp-size-label"><label htmlFor="ring-size">Ring size</label><a href="#size-guide">Size guide</a></div>
              <div className="pdp-select-wrap">
                <select id="ring-size" value={selectedSize} onChange={(event) => { setSelectedSize(event.target.value); setAdded(false); }}>
                  <option value="">Select your size</option>
                  {sizes.map((size) => <option value={size} key={size}>US {size}</option>)}
                </select>
                <span aria-hidden="true" />
              </div>
            </div>

            <button className={`pdp-add${added ? " is-added" : ""}`} type="button" disabled={!selectedSize} onClick={addToBag}>{added ? "ADDED TO BAG" : "ADD TO BAG"}</button>
            <p className="pdp-service-note">Complimentary insured delivery · Personal sizing support</p>

            <dl className="pdp-specs">
              <div><dt>Stone</dt><dd>Pink diamond and pink sapphires</dd></div>
              <div><dt>Shape</dt><dd>Oval brilliant</dd></div>
              <div><dt>Metal</dt><dd>18K white gold</dd></div>
              <div><dt>Setting</dt><dd>Four-claw centre, pavé band</dd></div>
              <div><dt>Collection</dt><dd>ROSÉ Dopamine</dd></div>
            </dl>

            <div className="pdp-accordions">
              <ProductAccordion title="Certification & sourcing">
                <p>ROSÉ works with both natural and laboratory-grown diamonds. Natural diamonds are accompanied by GIA documentation where applicable; laboratory-grown diamonds are accompanied by IGI documentation where applicable.</p>
                <div className="pdp-certifications" aria-label="Certification laboratories"><span>GIA</span><span>IGI</span></div>
                <a className="pdp-policy-link" href="/policies/ethical-sourcing">Read our Ethical Sourcing Policy</a>
              </ProductAccordion>
              <ProductAccordion title="Delivery & returns">
                <p>Your piece is delivered fully insured. Timing, destination availability and any applicable duties are confirmed during checkout or by our concierge.</p>
              </ProductAccordion>
              <ProductAccordion title="Product care">
                <p>Store the ring separately in its ROSÉ case. Avoid impact, chemicals and sudden temperature changes; clean gently with a soft brush and mild soapy water.</p>
              </ProductAccordion>
              <ProductAccordion title="Size guide">
                <div className="pdp-size-guide" id="size-guide"><span>US 5</span><span>49.3 mm</span><span>US 6</span><span>51.9 mm</span><span>US 7</span><span>54.4 mm</span><span>US 8</span><span>57.0 mm</span></div>
                <p>Between sizes? Our concierge can help confirm the most comfortable fit.</p>
              </ProductAccordion>
            </div>
          </div>
        </aside>
      </section>

      <section className="pdp-related" aria-labelledby="related-title">
        <div className="pdp-related-head"><p className="micro-label">Wear it your way</p><h2 id="related-title">Complete the stack.</h2><a className="underlined-link" href="/collections/rose-dopamine">View collection</a></div>
        <div className="pdp-related-grid">
          {relatedProducts.map((item) => <a href={`/collections/rose-dopamine#${item.id}`} className="pdp-related-card" key={item.id}><span><img src={assetPath(item.primary)} alt={item.name} loading="lazy" decoding="async" /></span><div><h3>{item.name}</h3><strong>{item.priceLabel}</strong></div></a>)}
        </div>
      </section>

      <SiteFooter />

      {menuOpen && <div className="nav-overlay" role="dialog" aria-modal="true" aria-label="Shop menu"><button className="nav-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" /><div className="nav-sheet"><div className="nav-sheet-top"><button className="nav-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><span /><span /></button><a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a><button className="nav-sheet-bag" onClick={() => { setMenuOpen(false); setBagOpen(true); }} aria-label="Shopping bag"><BagIcon /><sup>{bagCount}</sup></button></div><div className="nav-shop-layout catalog-nav-shop"><div className="nav-shop-intro"><small>Shop</small><p>Fine jewellery chosen by piece, collection or feeling.</p></div><div className="nav-shop-row"><div className="nav-column"><small>Discover</small><a href="/collections/all-jewellery">All Jewellery <MenuArrowIcon /></a><a href="/collections/rose-dopamine">ROSÉ Dopamine <MenuArrowIcon /></a></div><div className="nav-column"><small>Jewellery</small><a href="/collections/rings">Rings <MenuArrowIcon /></a><a href="/collections/necklaces">Necklaces <MenuArrowIcon /></a><a href="/collections/earrings">Earrings <MenuArrowIcon /></a><a href="/collections/bracelets">Bracelets <MenuArrowIcon /></a></div><div className="nav-column"><small>Services</small><a href="/#design-your-piece">Design Your Piece <MenuArrowIcon /></a><a href="/#concierge">Concierge <MenuArrowIcon /></a></div></div></div></div></div>}

      {bagOpen && <div className="nav-overlay" role="dialog" aria-modal="true" aria-label="Shopping bag"><button className="nav-backdrop" onClick={() => setBagOpen(false)} aria-label="Close bag" /><div className="nav-sheet"><div className="nav-sheet-top"><button className="nav-close" onClick={() => setBagOpen(false)} aria-label="Close bag"><span /><span /></button><a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a><span className="nav-sheet-bag"><BagIcon /><sup>{bagCount}</sup></span></div><div className="nav-bag-layout"><small>Your bag</small><h3>{bagCount ? `${product.name} is in your bag.` : "Your bag is currently empty."}</h3><p>{bagCount ? `Ring size US ${selectedSize}. Our concierge will confirm every detail.` : "Discover pieces chosen to be worn your way."}</p>{bagCount ? <button className="button button-dark" onClick={() => setBagOpen(false)}>Continue shopping</button> : <a className="button button-dark" href="/collections/all-jewellery">Explore jewellery</a>}</div></div></div>}
    </main>
  );
}
