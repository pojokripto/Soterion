import React, { useState, useMemo } from "react";
import { X } from "lucide-react";

const LABELS = {
  supply: "Supply Collateral",
  withdraw: "Withdraw",
  borrow: "Borrow",
  repay: "Repay Debt",
};

export default function TxModal({ mode, asset, markets, position, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const market = useMemo(() => markets.find(m => m.symbol === asset), [markets, asset]);
  const price = market?.price ?? 0;

  let max = 0;
  let maxLabel = "";
  if (mode === "supply") {
    max = position?.balances?.[asset] ?? 0;
    maxLabel = "wallet balance";
  } else if (mode === "withdraw") {
    max = position?.supplied?.[asset] ?? 0;
    maxLabel = "supplied";
  } else if (mode === "borrow") {
    max = price > 0 ? (position?.available_borrow_usd ?? 0) / price : 0;
    maxLabel = "available";
  } else if (mode === "repay") {
    max = Math.min(position?.borrowed?.[asset] ?? 0, position?.balances?.[asset] ?? 0);
    maxLabel = "owed";
  }

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(amount);
    } catch (e) {
      // Toast is shown upstream; log here for debugging only.
      if (process.env.NODE_ENV !== "production") console.error("tx submit", e);
    } finally {
      setBusy(false);
    }
  };

  const usd = (parseFloat(amount) || 0) * price;

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="tx-modal">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-label">{LABELS[mode]}</div>
            <div className="mono text-lg mt-1">{asset}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] mono text-muted-foreground">
            <span>{maxLabel}</span>
            <button
              className="text-steel hover:underline"
              onClick={() => setAmount((max * 0.999999).toString())}
              data-testid="max-btn"
            >
              max {max.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </button>
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-testid="amount-input"
          />
          <div className="mono text-[11px] text-muted-foreground text-right">≈ ${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>

        <div className="mt-5 border-t border-border pt-4 space-y-2 mono text-[11px]">
          {market && (
            <>
              <Row k="Price" v={`$${price.toFixed(6)}`} />
              {mode === "supply" || mode === "withdraw" ? (
                <Row k="Supply APY" v={`${market.supply_apy.toFixed(2)}%`} accent="terminal" />
              ) : (
                <Row k="Borrow APY" v={`${market.borrow_apy.toFixed(2)}%`} accent="amber" />
              )}
              <Row k="LTV" v={`${(market.ltv * 100).toFixed(0)}%`} />
              <Row k="Liq. Threshold" v={`${(market.liquidation_threshold * 100).toFixed(0)}%`} />
            </>
          )}
        </div>

        <button
          className="btn-primary w-full mt-5"
          disabled={!amount || busy || parseFloat(amount) <= 0}
          onClick={submit}
          data-testid="tx-submit"
        >
          {busy ? "Broadcasting…" : `Confirm ${LABELS[mode]}`}
        </button>
      </div>
    </div>
  );
}

function Row({ k, v, accent }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={accent ? `text-${accent}` : ""}>{v}</span>
    </div>
  );
}
