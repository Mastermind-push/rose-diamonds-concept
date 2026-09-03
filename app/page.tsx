"use client";

import { useEffect, useMemo, useState } from "react";
import SiteFooter from "@/components/site-footer";
import { useClientCommerce } from "@/components/client-commerce";
import { BagDrawer, ConciergeDrawer } from "@/components/client-drawers";
import { LeftNavigationHeader, ShopNavigation, WorldNavigation } from "@/components/navigation-menus";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const ArrowIcon = () => <img className="ui-arrow" src={assetPath("icons/arrow-up-right.svg")} alt="" aria-hidden="true" />;
const BagIcon = () => <img className="ui-bag" src={assetPath("icons/shopping-bag.svg")} alt="" aria-hidden="true" />;
const MenuArrowIcon = () => <img className="menu-arrow" src={assetPath("icons/menu-arrow-right.svg")} alt="" aria-hidden="true" />;

function BrandLogo({ inverse = false }: { inverse?: boolean }) {
  return <span className={`brand-logo${inverse ? " is-inverse" : ""}`} aria-hidden="true"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="" /></span>;
}

type Panel = "shop" | "world" | "search" | "bag" | "account" | "concierge" | "mobile" | null;

const products = [
  { name: "Oval Blush Ring", detail: "18K white gold · Pink diamond", image: assetPath("images/rose-hero.webp") },
  { name: "Diamond Line Bracelet", detail: "18K white gold · Diamonds", image: assetPath("images/rose-bracelet.webp") },
  { name: "Azure Light Studs", detail: "18K white gold · Diamonds", image: assetPath("images/rose-earrings.webp") },
  { name: "Barely There Pendant", detail: "18K white gold · Diamond", image: assetPath("images/rose-necklace.webp") },
];

const searchable = [
  { label: "Our Selection", target: "#rose-edit" },
  { label: "All Jewellery", target: "/collections/all-jewellery" },
  { label: "ROSÉ Dopamine", target: "/collections/rose-dopamine" },
  { label: "Rings", target: "/collections/rings" },
  { label: "Necklaces", target: "/collections/necklaces" },
  { label: "Earrings", target: "/collections/earrings" },
  { label: "Bracelets", target: "/collections/bracelets" },
  { label: "Design Your Piece", target: "/design-your-piece" },
  { label: "Our Philosophy", target: "/our-philosophy" },
  { label: "Concierge", target: "#concierge" },
];

function Placeholder({ label, ratio, className = "" }: { label: string; ratio: string; className?: string }) {
  return <div className={`image-placeholder ${className}`}><span>{label}</span><small>{ratio}</small></div>;
}

