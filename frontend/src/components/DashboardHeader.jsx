import React from "react";
import { LogOut } from "lucide-react";
import SoterionLogo from "@/components/SoterionLogo";

/** Sticky top navigation for the authenticated dashboard. */
export default function DashboardHeader({ wallet, onDisconnect }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-2xl">
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SoterionLogo size={28} dataTestId="header-logo" />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-[-0.02em] text-[15px] text-foreground">Soterion</span>
            <span className="mono text-[9.5px] tracking-[0.24em] text-muted-foreground uppercase">v1.0 · stellar</span>
          </div>
          <span className="ml-3 status-pill status-pill--safe" data-testid="network-status">
            <span className="dot" /> live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mono text-[11.5px]">
            <span className="text-muted-foreground">wallet</span>
            <span className="text-foreground" data-testid="header-wallet">
              {wallet.slice(0, 6)}…{wallet.slice(-6)}
            </span>
          </div>
          <button
            onClick={onDisconnect}
            data-testid="disconnect-btn"
            className="btn-ghost flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      </div>
    </header>
  );
}
