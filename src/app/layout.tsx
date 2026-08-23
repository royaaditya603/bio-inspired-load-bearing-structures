import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/ui/NavBar";

export const metadata: Metadata = {
  title: "Bio-Inspired Load-Bearing Structures",
  description:
    "Educational conceptual simulation demonstrating honeycomb and bone-inspired structural strategies — biomimicry project.",
  keywords: ["biomimicry", "honeycomb", "trabecular", "structural engineering", "simulation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main style={{ paddingTop: "64px" }}>{children}</main>
      </body>
    </html>
  );
}
