import React, { useEffect, useState } from "react";
import { Cpu, Zap } from "lucide-react";

export default function AutomationPanel({ position, onUpdate }) {
  const auto = position?.automation ?? { enabled: false, trigger_hf: 1.15, max_liquidation_pct: 0.35 };
  const { enabled: autoEnabled, trigger_hf: autoTrigger, max_liquidation_pct: autoMax } = auto;
  const [enabled, setEnabled] = useState(autoEnabled);
  const [trigger, setTrigger] = useState(autoTrigger);
  const [maxPct, setMaxPct] = useState(autoMax);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEnabled(autoEnabled);
    setTrigger(autoTrigger);
    setMaxPct(autoMax);
    setDirty(false);
  }, [autoEnabled, autoTrigger, autoMax]);

  const dirtyFlag = () => setDirty(true);

  const apply = () => {
    onUpdate({ enabled, trigger_hf: Number(trigger), max_liquidation_pct: Number(maxPct) });
    setDirty(false);
  };

  const lastCheck = auto.last_check ? new Date(auto.last_check).toLocaleTimeString() : "—";

  return (
    <div className="card-glass p-5" data-testid="automation-panel">
      <div className="flex items-center justify-between mb-4">
        <span className="section-label flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" /> Automation Engine
        </span>
        <span className={`status-pill ${enabled ? "status-pill--safe" : "status-pill--info"}`} data-testid="automation-status">
          <span className="dot" /> {enabled ? "ACTIVE" : "PAUSED"}
        </span>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm text-foreground">Auto Partial Liquidation</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Worker monitors HF every 6s. Executes on-chain when HF ≤ trigger.
          </div>
        </div>
        <div
          className={`toggle ${enabled ? "on" : ""}`}
          data-testid="automation-toggle"
          role="switch"
          aria-checked={enabled}
          onClick={() => { setEnabled(!enabled); dirtyFlag(); }}
        />
      </div>

      <div className="mt-4 space-y-4">
        <SliderRow
          label="Trigger HF"
          value={trigger}
          displayValue={Number(trigger).toFixed(2)}
          displayColor="steel"
          min="1.00" max="2.00" step="0.01"
          onChange={(v) => { setTrigger(v); dirtyFlag(); }}
          sliderTestId="trigger-slider"
          valueTestId="trigger-value"
          minLabel="1.00 liquidatable"
          maxLabel="2.00 safe"
        />
        <SliderRow
          label="Max Cut per Trigger"
          value={maxPct}
          displayValue={`${Math.round(maxPct * 100)}%`}
          displayColor="amber"
          min="0.05" max="0.75" step="0.05"
          onChange={(v) => { setMaxPct(v); dirtyFlag(); }}
          sliderTestId="maxpct-slider"
          valueTestId="max-pct-value"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <div className="mono text-[10.5px] text-muted-foreground">
          last check <span className="text-foreground">{lastCheck}</span>
        </div>
        <button
          className="btn-primary flex items-center gap-1.5"
          disabled={!dirty}
          onClick={apply}
          data-testid="automation-apply"
        >
          <Zap className="w-3 h-3" /> Apply
        </button>
      </div>
    </div>
  );
}

function SliderRow({
  label, value, displayValue, displayColor,
  min, max, step, onChange,
  sliderTestId, valueTestId,
  minLabel, maxLabel,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="section-label text-[10px]">{label}</span>
        <span className={`mono text-[12px] text-${displayColor}`} data-testid={valueTestId}>{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider"
        data-testid={sliderTestId}
      />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between mono text-[9px] text-muted-foreground mt-1">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

