import React from "react";
import { Wallet, ShieldAlert, Cpu, Activity, Zap, Terminal } from "lucide-react";
import SoterionLogo from "@/components/SoterionLogo";
import { AssetLogo } from "@/components/AssetLogos";

export default function Landing({ onConnect, loading, markets }) {
  return (
    <div className="min-h-screen scanlines" data-testid="landing">
      {/* Header */}
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

      {/* Hero */}
      <section className="max-w-[1440px] mx-auto px-6 pt-16 pb-20 grid grid-cols-12 gap-8 relative z-10">
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
          <span className="status-pill status-pill--safe self-start mb-6" data-testid="landing-live-badge">
            <span className="dot" /> LIVE ON STELLAR TESTNET
          </span>
          <h1 className="text-5xl md:text-6xl font-semibold leading-[1.02] tracking-[-0.03em]">
            Autonomous DeFi<br />
            <span
              style={{
                backgroundImage: "linear-gradient(90deg,#22D3EE,#3B82F6,#A855F7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >lending</span> on the Stellar network.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Soterion is a Soroban-powered lending market with an on-chain AI automation engine
            that monitors your health factor 24/7 and executes partial liquidations at your custom trigger — before the pool touches you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onConnect(null)}
              disabled={loading}
              className="btn-primary flex items-center gap-2 !text-sm !py-3 !px-5"
              data-testid="hero-connect-btn"
            >
              <Wallet className="w-4 h-4" />
              {loading ? "Connecting…" : "Connect Freighter"}
            </button>
            <a href="#markets" className="btn-ghost flex items-center gap-2 !text-sm !py-3 !px-5" data-testid="view-markets-btn">
              <Activity className="w-4 h-4" /> View Markets
            </a>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
            <MiniStat label="TVL" value="$18.4M" />
            <MiniStat label="Assets" value="4" />
            <MiniStat label="Automation" value="AI" accent="terminal" />
          </div>

          <div className="mt-10 flex items-center gap-3">
            <span className="section-label">Supported</span>
            <div className="flex items-center gap-2">
              <AssetLogo symbol="XLM" size={26} />
              <AssetLogo symbol="USDC" size={26} />
              <AssetLogo symbol="AQUA" size={26} />
              <AssetLogo symbol="YXLM" size={26} />
            </div>
          </div>
        </div>

        {/* Terminal preview */}
        <div className="col-span-12 lg:col-span-5">
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" /> soterion.automation
              </span>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-critical/70" />
                <span className="w-2 h-2 rounded-full bg-amber/70" />
                <span className="w-2 h-2 rounded-full bg-terminal/70" />
              </div>
            </div>
            <div className="terminal-log" style={{ maxHeight: 320 }}>
              <div><span className="ts">[00:00:01]</span> <span className="info">INIT</span> soterion worker online · polling stellar/soroban</div>
              <div><span className="ts">[00:00:02]</span> <span className="info">FEED</span> XLM/USDC price = 0.1150 · borrow_apy = 5.81%</div>
              <div><span className="ts">[00:00:03]</span> USER GA5Z…KZVN supplied 1200 XLM as collateral</div>
              <div><span className="ts">[00:00:04]</span> USER GA5Z…KZVN borrowed 68 USDC · HF=1.42</div>
              <div><span className="ts">[00:00:12]</span> <span className="warn">AUTO</span> trigger set: HF ≤ 1.20 · max cut = 35%</div>
              <div><span className="ts">[00:03:18]</span> <span className="warn">DRIFT</span> XLM -2.4% · new HF=1.18</div>
              <div><span className="ts">[00:03:18]</span> <span className="err">LIQ</span>  partial liquidation fired · repaid 23.8 USDC · seized 224 XLM</div>
              <div><span className="ts">[00:03:19]</span> <span className="info">OK</span> post-tx HF=1.31 · position safe<span className="term-cursor"></span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-white/[0.06] relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 py-16 grid grid-cols-12 gap-6">
          <Feature
            icon={<ShieldAlert className="w-4 h-4" />}
            title="Health Factor First"
            body="A dramatic radial gauge is the centerpiece of every position. You always know your distance from liquidation."
            color="critical"
          />
          <Feature
            icon={<Cpu className="w-4 h-4" />}
            title="AI Automation Engine"
            body="A background worker polls your position every 6 seconds and triggers partial liquidation at your custom threshold."
            color="steel"
          />
          <Feature
            icon={<Zap className="w-4 h-4" />}
            title="Powered by Stellar"
            body="Real-time price feeds from Stellar Horizon. Simulated Soroban lending pool with production-grade risk math."
            color="terminal"
          />
        </div>
      </section>

      {/* Live markets preview */}
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
                <th className="text-left px-5 py-3 font-normal text-[10.5px] uppercase tracking-[0.15em]">Asset</th>
                <th className="text-right px-3 py-3 font-normal text-[10.5px] uppercase tracking-[0.15em]">Price</th>
                <th className="text-right px-3 py-3 font-normal text-[10.5px] uppercase tracking-[0.15em]">Supply APY</th>
                <th className="text-right px-3 py-3 font-normal text-[10.5px] uppercase tracking-[0.15em]">Borrow APY</th>
                <th className="text-right px-5 py-3 font-normal text-[10.5px] uppercase tracking-[0.15em]">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={m.symbol} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={m.symbol} size={26} />
                      <div>
                        <div className="text-foreground font-semibold">{m.symbol}</div>
                        <div className="text-[10px] text-muted-foreground sans">{m.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right px-3 py-3">${m.price >= 1 ? m.price.toFixed(4) : m.price.toFixed(6)}</td>
                  <td className="text-right px-3 py-3 text-terminal">{m.supply_apy.toFixed(2)}%</td>
                  <td className="text-right px-3 py-3 text-amber">{m.borrow_apy.toFixed(2)}%</td>
                  <td className="text-right px-5 py-3">{(m.utilization * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {markets.length === 0 && (
                <tr><td colSpan="5" className="text-center py-10 text-muted-foreground">Loading Stellar rates…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex items-center justify-between text-[11px] mono text-muted-foreground">
          <span>© 2026 Soterion Labs · Stellar Testnet Simulation</span>
          <span className="flex items-center gap-2">
            <SoterionLogo size={14} glow={false} /> shielded by soterion
          </span>
        </div>
      </footer>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="border border-border rounded-sm px-3 py-2.5">
      <div className="section-label text-[9px]">{label}</div>
      <div className={`mono text-xl mt-1 ${accent ? `text-${accent}` : ""}`}>{value}</div>
    </div>
  );
}

function Feature({ icon, title, body, color }) {
  return (
    <div className="col-span-12 md:col-span-4 card-glass p-6">
      <div className={`w-8 h-8 rounded-sm border border-white/[0.08] flex items-center justify-center text-${color} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{body}</p>
    </div>
  );
}
