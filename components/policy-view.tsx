import Link from "next/link";
import ClientPageHeader from "@/components/client-page-header";
import SiteFooter from "@/components/site-footer";
import type { Policy } from "@/data/policies";

export default function PolicyView({ policy }: { policy: Policy }) {
  return <main className="utility-page policy-page">
    <ClientPageHeader />
    <header className="policy-heading"><p className="micro-label">Legal &amp; Privacy</p><h1>{policy.title}</h1><span>{policy.updated}</span></header>
    <div className="policy-layout"><nav aria-label="Legal pages"><Link href="/policies/privacy">Privacy Policy</Link><Link href="/policies/terms-of-service">Terms of Service</Link><Link href="/policies/ethical-sourcing">Ethical Sourcing</Link><Link href="/policies/modern-slavery">Modern Slavery</Link><Link href="/policies/delivery-and-returns">Delivery &amp; Returns</Link></nav><article>{policy.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</article></div>
    <SiteFooter />
  </main>;
}
