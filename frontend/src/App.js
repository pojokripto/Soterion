import React, { useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import useSoterionData from "@/hooks/useSoterionData";
import Landing from "@/components/Landing";
import DashboardHeader from "@/components/DashboardHeader";
import HFCard from "@/components/HFCard";
import MarketsPanel from "@/components/MarketsPanel";
import AutomationPanel from "@/components/AutomationPanel";
import AIInsight from "@/components/AIInsight";
import PositionSummary from "@/components/PositionSummary";
import ActivityLog from "@/components/ActivityLog";
import LiquidationHistory from "@/components/LiquidationHistory";
import TxModal from "@/components/TxModal";

// Extracted constant to avoid re-creating on every render (react-perf lint).
const TOAST_OPTIONS = {
  style: { fontFamily: "JetBrains Mono, monospace", fontSize: "12px" },
};

export default function App() {
  const {
    wallet, markets, position, activity, liquidations, loading, hfFlash,
    refreshMarkets, connect, disconnect, runTx, updateAutomation, requestAI,
  } = useSoterionData();

  const [txModal, setTxModal] = useState(null);

  if (!wallet) {
    return (
      <div className="App">
        <Toaster theme="dark" position="bottom-right" toastOptions={TOAST_OPTIONS} />
        <Landing onConnect={connect} loading={loading} markets={markets} />
      </div>
    );
  }

  const handleTx = async (amount) => {
    await runTx(txModal.mode, txModal.asset, amount);
    setTxModal(null);
  };

  return (
    <div className="App" data-testid="app-dashboard">
      <Toaster theme="dark" position="bottom-right" toastOptions={TOAST_OPTIONS} />
      <DashboardHeader wallet={wallet} onDisconnect={disconnect} />

      <main className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-12 gap-4">
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <HFCard position={position} hfFlash={hfFlash} />
          <AutomationPanel position={position} onUpdate={updateAutomation} />
          <AIInsight requestAI={requestAI} />
        </section>

        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <MarketsPanel
            markets={markets}
            onRefresh={refreshMarkets}
            onSupply={(sym) => setTxModal({ mode: "supply", asset: sym })}
            onBorrow={(sym) => setTxModal({ mode: "borrow", asset: sym })}
          />

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
          onSubmit={handleTx}
        />
      )}
    </div>
  );
}
