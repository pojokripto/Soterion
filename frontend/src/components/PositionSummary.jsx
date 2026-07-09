import React from "react";
import { Wallet } from "lucide-react";

export default function PositionSummary({ position, markets, onWithdraw, onRepay }) {
  const supplied = Object.entries(position?.supplied ?? {}).filter(([, v]) => v > 0);
  const borrowed = Object.entries(position?.borrowed ?? {}).filter(([, v]) => v > 0);
  const priceOf = (sym) => markets.find(m => m.symbol === sym)?.price ?? 0;
  const balances = position?.balances ?? {};
  const interestEarned = position?.interest_earned ?? {};
  const interestPaid = position?.interest_paid ?? {};

  const totalEarnedUsd = Object.entries(interestEarned).reduce((s, [k, v]) => s + v * priceOf(k), 0);
  const totalPaidUsd = Object.entries(interestPaid).reduce((s, [k, v]) => s + v * priceOf(k), 0);

  return (
    <div className="card-glass" data-testid="position-summary">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="section-label flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5" /> Your Positions
        </span>
        <div className="mono text-[10.5px] text-muted-foreground flex gap-4">
          <span>earned <span className="text-terminal" data-testid="interest-earned-usd">+${totalEarnedUsd.toFixed(4)}</span></span>
          <span>paid <span className="text-amber" data-testid="interest-paid-usd">−${totalPaidUsd.toFixed(4)}</span></span>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <PositionRow
          title="Supplied"
          rows={supplied}
          priceOf={priceOf}
          onAction={onWithdraw}
          actionLabel="Withdraw"
          color="terminal"
          testidPrefix="supplied"
          interest={interestEarned}
          interestLabel="+"
          interestColor="terminal"
        />
        <PositionRow
          title="Borrowed"
          rows={borrowed}
          priceOf={priceOf}
          onAction={onRepay}
          actionLabel="Repay"
          color="amber"
          testidPrefix="borrowed"
          interest={interestPaid}
          interestLabel="−"
          interestColor="amber"
        />

        <div>
          <div className="section-label mb-2">Wallet Balance</div>
          <div className="grid grid-cols-2 gap-2 mono text-[11.5px]">
            {Object.entries(balances).map(([sym, v]) => (
              <div key={sym} className="flex items-center justify-between border border-border px-2.5 py-1.5 rounded-sm" data-testid={`bal-${sym}`}>
                <span className="text-muted-foreground">{sym}</span>
                <span className="text-foreground">{v.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionRow({ title, rows, priceOf, onAction, actionLabel, color, testidPrefix, interest, interestLabel, interestColor }) {
  return (
    <div>
      <div className="section-label mb-2">{title}</div>
      {rows.length === 0 && <div className="text-muted-foreground text-[11.5px] mono">— none —</div>}
      <div className="space-y-1.5">
        {rows.map(([sym, amt]) => {
          const acc = interest?.[sym] ?? 0;
          return (
            <div key={sym} className="flex items-center justify-between border border-border px-3 py-2 rounded-sm" data-testid={`${testidPrefix}-${sym}`}>
              <div className="mono text-[12px]">
                <span className={`text-${color}`}>{sym}</span>
                <span className="text-foreground ml-2">{amt.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                <span className="text-muted-foreground ml-2 text-[10px]">${(amt * priceOf(sym)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                {acc > 0 && (
                  <span className={`ml-2 text-[9.5px] text-${interestColor}`} data-testid={`${testidPrefix}-int-${sym}`}>
                    {interestLabel}{acc.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </span>
                )}
              </div>
              <button
                className="btn-ghost !py-1 !px-2 !text-[10.5px]"
                onClick={() => onAction(sym)}
                data-testid={`${testidPrefix}-action-${sym}`}
              >
                {actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
