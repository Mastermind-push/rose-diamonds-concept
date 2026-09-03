import type { Metadata } from "next";
import WishlistView from "@/components/wishlist-view";

export const metadata: Metadata = { title: "Wishlist — ROSÉ Diamonds", description: "Your saved ROSÉ Diamonds pieces." };

export default function WishlistPage() { return <WishlistView />; }