export default function Home() {
  const commerce = useClientCommerce();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchable.slice(0, 5);
    return searchable.filter((item) => item.label.toLowerCase().includes(query));
  }, [searchQuery]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activePanel ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setActivePanel(null);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activePanel]);

  const closePanel = () => setActivePanel(null);

  return (
    <main>
      <header className={`site-header hero-header ${scrolled ? "is-scrolled" : ""}`}>
        <button className="mobile-menu-trigger" aria-label="Open menu" aria-expanded={activePanel === "mobile"} onClick={() => setActivePanel("mobile")}>
          <span /><span /><span />
        </button>

        <nav className="desktop-nav desktop-nav-left" aria-label="Primary navigation">
          <button onClick={() => setActivePanel(activePanel === "shop" ? null : "shop")} aria-expanded={activePanel === "shop"}>Shop</button>
          <button onClick={() => setActivePanel(activePanel === "world" ? null : "world")} aria-expanded={activePanel === "world"}>Our World</button>
          <button onClick={() => setActivePanel("search")}>Search</button>
        </nav>

        <a className="wordmark" href="#top" aria-label="ROSÉ Diamonds home"><BrandLogo inverse={!scrolled} /></a>

        <nav className="desktop-nav desktop-nav-right" aria-label="Client navigation">
          <button onClick={() => setActivePanel("concierge")}>Concierge</button>
          <button onClick={() => setActivePanel("account")}>My Account</button>
          <a href="/wishlist">Wishlist <sup>{commerce.wishlistCount}</sup></a>
          <button onClick={() => setActivePanel("bag")} aria-label="Shopping bag">Bag <sup>{commerce.bagCount}</sup></button>
        </nav>

        <button className="mobile-bag" aria-label="Shopping bag" onClick={() => setActivePanel("bag")}><BagIcon /><sup>{commerce.bagCount}</sup></button>
      </header>

      <section id="top" className="hero hero-editorial">
        <picture className="hero-media">
          <img src={assetPath("images/rose-hero-editorial.avif")} alt="A woman wearing diamond jewellery against deep teal and burgundy velvet" fetchPriority="high" decoding="async" />
        </picture>
        <div className="hero-overlay" />
        <div className="hero-copy">
          <h1>Diamonds<br />that ref{"\u200C"}lect you.</h1>
          <a className="button button-outline-light" href="/collections/all-jewellery">Explore jewellery</a>
        </div>
      </section>

      <section id="rose-edit" className="section most-wanted">
        <div className="section-intro row-intro">
          <h2>Our Selection</h2>
          <a className="underlined-link" href="/collections/all-jewellery">View all jewellery <ArrowIcon /></a>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <a className="product-image" href="#concierge"><img src={product.image} alt={product.name} loading="lazy" decoding="async" /></a>
              <a className="product-info" href="#concierge"><h3>{product.name}</h3><p>{product.detail}</p></a>
            </article>
          ))}
        </div>
      </section>

      <section id="categories" className="section category-section">
        <div className="section-intro"><p className="micro-label">Explore jewellery</p><h2>Find your piece.</h2></div>
        <div className="category-editorial-grid">
          <a className="category-tile category-rings" href="/collections/rings">
            <div className="category-media"><img src={assetPath("images/find-your-piece-rings.jpg")} alt="A model wearing a pink diamond ring" loading="lazy" decoding="async" /></div>
            <span><b>Rings</b><small>Discover</small></span>
          </a>
          <a className="category-tile category-necklaces" href="/collections/necklaces">
            <div className="category-media"><img src={assetPath("images/find-your-piece-necklaces.jpg")} alt="A diamond pendant worn at the collarbone" loading="lazy" decoding="async" /></div>
            <span><b>Necklaces</b><small>Discover</small></span>
          </a>
          <a className="category-tile category-earrings" href="/collections/earrings">
            <div className="category-media"><img src={assetPath("images/find-your-piece-earrings.jpg")} alt="A model wearing the Rosé Queen of Hearts Earring" loading="lazy" decoding="async" /></div>
            <span><b>Earrings</b><small>Discover</small></span>
          </a>
          <a className="category-tile category-bracelets" href="/collections/bracelets">
            <div className="category-media"><img src={assetPath("images/find-your-piece-bracelets.jpg")} alt="A diamond tennis bracelet worn on the wrist" loading="lazy" decoding="async" /></div>
            <span><b>Bracelets</b><small>Discover</small></span>
          </a>
        </div>
      </section>

      <div className="dopamine-chapter">
        <section id="dopamine" className="collection-story section-wide">
          <div className="collection-heading">
            <div><p className="micro-label accent-label">New collection</p><h2 className="pink-texture-title" style={{ backgroundImage: `url(${assetPath("images/pink-diamond-texture.avif")})` }}>Diamonds with a pulse.</h2></div>
            <div className="collection-copy"><p>Diamond rings charged with colour, character and energy.</p><a className="underlined-link" href="/collections/rose-dopamine">Discover ROSÉ Dopamine <ArrowIcon /></a></div>
          </div>
          <Placeholder className="collection-hero-placeholder" label="ROSÉ DOPAMINE — CAMPAIGN IMAGE" ratio="Desktop 16:9 · Mobile 4:5" />
        </section>

        <section id="stacking" className="section stack-editorial">
          <figure className="stack-visual"><img src={assetPath("images/shop-the-stack.webp")} alt="A hand wearing a colourful stack of ROSÉ diamond rings" loading="lazy" decoding="async" /></figure>
          <div className="stack-content">
            <p className="micro-label">The art of stacking</p>
            <h2>Wear one.<br />Stack your favourites.</h2>
            <p>Each ROSÉ Dopamine ring is a finished design, created to look complete on its own and effortless alongside the others. Choose a single colour statement or combine your favourites into a stack that feels entirely your own.</p>
            <a className="button button-dark" href="/collections/rose-dopamine">Explore the collection</a>
          </div>
        </section>
      </div>

      <section id="design-your-piece" className="design-story section-wide" style={{ backgroundImage: `url(${assetPath("images/design-your-piece-texture.jpg")})` }}>
        <div className="design-grid">
          <div className="design-content">
            <div className="design-heading"><p className="micro-label">Design Your Piece</p><h2>Make it<br />unmistakably yours.</h2></div>
            <div className="design-copy">
              <p>From the first conversation to the final setting, every decision begins with your story. Choose a stone, refine the proportions and create a piece that could belong to no one else.</p>
              <a className="button button-outline-light" href="/design-your-piece">Discover the process</a>
            </div>
          </div>
          <Placeholder className="design-main-placeholder" label="BESPOKE COMMISSION — PRIMARY IMAGE" ratio="4:5" />
        </div>
      </section>

      <section id="our-world" className="world-pause">
        <p className="micro-label">Our World</p>
        <blockquote>Jewellery for every version of you.</blockquote>
        <p>Born in Hong Kong. Shaped by contrast, colour and a belief that fine jewellery should feel deeply personal.</p>
        <button className="underlined-link" onClick={() => setActivePanel("world")}>Enter our world <ArrowIcon /></button>
      </section>

      <section id="worn-your-way" className="worn-your-way section">
        <div className="section-intro row-intro"><div><p className="micro-label">ROSÉ in the wild</p><h2>Worn your way.</h2></div><p>Real women, real stacks, real energy.</p></div>
        <div className="social-grid"><Placeholder label="SOCIAL IMAGE 01" ratio="4:5" /><Placeholder label="SOCIAL IMAGE 02" ratio="4:5" /><Placeholder label="SOCIAL IMAGE 03" ratio="4:5" /></div>
      </section>

      <section id="concierge" className="concierge">
        <picture className="concierge-media">
          <source media="(max-width: 700px)" srcSet={assetPath("images/private-concierge-mobile.webp")} type="image/webp" />
          <img src={assetPath("images/private-concierge-desktop.webp")} alt="A private diamond ring consultation" loading="lazy" decoding="async" />
        </picture>
        <div className="concierge-shade" />
        <div className="concierge-content">
          <p className="micro-label">Concierge</p>
          <h2>Need a little<br />help choosing?</h2>
          <p>Talk to a ROSÉ specialist about stones, sizing, styling or a piece made entirely for you.</p>
          <div><a className="button button-light" href="/consultation">Consultation</a><a className="underlined-link light-link" href="https://wa.me/85292270884">Chat on WhatsApp <ArrowIcon /></a></div>
        </div>
      </section>

      <SiteFooter />

      {activePanel && activePanel !== "bag" && activePanel !== "concierge" && (
        <div className={`nav-overlay nav-overlay-${activePanel}`} role="dialog" aria-modal="true" aria-label={`${activePanel} menu`}>
          <button className="nav-backdrop" onClick={closePanel} aria-label="Close menu" />
          <div className={`nav-sheet${activePanel === "shop" || activePanel === "world" || activePanel === "search" ? " nav-sheet-left" : ""}`}>
            <div className="nav-sheet-top">
              {(activePanel === "shop" || activePanel === "world" || activePanel === "search") && <LeftNavigationHeader active={activePanel} onSelect={setActivePanel} onClose={closePanel} />}
              <button className="nav-close" onClick={closePanel} aria-label="Close menu"><span /><span /></button>
              <a className="wordmark" href="#top" onClick={closePanel} aria-label="ROSÉ Diamonds home"><BrandLogo /></a>
              <button className="nav-sheet-bag" onClick={() => setActivePanel("bag")} aria-label="Shopping bag"><BagIcon /><sup>{commerce.bagCount}</sup></button>
            </div>

            {(activePanel === "shop" || activePanel === "mobile") && (
              <ShopNavigation onNavigate={closePanel} />
            )}

            {activePanel === "world" && (
              <WorldNavigation onNavigate={closePanel} />
            )}

            {activePanel === "search" && (
              <div className="nav-search-layout"><label htmlFor="site-search">What are you looking for?</label><div><input id="site-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search jewellery, collections and services" /><span>{searchResults.length} results</span></div><nav><small>{searchQuery ? "Results" : "Quick links"}</small>{searchResults.length ? searchResults.map((item) => <a href={item.target} onClick={closePanel} key={item.label}>{item.label}</a>) : <p>No matching pieces yet. Try “rings” or “Dopamine”.</p>}</nav></div>
            )}

            {activePanel === "account" && <div id="account" className="nav-account-layout"><small>My Account</small><h3>Welcome to ROSÉ.</h3><form onSubmit={(event) => event.preventDefault()}><label>Email<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><button className="button button-dark" type="submit">Sign in</button></form><button className="underlined-link" onClick={closePanel}>Create an account</button></div>}

            {activePanel === "mobile" && <div className="nav-mobile-secondary"><button onClick={() => setActivePanel("world")}>Our World <MenuArrowIcon /></button><button onClick={() => setActivePanel("search")}>Search <MenuArrowIcon /></button><button onClick={() => setActivePanel("concierge")}>Concierge <MenuArrowIcon /></button><a href="/wishlist">Wishlist ({commerce.wishlistCount}) <MenuArrowIcon /></a></div>}
          </div>
        </div>
      )}
      {activePanel === "bag" && <BagDrawer items={commerce.bag} onClose={closePanel} onQuantity={commerce.setQuantity} onRemove={commerce.removeFromBag} />}
      {activePanel === "concierge" && <ConciergeDrawer onClose={closePanel} />}
    </main>
  );
}
