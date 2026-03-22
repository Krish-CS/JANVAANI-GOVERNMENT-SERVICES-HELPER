import { useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import SolutionSection from "./components/SolutionSection";
import HowItWorksSection from "./components/HowItWorksSection";
import ArchitectureSection from "./components/ArchitectureSection";
import ImpactSection from "./components/ImpactSection";
import DemoSection from "./components/DemoSection";
import Footer from "./components/Footer";

export default function App() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const openDemo = useCallback(() => {
    setIsDemoOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeDemo = useCallback(() => {
    setIsDemoOpen(false);
    document.body.style.overflow = "";
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950">
      <Navbar onDemoClick={openDemo} />

      <main>
        <HeroSection onDemoClick={openDemo} />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <ArchitectureSection />
        <ImpactSection />
      </main>

      <Footer />

      <DemoSection isOpen={isDemoOpen} onClose={closeDemo} />
    </div>
  );
}
