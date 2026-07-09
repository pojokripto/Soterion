import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import SoterionLogo from "@/components/SoterionLogo";
import { XLMLogo, USDCLogo, AQUALogo, YXLMLogo } from "@/components/AssetLogos";

/**
 * Cursor-tracking parallax backdrop.
 *
 * A single fixed layer that captures pointer position on window and translates each
 * decorative logo by a small factor proportional to its depth. Uses framer-motion's
 * spring physics so the reaction feels floaty, not jittery.
 *
 * IMPORTANT: this layer has `pointer-events: none` so it never blocks the UI.
 */

// Positions are px offsets from centre — depth is the parallax coefficient
// (higher = moves more with the cursor). We pick a spread that keeps logos in view
// on typical viewports and avoids the central content column.
const NODES = [
  { Comp: SoterionLogo,  size: 220, x: "-42vw", y: "-22vh", depth: 0.9, opacity: 0.09, rotate: -6 },
  { Comp: SoterionLogo,  size: 140, x:  "40vw", y:  "26vh", depth: 1.6, opacity: 0.08, rotate: 12 },
  { Comp: XLMLogo,       size:  84, x: "-34vw", y:  "22vh", depth: 1.2, opacity: 0.35, rotate:  0 },
  { Comp: USDCLogo,      size:  70, x:  "36vw", y: "-24vh", depth: 1.0, opacity: 0.32, rotate:  4 },
  { Comp: AQUALogo,      size:  62, x: "-18vw", y: "-32vh", depth: 1.9, opacity: 0.30, rotate: -8 },
  { Comp: YXLMLogo,      size:  56, x:  "22vw", y:  "34vh", depth: 2.1, opacity: 0.28, rotate: 10 },
  { Comp: XLMLogo,       size:  46, x:  "48vw", y:   "2vh", depth: 2.4, opacity: 0.22, rotate: -4 },
  { Comp: AQUALogo,      size:  40, x: "-48vw", y:   "4vh", depth: 2.6, opacity: 0.22, rotate:  6 },
];

// Physics: soft, floaty spring – reads as background parallax, not follow-cursor.
const SPRING = { stiffness: 40, damping: 18, mass: 0.9 };

export default function ParallaxBackdrop() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, SPRING);
  const sy = useSpring(my, SPRING);

  useEffect(() => {
    const handle = (e) => {
      // Normalise to [-1, 1] around the viewport centre.
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mx.set(nx);
      my.set(ny);
    };
    window.addEventListener("pointermove", handle, { passive: true });
    return () => window.removeEventListener("pointermove", handle);
  }, [mx, my]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden data-testid="parallax-backdrop">
      {/* Radial spotlight to add depth behind logos */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(34,211,238,0.06) 0%, rgba(124,58,237,0.04) 30%, transparent 65%)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 w-0 h-0">
        {NODES.map((n, i) => (
          <ParallaxNode key={i} node={n} sx={sx} sy={sy} />
        ))}
      </div>
    </div>
  );
}

function ParallaxNode({ node, sx, sy }) {
  const { Comp, size, x, y, depth, opacity, rotate } = node;
  // depth in px — larger negative range = deeper (moves more).
  const range = 26 * depth;
  const tx = useTransform(sx, [-1, 1], [-range, range]);
  const ty = useTransform(sy, [-1, 1], [-range, range]);
  return (
    <motion.div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translateX: tx,
        translateY: ty,
        rotate,
        opacity,
        filter: "drop-shadow(0 0 12px rgba(34,211,238,0.25))",
      }}
    >
      <Comp size={size} />
    </motion.div>
  );
}
