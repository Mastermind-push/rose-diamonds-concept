"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useRef, useState } from "react";
import SiteFooter from "@/components/site-footer";
import { type Product, type ProductCategory, type StorefrontDiamondType } from "@/data/catalog";
import { useClientCommerce } from "@/components/client-commerce";
import { BagDrawer, ConciergeDrawer } from "@/components/client-drawers";
import { LeftNavigationHeader, NavigationSearch, ShopNavigation, WorldNavigation } from "@/components/navigation-menus";
import { useStorefrontCatalogState } from "@/components/use-storefront-catalog";
import { variantPriceKey } from "@/data/admin-catalog";

const assetPath = (path: string) => /^(?:blob:|data:|https?:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const ringSizes = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];
const ringSizeChart = [
  ["E", "2.5", "42", "13.6 mm"], ["F", "3", "44", "14.0 mm"], ["G", "3.5", "45", "14.5 mm"],
  ["H", "4", "46.5", "15.0 mm"], ["I", "4.5", "48", "15.3 mm"], ["J", "5", "49.5", "15.6 mm"],
  ["K", "5.5", "50.5", "16.2 mm"], ["L", "6", "52", "16.6 mm"], ["M", "6.5", "53", "16.9 mm"],
  ["N", "7", "54.5", "17.2 mm"], ["O", "7.5", "55.5", "17.8 mm"], ["P", "8", "57", "18.1 mm"],
  ["Q", "8.5", "58", "18.5 mm"], ["R", "9", "59.5", "19.1 mm"], ["S", "9.5", "61", "19.4 mm"],
  ["T", "10", "62", "19.7 mm"], ["U", "10.5", "63.5", "20.4 mm"], ["V", "11", "64.5", "20.7 mm"],
  ["W", "11.5", "66", "21.0 mm"], ["X", "12", "67", "21.6 mm"], ["Y", "12.5", "68.5", "22.0 mm"],
  ["Z", "13", "69.5", "22.3 mm"],
] as const;

type SelectionConfig = { label: string; placeholder: string; ariaLabel: string; options: string[]; guideTitle: string };
type GuideContent = {
  introduction: string;
  note: string;
  headers: string[];
  rows: readonly (readonly string[])[];
  measure: string;
  steps: string[];
};

const selections: Partial<Record<ProductCategory, SelectionConfig>> = {
  Rings: { label: "Ring size", placeholder: "Select your size", ariaLabel: "Available ring sizes", options: ringSizes.map((size) => `US ${size}`), guideTitle: "Ring Size Chart" },
  Necklaces: { label: "Chain length", placeholder: "Select a length", ariaLabel: "Available chain lengths", options: ["16 in", "18 in", "20 in"], guideTitle: "Necklace Size Guide" },
  Bracelets: { label: "Bracelet size", placeholder: "Select a size", ariaLabel: "Available bracelet sizes", options: ["15 cm", "16 cm", "17 cm", "18 cm"], guideTitle: "Bracelet Size Guide" },
};

