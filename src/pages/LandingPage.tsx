import React from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { MarketingROI } from '../components/MarketingROI';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { PricingSection } from '../components/PricingSection';
import { QrSection } from '../components/QrSection';
import { Footer } from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-main">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <MarketingROI />
        <FeaturesGrid />
        <QrSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
