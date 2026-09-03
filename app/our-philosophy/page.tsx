import type { Metadata } from "next";
import PhilosophyView from "@/components/philosophy-view";

export const metadata: Metadata = {
  title: "Our Philosophy — ROSÉ Diamonds",
  description: "Jewellery for every mood, every energy and every version of you.",
};

export default function OurPhilosophyPage() {
  return <PhilosophyView />;
}
