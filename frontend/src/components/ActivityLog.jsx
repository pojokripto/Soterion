import React from "react";
import { Activity } from "lucide-react";

const KIND_STYLE = {
  supply: "info",
  withdraw: "info",
  borrow: "warn",
  repay: "",
  liquidation: "err",
  automation: "warn",
  wallet: "ts",
};

export default function ActivityLog({ activity }) {
  return (
    <div className="card-glass" data-testid="activity-log">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="section-label flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Activity Feed
        </span>
        <span className="mono text-[10px] text-muted-foreground">tail -f soterion.log</span>
      </div>
      <div className="p-3">
        <div className="terminal-log" style={{ maxHeight: 300 }}>
          {activity.length === 0 && <div className="text-muted-foreground">// no activity yet</div>}
          {activity.map((a) => {
            const cls = KIND_STYLE[a.kind] || "";
            const ts = new Date(a.ts).toLocaleTimeString();
            return (
              <div key={a.id} data-testid={`activity-${a.kind}`}>
                <span className="ts">[{ts}]</span>{" "}
                <span className={cls}>{a.kind.toUpperCase().padEnd(11, " ")}</span>{" "}
                <span>{a.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
