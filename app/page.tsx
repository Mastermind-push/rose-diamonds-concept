"use client";

import { useEffect, useState } from "react";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const ArrowIcon = () => <img className="ui-arrow" src={assetPath("icons/arrow-up-right.svg")} alt="" aria-hidden="true" />;
const RotateIcon = () => <img className="ui-rotate" src={assetPath("icons/rotate-cw.svg")} alt="" aria-hidden="true" />;
const BagIcon = () => <img className="ui-bag" src={assetPath("icons/shopping-bag.svg")} alt="" aria-hidden="true" />;
const MenuArrowIcon = () => <img className="menu-arrow" src={assetPath("icons/menu-arrow-right.svg")} alt="" aria-hidden="true" />;

const categories = [
  { title: "Rings", text: "Stack, mix, make it yours", image: assetPath("images/rose-hero.webp") },
  { title: "Necklaces", text: "A little light, close to you", image: assetPath("images/rose-necklace.webp") },
  { title: "Earrings", text: "For every angle", image: assetPath("images/rose-earrings.webp") },
  { title: "Bracelets", text: "Energy in motion", image: assetPath("images/rose-bracelet.webp") },
];

const products = [
  { name: "Oval Blush Ring", detail: "18K white gold · Pink diamond", image: assetPath("images/rose-hero.webp"), tone: "rose" },
  { name: "Azure Light Studs", detail: "18K white gold · Lab-grown", image: assetPath("images/rose-earrings.webp"), tone: "ice" },
  { name: "Diamond Line Bracelet", detail: "18K white gold · Lab-grown", image: assetPath("images/rose-bracelet.webp"), tone: "silver" },
  { name: "Barely There Pendant", detail: "18K white gold · Lab-grown", image: assetPath("images/rose-necklace.webp"), tone: "aqua" },
];

const moods = [
  { name: "Glow", label: "Warm light", copy: "Golden tones and soft brilliance for an effortless glow.", className: "mood-gold", image: assetPath("images/rose-hero.webp") },
  { name: "Rush", label: "Electric colour", copy: "Pink sapphires and vivid colour for main-character energy.", className: "mood-pink", image: assetPath("images/rose-dopamine.webp") },
  { name: "Crush", label: "Soft obsession", copy: "Clean diamonds and icy light with a romantic edge.", className: "mood-ice", image: assetPath("images/rose-earrings.webp") },
  { name: "After Dark", label: "Deep brilliance", copy: "Statement sparkle made for the city after sunset.", className: "mood-emerald", image: assetPath("images/rose-bracelet.webp") },
];

const designOptions = [
  { label: "Stone", value: "Oval", icon: "◇" },
  { label: "Colour", value: "Blush pink", icon: "◉" },
  { label: "Setting", value: "Solitaire", icon: "✦" },
];

