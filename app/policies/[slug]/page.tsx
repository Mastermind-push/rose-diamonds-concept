import type { Metadata } from "next";
import PolicyView from "@/components/policy-view";
import { policies, policiesBySlug } from "@/data/policies";

type PolicyPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return policies.map((policy) => ({ slug: policy.slug })); }

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = policiesBySlug[slug] ?? policies[0];
  return { title: `${policy.title} — ROSÉ Diamonds`, description: `${policy.title} for ROSÉ Diamonds and ROSÉ HK Limited.` };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  return <PolicyView policy={policiesBySlug[slug] ?? policies[0]} />;
}
