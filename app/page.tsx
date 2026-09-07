"use client";

import "./home.css";
import Link from "next/link";
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
  { name: "Oval Blush Ring", detail: "18K white gold · Pink diamond", image: assetPath("images/our-selection-oval-blush-ring.webp") },
  { name: "Diamond Line Bracelet", detail: "18K white gold · Diamonds", image: assetPath("images/our-selection-diamond-line-bracelet.webp") },
  { name: "Rosé Pear Shape Studs", detail: "18K white gold · Diamonds", image: assetPath("images/our-selection-pear-shape-studs.webp") },
  { name: "Barely There Pendant", detail: "18K white gold · Diamond", image: assetPath("images/our-selection-barely-there-pendant.webp") },
];

function PhotoPlaceholder({ label, format, className = "" }: { label: string; format: string; className?: string }) {
  return <div className={`home-photo-placeholder ${className}`} role="img" aria-label={`${label}: image placeholder, ${format}`}><div><strong>{label}</strong><small>{format}</small></div></div>;
}

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

export default function Home() {
  const commerce = useClientCommerce();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchable.slice(0, 5);
    return searchable.filter((item) => item.label.toLowerCase().includes(query));
  }, [searchQuery]);

  useEffect(() => {
    const scrollPosition = () => Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
    let previousY = scrollPosition();
    let direction = 0;
    let distance = 0;
    let frame = 0;

    const updateHeader = () => {
      frame = 0;
      const currentY = scrollPosition();
      const delta = currentY - previousY;
      previousY = currentY;
      setScrolled(currentY > 24);

      // Keep navigation at the top; ignore bounce and small trackpad movements.
      if (currentY <= 96) {
        setHeaderHidden(false);
        distance = 0;
        direction = 0;
        return;
      }
      if (delta === 0) return;
      const nextDirection = Math.sign(delta);
      if (nextDirection !== direction) distance = 0;
      direction = nextDirection;
      distance += Math.abs(delta);
      if (distance >= (direction > 0 ? 20 : 8)) {
        setHeaderHidden(direction > 0);
        distance = 0;
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHeader);
    };
    frame = window.requestAnimationFrame(updateHeader);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
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
    <main className="rose-home">
      <header className={`site-header hero-header${scrolled ? " is-scrolled" : ""}${headerHidden && !activePanel ? " is-hidden" : ""}`}>
        <button className="mobile-menu-trigger" aria-label="Open menu" aria-expanded={activePanel === "mobile"} onClick={() => setActivePanel("mobile")}>
          <span /><span /><span />
        </button>

        <nav className="desktop-nav desktop-nav-left" aria-label="Primary navigation">
          <button onClick={() => setActivePanel(activePanel === "shop" ? null : "shop")} aria-expanded={activePanel === "shop"}>Shop</button>
          <button onClick={() => setActivePanel(activePanel === "world" ? null : "world")} aria-expanded={activePanel === "world"}>Our World</button>
          <button onClick={() => setActivePanel("search")}>Search</button>
        </nav>

        <a className="wordmark" href="#top" aria-label="ROSÉ Diamonds home"><BrandLogo /></a>

        <nav className="desktop-nav desktop-nav-right" aria-label="Client navigation">
          <button onClick={() => setActivePanel("concierge")}>Concierge</button>
          <button onClick={() => setActivePanel("account")}>My Account</button>
          <a href="/wishlist">Wishlist <sup>{commerce.wishlistCount}</sup></a>
          <button onClick={() => setActivePanel("bag")} aria-label="Shopping bag">Bag <sup>{commerce.bagCount}</sup></button>
        </nav>

        <button className="mobile-bag" aria-label="Shopping bag" onClick={() => setActivePanel("bag")}><BagIcon /><sup>{commerce.bagCount}</sup></button>
      </header>

      <section id="top" className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero-image"
          src={assetPath("images/rose-cherry-hero-2560.webp")}
          srcSet={`${assetPath("images/rose-cherry-hero-1600.webp")} 1600w, ${assetPath("images/rose-cherry-hero-2560.webp")} 2560w, ${assetPath("images/rose-cherry-hero-3840.webp")} 3840w`}
          sizes="(max-width: 760px) 180svh, (max-aspect-ratio: 16/9) 180svh, 100vw"
          width="5504"
          height="3072"
          alt="Colourful diamond rings arranged on a cherry branch with white blossoms against a peach-pink background"
          fetchPriority="high"
          decoding="async"
        />
        <div className="home-hero-copy">
          <p className="micro-label">ROSÉ Dopamine</p>
          <h1 id="home-title">A little colour.<br />A lot of you.</h1>
          <p>Delicate diamond rings, made to mix and stack.</p>
          <a className="button home-button" href="/collections/rose-dopamine">Discover the collection <ArrowIcon /></a>
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

      <section id="stacking" className="section home-story home-stack">
        <figure><img src={assetPath("images/shop-the-stack.webp")} alt="A hand wearing a colourful stack of ROSÉ diamond rings" loading="lazy" decoding="async" /></figure>
        <div className="home-story-copy">
          <p className="micro-label">The art of stacking</p>
          <h2>One is a feeling.<br />More is a mood.</h2>
          <p>A flash of pink. A little green. A combination only you would choose. Discover diamond rings made to be worn your way.</p>
          <a className="underlined-link" href="/collections/rose-dopamine">Find your combination <ArrowIcon /></a>
        </div>
      </section>

      <section className="home-occasions" aria-labelledby="occasions-title">
        <img className="home-meadow" src={assetPath("images/rose-meadow.webp")} alt="" loading="lazy" decoding="async" width="1920" height="2400" />
        <h2 id="occasions-title" className="sr-only">For life’s special moments</h2>
        <div className="home-occasion-grid">
          <a className="home-occasion" href="/collections/rose-signature">
            <PhotoPlaceholder label="Wedding jewellery" format="4:3" className="home-occasion-photo" />
            <h3>For your forever.</h3>
            <p>Diamonds for the day, and every day after.</p>
            <span className="underlined-link">Wedding jewellery <ArrowIcon /></span>
          </a>
          <a className="home-occasion" href="/collections/gifts">
            <PhotoPlaceholder label="Gifts" format="4:3" className="home-occasion-photo" />
            <h3>Just because. Always.</h3>
            <p>A little something that says everything.</p>
            <span className="underlined-link">Discover gifts <ArrowIcon /></span>
          </a>
        </div>
      </section>

      <section id="design-your-piece" className="section home-story home-bespoke">
        <div className="home-story-copy">
          <p className="micro-label">Design Your Piece</p>
          <h2>Some things<br />are only yours.</h2>
          <p>A stone you love. A detail that means something. Work with us to create a piece around your story, from the first sketch to the final setting.</p>
          <a className="underlined-link" href="/design-your-piece">Discover the process <ArrowIcon /></a>
        </div>
        <figure className="home-bespoke-visual">
          <PhotoPlaceholder label="Design Your Piece" format="4:5" className="home-bespoke-photo" />
        </figure>
      </section>

      <section id="worn-your-way" className="section home-worn">
        <div className="section-intro row-intro"><div><p className="micro-label">A closer look</p><h2>Worn your way.</h2></div><p>From everyday favourites to your signature piece.</p></div>
        <div className="home-worn-grid">
          <Link href="/products/pink-bloom"><PhotoPlaceholder label="Worn your way — 01" format="4:5" className="home-worn-photo" /><span>Colour, close to you. <ArrowIcon /></span></Link>
          <Link href="/products/queen-hearts-pendant"><PhotoPlaceholder label="Worn your way — 02" format="4:5" className="home-worn-photo" /><span>A little heart. <ArrowIcon /></span></Link>
          <Link href="/products/toi-et-moi-pink"><PhotoPlaceholder label="Worn your way — 03" format="4:5" className="home-worn-photo" /><span>Your kind of statement. <ArrowIcon /></span></Link>
        </div>
      </section>

      <section id="concierge" className="home-concierge section">
        <div><p className="micro-label">At your service</p><h2>Let’s find your piece.</h2></div>
        <div><p>For a question, a little guidance or something entirely your own. Your ROSÉ specialist is here.</p><div className="home-concierge-links"><a className="underlined-link" href="/consultation">Book a consultation <ArrowIcon /></a><a className="underlined-link" href="https://wa.me/85292270884">Chat on WhatsApp <ArrowIcon /></a></div></div>
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
