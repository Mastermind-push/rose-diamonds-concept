"use client";

import Link from "next/link";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const ArrowIcon = () => <img className="ui-arrow" src={assetPath("icons/arrow-up-right.svg")} alt="" aria-hidden="true" />;

export default function SiteFooter() {
  return (
    <footer id="footer">
      <div className="footer-brand"><p style={{ backgroundImage: `url(${assetPath("images/footer-blue-texture.avif")})` }}>Brilliance,<br />in every mood.</p></div>
      <div className="footer-links">
        <div><small>JEWELLERY</small><Link href="/collections/all-jewellery">All Jewellery</Link><Link href="/collections/rings">Rings</Link><Link href="/collections/necklaces">Necklaces</Link><Link href="/collections/earrings">Earrings</Link><Link href="/collections/bracelets">Bracelets</Link></div>
        <div><small>OUR WORLD</small><Link href="/our-philosophy">Our Philosophy</Link><Link href="/design-your-piece">Craftsmanship</Link><Link href="/policies/ethical-sourcing">Diamonds &amp; Sourcing</Link></div>
        <div><small>CLIENT SERVICES</small><Link href="/design-your-piece">Design Your Piece</Link><Link href="/consultation">Contact Us</Link><Link href="/products/pink-bloom">Size Guide</Link><Link href="/policies/delivery-and-returns">Delivery &amp; Returns</Link><Link href="/consultation">Jewellery Care</Link></div>
      </div>
      <div className="newsletter"><small>JOIN OUR WORLD</small><p>New colour, new drops, no noise.</p><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" type="email" placeholder="Email address" /><button type="submit" aria-label="Subscribe"><ArrowIcon /></button></form><div className="footer-socials"><a href="https://instagram.com/rosediamondshk" aria-label="Instagram"><img src={assetPath("icons/instagram.svg")} alt="" /></a><a href="https://tiktok.com/@rosediamondshk" aria-label="TikTok"><img src={assetPath("icons/tiktok.svg")} alt="" /></a><a href="#footer" aria-label="Pinterest"><img src={assetPath("icons/pinterest.svg")} alt="" /></a></div></div>
      <div className="footer-bottom"><nav className="footer-policy-links" aria-label="Legal policies"><Link href="/policies/privacy">Privacy Policy</Link><Link href="/policies/terms-of-service">Terms of Service</Link><Link href="/policies/ethical-sourcing">Ethical Sourcing</Link><Link href="/policies/modern-slavery">Modern Slavery</Link></nav><span className="footer-delivery">Worldwide delivery</span><span className="footer-copyright">© 2026 ROSÉ Diamonds Ltd.</span></div>
    </footer>
  );
}
