import React from "react";

/**
 * Minimal, on-brand SVG logos for Stellar-native assets. Each is a 40x40 viewBox
 * with subtle neon-friendly gradients — usable in the markets table, backdrop, or modals.
 */

function Base({ children, size = 40, testId, gradient }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" data-testid={testId} role="img">
      {gradient}
      {children}
    </svg>
  );
}

export function XLMLogo({ size = 40, testId = "logo-xlm" }) {
  const id = React.useId();
  return (
    <Base
      size={size}
      testId={testId}
      gradient={
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      }
    >
      <circle cx="20" cy="20" r="18" fill="#050A18" stroke={`url(#${id})`} strokeWidth="1.3" />
      {/* Stellar rocket wing */}
      <path
        d="M8 14 L32 24 M32 14 L8 24"
        stroke={`url(#${id})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="20" cy="19" r="2.4" fill={`url(#${id})`} />
    </Base>
  );
}

export function USDCLogo({ size = 40, testId = "logo-usdc" }) {
  const id = React.useId();
  return (
    <Base
      size={size}
      testId={testId}
      gradient={
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      }
    >
      <circle cx="20" cy="20" r="18" fill="#050A18" stroke={`url(#${id})`} strokeWidth="1.3" />
      {/* Stylised dollar */}
      <path
        d="M20 10 V30 M16 14 H23 A2.4 2.4 0 0 1 25.4 16.4 A2.4 2.4 0 0 1 23 18.8 H17 A2.4 2.4 0 0 0 14.6 21.2 A2.4 2.4 0 0 0 17 23.6 H24"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  );
}

export function AQUALogo({ size = 40, testId = "logo-aqua" }) {
  const id = React.useId();
  return (
    <Base
      size={size}
      testId={testId}
      gradient={
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
      }
    >
      <circle cx="20" cy="20" r="18" fill="#050A18" stroke={`url(#${id})`} strokeWidth="1.3" />
      {/* Water droplet + wave */}
      <path
        d="M20 9 C25 15 27 19 27 22.5 A7 7 0 1 1 13 22.5 C13 19 15 15 20 9 Z"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 27 C16 26 18 27 20 26.5 C22 26 24 27 26 26"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </Base>
  );
}

export function YXLMLogo({ size = 40, testId = "logo-yxlm" }) {
  const id = React.useId();
  return (
    <Base
      size={size}
      testId={testId}
      gradient={
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      }
    >
      <circle cx="20" cy="20" r="18" fill="#050A18" stroke={`url(#${id})`} strokeWidth="1.3" />
      {/* Y prong + XLM cross underneath */}
      <path
        d="M12 12 L20 20 L28 12 M20 20 V30"
        stroke={`url(#${id})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M15 26 L25 30 M25 26 L15 30"
        stroke={`url(#${id})`}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.65"
      />
    </Base>
  );
}

export function AssetLogo({ symbol, size = 32, testId }) {
  const s = (symbol || "").toUpperCase();
  const t = testId || `asset-logo-${s.toLowerCase()}`;
  if (s === "XLM") return <XLMLogo size={size} testId={t} />;
  if (s === "USDC") return <USDCLogo size={size} testId={t} />;
  if (s === "AQUA") return <AQUALogo size={size} testId={t} />;
  if (s === "YXLM") return <YXLMLogo size={size} testId={t} />;
  return null;
}
