import React from "react";
import { ShieldAlert } from "lucide-react";

export default function LiquidationHistory({ items }) {
  return (
    <div className="card-flat" data-testid="liquidation-history">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <span className="section-label flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Liquidation History
        </span>
        <span className="mono text-[10px] text-muted-foreground">auto-triggered partial liquidations</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full mono text-[11.5px]">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left px-5 py-2.5 font-normal text-[10px] uppercase tracking-[0.15em]">Time</th>
              <th className="text-left px-3 py-2.5 font-normal text-[10px] uppercase tracking-[0.15em]">Reason</th>
              <th className="text-right px-3 py-2.5 font-normal text-[10px] uppercase tracking-[0.15em]">Debt Repaid</th>
              <th className="text-right px-3 py-2.5 font-normal text-[10px] uppercase tracking-[0.15em]">Collateral Seized</th>
              <th className="text-right px-5 py-2.5 font-normal text-[10px] uppercase tracking-[0.15em]">Bonus</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan="5" className="text-center py-6 text-muted-foreground">No liquidations yet.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-b border-border/60" data-testid={`liq-${it.id}`}>
                <td className="px-5 py-2 text-muted-foreground">{new Date(it.ts).toLocaleString()}</td>
                <td className="px-3 py-2 text-amber">{it.reason}</td>
                <td className="px-3 py-2 text-right">
                  <div>{it.debt_repaid.toFixed(4)} <span className="text-muted-foreground">{it.debt_asset}</span></div>
                  <div className="text-[10px] text-muted-foreground">${it.debt_repaid_usd.toFixed(2)}</div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="text-critical">{it.collateral_seized.toFixed(4)} <span className="text-muted-foreground">{it.collateral_asset}</span></div>
                  <div className="text-[10px] text-muted-foreground">${it.collateral_seized_usd.toFixed(2)}</div>
                </td>
                <td className="px-5 py-2 text-right">{Math.round(it.liquidation_bonus_pct * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
