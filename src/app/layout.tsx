import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rogue Links: Practice Round",
  description: "A three-hole roguelike golf timing game."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
