"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useReducedMotion, animate, useMotionValue, useTransform } from "framer-motion";
import { LanguageVerdict, isVerdictOk, isSignalError } from "@/lib/types";

interface VerdictCardProps {
  verdict: LanguageVerdict;
}

/** Counts a motion value from 0 to target and rounds it for display. */
function AnimatedNumber({ target }: { target: number }) {
  const motionVal = useMotionValue(0);
  const rounded   = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    rounded.on("change", (v) => setDisplay(v));
    const controls = animate(motionVal, target, { duration: 1, ease: "easeOut" });
    return controls.stop;
  }, [target, motionVal, rounded]);

  return <>{display}</>;
}

export default function VerdictCard({ verdict }: VerdictCardProps) {
  const shouldReduce = useReducedMotion();
  const barControls  = useAnimation();
  const barStarted   = useRef(false);

  const isOk    = isVerdictOk(verdict);
  const isError = isSignalError(verdict);

  const label      = isOk ? verdict.label : null;
  const confidence = isOk ? verdict.confidence : null;
  const isFake     = label === "Fake";
  const accent     = isFake ? "#A13D3D" : "#2F6B4F";

  useEffect(() => {
    if (confidence !== null && !barStarted.current) {
      barStarted.current = true;
      barControls.start({
        width: `${confidence}%`,
        transition: { duration: 0.9, ease: "easeOut" },
      });
    }
  }, [confidence, barControls]);

  const stampVariants = shouldReduce
    ? {
        hidden:  { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden:  { opacity: 0, scale: 0.6, rotate: -8, y: 10 },
        visible: {
          opacity: 1, scale: 1, rotate: 0, y: 0,
          transition: { type: "spring" as const, stiffness: 300, damping: 18, delay: 0.1 },
        },
      };

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5 overflow-hidden">
      {/* Subtle color wash behind the card */}
      {isOk && (
        <div
          className="absolute inset-0 opacity-[0.03] rounded-2xl pointer-events-none"
          style={{ background: isFake ? "#A13D3D" : "#2F6B4F" }}
        />
      )}

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-4">
        Language verdict
      </p>

      {isError ? (
        <p className="text-muted text-sm">Language analysis unavailable right now.</p>
      ) : isOk ? (
        <div className="flex flex-col gap-5">
          {/* Verdict stamp */}
          <motion.div variants={stampVariants} initial="hidden" animate="visible" className="self-start">
            <div
              className="relative inline-block px-6 py-3 rounded-xl border-2 font-fraunces font-semibold uppercase text-2xl tracking-widest select-none"
              style={{ borderColor: accent, color: accent }}
              aria-label={`Verdict: ${label}`}
            >
              {/* Inner glow pulse */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: accent }}
                animate={{ opacity: [0.06, 0.12, 0.06] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10">{label}</span>
            </div>
          </motion.div>

          {/* Confidence with animated counter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">Confidence</span>
              <span className="font-mono text-sm font-medium" style={{ color: accent }}>
                <AnimatedNumber target={confidence!} />%
              </span>
            </div>
            {/* Track */}
            <div className="h-1.5 w-full rounded-full bg-hairline overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={barControls}
                className="h-full rounded-full"
                style={{ backgroundColor: accent }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
