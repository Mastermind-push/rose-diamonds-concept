import type { Metadata } from "next";
import BagView from "@/components/bag-view";

export const metadata: Metadata = { title: "Your Bag — ROSÉ Diamonds", description: "Review your selected ROSÉ Diamonds pieces." };

export default function BagPage() { return <BagView />; }
