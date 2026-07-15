import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PricingSection } from '../components/PricingSection';

// New specialized components for the global competition pitch
import { NewHeroSection } from '../components/landing/NewHeroSection';
import { ProblemSolution } from '../components/landing/ProblemSolution';
import { SmartMenuFlow } from '../components/landing/SmartMenuFlow';
import { WhatsAppAI } from '../components/landing/WhatsAppAI';
import { RestaurantOS } from '../components/landing/RestaurantOS';
import { WhyUs } from '../components/landing/WhyUs';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-main font-sans text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main>
        <NewHeroSection />
        <ProblemSolution />
        <SmartMenuFlow />
        <WhatsAppAI />
        <RestaurantOS />
        <WhyUs />
        {/* Kept existing pricing section as it already defines plans, might need theme adjustment later if requested */}
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
