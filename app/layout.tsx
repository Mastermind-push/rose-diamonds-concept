import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROSÉ Diamonds — Diamonds that reflect you",
  description: "Fine diamonds, expressive colour and jewellery made personal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
