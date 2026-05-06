import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Setups from "@/components/Setups";
import Games from "@/components/Games";
import Features from "@/components/Features";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Setups />
        <Games />
        <Features />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}