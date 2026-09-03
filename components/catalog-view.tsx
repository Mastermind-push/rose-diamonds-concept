"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import { catalogConfigs, type CatalogSlug, type Product } from "@/data/catalog";
import SiteFooter from "@/components/site-footer";
import { useClientCommerce } from "@/components/client-commerce";
import { BagDrawer, ConciergeDrawer } from "@/components/client-drawers";
import { LeftNavigationHeader, ShopNavigation, WorldNavigation } from "@/components/navigation-menus";
import { useStorefrontCatalog } from "@/components/use-storefront-catalog";

const assetPath = (path: string) => /^(?:blob:|data:|https?:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const BagIcon = () => <img className="ui-bag" src={assetPath("icons/shopping-bag.svg")} alt="" aria-hidden="true" />;

function BrandLogo() {
  return <span className="brand-logo" aria-hidden="true"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="" /></span>;
}

const PRICE_FILTERS = [
  { id: "under-1500", label: "Under $1,500", matches: (price: number) => price < 1500 },
  { id: "1500-2500", label: "$1,500–$2,500", matches: (price: number) => price >= 1500 && price <= 2500 },
  { id: "2500-5000", label: "$2,500–$5,000", matches: (price: number) => price > 2500 && price <= 5000 },
  { id: "over-5000", label: "$5,000+", matches: (price: number) => price > 5000 },
];

type FilterKey = "category" | "collection" | "metal" | "colour" | "price";
type Filters = Record<FilterKey, string[]>;
type NavPanel = "shop" | "world" | "search" | "bag" | "account" | "concierge" | null;

const emptyFilters: Filters = { category: [], collection: [], metal: [], colour: [], price: [] };

const featuredOrder = [
  "pink-bloom", "pink-emerald-three-stone", "tennis-necklace", "round-studs",
  "blue-lagoon", "slim-tennis-bracelet", "pink-heart-halo", "queen-hearts-pendant",
  "secret-garden", "toi-et-moi-classic", "emerald-halo-studs", "emerald-tennis-bracelet",
  "golden-hour", "oval-solitaire", "queen-hearts-necklace", "pear-studs",
  "sweetheart", "pink-marquise-three-stone", "round-pendant", "signature-tennis-bracelet",
  "cherry-kiss", "toi-et-moi-pink", "cross-pendant", "queen-hearts-earrings",
  "blue-velvet", "yellow-radiant-three-stone", "emerald-halo-pendant", "oval-studs",
  "youth", "pink-oval-solitaire", "emerald-halo-ring", "heart-halo-ring", "toi-et-moi-yellow",
];

function ProductCard({
  product,
  priority = false,
  wished,
  onToggleWish,
}: {
  product: Product;
  priority?: boolean;
  wished: boolean;
  onToggleWish: () => void;
}) {
  const [selectedImage, setSelectedImage] = useState<0 | 1 | null>(null);
  const productHref = `/products/${product.id}`;

  const cycleImage = (direction: -1 | 1) => {
    setSelectedImage((current) => {
      const visibleImage = current ?? 1;
      return ((visibleImage + direction + 2) % 2) as 0 | 1;
    });
  };

  return (
    <article className="catalog-card" id={product.id}>
      <div
        className={`catalog-card-media${selectedImage === 0 ? " is-primary-selected" : selectedImage === 1 ? " is-secondary-selected" : ""}`}
        onMouseLeave={() => setSelectedImage(null)}
      >
        <img className="catalog-card-primary" src={assetPath(product.primary)} alt={product.name} loading={priority ? "eager" : "lazy"} decoding="async" />
        <img className="catalog-card-secondary" src={assetPath(product.secondary)} alt={`${product.name} worn`} loading="lazy" decoding="async" />
        <a className="catalog-card-pdp-link" href={productHref} aria-label={`View ${product.name}`} />
        {product.isNew && <span className="catalog-card-badge">New</span>}
        <div className={`catalog-card-controls${wished ? " has-wish" : ""}`}>
          <button
            className={`catalog-wishlist${wished ? " is-active" : ""}`}
            type="button"
            aria-label={wished ? `Remove ${product.name} from wish list` : `Add ${product.name} to wish list`}
            aria-pressed={wished}
            onClick={onToggleWish}
          ><span
            className="wishlist-heart-icon"
            aria-hidden="true"
            style={{
              WebkitMaskImage: `url("${assetPath(wished ? "icons/wishlist-heart-filled.svg" : "icons/wishlist-heart.svg")}")`,
              maskImage: `url("${assetPath(wished ? "icons/wishlist-heart-filled.svg" : "icons/wishlist-heart.svg")}")`,
            }}
          /></button>
          <button className="catalog-image-arrow catalog-image-arrow-prev" type="button" aria-label={`Show previous image for ${product.name}`} onClick={() => cycleImage(-1)}><span aria-hidden="true">‹</span></button>
          <button className="catalog-image-arrow catalog-image-arrow-next" type="button" aria-label={`Show next image for ${product.name}`} onClick={() => cycleImage(1)}><span aria-hidden="true">›</span></button>
        </div>
      </div>
      <div className="catalog-card-copy">
        <div className="catalog-card-heading">
          <h2><a href={productHref}>{product.name}</a></h2>
          <strong>{product.priceLabel}</strong>
        </div>
        <p>{product.detail}</p>
      </div>
    </article>
  );
}

function FilterOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className="catalog-filter-option"><input type="checkbox" checked={checked} onChange={onChange} /><span>{label}</span><i aria-hidden="true" /></label>;
}

