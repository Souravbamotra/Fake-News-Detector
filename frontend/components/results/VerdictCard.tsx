"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { LanguageVerdict, isVerdictOk, isSignalError } from "@/lib/types";

interface VerdictCardProps {
  verdict: LanguageVerdict;
}

export default function VerdictCard({ verdict }: VerdictCardProps) {
  const shouldReduce = useReducedMotion();
  const barControls = useAnimation();
  const barRef = useRef(false);

  const isOk = isVerdictOk(verdict);
  const isError = isSignalError(verdict);

  const label = isOk ? verdict.label : null;
  const confidence = isOk ? verdict.confidence : null;

  const isFake = label === "Fake";
  const accentColor = isFake ? "#A13D3D" : "#2F6B4F";

  useEffect(() => {
    if (confidence !== null && !barRef.current) {
      barRef.current = true;
      barControls.start({
        width: `${confidence}%`,
        transition: { duration: 0.6, ease: "easeOut" },
      });
    }
  }, [confidence, barControls]);

  const stampVariants = shouldReduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.85, rotate: -4 },
        visible: {
          opacity: 1,
          scale: 1,
          rotate: 0,
          transition: { type: "spring" as const, stiffness: 260, damping: 20, duration: 0.4 },
        },
      };

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5">
      {/* Card label */}
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-4">
        Language verdict
      </p>

      {isError ? (
        <p className="text-muted text-sm">Language analysis unavailable right now.</p>
      ) : isOk ? (
        <div className="flex flex-col gap-4">
          {/* Verdict stamp */}
          <motion.div
            variants={stampVariants}
            initial="hidden"
            animate="visible"
            className="self-start"
          >
            <div
              className="inline-block px-5 py-2.5 rounded-xl border-2 font-fraunces font-semibold uppercase text-xl tracking-wide"
              style={{ borderColor: accentColor, color: accentColor }}
              aria-label={`Verdict: ${label}`}
            >
              {label}
            </div>
          </motion.div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted">Confidence</span>
              <span
                className="font-mono text-sm font-medium"
                style={{ color: accentColor }}
              >
                {confidence}%
              </span>
            </div>
            {/* Progress bar track */}
            <div className="h-1 w-full rounded-full bg-hairline overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={barControls}
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