const guides: Partial<Record<ProductCategory, GuideContent>> = {
  Rings: {
    introduction: "You may be able to find your size by measuring a ring you already own that feels comfortable. Otherwise, use the guide below to compare measurements.",
    note: "The symbol ⌀ indicates the inside diameter.",
    headers: ["UK", "US", "EU", "⌀ Inside diameter"],
    rows: ringSizeChart,
    measure: "Choose a ring that fits the same finger. Measure straight across the centre of its inner edge in millimetres, then match that diameter to the chart.",
    steps: ["Place the ring on a flat surface.", "Measure only the inside opening.", "Use the widest point through the centre.", "Compare the result with the size chart."],
  },
  Necklaces: {
    introduction: "Chain length changes where a pendant rests and how it layers with other pieces. Use these positions as a guide; the final placement will vary slightly with the wearer.",
    note: "Measurements refer to the full wearable chain length.",
    headers: ["Length", "Centimetres", "Position"],
    rows: [["16 in", "40.6 cm", "At the collarbone"], ["18 in", "45.7 cm", "Below the collarbone"], ["20 in", "50.8 cm", "Upper chest"]],
    measure: "Place a soft measuring tape around your neck at the point where you would like the necklace to rest. Allow a little extra length for a relaxed fit or for layering.",
    steps: ["Choose your preferred necklace position.", "Measure around the neck with a soft tape.", "Add space for the fit you prefer.", "Compare the measurement with the guide."],
  },
  Bracelets: {
    introduction: "Measure your wrist where the bracelet will sit, then choose the size that gives you the balance of comfort and movement you prefer.",
    note: "For a more relaxed fit, choose the next size up.",
    headers: ["ROSÉ size", "Wrist", "Fit"],
    rows: [["15 cm", "Up to 14 cm", "Close"], ["16 cm", "Up to 15 cm", "Close"], ["17 cm", "Up to 16 cm", "Comfort"], ["18 cm", "Up to 17 cm", "Comfort"]],
    measure: "Wrap a soft measuring tape around the widest part of your wrist without pulling it tight. Use that measurement to select the fit you prefer.",
    steps: ["Relax your hand and wrist.", "Wrap the tape around the wrist.", "Record the exact circumference.", "Choose a close or comfortable fit."],
  },
};

const categorySingular: Record<ProductCategory, string> = { Rings: "ring", Necklaces: "necklace", Earrings: "earrings", Bracelets: "bracelet" };
const settings: Record<ProductCategory, string> = {
  Rings: "Fine claw and pavé setting",
  Necklaces: "Pendant and polished chain setting",
  Earrings: "Fine claw setting",
  Bracelets: "Articulated diamond setting",
};

function describeProduct(product: Product) {
  const detail = product.detail.charAt(0).toLowerCase() + product.detail.slice(1);
  const singular = categorySingular[product.category];
  if (product.collection === "ROSÉ Dopamine") {
    return `${product.name} brings a clear pulse of colour to the everyday. The ${detail} create an expressive composition in polished 18K gold. Refined worn alone and distinctive within a stack, this ${singular} balances playful energy with the precision of fine jewellery.`;
  }
  return `${product.name} is defined by ${detail}. Crafted in polished 18K gold, the composition places clarity, proportion and light at the centre. An enduring ${singular} with a distinctly modern presence, designed to feel considered in the everyday and exceptional for the moments that matter.`;
}

function shapeFromDetail(detail: string) {
  const shapes = [
    ["emerald", "Emerald cut"], ["marquise", "Marquise"], ["heart", "Heart cut"], ["oval", "Oval brilliant"],
    ["pear", "Pear cut"], ["cushion", "Cushion cut"], ["radiant", "Radiant cut"], ["round", "Round brilliant"],
  ] as const;
  if (/mixed cuts/i.test(detail)) return "Mixed cuts";
  const found = shapes.filter(([key]) => detail.toLowerCase().includes(key)).map(([, label]) => label);
  return found.length ? [...new Set(found)].join(" and ") : "Round brilliant";
}

function stoneFromProduct(product: Product) {
  if (product.collection === "ROSÉ Dopamine") return product.detail.replace(/^./, (letter) => letter.toUpperCase());
  if (product.colours.includes("Pink")) return "Pink and colourless diamonds";
  if (product.colours.includes("Yellow")) return "Yellow and colourless diamonds";
  return "Diamond";
}

