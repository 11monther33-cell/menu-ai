import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Smile } from 'lucide-react';
const Footer = React.lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));
const PricingSection = React.lazy(() => import('../components/PricingSection').then(m => ({ default: m.PricingSection })));

// New specialized components for the global competition pitch
import { NewHeroSection } from '../components/landing/NewHeroSection';
import { AIChatDrawer } from '../components/qr/AIChatDrawer';
const ProblemSolution = React.lazy(() => import('../components/landing/ProblemSolution').then(m => ({ default: m.ProblemSolution })));
const SmartMenuFlow = React.lazy(() => import('../components/landing/SmartMenuFlow').then(m => ({ default: m.SmartMenuFlow })));
const WhatsAppAI = React.lazy(() => import('../components/landing/WhatsAppAI').then(m => ({ default: m.WhatsAppAI })));
const ComprehensiveFeatures = React.lazy(() => import('../components/landing/ComprehensiveFeatures').then(m => ({ default: m.ComprehensiveFeatures })));
const WhyUs = React.lazy(() => import('../components/landing/WhyUs').then(m => ({ default: m.WhyUs })));

const LandingPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-main font-sans text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main>
        <NewHeroSection />
        <React.Suspense fallback={null}>
          <ProblemSolution />
          <SmartMenuFlow />
          <WhatsAppAI />
          <ComprehensiveFeatures />
          <WhyUs />
          {/* Kept existing pricing section as it already defines plans, might need theme adjustment later if requested */}
          <PricingSection />
        </React.Suspense>
      </main>
      <React.Suspense fallback={null}>
        <Footer />
      </React.Suspense>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] bg-[#8B5CF6] text-white p-4 rounded-2xl shadow-2xl hover:bg-[#A78BFA] transition-all duration-300 flex items-center justify-center transform hover:scale-105"
        aria-label="Open AI Assistant"
      >
        <Smile className="w-8 h-8" />
      </button>

      {/* AI Chat Drawer */}
      <AIChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        branding={{ primary_color: '#8B5CF6' }} 
      />
    </div>
  );
};

export default LandingPage;
