"use client";

import ClientPageHeader from "@/components/client-page-header";
import SiteFooter from "@/components/site-footer";

const consultationHref = "/consultation?interest=Bespoke#book-consultation";

function EditorialPlaceholder({ label, format, className = "" }: { label: string; format: string; className?: string }) {
  return <figure className={`bespoke-image-placeholder${className ? ` ${className}` : ""}`}><div><span>{label}</span><small>{format}</small></div></figure>;
}

const steps = [
  ["01", "Begin with a conversation", "We learn about the person, the occasion and what you want the piece to express."],
  ["02", "Find your diamond", "Choose a natural or laboratory-grown diamond selected for beauty, proportion and character."],
  ["03", "Shape the design", "Together, we refine the stone, colour, metal, setting and every important detail."],
  ["04", "Made exclusively for you", "Your jewellery is crafted in 18K gold, finished by hand and presented privately."],
] as const;

export default function DesignYourPieceView() {
  return <main className="utility-page bespoke-page">
    <ClientPageHeader />

    <section className="bespoke-hero" aria-labelledby="bespoke-title">
      <div className="bespoke-hero-copy">
        <p className="micro-label">Design Your Piece</p>
        <h1 id="bespoke-title">Made for one.<br />Made around you.</h1>
        <p>From an intimate everyday piece to a once-in-a-lifetime diamond, every ROSÉ commission begins with you. We create one-of-one jewellery around your story, your style and the way you want to feel.</p>
        <a className="button button-dark" href={consultationHref}>Book a private consultation</a>
      </div>
      <div className="bespoke-hero-visual"><EditorialPlaceholder label="ONE-OF-ONE ROSÉ COMMISSION" format="4:5" /><p>Your idea, refined into something unmistakably yours.</p></div>
    </section>

    <section className="bespoke-process" aria-labelledby="bespoke-process-title">
      <header><p className="micro-label">The process</p><h2 id="bespoke-process-title">From first thought<br />to final piece.</h2></header>
      <ol className="bespoke-steps">
        {steps.map(([number, title, copy]) => <li key={number}>
          <span className="bespoke-step-number" aria-hidden="true">{number}</span>
          <div><h3>{title}</h3><p>{copy}</p></div>
        </li>)}
      </ol>
      <div className="bespoke-macro"><EditorialPlaceholder label="STONE, SETTING & CRAFT — MACRO" format="16:10 · Mobile 4:5" /><div><p className="micro-label">Every detail, considered</p><p>Proportion, light, comfort and character are refined together. The result should feel extraordinary at first sight—and completely natural when worn.</p></div></div>
    </section>

    <section className="bespoke-diamond" aria-labelledby="bespoke-diamond-title">
      <EditorialPlaceholder label="PRIVATE DIAMOND SELECTION" format="4:5" />
      <div><p className="micro-label">Sourcing</p><h2 id="bespoke-diamond-title">Your diamond.<br />Your choice.</h2><p>We work with both natural and laboratory-grown diamonds, sourcing each stone according to your design, priorities and budget. Every diamond is selected for beauty and character, with the relevant independent certification and full details provided.</p><ul><li>Natural and laboratory-grown diamonds</li><li>White and coloured stones</li><li>Individual shapes and carat weights</li><li>GIA or IGI certification where applicable</li></ul></div>
    </section>

    <section className="bespoke-invitation" aria-labelledby="bespoke-invitation-title">
      <p className="micro-label">A private commission</p>
      <h2 id="bespoke-invitation-title">Whatever you imagine,<br />it begins with a conversation.</h2>
      <p>An everyday signature. A meaningful gift. An engagement ring. A ten-carat statement that changes the room when you enter it.</p>
      <div><a className="button button-dark" href={consultationHref}>Begin your commission</a><a className="underlined-link" href="https://wa.me/85292270884" target="_blank" rel="noreferrer">Message ROSÉ Concierge on WhatsApp</a></div>
    </section>

    <SiteFooter />
  </main>;
}
