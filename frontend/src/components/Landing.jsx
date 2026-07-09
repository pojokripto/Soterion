import React from "react";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import LiveMarketsPreview from "@/components/landing/LiveMarketsPreview";
import LandingFooter from "@/components/landing/LandingFooter";

/**
 * Pre-connect landing page. Kept intentionally small: it just composes
 * the marketing sections and passes them the connect handler.
 */
export default function Landing({ onConnect, loading, markets }) {
  return (
    <div className="min-h-screen scanlines" data-testid="landing">
      <LandingHeader onConnect={onConnect} loading={loading} />
      <HeroSection onConnect={onConnect} loading={loading} />
      <FeaturesSection />
      <LiveMarketsPreview markets={markets} onConnect={onConnect} />
      <LandingFooter />
    </div>
  );
}
