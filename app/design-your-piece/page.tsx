import type { Metadata } from "next";
import DesignYourPieceView from "@/components/design-your-piece-view";

export const metadata: Metadata = {
  title: "Design Your Piece — ROSÉ Diamonds",
  description: "Create a one-of-one ROSÉ jewel through a private, personal commission.",
};

export default function DesignYourPiecePage() {
  return <DesignYourPieceView />;
}