function relatedFor(product: Product, products: Product[]) {
  return products
    .filter((item) => item.id !== product.id)
    .map((item) => ({ item, score: Number(item.category === product.category) * 2 + Number(item.collection === product.collection) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item);
}

const BagIcon = () => <img className="ui-bag" src={assetPath("icons/shopping-bag.svg")} alt="" aria-hidden="true" />;

function BrandLogo() {
  return <span className="brand-logo" aria-hidden="true"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="" /></span>;
}

function ProductAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="pdp-accordion"><summary><span>{title}</span><i aria-hidden="true" /></summary><div className="pdp-accordion-content">{children}</div></details>;
}

const formatPrice = (price: number) => `$${price.toLocaleString("en-US")}`;
const diamondLabel = (diamond: StorefrontDiamondType) => diamond === "natural" ? "Natural" : "Laboratory-grown";

export default function ProductDetailView({ productId = "pink-bloom" }: { productId?: string }) {
  const { products, ready: catalogReady } = useStorefrontCatalogState();
  const requestedProduct = products.find((item) => item.id === productId);
  const product = requestedProduct ?? products[0];
  const commerce = useClientCommerce();
  const relatedProducts = useMemo(() => relatedFor(product, products), [product, products]);
  const defaultSelection = selections[product.category];
  const selection = defaultSelection && (product.sizes?.length ?? defaultSelection.options.length) > 0
    ? { ...defaultSelection, options: product.sizes?.length ? product.sizes : defaultSelection.options }
    : undefined;
  const guide = guides[product.category];
  const [navPanel, setNavPanel] = useState<"shop" | "world" | "search" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<"find" | "measure">("find");
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedDiamondType, setSelectedDiamondType] = useState<StorefrontDiamondType | "">("");
  const [selectedCarat, setSelectedCarat] = useState("");
  const [openChoice, setOpenChoice] = useState<"diamond" | "carat" | null>(null);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = navPanel || bagOpen || conciergeOpen || sizeGuideOpen ? "hidden" : "";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavPanel(null); setBagOpen(false); setConciergeOpen(false); setSizeGuideOpen(false); setSizeMenuOpen(false); }
    };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [navPanel, bagOpen, conciergeOpen, sizeGuideOpen]);

  useEffect(() => {
    const closeSizePicker = (event: PointerEvent) => {
      if (!sizePickerRef.current?.contains(event.target as Node)) setSizeMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeSizePicker);
    return () => document.removeEventListener("pointerdown", closeSizePicker);
  }, []);

  useEffect(() => {
    // Product navigation resets a configuration that belongs to the previous piece.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDiamondType("");
    setSelectedCarat("");
    setSelectedSize("");
    setOpenChoice(null);
    setAdded(false);
    setActiveImage(0);
  }, [product.id]);

  const diamondTypeOptions = [...(product.diamondTypes ?? [])]
    .sort((left, right) => Number(left === "natural") - Number(right === "natural"));
  const caratOptions = product.caratOptions ?? [];

  useEffect(() => {
    // Published option edits can invalidate an open customer selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDiamondType((current) => current && !(product.diamondTypes ?? []).includes(current) ? "" : current);
    setSelectedCarat((current) => current && !(product.caratOptions ?? []).some((option) => option.id === current) ? "" : current);
    const availableSizes = product.sizes?.length ? product.sizes : defaultSelection?.options ?? [];
    setSelectedSize((current) => current && !availableSizes.includes(current) ? "" : current);
    setAdded(false);
  }, [defaultSelection, product.caratOptions, product.diamondTypes, product.sizes]);

  const hasDiamondConfiguration = diamondTypeOptions.length > 0;
  const hasCaratConfiguration = caratOptions.length > 0;
  const hasConfiguration = hasDiamondConfiguration || hasCaratConfiguration;
  const configurationComplete = (!hasDiamondConfiguration || Boolean(selectedDiamondType)) && (!hasCaratConfiguration || Boolean(selectedCarat));
  const configuredVariantKey = variantPriceKey(selectedDiamondType || null, selectedCarat || null, hasConfiguration);
  const configuredPrice = configurationComplete ? product.variantPrices?.[configuredVariantKey] ?? (hasConfiguration ? null : product.price) : null;
  const canPurchase = configurationComplete && Boolean(configuredPrice);
  const displayedPrice = configuredPrice ? formatPrice(configuredPrice) : product.priceLabel;

  const addToBag = () => {
    if ((selection && !selectedSize) || !canPurchase || added) return;
    const option = [
      selectedDiamondType ? `${diamondLabel(selectedDiamondType)} diamond` : "",
      selectedCarat ? caratOptions.find((item) => item.id === selectedCarat)?.label : "",
      selectedSize,
    ].filter(Boolean).join(" · ");
    commerce.addToBag(product.id, option || undefined, configuredPrice || undefined);
    setAdded(true);
  };

  const updateMobileGallery = () => {
    const gallery = mobileGalleryRef.current;
    if (!gallery) return;
    const index = Math.round(gallery.scrollLeft / Math.max(gallery.clientWidth, 1));
    setActiveImage(Math.max(0, Math.min(galleryImages.length - 1, index)));
  };

  const galleryImages = product.images?.length ? product.images.map((image) => ({ src: image.src, alt: image.altText })) : [
    { src: product.primary, alt: `${product.name} ${categorySingular[product.category]}, product view` },
    ...(product.secondary !== product.primary ? [{ src: product.secondary, alt: `${product.name} ${categorySingular[product.category]} worn` }] : []),
  ];

  const configuredCaratLabel = caratOptions.find((item) => item.id === selectedCarat)?.label;
  const adminSpecs = product.facts?.filter((fact) => fact.label.trim() && fact.value.trim()).map((fact) => [
    fact.label,
    fact.label.trim().toLowerCase() === "stone" && selectedDiamondType ? `${diamondLabel(selectedDiamondType)} diamond` : fact.value,
  ] as [string, string]);
  const specs: [string, string][] = adminSpecs?.length ? [
    ...adminSpecs,
    ...(configuredCaratLabel && !adminSpecs.some(([term]) => /carat/i.test(term)) ? [["Carat weight", configuredCaratLabel] as [string, string]] : []),
    ...(product.collection && !adminSpecs.some(([term]) => term.trim().toLowerCase() === "collection") ? [["Collection", product.collection] as [string, string]] : []),
  ] : [
    ["Stone", selectedDiamondType ? `${diamondLabel(selectedDiamondType)} diamond` : stoneFromProduct(product)],
    ...(configuredCaratLabel ? [["Carat weight", configuredCaratLabel] as [string, string]] : []),
    ["Shape", shapeFromDetail(product.detail)],
    ["Metal", product.metals.map((metal) => `18K ${metal.toLowerCase()}`).join(" / ")],
    ["Setting", settings[product.category]],
    ...(product.collection ? [["Collection", product.collection] as [string, string]] : []),
  ];

  if (!requestedProduct && catalogReady) {
    return <main className="utility-page"><section className="utility-empty"><p className="micro-label">Catalogue</p><h1>This piece is not currently available.</h1><p>It may still be in draft or have been removed from the published collection.</p><a className="button button-dark" href="/collections/all-jewellery">Explore jewellery</a></section><SiteFooter /></main>;
  }

  return (
    <main className="pdp-page">
      <header className="site-header pdp-header">
        <button className="mobile-menu-trigger" aria-label="Open menu" onClick={() => setNavPanel("shop")}><span /><span /><span /></button>
        <nav className="desktop-nav desktop-nav-left" aria-label="Primary navigation"><button onClick={() => setNavPanel("shop")}>Shop</button><button onClick={() => setNavPanel("world")}>Our World</button><button onClick={() => setNavPanel("search")}>Search</button></nav>
        <a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a>
        <nav className="desktop-nav desktop-nav-right" aria-label="Client navigation"><button onClick={() => setConciergeOpen(true)}>Concierge</button><a href="#pdp-details">My Account</a><a href="/wishlist">Wishlist <sup>{commerce.wishlistCount}</sup></a><button onClick={() => setBagOpen(true)}>Bag <sup>{commerce.bagCount}</sup></button></nav>
        <button className="mobile-bag" aria-label={`Shopping bag, ${commerce.bagCount} items`} onClick={() => setBagOpen(true)}><BagIcon /><sup>{commerce.bagCount}</sup></button>
      </header>

      <section className="pdp-main" aria-labelledby="pdp-title">
        <div className="pdp-gallery-desktop" aria-label="Product gallery">{galleryImages.map((image, index) => <figure className="pdp-media" key={image.src}><img src={assetPath(image.src)} alt={image.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" /></figure>)}</div>

        <div className="pdp-gallery-mobile-wrap">
          <div className="pdp-gallery-mobile" ref={mobileGalleryRef} onScroll={updateMobileGallery}>{galleryImages.map((image, index) => <figure className="pdp-mobile-slide" key={image.src}><img src={assetPath(image.src)} alt={image.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" /></figure>)}</div>
          <span className="pdp-image-count" aria-live="polite">{String(activeImage + 1).padStart(2, "0")} / {String(galleryImages.length).padStart(2, "0")}</span>
          <div className="pdp-image-dots" aria-hidden="true">{galleryImages.map((image, index) => <i className={activeImage === index ? "is-active" : ""} key={image.src} />)}</div>
        </div>

        <aside className="pdp-info-column" id="pdp-details">
          <div className="pdp-info-panel">
            <div className="pdp-title-row"><h1 id="pdp-title">{product.name}</h1><button className={`pdp-wishlist${commerce.wishlist.has(product.id) ? " is-active" : ""}`} type="button" onClick={() => commerce.toggleWishlist(product.id)} aria-pressed={commerce.wishlist.has(product.id)} aria-label={commerce.wishlist.has(product.id) ? `Remove ${product.name} from wish list` : `Add ${product.name} to wish list`}><span className="wishlist-heart-icon" aria-hidden="true" style={{ WebkitMaskImage: `url("${assetPath(commerce.wishlist.has(product.id) ? "icons/wishlist-heart-filled.svg" : "icons/wishlist-heart.svg")}")`, maskImage: `url("${assetPath(commerce.wishlist.has(product.id) ? "icons/wishlist-heart-filled.svg" : "icons/wishlist-heart.svg")}")` }} /></button></div>
            <p className="pdp-price" aria-live="polite">{displayedPrice}</p>
            <p className="pdp-description">{product.fullDescription || describeProduct(product)}</p>

            {hasConfiguration && <div className="pdp-configurator" aria-label="Configure your diamond">
              {hasDiamondConfiguration &&
              <section className={`pdp-choice-panel${openChoice === "diamond" ? " is-open" : ""}`}>
                <button className="pdp-choice-summary" type="button" aria-expanded={openChoice === "diamond"} aria-controls="pdp-diamond-options" onClick={() => setOpenChoice((current) => current === "diamond" ? null : "diamond")}>
                  <span><small>Diamond type</small><strong>{selectedDiamondType ? diamondLabel(selectedDiamondType) : "Select your diamond"}</strong></span><i aria-hidden="true" />
                </button>
                {openChoice === "diamond" && <div className="pdp-choice-content pdp-diamond-options" id="pdp-diamond-options">
                  <div>{diamondTypeOptions.map((option) => <button className={selectedDiamondType === option ? "is-active" : ""} type="button" aria-pressed={selectedDiamondType === option} key={option} onClick={() => { setSelectedDiamondType(option); setSelectedCarat(""); setAdded(false); setOpenChoice(hasCaratConfiguration ? "carat" : null); }}><strong>{diamondLabel(option)}</strong></button>)}</div>
                  <a className="pdp-diamond-guide" href="/policies/ethical-sourcing">Not sure which to choose? Compare diamond types</a>
                </div>}
              </section>}

              {hasCaratConfiguration && <section className={`pdp-choice-panel${openChoice === "carat" ? " is-open" : ""}${hasDiamondConfiguration && !selectedDiamondType ? " is-locked" : ""}`}>
                <button className="pdp-choice-summary" type="button" disabled={hasDiamondConfiguration && !selectedDiamondType} aria-expanded={openChoice === "carat"} aria-controls="pdp-carat-options" onClick={() => setOpenChoice((current) => current === "carat" ? null : "carat")}>
                  <span><small>Carat weight</small><strong>{configuredCaratLabel || (hasDiamondConfiguration && !selectedDiamondType ? "Choose diamond type first" : "Select carat weight")}</strong></span><i aria-hidden="true" />
                </button>
                {openChoice === "carat" && (!hasDiamondConfiguration || selectedDiamondType) && <div className="pdp-choice-content pdp-carat-options" id="pdp-carat-options">
                  {caratOptions.map((carat) => {
                    const priceKey = variantPriceKey(selectedDiamondType || null, carat.id);
                    const optionPrice = product.variantPrices?.[priceKey];
                    return <button className={selectedCarat === carat.id ? "is-active" : ""} type="button" aria-pressed={selectedCarat === carat.id} key={carat.id} onClick={() => { setSelectedCarat(carat.id); setAdded(false); setOpenChoice(null); }}><strong>{carat.label}</strong>{optionPrice && <small>{formatPrice(optionPrice)}</small>}</button>;
                  })}
                </div>}
              </section>}
            </div>}

            {selection && <div className="pdp-size-block">
              <div className="pdp-size-label"><span>{selection.label}</span><button type="button" onClick={() => { setSizeMenuOpen(false); setSizeGuideOpen(true); }}>Size guide</button></div>
              <div className={`pdp-size-picker${sizeMenuOpen ? " is-open" : ""}`} ref={sizePickerRef}>
                <button className="pdp-size-trigger" type="button" aria-expanded={sizeMenuOpen} aria-controls="pdp-size-menu" onClick={() => setSizeMenuOpen((open) => !open)}><span>{selectedSize || selection.placeholder}</span><i aria-hidden="true" /></button>
                {sizeMenuOpen && <div className="pdp-size-menu" id="pdp-size-menu" role="listbox" aria-label={selection.ariaLabel}>{selection.options.map((option) => <button className={selectedSize === option ? "is-active" : ""} type="button" role="option" aria-selected={selectedSize === option} onClick={() => { setSelectedSize(option); setAdded(false); setSizeMenuOpen(false); }} key={option}>{option}</button>)}</div>}
              </div>
            </div>}

            <button className={`pdp-add${added ? " is-added" : ""}`} type="button" disabled={Boolean((selection && !selectedSize) || !canPurchase)} onClick={addToBag}>{added ? "ADDED TO BAG" : "ADD TO BAG"}</button>
            <p className="pdp-service-note">Complimentary insured delivery{selection ? " · Personal sizing support" : " · Personal concierge support"}</p>

            <dl className="pdp-specs">{specs.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>

            <div className="pdp-accordions pdp-service-accordions">
              <ProductAccordion title="Certification & sourcing"><p>ROSÉ works with both natural and laboratory-grown diamonds. Natural diamonds are accompanied by GIA documentation where applicable; laboratory-grown diamonds are accompanied by IGI documentation where applicable.</p><div className="pdp-certifications" aria-label="Certification laboratories"><span>GIA</span><span>IGI</span></div><a className="pdp-policy-link" href="/policies/ethical-sourcing">Read our Ethical Sourcing Policy</a></ProductAccordion>
              <ProductAccordion title="Delivery & returns"><p>Your piece is delivered fully insured. Timing, destination availability and any applicable duties are confirmed during checkout or by our concierge.</p><a className="pdp-policy-link" href="/policies/delivery-and-returns">Read our Delivery &amp; Returns Policy</a></ProductAccordion>
            </div>
          </div>
        </aside>
      </section>

      <section className="pdp-related" aria-labelledby="related-title">
        <div className="pdp-related-head"><h2 id="related-title">You may also like</h2></div>
        <div className="catalog-grid catalog-grid-compact pdp-related-grid">{relatedProducts.map((item) => <article className="catalog-card" key={item.id}><div className="catalog-card-media"><img className="catalog-card-primary" src={assetPath(item.primary)} alt={item.name} loading="lazy" decoding="async" /><img className="catalog-card-secondary" src={assetPath(item.secondary)} alt={`${item.name} worn`} loading="lazy" decoding="async" /><a className="catalog-card-pdp-link" href={`/products/${item.id}`} aria-label={`View ${item.name}`} /></div><div className="catalog-card-copy"><div className="catalog-card-heading"><h2><a href={`/products/${item.id}`}>{item.name}</a></h2><strong>{item.priceLabel}</strong></div><p>{item.detail}</p></div></article>)}</div>
      </section>

      <SiteFooter />

      {navPanel && <div className="nav-overlay" role="dialog" aria-modal="true" aria-label={`${navPanel} menu`}><button className="nav-backdrop" onClick={() => setNavPanel(null)} aria-label="Close menu" /><div className="nav-sheet nav-sheet-left"><div className="nav-sheet-top"><LeftNavigationHeader active={navPanel} onSelect={setNavPanel} onClose={() => setNavPanel(null)} /><button className="nav-close" onClick={() => setNavPanel(null)} aria-label="Close menu"><span /><span /></button><a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a><button className="nav-sheet-bag" onClick={() => { setNavPanel(null); setBagOpen(true); }} aria-label="Shopping bag"><BagIcon /><sup>{commerce.bagCount}</sup></button></div>{navPanel === "shop" ? <ShopNavigation className="catalog-nav-shop" onNavigate={() => setNavPanel(null)} /> : navPanel === "world" ? <WorldNavigation onNavigate={() => setNavPanel(null)} /> : <NavigationSearch onNavigate={() => setNavPanel(null)} />}</div></div>}

      {bagOpen && <BagDrawer items={commerce.bag} onClose={() => setBagOpen(false)} onQuantity={commerce.setQuantity} onRemove={commerce.removeFromBag} />}
      {conciergeOpen && <ConciergeDrawer onClose={() => setConciergeOpen(false)} />}

      {sizeGuideOpen && guide && selection && <div className="size-guide-layer" role="dialog" aria-modal="true" aria-labelledby="size-guide-title"><button className="size-guide-backdrop" type="button" aria-label="Close size guide" onClick={() => setSizeGuideOpen(false)} /><aside className="size-guide-drawer"><header><h2 id="size-guide-title">{selection.guideTitle}</h2><button className="nav-close" type="button" onClick={() => setSizeGuideOpen(false)} aria-label="Close size guide"><span /><span /></button></header><div className="size-guide-tabs" role="tablist"><button className={sizeGuideTab === "find" ? "is-active" : ""} type="button" role="tab" aria-selected={sizeGuideTab === "find"} onClick={() => setSizeGuideTab("find")}>Find your size</button><button className={sizeGuideTab === "measure" ? "is-active" : ""} type="button" role="tab" aria-selected={sizeGuideTab === "measure"} onClick={() => setSizeGuideTab("measure")}>How to measure</button></div><div className="size-guide-body">{sizeGuideTab === "find" ? <><p>{guide.introduction}</p><p className="size-guide-contact">For personal guidance, our jewellery specialists will be happy to help. <a href="/#concierge">Contact us</a></p><h3>Size chart</h3><small>{guide.note}</small><div className={`size-guide-table size-guide-table-${guide.headers.length}`} role="table" aria-label={`${selection.label} guide`}><div className="size-guide-table-head" role="row">{guide.headers.map((header) => <b key={header}>{header}</b>)}</div>{guide.rows.map((row) => <div role="row" key={row.join("-")}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></> : <><p>{guide.measure}</p><p className="size-guide-contact">If you are between sizes or would prefer personal assistance, <a href="/#concierge">contact us</a>.</p><ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol></>}</div></aside></div>}
    </main>
  );
}
