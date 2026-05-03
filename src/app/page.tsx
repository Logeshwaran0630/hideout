import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Setups from "@/components/Setups";
import Games from "@/components/Games";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Setups />
        <Games />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}