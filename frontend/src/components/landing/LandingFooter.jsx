import React from "react";
import SoterionLogo from "@/components/SoterionLogo";

/** Landing footer with brand attribution. */
export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] relative z-10">
      <div className="max-w-[1440px] mx-auto px-6 py-6 flex items-center justify-between text-[11px] mono text-muted-foreground">
        <span>© 2026 Soterion Labs · Stellar Testnet Simulation</span>
        <span className="flex items-center gap-2">
          <SoterionLogo size={14} glow={false} /> shielded by soterion
        </span>
      </div>
    </footer>
  );
}
