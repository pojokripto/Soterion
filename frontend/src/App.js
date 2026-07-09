import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Activity, Cpu, ShieldAlert, Terminal, Wallet, LogOut, Zap,
  ArrowUpRight, ArrowDownLeft, RefreshCw, TrendingUp, TrendingDown,
} from "lucide-react";
import HealthGauge from "@/components/HealthGauge";
import MarketsTable from "@/components/MarketsTable";
import AutomationPanel from "@/components/AutomationPanel";
import AIInsight from "@/components/AIInsight";
import PositionSummary from "@/components/PositionSummary";
import ActivityLog from "@/components/ActivityLog";
import LiquidationHistory from "@/components/LiquidationHistory";
import TxModal from "@/components/TxModal";
import Landing from "@/components/Landing";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND}/api`;

export default function App() {
  const [wallet, setWallet] = useState(() => localStorage.getItem("soterion_wallet") || null);
  const [position, setPosition] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [activity, setActivity] = useState([]);
  const [liquidations, setLiquidations] = useState([]);
  const [txModal, setTxModal] = useState(null); // {mode, asset}
  const [loading, setLoading] = useState(false);
  const prevHFRef = useRef(null);
  const [hfFlash, setHfFlash] = useState(null); // "up" | "down" | null

  const logErr = (label, err) => {
    if (process.env.NODE_ENV !== "production") console.error(label, err);
  };

  const fetchMarkets = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/markets`);
      setMarkets(data.assets);
    } catch (e) { logErr("markets", e); }
  }, []);

  const fetchPosition = useCallback(async (w) => {
    if (!w) return;
    try {
      const { data } = await axios.get(`${API}/position/${w}`);
      setPosition(data);
      if (data.health_factor != null && prevHFRef.current != null) {
        if (data.health_factor > prevHFRef.current) { setHfFlash("up"); setTimeout(() => setHfFlash(null), 800); }
        else if (data.health_factor < prevHFRef.current) { setHfFlash("down"); setTimeout(() => setHfFlash(null), 800); }
      }
      prevHFRef.current = data.health_factor;
    } catch (e) { logErr("position", e); }
  }, []);

  const fetchActivity = useCallback(async (w) => {
    if (!w) return;
    try {
      const [a, l] = await Promise.all([
        axios.get(`${API}/activity/${w}?limit=40`),
        axios.get(`${API}/liquidations/${w}?limit=20`),
      ]);
      setActivity(a.data.activity);
      setLiquidations(l.data.liquidations);
    } catch (e) { logErr("activity", e); }
  }, []);

  // Poll markets every 6s
  useEffect(() => {
    fetchMarkets();
    const id = setInterval(fetchMarkets, 6000);
    return () => clearInterval(id);
  }, [fetchMarkets]);

  // Poll position + activity when wallet is set
  useEffect(() => {
    if (!wallet) return;
    fetchPosition(wallet);
    fetchActivity(wallet);
    const id = setInterval(() => {
      fetchPosition(wallet);
      fetchActivity(wallet);
    }, 6000);
    return () => clearInterval(id);
  }, [wallet, fetchPosition, fetchActivity]);

  const connectWallet = async (mockAddress = null) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/wallet/connect`, { address: mockAddress });
      setWallet(data.address);
      localStorage.setItem("soterion_wallet", data.address);
      toast.success("Freighter wallet connected", { description: `${data.address.slice(0,6)}…${data.address.slice(-4)}` });
    } catch (e) {
      toast.error("Failed to connect wallet");
    } finally { setLoading(false); }
  };

  const disconnect = () => {
    setWallet(null);
    setPosition(null);
    setActivity([]);
    setLiquidations([]);
    localStorage.removeItem("soterion_wallet");
    toast.info("Disconnected");
  };

  const runTx = async (mode, asset, amount) => {
    try {
      const { data } = await axios.post(`${API}/${mode}`, { wallet, asset, amount: Number(amount) });
      setPosition(data);
      toast.success(`${mode.toUpperCase()} ${amount} ${asset} confirmed`);
      fetchActivity(wallet);
      fetchMarkets();
    } catch (e) {
      toast.error(e?.response?.data?.detail || `${mode} failed`);
      throw e;
    }
  };

  const updateAutomation = async (cfg) => {
    try {
      const { data } = await axios.post(`${API}/automation/config`, { wallet, ...cfg });
      setPosition(data);
      toast.success(`Automation ${cfg.enabled ? "enabled" : "paused"}`);
      fetchActivity(wallet);
    } catch (e) {
      toast.error("Automation update failed");
    }
  };

  const requestAI = async () => {
    try {
      const { data } = await axios.post(`${API}/ai/insight`, { wallet });
      return data.insight;
    } catch (e) {
      return "AI unavailable.";
    }
  };

  if (!wallet) {
    return (
      <div className="App">
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}} />
        <Landing onConnect={connectWallet} loading={loading} markets={markets} />
      </div>
    );
  }

  return (
    <div className="App" data-testid="app-dashboard">
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terminal pulse-green" />
              <span className="mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">SOTERION</span>
              <span className="mono text-[11px] text-terminal">/ v1.0 · stellar-testnet</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mono text-[11.5px]">
              <span className="text-muted-foreground">wallet</span>
              <span className="text-foreground" data-testid="header-wallet">
                {wallet.slice(0,6)}…{wallet.slice(-6)}
              </span>
            </div>
            <button
              onClick={disconnect}
              data-testid="disconnect-btn"
              className="btn-ghost flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-12 gap-4">
        {/* Left column: gauge + automation */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
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
            <HealthGauge
              hf={position?.health_factor}
              trigger={position?.automation?.trigger_hf ?? 1.15}
              flash={hfFlash}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Stat label="Collateral" value={`$${(position?.collateral_usd ?? 0).toLocaleString(undefined,{maximumFractionDigits:2})}`} testid="stat-collateral" />
              <Stat label="Debt" value={`$${(position?.debt_usd ?? 0).toLocaleString(undefined,{maximumFractionDigits:2})}`} testid="stat-debt" />
              <Stat label="Available" value={`$${(position?.available_borrow_usd ?? 0).toLocaleString(undefined,{maximumFractionDigits:2})}`} testid="stat-available" />
            </div>
          </div>

          <AutomationPanel
            position={position}
            onUpdate={updateAutomation}
          />

          <AIInsight requestAI={requestAI} position={position} />
        </section>

        {/* Right column: markets, position, logs */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="card-flat">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="section-label flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Markets · Stellar Testnet
              </span>
              <button
                data-testid="refresh-markets"
                onClick={fetchMarkets}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <MarketsTable
              markets={markets}
              onSupply={(sym) => setTxModal({ mode: "supply", asset: sym })}
              onBorrow={(sym) => setTxModal({ mode: "borrow", asset: sym })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PositionSummary
              position={position}
              markets={markets}
              onWithdraw={(sym) => setTxModal({ mode: "withdraw", asset: sym })}
              onRepay={(sym) => setTxModal({ mode: "repay", asset: sym })}
            />
            <ActivityLog activity={activity} />
          </div>

          <LiquidationHistory items={liquidations} />
        </section>
      </main>

      {txModal && (
        <TxModal
          mode={txModal.mode}
          asset={txModal.asset}
          markets={markets}
          position={position}
          onClose={() => setTxModal(null)}
          onSubmit={async (amt) => {
            await runTx(txModal.mode, txModal.asset, amt);
            setTxModal(null);
          }}
        />
      )}
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
