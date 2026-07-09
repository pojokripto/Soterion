import React from "react";
import { ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";
import HealthGauge from "@/components/HealthGauge";

/** Top-left card: HF gauge + collateral / debt / available stats. */
export default function HFCard({ position, hfFlash }) {
  const trigger = position?.automation?.trigger_hf ?? 1.15;
  return (
    <div className="card-flat p-5" data-testid="hf-card">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Health Factor
        </span>
        {hfFlash && (
          <span className={`badge ${hfFlash === "up" ? "badge-green" : "badge-red"}`}>
            {hfFlash === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            live
          </span>
        )}
      </div>
      <HealthGauge hf={position?.health_factor} trigger={trigger} flash={hfFlash} />
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="Collateral" value={`$${(position?.collateral_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} testid="stat-collateral" />
        <Stat label="Debt" value={`$${(position?.debt_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} testid="stat-debt" />
        <Stat label="Available" value={`$${(position?.available_borrow_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} testid="stat-available" />
      </div>
    </div>
  );
}

function Stat({ label, value, testid }) {
  return (
    <div>
      <div className="section-label text-[9.5px]">{label}</div>
      <div className="mono text-sm text-foreground mt-1" data-testid={testid}>{value}</div>
    </div>
  );
}
