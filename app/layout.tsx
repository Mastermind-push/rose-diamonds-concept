import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROSÉ Diamonds — Brilliance, in every mood",
  description: "A high-fidelity homepage concept for expressive fine jewellery born in Hong Kong.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
