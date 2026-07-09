import React from "react";
import { Wallet } from "lucide-react";
import SoterionLogo from "@/components/SoterionLogo";

/** Public marketing header — used only by the pre-connect landing page. */
export default function LandingHeader({ onConnect, loading }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-2xl">
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SoterionLogo size={30} />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-[-0.02em] text-[15px] text-foreground">Soterion</span>
            <span className="mono text-[9.5px] tracking-[0.24em] text-muted-foreground uppercase">v1.0 · stellar</span>
          </div>
          <span className="ml-3 status-pill status-pill--safe !text-[9.5px] !px-2.5 !py-1">
            <span className="dot" /> live
          </span>
        </div>
        <button
          onClick={() => onConnect(null)}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
          data-testid="header-connect-btn"
        >
          <Wallet className="w-3.5 h-3.5" />
          {loading ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    </header>
  );
}
