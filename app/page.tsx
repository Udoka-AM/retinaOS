import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Pillars } from "@/components/sections/Pillars";
import { ProductSuite } from "@/components/sections/ProductSuite";
import { Flow } from "@/components/sections/Flow";
import { WalletApp } from "@/components/sections/WalletApp";
import { Features } from "@/components/sections/Features";
import { Pricing } from "@/components/sections/Pricing";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Pillars />
        <ProductSuite />
        <Flow />
        <WalletApp />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
