import React from "react";
import { Wallet } from "lucide-react";
import { AssetLogo } from "@/components/AssetLogos";

const HEAD_COLS = [
  { label: "Asset", align: "left", cls: "px-5" },
  { label: "Price", align: "right", cls: "px-3" },
  { label: "Supply APY", align: "right", cls: "px-3" },
  { label: "Borrow APY", align: "right", cls: "px-3" },
  { label: "Utilization", align: "right", cls: "px-5" },
];

const fmtPrice = (p) => (p >= 1 ? p.toFixed(4) : p.toFixed(6));

export default function LiveMarketsPreview({ markets, onConnect }) {
  return (
    <section id="markets" className="max-w-[1440px] mx-auto px-6 py-16 relative z-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="section-label">Live Markets</div>
          <h2 className="text-3xl mt-1 font-semibold tracking-tight">Real-time Stellar rates</h2>
        </div>
        <button
          onClick={() => onConnect(null)}
          className="btn-primary flex items-center gap-2"
          data-testid="footer-connect-btn"
        >
          <Wallet className="w-3.5 h-3.5" /> Connect to trade
        </button>
      </div>

      <div className="card-glass overflow-hidden">
        <table className="w-full mono text-[12.5px]">
          <thead className="border-b border-white/[0.06]">
            <tr className="text-muted-foreground">
              {HEAD_COLS.map((c) => (
                <th key={c.label} className={`text-${c.align} ${c.cls} py-3 font-normal text-[10.5px] uppercase tracking-[0.15em]`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-10 text-muted-foreground">Loading Stellar rates…</td></tr>
            ) : (
              markets.map((m) => <MarketRow key={m.symbol} m={m} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MarketRow({ m }) {
  return (
    <tr className="border-b border-white/[0.04]">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={m.symbol} size={26} />
          <div>
            <div className="text-foreground font-semibold">{m.symbol}</div>
            <div className="text-[10px] text-muted-foreground sans">{m.name}</div>
          </div>
        </div>
      </td>
      <td className="text-right px-3 py-3">${fmtPrice(m.price)}</td>
      <td className="text-right px-3 py-3 text-terminal">{m.supply_apy.toFixed(2)}%</td>
      <td className="text-right px-3 py-3 text-amber">{m.borrow_apy.toFixed(2)}%</td>
      <td className="text-right px-5 py-3">{(m.utilization * 100).toFixed(1)}%</td>
    </tr>
  );
}