function SortOption({ label, value, selected, onChange }: { label: string; value: string; selected: boolean; onChange: (value: string) => void }) {
  return <label className="catalog-filter-option"><input type="radio" name="catalog-sort" checked={selected} onChange={() => onChange(value)} /><span>{label}</span><i aria-hidden="true" /></label>;
}

export default function CatalogView({ slug }: { slug: CatalogSlug }) {
  const config = catalogConfigs[slug];
  const products = useStorefrontCatalog();
  const commerce = useClientCommerce();
  const [navPanel, setNavPanel] = useState<NavPanel>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"compact" | "editorial">("compact");
  const [visibleCount, setVisibleCount] = useState(24);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.body.style.overflow = filterOpen || navPanel ? "hidden" : "";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setFilterOpen(false); setNavPanel(null); }
    };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [filterOpen, navPanel]);

  const baseProducts = useMemo(() => products.filter((product) => {
    if ("category" in config && config.category && product.category !== config.category) return false;
    if ("collection" in config && config.collection && product.collection !== config.collection) return false;
    if ("newOnly" in config && config.newOnly && !product.isNew) return false;
    if ("productIds" in config && config.productIds && !config.productIds.includes(product.id)) return false;
    return true;
  }), [config, products]);

  const options = useMemo(() => ({
    categories: [...new Set(baseProducts.map((product) => product.category))],
    collections: [...new Set(baseProducts.map((product) => product.collection).filter(Boolean))],
    metals: [...new Set(baseProducts.flatMap((product) => product.metals))],
    colours: [...new Set(baseProducts.flatMap((product) => product.colours))],
  }), [baseProducts]);

  const filteredProducts = useMemo(() => {
    const matchesAny = (selected: string[], values: string[]) => !selected.length || selected.some((item) => values.includes(item));
    const result = baseProducts.filter((product) =>
      matchesAny(filters.category, [product.category]) &&
      matchesAny(filters.collection, [product.collection]) &&
      matchesAny(filters.metal, product.metals) &&
      matchesAny(filters.colour, product.colours) &&
      (!filters.price.length || filters.price.some((id) => PRICE_FILTERS.find((range) => range.id === id)?.matches(product.price)))
    );
    if (sort === "price-low") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "newest") return [...result].sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    if (slug === "all-jewellery") return [...result].sort((a, b) => {
      const left = featuredOrder.indexOf(a.id);
      const right = featuredOrder.indexOf(b.id);
      return (left < 0 ? Number.MAX_SAFE_INTEGER : left) - (right < 0 ? Number.MAX_SAFE_INTEGER : right);
    });
    return result;
  }, [baseProducts, filters, sort, slug]);

  const activeFilters = (Object.entries(filters) as [FilterKey, string[]][]).flatMap(([key, values]) => values.map((value) => ({ key, value })));
  const searchResults = products.filter((product) => product.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6);

  const toggleFilter = (key: FilterKey, value: string) => {
    setVisibleCount(24);
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  };

  const changeSort = (value: string) => {
    setVisibleCount(24);
    setSort(value);
  };

  const chooseView = (next: "compact" | "editorial") => {
    setView(next);
  };

  return (
    <main className="catalog-page">
      <header className="site-header catalog-header">
        <button className="mobile-menu-trigger" aria-label="Open menu" onClick={() => setNavPanel("shop")}><span /><span /><span /></button>
        <nav className="desktop-nav desktop-nav-left" aria-label="Primary navigation">
          <button onClick={() => setNavPanel("shop")}>Shop</button>
          <button onClick={() => setNavPanel("world")}>Our World</button>
          <button onClick={() => setNavPanel("search")}>Search</button>
        </nav>
        <a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a>
        <nav className="desktop-nav desktop-nav-right" aria-label="Client navigation">
          <button onClick={() => setNavPanel("concierge")}>Concierge</button>
          <button onClick={() => setNavPanel("account")}>My Account</button>
          <a href="/wishlist">Wishlist <sup>{commerce.wishlistCount}</sup></a>
          <button onClick={() => setNavPanel("bag")}>Bag <sup>{commerce.bagCount}</sup></button>
        </nav>
        <button className="mobile-bag" aria-label="Shopping bag" onClick={() => setNavPanel("bag")}><BagIcon /><sup>{commerce.bagCount}</sup></button>
      </header>

      <section className="catalog-products" aria-live="polite">
        <div className="catalog-toolbar">
          <div className="catalog-view-switch" aria-label="Change catalogue view">
            <span>View:</span>
            <button className={view === "compact" ? "is-active" : ""} onClick={() => chooseView("compact")} aria-label="Compact grid"><span className="catalog-view-desktop">Four</span><span className="catalog-view-mobile">Two</span></button>
            <button className={view === "editorial" ? "is-active" : ""} onClick={() => chooseView("editorial")} aria-label="Large grid"><span className="catalog-view-desktop">Two</span><span className="catalog-view-mobile">One</span></button>
          </div>
          <h1>{config.title}</h1>
          <button className="catalog-filter-trigger" onClick={() => setFilterOpen(true)}>Filter &amp; Sort{activeFilters.length > 0 && <sup>{activeFilters.length}</sup>}</button>
        </div>

        {activeFilters.length > 0 && <div className="catalog-active-filters">{activeFilters.map(({ key, value }) => <button key={`${key}-${value}`} onClick={() => toggleFilter(key, value)}>{PRICE_FILTERS.find((item) => item.id === value)?.label || value}<span>×</span></button>)}<button className="clear-all" onClick={() => setFilters(emptyFilters)}>Clear all</button></div>}

        {filteredProducts.length ? (
          <>
            <div className={`catalog-grid catalog-grid-${view}`}>
              {filteredProducts.slice(0, visibleCount).map((product, index) => <ProductCard product={product} priority={index < 4} wished={commerce.wishlist.has(product.id)} onToggleWish={() => commerce.toggleWishlist(product.id)} key={product.id} />)}
            </div>
            {visibleCount < filteredProducts.length && <div className="catalog-load-more"><button className="button button-dark" onClick={() => setVisibleCount((count) => count + 24)}>Load more</button><span>{visibleCount} of {filteredProducts.length}</span></div>}
          </>
        ) : <div className="catalog-empty"><h2>No pieces match these filters.</h2><button className="underlined-link" onClick={() => setFilters(emptyFilters)}>Clear all filters</button></div>}
      </section>

      <section className="catalog-concierge">
        <p className="micro-label">Concierge</p>
        <h2>Looking for something<br />more personal?</h2>
        <p>Talk to a ROSÉ specialist about stones, sizing or a piece created entirely for you.</p>
        <a className="button button-light" href="/consultation">Consultation</a>
      </section>

      <SiteFooter />

      {filterOpen && <div className="catalog-drawer-layer" role="dialog" aria-modal="true" aria-label="Filter catalogue"><button className="catalog-drawer-backdrop" aria-label="Close filters" onClick={() => setFilterOpen(false)} /><aside className="catalog-filter-drawer"><div className="catalog-drawer-head"><div><span>Filter &amp; Sort</span><small>{filteredProducts.length} pieces</small></div><button className="nav-close" onClick={() => setFilterOpen(false)} aria-label="Close filters"><span /><span /></button></div><div className="catalog-filter-body">
        <details open><summary>Sort by</summary><div><SortOption label="Featured" value="featured" selected={sort === "featured"} onChange={changeSort} /><SortOption label="Newest" value="newest" selected={sort === "newest"} onChange={changeSort} /><SortOption label="Price: Low to High" value="price-low" selected={sort === "price-low"} onChange={changeSort} /><SortOption label="Price: High to Low" value="price-high" selected={sort === "price-high"} onChange={changeSort} /></div></details>
        {!("category" in config) && options.categories.length > 1 && <details open><summary>Category</summary><div>{options.categories.map((option) => <FilterOption key={option} label={option} checked={filters.category.includes(option)} onChange={() => toggleFilter("category", option)} />)}</div></details>}
        {!("collection" in config) && options.collections.length > 1 && <details open><summary>Collection</summary><div>{options.collections.map((option) => <FilterOption key={option} label={option} checked={filters.collection.includes(option)} onChange={() => toggleFilter("collection", option)} />)}</div></details>}
        {options.metals.length > 1 && <details><summary>Metal</summary><div>{options.metals.map((option) => <FilterOption key={option} label={option} checked={filters.metal.includes(option)} onChange={() => toggleFilter("metal", option)} />)}</div></details>}
        {options.colours.length > 1 && <details><summary>Stone / Colour</summary><div>{options.colours.map((option) => <FilterOption key={option} label={option} checked={filters.colour.includes(option)} onChange={() => toggleFilter("colour", option)} />)}</div></details>}
        <details><summary>Price</summary><div>{PRICE_FILTERS.map((option) => <FilterOption key={option.id} label={option.label} checked={filters.price.includes(option.id)} onChange={() => toggleFilter("price", option.id)} />)}</div></details>
      </div><div className="catalog-drawer-actions"><button className="underlined-link" onClick={() => setFilters(emptyFilters)}>Clear all</button><button className="button button-dark" onClick={() => setFilterOpen(false)}>View {filteredProducts.length} pieces</button></div></aside></div>}

      {navPanel && navPanel !== "bag" && navPanel !== "concierge" && <div className="nav-overlay" role="dialog" aria-modal="true" aria-label={`${navPanel} menu`}><button className="nav-backdrop" onClick={() => setNavPanel(null)} aria-label="Close menu" /><div className={`nav-sheet${navPanel === "shop" || navPanel === "world" || navPanel === "search" ? " nav-sheet-left" : ""}`}><div className="nav-sheet-top">{(navPanel === "shop" || navPanel === "world" || navPanel === "search") && <LeftNavigationHeader active={navPanel} onSelect={setNavPanel} onClose={() => setNavPanel(null)} />}<button className="nav-close" onClick={() => setNavPanel(null)} aria-label="Close menu"><span /><span /></button><a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a><button className="nav-sheet-bag" onClick={() => setNavPanel("bag")} aria-label="Shopping bag"><BagIcon /><sup>{commerce.bagCount}</sup></button></div>
        {navPanel === "shop" && <ShopNavigation className="catalog-nav-shop" onNavigate={() => setNavPanel(null)} />}
        {navPanel === "world" && <WorldNavigation onNavigate={() => setNavPanel(null)} />}
        {navPanel === "search" && <div className="nav-search-layout"><label htmlFor="catalog-search">What are you looking for?</label><div><input id="catalog-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jewellery" /><span>{searchResults.length} results</span></div><nav><small>Pieces</small>{searchResults.map((product) => <a href={`/products/${product.id}`} key={product.id}>{product.name}</a>)}</nav></div>}
        {navPanel === "account" && <div className="nav-account-layout"><small>My Account</small><h3>Welcome to ROSÉ.</h3><form onSubmit={(event) => event.preventDefault()}><label>Email<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><button className="button button-dark" type="submit">Sign in</button></form></div>}
      </div></div>}
      {navPanel === "bag" && <BagDrawer items={commerce.bag} onClose={() => setNavPanel(null)} onQuantity={commerce.setQuantity} onRemove={commerce.removeFromBag} />}
      {navPanel === "concierge" && <ConciergeDrawer onClose={() => setNavPanel(null)} />}
    </main>
  );
}
