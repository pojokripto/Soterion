import React from "react";
import { ShieldAlert, Cpu, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: <ShieldAlert className="w-4 h-4" />,
    title: "Health Factor First",
    body: "A dramatic radial gauge is the centerpiece of every position. You always know your distance from liquidation.",
    color: "critical",
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    title: "AI Automation Engine",
    body: "A background worker polls your position every 6 seconds and triggers partial liquidation at your custom threshold.",
    color: "steel",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: "Powered by Stellar",
    body: "Real-time price feeds from Stellar Horizon. Simulated Soroban lending pool with production-grade risk math.",
    color: "terminal",
  },
];

export default function FeaturesSection() {
  return (
    <section className="border-y border-white/[0.06] relative z-10">
      <div className="max-w-[1440px] mx-auto px-6 py-16 grid grid-cols-12 gap-6">
        {FEATURES.map((f) => (
          <Feature key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function Feature({ icon, title, body, color }) {
  return (
    <div className="col-span-12 md:col-span-4 card-glass p-6">
      <div className={`w-8 h-8 rounded-sm border border-white/[0.08] flex items-center justify-center text-${color} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{body}</p>
    </div>
  );
}
