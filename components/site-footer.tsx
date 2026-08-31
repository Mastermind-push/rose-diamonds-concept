"use client";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const ArrowIcon = () => <img className="ui-arrow" src={assetPath("icons/arrow-up-right.svg")} alt="" aria-hidden="true" />;

function BrandLogo() {
  return <span className="brand-logo" aria-hidden="true"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="" /></span>;
}

export default function SiteFooter() {
  return (
    <footer id="footer">
      <div className="footer-brand"><span className="wordmark"><BrandLogo /></span><p>Brilliance, in every mood.</p></div>
      <div className="footer-links">
        <div><small>JEWELLERY</small><a href="/collections/all-jewellery">All Jewellery</a><a href="/collections/rings">Rings</a><a href="/collections/necklaces">Necklaces</a><a href="/collections/earrings">Earrings</a><a href="/collections/bracelets">Bracelets</a></div>
        <div><small>OUR WORLD</small><a href="/collections/rose-dopamine">ROSÉ Dopamine</a><a href="/#design-your-piece">Design Your Piece</a><a href="/#our-world">Our Story</a><a href="/#concierge">Concierge</a></div>
        <div><small>CLIENT CARE</small><a href="#footer">Delivery &amp; Returns</a><a href="#footer">Size Guide</a><a href="#footer">Jewellery Care</a><a href="#footer">Contact</a></div>
      </div>
      <div className="newsletter"><small>JOIN OUR WORLD</small><p>New colour, new drops, no noise.</p><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" type="email" placeholder="Email address" /><button type="submit" aria-label="Subscribe"><ArrowIcon /></button></form></div>
      <div className="footer-bottom"><span>© 2026 ROSÉ Diamonds Ltd.</span><span>Hong Kong · Worldwide delivery</span><div className="footer-socials"><a href="https://instagram.com/rosediamondshk" aria-label="Instagram"><img src={assetPath("icons/instagram.svg")} alt="" /></a><a href="https://tiktok.com/@rosediamondshk" aria-label="TikTok"><img src={assetPath("icons/tiktok.svg")} alt="" /></a><a href="#footer" aria-label="Pinterest"><img src={assetPath("icons/pinterest.svg")} alt="" /></a></div></div>
    </footer>
  );
}
