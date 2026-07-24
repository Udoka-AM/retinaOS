import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RevealController } from "@/components/RevealController";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RetinaOS — On-chain intelligence for Robinhood Chain",
  description:
    "The intelligence layer for Robinhood Chain. Real-time token discovery, wallet reputation scoring, and policy-governed execution. See what matters. Trade with confidence.",
  metadataBase: new URL("https://retinaos.app"),
  openGraph: {
    title: "RetinaOS — On-chain intelligence for Robinhood Chain",
    description:
      "Real-time token discovery, wallet reputation scoring, and policy-governed execution for Robinhood Chain.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <RevealController />
        {children}
      </body>
    </html>
  );
}
