import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Health factor semi-circular gauge with color zones and trigger point marker.
 * hf === null (no debt) → considered infinite / safe.
 * Zones:
 *   <= 1.0  danger (red)
 *   <= 1.25 warning (amber)
 *   >  1.25 safe (green)
 */
/** Zone thresholds mapped once to avoid nested ternaries in the render body. */
const ZONES = [
  { max: 1.0, label: "LIQUIDATABLE", badge: "badge-red" },
  { max: 1.15, label: "DANGER", badge: "badge-red" },
  { max: 1.5, label: "WARNING", badge: "badge-amber" },
  { max: Infinity, label: "SAFE", badge: "badge-green" },
];

function classifyZone(hf, noDebt) {
  if (noDebt) return ZONES[ZONES.length - 1];
  if (hf == null) return { label: "—", badge: "badge-red" };
  return ZONES.find((z) => hf <= z.max) ?? ZONES[ZONES.length - 1];
}

function flashClass(flash) {
  if (flash === "up") return "flash-up";
  if (flash === "down") return "flash-down";
  return "";
}

// Framer Motion config — extracted so props don't allocate every render.
const NEEDLE_TRANSITION = { type: "spring", stiffness: 90, damping: 14 };

export default function HealthGauge({ hf, trigger = 1.15, flash }) {
  const value = hf == null ? 2.5 : Math.min(hf, 2.5);
  const noDebt = hf == null;

  // Map value [0..2.5] → angle [-90 .. 90] (semicircle)
  const angleFor = (v) => -90 + (Math.min(Math.max(v, 0), 2.5) / 2.5) * 180;
  const needleAngle = angleFor(value);
  const triggerAngle = angleFor(Math.min(Math.max(trigger, 1.0), 2.5));

  const size = 260;
  const cx = size / 2;
  const cy = size * 0.62;
  const r = size * 0.4;
  const strokeW = 18;

  // Zone arcs as strokeDasharray
  const arc = (startDeg, endDeg, color, id) => {
    const start = polar(cx, cy, r, startDeg);
    const end = polar(cx, cy, r, endDeg);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return (
      <path
        key={id}
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
        stroke={color}
        strokeWidth={strokeW}
        fill="none"
        strokeLinecap="butt"
      />
    );
  };

  // Split into zones: -90..0 (0..1.25 → danger/warn) and 0..90 (1.25..2.5 → safe)
  const zoneRed = arc(-90, angleFor(1.0), "hsl(var(--critical-red))", "z-red");
  const zoneAmber = arc(angleFor(1.0), angleFor(1.25), "hsl(var(--amber-warning))", "z-amber");
  const zoneGreen = arc(angleFor(1.25), 90, "hsl(var(--terminal-green))", "z-green");

  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  useEffect(() => {
    if (noDebt) { setDisplay(0); displayRef.current = 0; return undefined; }
    let raf;
    const step = () => {
      const next = displayRef.current + (value - displayRef.current) * 0.18;
      displayRef.current = next;
      setDisplay(next);
      if (Math.abs(value - next) > 0.005) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, noDebt]);

  const zoneInfo = classifyZone(hf, noDebt);
  const zone = zoneInfo.label;
  const zoneClass = zoneInfo.badge;
  const needleStyle = { originX: `${cx}px`, originY: `${cy}px`, transformBox: "fill-box" };
  const needleAnimate = { rotate: noDebt ? 90 : needleAngle };

  return (
    <div className="flex flex-col items-center" data-testid="health-gauge">
      <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
        {/* Background track */}
        <path
          d={`M ${polar(cx, cy, r, -90).x} ${polar(cx, cy, r, -90).y} A ${r} ${r} 0 1 1 ${polar(cx, cy, r, 90).x} ${polar(cx, cy, r, 90).y}`}
          stroke="hsl(var(--border))"
          strokeWidth={strokeW}
          fill="none"
        />
        {zoneRed}
        {zoneAmber}
        {zoneGreen}

        {/* Trigger marker */}
        <TickMarker cx={cx} cy={cy} r={r} angle={triggerAngle} color="hsl(var(--steel-blue))" label={`trigger ${trigger.toFixed(2)}`} />

        {/* Needle */}
        <motion.g animate={needleAnimate} transition={NEEDLE_TRANSITION} style={needleStyle}>
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r + 4}
            stroke="hsl(var(--foreground))"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={5} fill="hsl(var(--foreground))" />
        </motion.g>
      </svg>

      <div className="flex flex-col items-center -mt-6">
        <div className={`mono text-[42px] font-semibold leading-none ${flashClass(flash)}`} data-testid="hf-value">
          {noDebt ? "∞" : display.toFixed(3)}
        </div>
        <div className="mt-1 mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Health Factor</div>
        <div className={`badge ${zoneClass} mt-3`}>{zone}</div>
      </div>

      <div className="grid grid-cols-3 w-full mt-4 gap-2 mono text-[10.5px] text-muted-foreground">
        <Legend color="critical-red" label="≤1.00 LIQ" />
        <Legend color="amber-warning" label="≤1.25 WARN" />
        <Legend color="terminal-green" label=">1.25 SAFE" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm" style={{ background: `hsl(var(--${color}))` }} />
      <span>{label}</span>
    </div>
  );
}

function TickMarker({ cx, cy, r, angle, color, label }) {
  const inner = polar(cx, cy, r - 14, angle);
  const outer = polar(cx, cy, r + 12, angle);
  const labelPos = polar(cx, cy, r + 22, angle);
  return (
    <g>
      <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={color} strokeWidth={2} />
      <text
        x={labelPos.x}
        y={labelPos.y}
        fill={color}
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="0.05em"
      >
        {label}
      </text>
    </g>
  );
}

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
