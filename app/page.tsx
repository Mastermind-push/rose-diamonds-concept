"use client";

import { useEffect, useState } from "react";

const categories = [
  { number: "01", title: "Rings", text: "Stack, mix, make it yours", image: "/images/rose-hero.jpg" },
  { number: "02", title: "Necklaces", text: "A little light, close to you", image: "/images/rose-necklace.jpg" },
  { number: "03", title: "Earrings", text: "For every angle", image: "/images/rose-earrings.jpg" },
  { number: "04", title: "Bracelets", text: "Energy in motion", image: "/images/rose-bracelet.jpg" },
];

const products = [
  { name: "Oval Blush Ring", detail: "18K white gold · Pink diamond", image: "/images/rose-hero.jpg", tone: "rose" },
  { name: "Azure Light Studs", detail: "18K white gold · Lab-grown", image: "/images/rose-earrings.jpg", tone: "ice" },
  { name: "Diamond Line Bracelet", detail: "18K white gold · Lab-grown", image: "/images/rose-bracelet.jpg", tone: "silver" },
  { name: "Barely There Pendant", detail: "18K white gold · Lab-grown", image: "/images/rose-necklace.jpg", tone: "aqua" },
];

const moods = [
  { name: "Glow", label: "Warm light", className: "mood-gold" },
  { name: "Rush", label: "Electric colour", className: "mood-pink" },
  { name: "Crush", label: "Soft obsession", className: "mood-ice" },
  { name: "After Dark", label: "Deep brilliance", className: "mood-emerald" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMood, setActiveMood] = useState(1);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <main>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <button className="icon-button menu-trigger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <span /><span />
        </button>
        <nav className="desktop-nav desktop-nav-left" aria-label="Primary">
          <a href="#collections">Collections</a><a href="#dopamine">New</a><a href="#story">World of Rosé</a>
        </nav>
        <a className="wordmark" href="#top" aria-label="Rosé Diamonds home">ROSÉ<small>DIAMONDS</small></a>
        <nav className="desktop-nav desktop-nav-right" aria-label="Services">
          <a href="#concierge">Concierge</a><button aria-label="Search">Search</button><button aria-label="Shopping bag">Bag <sup>0</sup></button>
        </nav>
        <button className="mobile-bag" aria-label="Shopping bag">Bag <sup>0</sup></button>
      </header>

      <section id="top" className="hero">
        <div className="hero-art">
          <img src="/images/rose-hero-collection.jpg" alt="Rosé diamond rings arranged on ivory plinths" />
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Born in Hong Kong · Fine diamonds &amp; colour</p>
          <h1>Brilliance,<br /><em>in every mood.</em></h1>
          <p className="hero-description">Natural and lab-grown diamonds in 18K gold, made for women who never blend in.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#dopamine">Discover Rosé Dopamine</a>
            <a className="text-link" href="#products">Shop rings <span>↗</span></a>
          </div>
        </div>
        <a className="scroll-cue" href="#collections"><span /> Discover</a>
      </section>

      <div className="trust-ribbon" aria-label="Product assurances">
        <span>GIA-certified natural diamonds</span><i>✦</i><span>IGI-certified lab-grown</span><i>✦</i><span>18K gold</span><i>✦</i><span>Worldwide delivery</span>
      </div>

      <section id="collections" className="section collection-preview reveal">
        <div className="section-heading">
          <p className="eyebrow eyebrow-dark">The Rosé edit</p>
          <h2>Find your<br /><span className="diamond-text diamond-ice">kind of brilliance.</span></h2>
        </div>
        <div className="first-grid">
          {categories.map((category, index) => (
            <a className={`category-card category-${index + 1}`} href="#products" key={category.title}>
              <div className="category-image"><img src={category.image} alt={`${category.title} by Rosé Diamonds`} /><span>{category.number}</span></div>
              <div className="category-meta"><div><h3>{category.title}</h3><p>{category.text}</p></div><span className="round-arrow">↗</span></div>
            </a>
          ))}
        </div>
      </section>

      <section id="dopamine" className="dopamine reveal">
        <div className="dopamine-visual">
          <img src="/images/rose-dopamine.jpg" alt="Colourful Rosé Dopamine rings worn on a hand" />
          <span className="asset-tag">CURRENT ASSET · FUTURE CAMPAIGN CROP</span>
        </div>
        <div className="dopamine-copy">
          <p className="eyebrow">New collection · 18K gold</p>
          <h2>Diamonds<br /><span className="diamond-text diamond-pink">with a pulse.</span></h2>
          <p>Lab-grown diamonds and coloured sapphires, arranged like tiny hits of energy. Precious, vivid and designed to stack your own way.</p>
          <a className="button button-ink" href="#products">Enter Rosé Dopamine <span>↗</span></a>
          <div className="dopamine-dots"><span /><span /><span /><span /><span /></div>
        </div>
      </section>

      <section id="products" className="section products reveal">
        <div className="product-heading">
          <div><p className="eyebrow eyebrow-dark">New &amp; most wanted</p><h2>Pieces with<br />personality.</h2></div>
          <a className="text-link text-link-dark" href="#collections">Shop all jewellery <span>↗</span></a>
        </div>
        <div className="product-rail">
          {products.map((product, index) => (
            <article className="product-card" key={product.name}>
              <a className={`product-image product-${product.tone}`} href="#concierge">
                <img src={product.image} alt={product.name} />
                <span className="product-index">0{index + 1}</span><button className="heart" aria-label={`Save ${product.name}`}>♡</button>
                <span className="product-hover">View piece ↗</span>
              </a>
              <div className="product-meta"><div><h3>{product.name}</h3><p>{product.detail}</p></div><a href="#concierge">Discover</a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="stack-story reveal">
        <div className="stack-photo">
          <div className="placeholder-noise" />
          <span className="photo-brief">NEW PHOTO · YOUNG EDITORIAL PORTRAIT · 4:5</span>
          <button className="hotspot hotspot-one" aria-label="View pink ring">1</button>
          <button className="hotspot hotspot-two" aria-label="View blue ring">2</button>
          <button className="hotspot hotspot-three" aria-label="View yellow ring">3</button>
        </div>
        <div className="stack-copy">
          <p className="eyebrow">Shop the stack</p>
          <h2>More you.<br />Never too much.</h2>
          <p>Start with one colour. Add another because it feels right. There are no rules—only your rhythm.</p>
          <div className="mini-product"><span className="mini-stone" /><div><small>STACK 01</small><h3>The Dopamine Trio</h3><p>Three rings · 18K gold</p></div><a href="#concierge">↗</a></div>
          <a className="button button-outline" href="#products">Build your stack</a>
        </div>
      </section>

      <section className={`mood-section ${moods[activeMood].className} reveal`}>
        <div className="mood-intro"><p className="eyebrow">Shop by mood</p><h2>Pick your<br /><span className="diamond-text diamond-mood">energy.</span></h2><p>Jewellery is not the finishing touch. It is the mood you choose to carry.</p></div>
        <div className="mood-list">
          {moods.map((mood, index) => (
            <button className={index === activeMood ? "active" : ""} onMouseEnter={() => setActiveMood(index)} onFocus={() => setActiveMood(index)} onClick={() => setActiveMood(index)} key={mood.name}>
              <small>0{index + 1}</small><span>{mood.name}</span><em>{mood.label}</em><b>↗</b>
            </button>
          ))}
        </div>
      </section>

      <section className="design-piece section reveal">
        <div className="design-copy"><p className="eyebrow eyebrow-dark">Design your piece</p><h2>Make it<br /><span className="diamond-text diamond-emerald">unmistakably yours.</span></h2><p>Choose the stone, colour and setting. We will craft it in Hong Kong with certified diamonds and 18K gold.</p><a className="button button-ink" href="#concierge">Start designing ↗</a></div>
        <div className="design-studio">
          <span className="studio-label">INTERACTIVE 3D / PRODUCT PHOTOGRAPHY PLACEHOLDER</span>
          <div className="design-ring"><span /></div>
          <div className="design-controls">
            {["Stone", "Colour", "Setting"].map((item, index) => <button key={item}><small>0{index + 1}</small>{item}<span>{index === 0 ? "Oval" : index === 1 ? "Pink" : "Solitaire"}</span></button>)}
          </div>
        </div>
      </section>

      <section id="story" className="story reveal">
        <div className="story-image"><span>NEW PHOTO · HONG KONG AFTER DARK · 16:10</span></div>
        <div className="story-copy"><p className="eyebrow">Our origin</p><h2>Born in<br /><span className="diamond-text diamond-gold">Hong Kong.</span></h2><p>A city of light, movement and fearless contrasts. Rosé was created here for women everywhere who believe fine jewellery should feel alive.</p><div className="story-facts"><span><b>18K</b> Gold craftsmanship</span><span><b>GIA / IGI</b> Certified stones</span><span><b>Global</b> Worldwide delivery</span></div><a className="text-link" href="#footer">The world of Rosé <span>↗</span></a></div>
      </section>

      <section className="section confidence reveal">
        <div className="confidence-title"><p className="eyebrow eyebrow-dark">Beautifully transparent</p><h2>Confidence<br />in every detail.</h2></div>
        <div className="confidence-grid">
          <article><small>01</small><h3>Natural diamonds</h3><p>Ethically sourced and GIA certified for life’s most precious moments.</p><a href="#concierge">Learn more ↗</a></article>
          <article><small>02</small><h3>Lab-grown brilliance</h3><p>IGI certified diamonds with exceptional light, crafted for every day.</p><a href="#concierge">Learn more ↗</a></article>
          <article><small>03</small><h3>Made to last</h3><p>Every Rosé piece is crafted in 18K gold and delivered with personal care.</p><a href="#concierge">Our services ↗</a></article>
        </div>
      </section>

      <section className="community reveal">
        <div className="community-heading"><p className="eyebrow">Rosé in the wild</p><h2>Worn your way.</h2><p>Real women, real stacks, real energy.</p></div>
        <div className="community-grid">
          {["CLIENT UGC · 4:5", "LIFESTYLE VIDEO · 9:16", "CLIENT UGC · 4:5"].map((label, index) => <article key={label + index}><div className={`ugc-placeholder ugc-${index + 1}`}><span>{label}</span></div><div><p>“It feels completely like me.”</p><small>@roségirl · Verified client</small></div></article>)}
        </div>
      </section>

      <section id="concierge" className="concierge reveal">
        <p className="eyebrow">Private concierge</p><h2>Need a little<br /><span className="diamond-text diamond-ice">help choosing?</span></h2><p>Talk to a Rosé specialist about stones, sizing, styling or a piece made entirely for you.</p>
        <div className="concierge-actions"><a className="button button-light" href="mailto:hello@rosehk.com">Book a consultation</a><a className="text-link" href="https://wa.me/85292270884">Chat on WhatsApp ↗</a></div>
      </section>

      <footer id="footer">
        <div className="footer-brand"><span className="wordmark">ROSÉ<small>DIAMONDS</small></span><p>Brilliance, in every mood.</p></div>
        <div className="footer-links"><div><small>JEWELLERY</small><a href="#collections">Rings</a><a href="#collections">Necklaces</a><a href="#collections">Earrings</a><a href="#collections">Bracelets</a></div><div><small>THE HOUSE</small><a href="#story">Our story</a><a href="#dopamine">Rosé Dopamine</a><a href="#concierge">Design your piece</a><a href="#concierge">Concierge</a></div><div><small>CLIENT CARE</small><a href="#footer">Delivery &amp; returns</a><a href="#footer">Size guide</a><a href="#footer">Jewellery care</a><a href="#footer">Contact</a></div></div>
        <div className="newsletter"><small>JOIN OUR WORLD</small><p>New colour, new drops, no noise.</p><form><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" placeholder="Email address" /><button type="submit" aria-label="Subscribe">↗</button></form></div>
        <div className="footer-bottom"><span>© 2026 Rosé Diamonds Ltd.</span><span>Hong Kong · Worldwide delivery</span><span>Instagram · TikTok</span></div>
      </footer>

      {menuOpen && (
        <div className="menu-panel" role="dialog" aria-modal="true" aria-label="Main menu">
          <div className="menu-top"><button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button><span className="wordmark menu-wordmark">ROSÉ<small>DIAMONDS</small></span><span className="menu-count">Bag <sup>0</sup></span></div>
          <div className="menu-body"><nav className="menu-links">{["New & Dopamine", "Rings", "Necklaces", "Earrings", "Bracelets", "Design your piece", "The world of Rosé"].map((item, i) => <a href={i === 0 ? "#dopamine" : i === 5 ? "#concierge" : i === 6 ? "#story" : "#collections"} onClick={() => setMenuOpen(false)} key={item}><small>0{i + 1}</small><span>{item}</span><b>↗</b></a>)}</nav><div className="menu-campaign"><span>NEW COLLECTION</span><h3>Rosé<br />Dopamine</h3><p>Campaign image placeholder</p></div></div>
          <div className="menu-service"><a href="#concierge" onClick={() => setMenuOpen(false)}>Private concierge</a><a href="#footer" onClick={() => setMenuOpen(false)}>Delivery &amp; returns</a><a href="#footer" onClick={() => setMenuOpen(false)}>Language / Region</a><a href="#footer" onClick={() => setMenuOpen(false)}>Client login</a></div>
        </div>
      )}
    </main>
  );
}
