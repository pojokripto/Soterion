import React from "react";
import { Wallet, Activity, Terminal } from "lucide-react";
import { AssetLogo } from "@/components/AssetLogos";

const GRADIENT_STYLE = {
  backgroundImage: "linear-gradient(90deg,#22D3EE,#3B82F6,#A855F7)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const SUPPORTED = ["XLM", "USDC", "AQUA", "YXLM"];

export default function HeroSection({ onConnect, loading }) {
  return (
    <section className="max-w-[1440px] mx-auto px-6 pt-16 pb-20 grid grid-cols-12 gap-8 relative z-10">
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
        <span className="status-pill status-pill--safe self-start mb-6" data-testid="landing-live-badge">
          <span className="dot" /> LIVE ON STELLAR TESTNET
        </span>
        <h1 className="text-5xl md:text-6xl font-semibold leading-[1.02] tracking-[-0.03em]">
          Autonomous DeFi<br />
          <span style={GRADIENT_STYLE}>lending</span> on the Stellar network.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Soterion is a Soroban-powered lending market with an on-chain AI automation engine
          that monitors your health factor 24/7 and executes partial liquidations at your custom trigger —
          before the pool touches you.
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
            {SUPPORTED.map((sym) => (
              <AssetLogo key={sym} symbol={sym} size={26} />
            ))}
          </div>
        </div>
      </div>

      <TerminalPreview />
    </section>
  );
}

function TerminalPreview() {
  return (
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
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="border border-white/[0.06] rounded-sm px-3 py-2.5">
      <div className="section-label text-[9px]">{label}</div>
      <div className={`mono text-xl mt-1 ${accent ? `text-${accent}` : ""}`}>{value}</div>
    </div>
  );
}
