"use client";

import { useState } from "react";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const MenuArrowIcon = () => <img className="menu-arrow" src={assetPath("icons/menu-arrow-right.svg")} alt="" aria-hidden="true" />;

type ShopSection = "jewellery" | "collections" | null;
export type LeftNavigationPanel = "shop" | "world" | "search";

export function LeftNavigationHeader({
  active,
  onSelect,
  onClose,
}: {
  active: LeftNavigationPanel;
  onSelect: (panel: LeftNavigationPanel) => void;
  onClose: () => void;
}) {
  const items: { id: LeftNavigationPanel; label: string }[] = [
    { id: "shop", label: "Shop" },
    { id: "world", label: "Our World" },
    { id: "search", label: "Search" },
  ];

  return <nav className="nav-sheet-desktop-tabs" aria-label="Primary navigation">
    {items.map((item) => <button
      type="button"
      className={active === item.id ? "is-active" : ""}
      aria-current={active === item.id ? "page" : undefined}
      onClick={() => active === item.id ? onClose() : onSelect(item.id)}
      key={item.id}
    >{item.label}</button>)}
  </nav>;
}

export function NavigationSearch({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="nav-search-layout">
    <form action="/collections/all-jewellery" onSubmit={onNavigate}>
      <label htmlFor="navigation-search">What are you looking for?</label>
      <div><input id="navigation-search" name="q" placeholder="Search jewellery" /><button type="submit">Search</button></div>
    </form>
    <nav aria-label="Search quick links"><small>Quick links</small><a href="/collections/new-in" onClick={onNavigate}>New In</a><a href="/collections/rings" onClick={onNavigate}>Rings</a><a href="/collections/rose-dopamine" onClick={onNavigate}>ROSÉ Dopamine</a></nav>
  </div>;
}

export function ShopNavigation({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  const [section, setSection] = useState<ShopSection>(null);
  const [clientServicesOpen, setClientServicesOpen] = useState(false);

  const openSection = (next: Exclude<ShopSection, null>) => setSection((current) => current === next ? null : next);

  return <div className={`nav-shop-layout nav-shop-compact${section ? " has-submenu" : ""}${className ? ` ${className}` : ""}`}>
    <div className="nav-shop-columns">
      <nav className="nav-shop-primary" aria-label="Shop categories">
        <a href="/collections/new-in" onClick={onNavigate}>New In</a>
        <button type="button" className={section === "jewellery" ? "is-active" : ""} aria-expanded={section === "jewellery"} onClick={() => openSection("jewellery")}><span>Jewellery</span><MenuArrowIcon /></button>
        <button type="button" className={section === "collections" ? "is-active" : ""} aria-expanded={section === "collections"} onClick={() => openSection("collections")}><span>Collections</span><MenuArrowIcon /></button>
        <a href="/collections/gifts" onClick={onNavigate}>Gifts</a>
        <a href="/design-your-piece" onClick={onNavigate}>Design Your Piece</a>
      </nav>

      {section && <div className="nav-shop-secondary">
        <button className="nav-shop-back" type="button" onClick={() => setSection(null)} aria-label="Back to Shop"><span aria-hidden="true">‹</span>{section === "jewellery" ? "Jewellery" : "Collections"}</button>
        <nav aria-label={section === "jewellery" ? "Jewellery categories" : "Collections"}>
          {section === "jewellery" ? <>
            <a href="/collections/all-jewellery" onClick={onNavigate}>All Jewellery</a>
            <a href="/collections/rings" onClick={onNavigate}>Rings</a>
            <a href="/collections/necklaces" onClick={onNavigate}>Necklaces</a>
            <a href="/collections/earrings" onClick={onNavigate}>Earrings</a>
            <a href="/collections/bracelets" onClick={onNavigate}>Bracelets</a>
          </> : <>
            <a href="/collections/rose-signature" onClick={onNavigate}>ROSÉ Signature</a>
            <a href="/collections/rose-dopamine" onClick={onNavigate}>ROSÉ Dopamine</a>
          </>}
        </nav>
      </div>}
    </div>

    <div className={`nav-shop-client-services${clientServicesOpen ? " is-open" : ""}`}>
      <button type="button" aria-expanded={clientServicesOpen} onClick={() => setClientServicesOpen((open) => !open)}><span>Client Services</span><MenuArrowIcon /></button>
      <nav aria-label="Client services">
        <a href="/design-your-piece" onClick={onNavigate}>Design Your Piece</a>
        <a href="/consultation" onClick={onNavigate}>Contact Us</a>
        <a href="/products/pink-bloom#size-guide" onClick={onNavigate}>Size Guide</a>
        <a href="/policies/delivery-and-returns" onClick={onNavigate}>Delivery &amp; Returns</a>
        <a href="/consultation" onClick={onNavigate}>Jewellery Care</a>
      </nav>
    </div>
  </div>;
}

export function WorldNavigation({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  return <div className={`nav-world-layout nav-world-compact${className ? ` ${className}` : ""}`}>
    <nav aria-label="Our World">
      <a href="/our-philosophy" onClick={onNavigate}>Our Philosophy <MenuArrowIcon /></a>
      <a href="/design-your-piece" onClick={onNavigate}>Craftsmanship <MenuArrowIcon /></a>
      <a href="/policies/ethical-sourcing" onClick={onNavigate}>Diamonds &amp; Sourcing <MenuArrowIcon /></a>
    </nav>
  </div>;
}
