import React from "react";
import { LogOut } from "lucide-react";

/** Sticky top navigation for the authenticated dashboard. */
export default function DashboardHeader({ wallet, onDisconnect }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-terminal pulse-green" />
          <span className="mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">SOTERION</span>
          <span className="mono text-[11px] text-terminal">/ v1.0 · stellar-testnet</span>
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
