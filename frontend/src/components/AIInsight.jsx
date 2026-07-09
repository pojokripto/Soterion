import React, { useState } from "react";
import { Terminal, Sparkles } from "lucide-react";

export default function AIInsight({ requestAI }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setText("");
    const res = await requestAI();
    setText(res || "");
    setLoading(false);
  };

  return (
    <div className="card-flat p-5" data-testid="ai-insight-panel">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> AI Risk Insights
        </span>
        <button
          className="btn-primary flex items-center gap-1.5 !py-1.5 !px-3 !text-[11px]"
          onClick={run}
          disabled={loading}
          data-testid="ai-run-btn"
        >
          <Terminal className="w-3 h-3" /> {loading ? "analyzing…" : "Analyze position"}
        </button>
      </div>
      <div className="terminal-log" data-testid="ai-insight-output">
        {loading && <span className="term-cursor">soterion@risk-agent<span className="ts"> ~$ </span>querying stellar oracle</span>}
        {!loading && !text && (
          <div className="text-muted-foreground text-[11.5px] leading-relaxed">
            <span className="info">$ </span>Run analysis to receive on-chain risk narrative powered by Claude Sonnet.
          </div>
        )}
        {!loading && text && (
          <pre className="whitespace-pre-wrap break-words text-[11.5px] leading-relaxed" data-testid="ai-insight-text">
            {text.split("\n").map((line, i) => {
              const lower = line.toLowerCase();
              let cls = "";
              if (lower.startsWith("risk level")) cls = "warn";
              else if (lower.startsWith("recommendation")) cls = "info";
              else if (lower.startsWith("market note")) cls = "ts";
              // Stable key from content + index prefix; lines can repeat, so include both.
              const key = `${i}:${line.slice(0, 24)}`;
              return (
                <div key={key} className={cls}>{line}</div>
              );
            })}
          </pre>
        )}
      </div>
    </div>
  );
}
