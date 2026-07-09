import React from "react";
import { ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";
import HealthGauge from "@/components/HealthGauge";

/** Map HF → status-pill variant + neon glow class for the numeric readout. */
function hfState(hf) {
  if (hf == null) return { label: "NO DEBT", variant: "safe", neon: "neon-safe" };
  if (hf <= 1.0) return { label: "LIQUIDATABLE", variant: "danger", neon: "neon-danger" };
  if (hf <= 1.15) return { label: "DANGER", variant: "danger", neon: "neon-danger" };
  if (hf <= 1.5) return { label: "WARNING", variant: "warn", neon: "neon-warn" };
  return { label: "HEALTHY", variant: "safe", neon: "neon-safe" };
}

/** Top-left card: HF gauge + prominent status pill + stats. */
export default function HFCard({ position, hfFlash }) {
  const trigger = position?.automation?.trigger_hf ?? 1.15;
  const hf = position?.health_factor;
  const state = hfState(hf);

  return (
    <div className="card-glass p-5" data-testid="hf-card">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Health Factor
        </span>
        <span className={`status-pill status-pill--${state.variant}`} data-testid="hf-status-pill">
          <span className="dot" /> {state.label}
        </span>
      </div>

      {hfFlash && (
        <div className="flex justify-end -mt-2 mb-2">
          <span className={`badge ${hfFlash === "up" ? "badge-green" : "badge-red"} !text-[9.5px]`}>
            {hfFlash === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            hf tick
          </span>
        </div>
      )}

      <HealthGauge hf={hf} trigger={trigger} flash={hfFlash} neonClass={state.neon} />

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="Collateral" value={fmtUsd(position?.collateral_usd)} testid="stat-collateral" />
        <Stat label="Debt" value={fmtUsd(position?.debt_usd)} testid="stat-debt" />
        <Stat label="Available" value={fmtUsd(position?.available_borrow_usd)} testid="stat-available" />
      </div>
    </div>
  );
}

function fmtUsd(n) {
  return `$${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Stat({ label, value, testid }) {
  return (
    <div>
      <div className="section-label text-[9.5px]">{label}</div>
      <div className="mono text-sm text-foreground mt-1" data-testid={testid}>{value}</div>
    </div>
  );
}
