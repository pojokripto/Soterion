import React, { useMemo } from "react";
import { LineChart, Line } from "recharts";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function MarketsTable({ markets, onSupply, onBorrow }) {
  return (
    <div className="overflow-x-auto" data-testid="markets-table">
      <table className="w-full mono text-[12px]">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left px-5 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Asset</th>
            <th className="text-right px-3 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Price</th>
            <th className="text-right px-3 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Supply APY</th>
            <th className="text-right px-3 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Borrow APY</th>
            <th className="text-right px-3 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Utilization</th>
            <th className="text-right px-3 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Total Supplied</th>
            <th className="text-right px-5 py-2.5 font-normal text-[10.5px] uppercase tracking-[0.15em]">Action</th>
          </tr>
        </thead>
        <tbody>
          {markets.length === 0 && (
            <tr><td colSpan="7" className="text-center py-10 text-muted-foreground">Loading markets…</td></tr>
          )}
          {markets.map((m) => (
            <Row key={m.symbol} m={m} onSupply={onSupply} onBorrow={onBorrow} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ m, onSupply, onBorrow }) {
  const data = useMemo(() => (m.history || []).map((v, i) => ({ i, v })), [m.history]);
  const first = data[0]?.v ?? m.price;
  const last = data[data.length - 1]?.v ?? m.price;
  const up = last >= first;
  const changePct = first ? ((last - first) / first) * 100 : 0;

  return (
    <tr className="border-b border-border/60 hover:bg-white/[0.02] transition-colors" data-testid={`market-row-${m.symbol}`}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <AssetIcon sym={m.symbol} />
          <div>
            <div className="text-foreground font-semibold">{m.symbol}</div>
            <div className="text-[10px] text-muted-foreground sans">{m.name}</div>
          </div>
          <div className="w-16 h-8 ml-2">
            <LineChart width={64} height={32} data={data}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={up ? "hsl(var(--terminal-green))" : "hsl(var(--critical-red))"}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
        </div>
      </td>
      <td className="text-right px-3 py-3">
        <div className="text-foreground">${formatPrice(m.price)}</div>
        <div className={`text-[10px] ${up ? "text-terminal" : "text-critical"}`}>
          {up ? "+" : ""}{changePct.toFixed(2)}%
        </div>
      </td>
      <td className="text-right px-3 py-3 text-terminal">{m.supply_apy.toFixed(2)}%</td>
      <td className="text-right px-3 py-3 text-amber">{m.borrow_apy.toFixed(2)}%</td>
      <td className="text-right px-3 py-3">
        <div className="text-foreground">{(m.utilization * 100).toFixed(1)}%</div>
        <div className="h-1 bg-border w-16 ml-auto mt-1 relative overflow-hidden rounded-sm">
          <div className="absolute inset-y-0 left-0 bg-steel" style={{ width: `${Math.min(100, m.utilization * 100)}%` }} />
        </div>
      </td>
      <td className="text-right px-3 py-3 text-muted-foreground">{formatCompact(m.total_supplied)}</td>
      <td className="text-right px-5 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            className="btn-ghost !py-1 !px-2 flex items-center gap-1"
            onClick={() => onSupply(m.symbol)}
            data-testid={`supply-btn-${m.symbol}`}
          >
            <ArrowUpRight className="w-3 h-3" /> Supply
          </button>
          <button
            className="btn-ghost !py-1 !px-2 flex items-center gap-1"
            onClick={() => onBorrow(m.symbol)}
            data-testid={`borrow-btn-${m.symbol}`}
          >
            <ArrowDownLeft className="w-3 h-3" /> Borrow
          </button>
        </div>
      </td>
    </tr>
  );
}

function AssetIcon({ sym }) {
  const colors = {
    XLM: "hsl(217, 91%, 60%)",
    USDC: "hsl(210, 80%, 50%)",
    AQUA: "hsl(180, 76%, 45%)",
    yXLM: "hsl(268, 80%, 60%)",
  };
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center mono text-[10px] font-bold text-black flex-shrink-0"
      style={{ background: colors[sym] || "hsl(var(--foreground))" }}
    >
      {sym.slice(0, sym === "yXLM" ? 2 : 1)}
    </div>
  );
}

function formatPrice(p) {
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.01) return p.toFixed(5);
  return p.toFixed(6);
}
function formatCompact(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}
