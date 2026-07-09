import React from "react";

/**
 * Soterion mark — a hexagonal shield fused with a stylised digital "S" and
 * a Stellar rocket-trail accent. Two-tone electric-cyan / violet neon.
 *
 * Props:
 *   size:    px width (height auto-scales to preserve aspect)
 *   glow:    add SVG filter glow
 *   className: passthrough for layout
 *   dataTestId: test hook
 */
export default function SoterionLogo({ size = 40, glow = true, className = "", dataTestId }) {
  const gid = React.useId();
  const glowId = `${gid}-glow`;
  const linearId = `${gid}-linear`;
  const strokeId = `${gid}-stroke`;
  const trailId = `${gid}-trail`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={dataTestId}
      role="img"
      aria-label="Soterion"
    >
      <defs>
        <linearGradient id={linearId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={trailId} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67E8F9" stopOpacity="0" />
          <stop offset="70%" stopColor="#67E8F9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        {glow && (
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={glow ? `url(#${glowId})` : undefined}>
        {/* Shield outline (hex with concave base) */}
        <path
          d="M32 3 L57 14 V32 C57 46 45.5 55.5 32 61 C18.5 55.5 7 46 7 32 V14 Z"
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Inner sunken shield with subtle fill */}
        <path
          d="M32 9 L52 17.5 V31 C52 43 43 51 32 55.5 C21 51 12 43 12 31 V17.5 Z"
          fill={`url(#${linearId})`}
          fillOpacity="0.08"
          stroke={`url(#${linearId})`}
          strokeOpacity="0.35"
          strokeWidth="0.75"
        />

        {/* Digital "S" — two blocky counter-strokes with a comet trail */}
        <path
          d="M23 22 H41 A2 2 0 0 1 43 24 V27.5 A2 2 0 0 1 41 29.5 H26 A2 2 0 0 0 24 31.5 V33.5 A2 2 0 0 0 26 35.5 H41 A2 2 0 0 1 43 37.5 V41.5 A2 2 0 0 1 41 43.5 H23"
          fill="none"
          stroke={`url(#${linearId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Rocket comet trail crossing behind the S */}
        <path
          d="M14 46 C22 42 30 40 44 38"
          fill="none"
          stroke={`url(#${trailId})`}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Rocket tip / spark */}
        <circle cx="45" cy="37.7" r="1.4" fill="#67E8F9" />
        <circle cx="45" cy="37.7" r="2.6" fill="#67E8F9" fillOpacity="0.35" />

        {/* Corner tick marks — data-terminal vibe */}
        <path d="M12 14 L12 11 L15 11" stroke={`url(#${strokeId})`} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M52 14 L52 11 L49 11" stroke={`url(#${strokeId})`} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Compact wordmark with mark + name for headers. */
export function SoterionWordmark({ size = 22 }) {
  return (
    <div className="flex items-center gap-2.5">
      <SoterionLogo size={size} />
      <span
        className="font-semibold tracking-[-0.02em] text-foreground"
        style={{ fontSize: `${Math.round(size * 0.72)}px` }}
      >
        Soterion
      </span>
    </div>
  );
}