const instagramPosts = [
  "https://www.instagram.com/p/DbL5Ph9COzg/",
  "https://www.instagram.com/p/DcTpspGCOQB/",
  "https://www.instagram.com/p/DaxFCn9CGm_/",
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const section = document.querySelector(".community");
    if (!section) return;
    const loadEmbeds = () => {
      const processEmbeds = () => (window as typeof window & { instgrm?: { Embeds?: { process?: () => void } } }).instgrm?.Embeds?.process?.();
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.instagram.com/embed.js"]');
      if (existing) return processEmbeds();
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.instagram.com/embed.js";
      script.onload = processEmbeds;
      document.body.appendChild(script);
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadEmbeds();
        observer.disconnect();
      }
    }, { rootMargin: "700px 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <button className="icon-button menu-trigger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <span /><span /><span />
        </button>
        <nav className="desktop-nav desktop-nav-left" aria-label="Primary">
          <a href="#collections">Collections</a><a href="#dopamine">New</a><a href="#moods">Shop by mood</a>
        </nav>
        <a className="wordmark" href="#top" aria-label="Rosé Diamonds home">ROSÉ<small>DIAMONDS</small></a>
        <nav className="desktop-nav desktop-nav-right" aria-label="Services">
          <a href="#concierge">Concierge</a><button aria-label="Search">Search</button><button aria-label="Shopping bag">Bag <sup>0</sup></button>
        </nav>
        <button className="mobile-bag" aria-label="Shopping bag"><BagIcon /></button>
      </header>

      <section id="top" className="hero">
        <div className="hero-art">
          <picture>
            <source media="(max-width: 820px)" srcSet={assetPath("images/rose-hero-mobile.webp")} type="image/webp" />
            <img src={assetPath("images/rose-hero-collection.webp")} alt="Rosé diamond rings arranged on ivory plinths" fetchPriority="high" decoding="async" />
          </picture>
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <h1><em style={{ backgroundImage: `url("${assetPath("images/hero-diamond-texture-preview.webp")}")` }}>Brilliance,</em><br />in every mood.</h1>
          <p className="hero-description">Natural and lab-grown diamonds in 18K gold, made for women who never blend in.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#dopamine">Discover Rosé Dopamine</a>
            <a className="text-link" href="#products">Shop rings <ArrowIcon /></a>
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
              <div className="category-image"><img src={category.image} alt={`${category.title} by Rosé Diamonds`} loading="lazy" decoding="async" /></div>
              <div className="category-meta"><div><h3>{category.title}</h3><p>{category.text}</p></div><span className="round-arrow"><ArrowIcon /></span></div>
            </a>
          ))}
        </div>
      </section>

      <section id="dopamine" className="dopamine reveal">
        <div className="dopamine-visual">
          <img src={assetPath("images/rose-dopamine.webp")} alt="Colourful Rosé Dopamine rings worn on a hand" loading="lazy" decoding="async" />
        </div>
        <div className="dopamine-copy">
          <p className="eyebrow">New collection</p>
          <h2>Diamonds<br /><span className="diamond-text diamond-pink">with a pulse.</span></h2>
          <p>Lab-grown diamonds and coloured sapphires, arranged like tiny hits of energy. Precious, vivid and designed to stack your own way.</p>
          <a className="button button-ink" href="#products">Enter Rosé Dopamine <ArrowIcon /></a>
        </div>
      </section>

      <section id="products" className="section products reveal">
        <div className="product-heading">
          <div><p className="eyebrow eyebrow-dark">New &amp; most wanted</p><h2>Pieces with<br />personality.</h2></div>
          <a className="text-link text-link-dark" href="#collections">Shop all jewellery <ArrowIcon /></a>
        </div>
        <div className="product-rail">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <a className={`product-image product-${product.tone}`} href="#concierge">
                <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                <span className="product-hover">View piece <ArrowIcon /></span>
              </a>
              <div className="product-meta"><div><h3>{product.name}</h3><p>{product.detail}</p></div><a href="#concierge">Discover</a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="stack-story reveal">
        <div className="stack-photo">
          <img src={assetPath("images/shop-the-stack.webp")} alt="A hand wearing a colourful stack of Rosé diamond rings" loading="lazy" decoding="async" />
        </div>
        <div className="stack-copy">
          <p className="eyebrow">Shop the stack</p>
          <h2>Build a stack<br />that feels like you.</h2>
          <p>Choose one hero stone, add a line of colour, then mix shapes or metals. Shop the complete edit or use it as a starting point.</p>
          <div className="stack-formula" aria-label="How to build a ring stack">
            <span><img className="stack-step-icon" src={assetPath("icons/stack-gem.svg")} alt="" aria-hidden="true" /><b>Choose a hero</b><em>Start with your favourite stone</em></span>
            <span><img className="stack-step-icon" src={assetPath("icons/stack-palette.svg")} alt="" aria-hidden="true" /><b>Add colour</b><em>Match it or make it clash</em></span>
            <span><img className="stack-step-icon" src={assetPath("icons/stack-layers.svg")} alt="" aria-hidden="true" /><b>Make it yours</b><em>Stack two, three or more</em></span>
          </div>
          <div className="stack-actions"><a className="button button-light" href="#products">Shop the complete stack</a><a className="text-link" href="#concierge">Ask a stylist <ArrowIcon /></a></div>
        </div>
      </section>

      <section id="moods" className="mood-section reveal">
        <div className="mood-intro"><div><p className="eyebrow eyebrow-dark">Shop by mood</p><h2>Choose the energy<br /><span className="diamond-text diamond-mood">you want to wear.</span></h2></div><p>Four curated edits built around colour, light and attitude. Pick the feeling first—we will show you the pieces.</p></div>
        <div className="mood-grid">
          {moods.map((mood) => (
            <a className={`mood-card ${mood.className}`} href="#products" key={mood.name}>
              <img src={mood.image} alt={`${mood.name} jewellery edit`} loading="lazy" decoding="async" />
              <span className="mood-wash" />
              <span className="mood-card-copy"><small>{mood.label}</small><b>{mood.name}</b><em>{mood.copy}</em><i>Shop this mood <ArrowIcon /></i></span>
            </a>
          ))}
        </div>
      </section>

      <section className="design-piece section reveal">
        <div className="design-copy"><p className="eyebrow eyebrow-dark">Design your piece</p><h2>Make it<br /><span className="diamond-text diamond-emerald">unmistakably yours.</span></h2><p>Choose the stone, colour and setting. We will craft it in Hong Kong with certified diamonds and 18K gold.</p><div className="render-requirement"><RotateIcon /><span><b>Interactive 360° preview</b><small>The final experience uses a dedicated GLB product model—not a simulated CSS ring.</small></span></div><a className="button button-ink" href="#concierge">Start designing <ArrowIcon /></a></div>
        <div className="design-studio">
          <div className="design-preview"><img src={assetPath("images/rose-hero.webp")} alt="Pink oval diamond ring preview" loading="lazy" decoding="async" /><span><RotateIcon /> 360° MODEL AREA</span></div>
          <div className="design-controls">
            {designOptions.map(({ label, value, icon }, index) => <button key={label}><i className="line-icon" aria-hidden="true">{icon}</i><small>0{index + 1}</small><b>{label}</b><span>{value}</span></button>)}
          </div>
        </div>
      </section>

      <section className="community reveal">
        <div className="community-heading"><p className="eyebrow">Rosé in the wild</p><h2>Worn your way.</h2><p>Real women, real stacks, real energy.</p></div>
        <div className="community-grid">
          {instagramPosts.map((post) => <article className="instagram-card" key={post}><blockquote className="instagram-media" data-instgrm-permalink={`${post}?utm_source=ig_embed&utm_campaign=loading`} data-instgrm-version="14"><a href={post} target="_blank" rel="noreferrer">View this post on Instagram</a></blockquote></article>)}
        </div>
      </section>

      <section id="concierge" className="concierge reveal">
        <picture className="concierge-media">
          <source media="(max-width: 700px)" srcSet={assetPath("images/private-concierge-mobile.webp")} type="image/webp" />
          <img src={assetPath("images/private-concierge-desktop.webp")} alt="A private diamond ring consultation" loading="lazy" decoding="async" />
        </picture>
        <div className="concierge-content">
          <p className="eyebrow">Private concierge</p><h2>Need a little<br />help choosing?</h2><p>Talk to a Rosé specialist about stones, sizing, styling or a piece made entirely for you.</p>
          <div className="concierge-actions"><a className="button button-light" href="mailto:hello@rosehk.com">Book a consultation</a><a className="text-link" href="https://wa.me/85292270884">Chat on WhatsApp <ArrowIcon /></a></div>
        </div>
      </section>

      <footer id="footer">
        <div className="footer-brand"><span className="wordmark">ROSÉ<small>DIAMONDS</small></span><p>Brilliance, in every mood.</p></div>
        <div className="footer-links"><div><small>JEWELLERY</small><a href="#collections">Rings</a><a href="#collections">Necklaces</a><a href="#collections">Earrings</a><a href="#collections">Bracelets</a></div><div><small>THE HOUSE</small><a href="#dopamine">Rosé Dopamine</a><a href="#moods">Shop by mood</a><a href="#concierge">Design your piece</a><a href="#concierge">Concierge</a></div><div><small>CLIENT CARE</small><a href="#footer">Delivery &amp; returns</a><a href="#footer">Size guide</a><a href="#footer">Jewellery care</a><a href="#footer">Contact</a></div></div>
        <div className="newsletter"><small>JOIN OUR WORLD</small><p>New colour, new drops, no noise.</p><form><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" placeholder="Email address" /><button type="submit" aria-label="Subscribe"><ArrowIcon /></button></form></div>
        <div className="footer-bottom"><span>© 2026 Rosé Diamonds Ltd.</span><span>Hong Kong · Worldwide delivery</span><div className="footer-socials"><a href="#footer" aria-label="Instagram"><img src={assetPath("icons/instagram.svg")} alt="" /></a><a href="#footer" aria-label="TikTok"><img src={assetPath("icons/tiktok.svg")} alt="" /></a><a href="#footer" aria-label="Pinterest"><img src={assetPath("icons/pinterest.svg")} alt="" /></a></div></div>
      </footer>

      {menuOpen && (
        <div className="menu-panel" role="dialog" aria-modal="true" aria-label="Main menu">
          <div className="menu-top"><button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button><span className="wordmark menu-wordmark">ROSÉ<small>DIAMONDS</small></span><button className="menu-bag" aria-label="Shopping bag"><BagIcon /></button></div>
          <div className="menu-body"><nav className="menu-links">{["New & Dopamine", "Rings", "Necklaces", "Earrings", "Bracelets", "Design your piece", "Shop by mood"].map((item, i) => <a href={i === 0 ? "#dopamine" : i === 5 ? "#concierge" : i === 6 ? "#moods" : "#collections"} onClick={() => setMenuOpen(false)} key={item}><span>{item}</span><MenuArrowIcon /></a>)}</nav><div className="menu-campaign" style={{ backgroundImage: `url("${assetPath("images/rose-dopamine.webp")}")` }}><span>NEW COLLECTION</span><h3>Rosé<br />Dopamine</h3></div></div>
          <div className="menu-service"><a href="#concierge" onClick={() => setMenuOpen(false)}>Private concierge</a><a href="#footer" onClick={() => setMenuOpen(false)}>Delivery &amp; returns</a><a href="#footer" onClick={() => setMenuOpen(false)}>Language / Region</a><a href="#footer" onClick={() => setMenuOpen(false)}>Client login</a></div>
        </div>
      )}
    </main>
  );
}
