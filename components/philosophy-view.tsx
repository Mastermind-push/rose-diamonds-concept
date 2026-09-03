import ClientPageHeader from "@/components/client-page-header";
import SiteFooter from "@/components/site-footer";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const expressions = [
  {
    name: "Dopamine",
    description: "Colour you can feel.",
    href: "/collections/rose-dopamine",
  },
  {
    name: "Signature",
    description: "Pieces that become personal.",
    href: "/collections/rose-signature",
  },
  {
    name: "Privé",
    description: "Created around you.",
    href: "/design-your-piece",
  },
] as const;

export default function PhilosophyView() {
  return <main className="utility-page philosophy-page">
    <ClientPageHeader />

    <article>
      <section className="philosophy-hero" aria-labelledby="philosophy-title">
        <p className="micro-label">Our Philosophy</p>
        <h1 id="philosophy-title">You were never<br /><span>only one thing.</span></h1>
        <p>Neither should the jewellery you choose be. ROSÉ creates fine jewellery that reflects your character, your energy and every version of you.</p>
      </section>

      <section className="philosophy-manifesto" aria-labelledby="manifesto-title">
        <div className="philosophy-manifesto-copy">
          <p className="micro-label">Every version of you</p>
          <h2 id="manifesto-title">You do not have to choose<br />one version of yourself.</h2>
          <div className="philosophy-manifesto-body">
            <p>You do not become someone else when the mood changes. Another part of you simply comes forward. Jewellery should meet you there—not define you or complete you, but make what is already yours more visible.</p>
          </div>
          <p className="philosophy-qualities"><span>Your beauty.</span><span>Your character.</span><span>Your energy.</span></p>
          <blockquote>Not a new you.<br /><em style={{ backgroundImage: `url(${assetPath("images/pink-diamond-texture.avif")})` }}>More of you.</em></blockquote>
        </div>

        <figure className="philosophy-portrait">
          <div className="image-placeholder philosophy-portrait-placeholder" role="img" aria-label="Placeholder for a future Every version of you editorial image">
            <span>Every version of you — editorial image</span>
            <small>4:5 · min. 2000 × 2500</small>
          </div>
        </figure>
      </section>

      <section
        className="philosophy-belief"
        aria-labelledby="belief-title"
        style={{ backgroundImage: `url(${assetPath("images/philosophy-belief-texture.jpg")})` }}
      >
        <div className="philosophy-belief-inner">
          <h2 id="belief-title">We believe the right jewellery does not change you.<br />It brings you into sharper focus.</h2>
        </div>
      </section>

      <section className="philosophy-expression" aria-labelledby="expression-title">
        <header>
          <p className="micro-label">The world of ROSÉ</p>
          <h2 id="expression-title">For every mood.<br />For every scale.</h2>
        </header>
        <div className="philosophy-expression-copy">
          <p>There are days for colour, days for restraint, and moments for a diamond that changes the atmosphere. ROSÉ moves between all of them—from stackable rings to important stones and one-of-one commissions—without asking you to choose a single version of yourself.</p>
          <nav aria-label="Explore ROSÉ collections">
            {expressions.map((expression) => <a href={expression.href} key={expression.name}>
              <strong>ROSÉ {expression.name}</strong>
              <span>{expression.description}</span>
              <i aria-hidden="true">↗</i>
            </a>)}
          </nav>
        </div>
      </section>

      <section className="philosophy-origin" aria-labelledby="origin-title">
        <figure>
          <div className="image-placeholder philosophy-origin-placeholder" role="img" aria-label="Placeholder for the future ROSÉ story image">
            <span>Who we are — editorial image</span>
            <small>16:10 · min. 2400 × 1500</small>
          </div>
        </figure>
        <div className="philosophy-origin-copy">
          <p className="micro-label">Who we are</p>
          <h2 id="origin-title">Born in Hong Kong.<br />Made to feel personal.</h2>
          <p className="philosophy-origin-lead">ROSÉ was founded in Hong Kong by partners who believe exceptional diamonds should feel personal—chosen for the woman you are, not reserved for the occasion you are waiting for.</p>
          <p className="philosophy-origin-detail">We combine jewellery expertise with 18K gold and carefully selected natural and laboratory-grown diamonds. The result is fine jewellery with character: pieces you can live in, significant stones, and one-of-one commissions shaped around you.</p>
        </div>
      </section>

      <section className="philosophy-invitation" aria-labelledby="philosophy-invitation-title">
        <h2 id="philosophy-invitation-title">Your jewellery should<br />feel like recognition.</h2>
        <p>Discover the piece that feels immediately yours—or begin the one that does not exist yet.</p>
        <div>
          <a className="button button-dark" href="/collections/all-jewellery">Explore jewellery</a>
          <a className="underlined-link" href="/design-your-piece">Design your piece</a>
        </div>
      </section>
    </article>

    <SiteFooter />
  </main>;
}
