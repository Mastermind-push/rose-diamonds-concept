"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";
import { BagDrawer, ConciergeDrawer } from "@/components/client-drawers";
import { useClientCommerce } from "@/components/client-commerce";
import { LeftNavigationHeader, NavigationSearch, ShopNavigation, WorldNavigation } from "@/components/navigation-menus";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const BagIcon = () => <img className="ui-bag" src={assetPath("icons/shopping-bag.svg")} alt="" aria-hidden="true" />;

function BrandLogo() {
  return <span className="brand-logo" aria-hidden="true"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="" /></span>;
}

export default function ClientPageHeader() {
  const commerce = useClientCommerce();
  const [panel, setPanel] = useState<"shop" | "world" | "search" | "account" | "bag" | "concierge" | null>(null);

  useEffect(() => {
    document.body.style.overflow = panel ? "hidden" : "";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [panel]);

  return <>
    <header className="site-header catalog-header client-page-header">
      <button className="mobile-menu-trigger" aria-label="Open menu" onClick={() => setPanel("shop")}><span /><span /><span /></button>
      <nav className="desktop-nav desktop-nav-left" aria-label="Primary navigation"><button onClick={() => setPanel("shop")}>Shop</button><button onClick={() => setPanel("world")}>Our World</button><button onClick={() => setPanel("search")}>Search</button></nav>
      <a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a>
      <nav className="desktop-nav desktop-nav-right" aria-label="Client navigation"><button onClick={() => setPanel("concierge")}>Concierge</button><button onClick={() => setPanel("account")}>My Account</button><a href="/wishlist">Wishlist <sup>{commerce.wishlistCount}</sup></a><button onClick={() => setPanel("bag")}>Bag <sup>{commerce.bagCount}</sup></button></nav>
      <button className="mobile-bag" aria-label={`Shopping bag, ${commerce.bagCount} items`} onClick={() => setPanel("bag")}><BagIcon /><sup>{commerce.bagCount}</sup></button>
    </header>

    {(panel === "shop" || panel === "world" || panel === "search" || panel === "account") && <div className="nav-overlay" role="dialog" aria-modal="true" aria-label={`${panel} menu`}><button className="nav-backdrop" onClick={() => setPanel(null)} aria-label="Close menu" /><div className={`nav-sheet${panel === "shop" || panel === "world" || panel === "search" ? " nav-sheet-left" : ""}`}><div className="nav-sheet-top">{(panel === "shop" || panel === "world" || panel === "search") && <LeftNavigationHeader active={panel} onSelect={setPanel} onClose={() => setPanel(null)} />}<button className="nav-close" onClick={() => setPanel(null)} aria-label="Close menu"><span /><span /></button><a className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><BrandLogo /></a><button className="nav-sheet-bag" onClick={() => setPanel("bag")} aria-label="Shopping bag"><BagIcon /><sup>{commerce.bagCount}</sup></button></div>{panel === "shop" && <ShopNavigation className="catalog-nav-shop" onNavigate={() => setPanel(null)} />}{panel === "world" && <WorldNavigation onNavigate={() => setPanel(null)} />}{panel === "search" && <NavigationSearch onNavigate={() => setPanel(null)} />}{panel === "account" && <div className="nav-account-layout"><small>Client account</small><h3>Welcome back.</h3><p>Account access will connect to the live commerce platform at launch.</p><form onSubmit={(event) => event.preventDefault()}><label>Email<input type="email" autoComplete="email" /></label><label>Password<input type="password" autoComplete="current-password" /></label><button className="button button-dark" type="submit">Sign in</button></form><button className="underlined-link" type="button">Create an account</button></div>}</div></div>}
    {panel === "bag" && <BagDrawer items={commerce.bag} onClose={() => setPanel(null)} onQuantity={commerce.setQuantity} onRemove={commerce.removeFromBag} />}
    {panel === "concierge" && <ConciergeDrawer onClose={() => setPanel(null)} />}
  </>;
}
