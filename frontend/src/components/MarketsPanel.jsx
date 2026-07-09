import React from "react";
import { Activity, RefreshCw } from "lucide-react";
import MarketsTable from "@/components/MarketsTable";

/** Right column: markets table with header + refresh action. */
export default function MarketsPanel({ markets, onRefresh, onSupply, onBorrow }) {
  return (
    <div className="card-glass">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="section-label flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Markets · Stellar Testnet
        </span>
        <button
          data-testid="refresh-markets"
          onClick={onRefresh}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <MarketsTable markets={markets} onSupply={onSupply} onBorrow={onBorrow} />
    </div>
  );
}
