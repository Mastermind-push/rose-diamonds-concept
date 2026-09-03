"use client";

import { FormEvent, useEffect, useState } from "react";
import ClientPageHeader from "@/components/client-page-header";
import SiteFooter from "@/components/site-footer";

export default function ConsultationView() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [interest, setInterest] = useState("Choosing a piece");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("interest")?.toLowerCase() === "bespoke") setInterest("Bespoke");
  }, []);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    try {
      const response = await fetch("https://formspree.io/f/mwlezarb", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Unable to send enquiry");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return <main className="utility-page consultation-page">
    <ClientPageHeader />
    <section className="contact-page-hero"><p className="micro-label">ROSÉ Concierge</p><h1>Contact us.</h1><p>Our jewellery specialists are here to help with choosing a piece, sizing, gifts and bespoke enquiries.</p></section>
    <section className="contact-methods" aria-label="Contact options"><a href="https://wa.me/85292270884" target="_blank" rel="noreferrer"><small>WhatsApp</small><strong>Message us on WhatsApp</strong><span>+852 9227 0884</span></a><a href="tel:+85292270884"><small>Call us</small><strong>Call ROSÉ Concierge</strong><span>+852 9227 0884</span></a><a href="mailto:hello@rosehk.com"><small>Email</small><strong>Email our specialists</strong><span>hello@rosehk.com</span></a></section>
    <section className="contact-locations"><p className="micro-label">Our offices</p><div><address><small>Hong Kong</small><p>20/F IFC Tower One<br />Central, Hong Kong SAR</p></address><address><small>Dubai</small><p>DIFC, Gate Village 7<br />Dubai, UAE</p></address><address><small>Paris</small><p>18 Place Vendôme<br />75001 Paris, France</p></address></div></section>
    <section className="consultation-form-section" id="book-consultation"><div><p className="micro-label">Book a consultation</p><h2>Tell us what<br />you&apos;re looking for.</h2><p>Share a few details and a ROSÉ specialist will contact you personally.</p></div>{status === "sent" ? <div className="consultation-success" role="status"><p className="micro-label">Enquiry received</p><h3>Thank you.</h3><p>Your request has been sent to the ROSÉ concierge. A jewellery specialist will contact you personally.</p><button className="underlined-link" type="button" onClick={() => setStatus("idle")}>Send another enquiry</button></div> : <form className="consultation-form" onSubmit={submitEnquiry}><input type="hidden" name="_subject" value="New ROSÉ consultation request" /><label>Your name<input name="name" required autoComplete="name" /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" /></label><label>Where are you based?<input name="location" autoComplete="country-name" /></label><fieldset className="consultation-form-wide consultation-choice-group"><legend>I am interested in</legend><div><label><input type="radio" name="interest" value="Choosing a piece" checked={interest === "Choosing a piece"} onChange={(event) => setInterest(event.target.value)} /><span>Choosing a piece</span></label><label><input type="radio" name="interest" value="Bespoke" checked={interest === "Bespoke"} onChange={(event) => setInterest(event.target.value)} /><span>Bespoke</span></label><label><input type="radio" name="interest" value="Engagement and bridal" checked={interest === "Engagement and bridal"} onChange={(event) => setInterest(event.target.value)} /><span>Engagement &amp; bridal</span></label><label><input type="radio" name="interest" value="High jewellery" checked={interest === "High jewellery"} onChange={(event) => setInterest(event.target.value)} /><span>High jewellery</span></label><label><input type="radio" name="interest" value="Sizing or order support" checked={interest === "Sizing or order support"} onChange={(event) => setInterest(event.target.value)} /><span>Sizing or order support</span></label></div></fieldset><label className="consultation-form-wide">Your enquiry<textarea name="message" rows={4} /></label><fieldset className="consultation-form-wide consultation-preference"><legend>How would you like us to contact you?</legend><div><label><input type="radio" name="contact" value="WhatsApp" defaultChecked /><span>WhatsApp</span></label><label><input type="radio" name="contact" value="Email" /><span>Email</span></label><label><input type="radio" name="contact" value="Phone" /><span>Phone</span></label></div></fieldset>{status === "error" && <p className="consultation-form-error consultation-form-wide" role="alert">We could not send your request. Please try again or contact us on WhatsApp.</p>}<button className="button button-dark consultation-form-wide" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Send enquiry"}</button></form>}</section>
    <SiteFooter />
  </main>;
}
