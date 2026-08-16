"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { TruthScore, TruthScoreBreakdown } from "@/lib/types";

interface TruthScoreGaugeProps {
  truthScore: TruthScore;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#2F6B4F"; // Dark forest green
  if (score >= 60) return "#3D8B68"; // Light green tone
  if (score >= 40) return "#B8862F"; // Amber
  return "#A13D3D";                 // Muted red
}

function getTruthScoreSummary(score: number, breakdown: TruthScoreBreakdown): string {
  const { source_reliability, language_confidence, fact_check_match } = breakdown;

  if (fact_check_match !== null && fact_check_match <= 20) {
    return "A professional fact-checking review has explicitly flagged or debunked this claim.";
  }
  if (fact_check_match !== null && fact_check_match >= 90) {
    return "Corroborated by professional fact-checking and verified sources.";
  }
  if (source_reliability !== null && source_reliability >= 85 && (language_confidence ?? 50) >= 70) {
    return "Backed by a recognized high-credibility outlet and measured writing patterns.";
  }
  if (source_reliability !== null && source_reliability >= 85 && (fact_check_match === 50 || fact_check_match === null)) {
    return "Backed by a credible source, but direct fact-check coverage is limited.";
  }
  if (score >= 80) {
    return "Strong corroboration across publisher reputation, language structure, and fact checks.";
  }
  if (score >= 60) {
    return "Shows positive reliability signals, though some factors remain moderate or unrated.";
  }
  if (score >= 40) {
    return "Presents mixed signals — verify details through additional trusted reporting.";
  }
  if (score >= 20) {
    return "Multiple indicators suggest potential inaccuracies or low-trust provenance.";
  }
  return "Flagged with serious reliability warnings across writing patterns and source history.";
}

function AnimatedNumber({ target }: { target: number }) {
  const shouldReduce = useReducedMotion();
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(shouldReduce ? target : 0);

  useEffect(() => {
    if (shouldReduce) {
      setDisplay(target);
      return;
    }
    const unsub = rounded.on("change", (v) => setDisplay(v));
    const controls = animate(motionVal, target, { duration: 0.8, ease: "easeOut" });
    return () => {
      unsub();
      controls.stop();
    };
  }, [target, motionVal, rounded, shouldReduce]);

  return <>{display}</>;
}

export default function TruthScoreGauge({ truthScore }: TruthScoreGaugeProps) {
  const shouldReduce = useReducedMotion();
  const { overall, breakdown, label } = truthScore;
  const color = getScoreColor(overall);
  const summaryText = getTruthScoreSummary(overall, breakdown);

  // SVG Gauge geometry
  const size = 148;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, overall)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Gauge ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E4E1DA"
            strokeWidth={strokeWidth}
          />
          {/* Animated score arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: shouldReduce ? strokeDashoffset : circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: shouldReduce ? 0 : 0.8, ease: "easeOut" }}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* Center score & denominator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
          <span
            className="font-fraunces font-bold text-4xl leading-none tracking-tight"
            style={{ color }}
            aria-label={`Truth score: ${overall} out of 100`}
          >
            <AnimatedNumber target={overall} />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted/70 mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Label and dynamic 1-sentence plain language summary */}
      <div className="mt-3.5 flex flex-col items-center gap-1 max-w-sm">
        <span
          className="font-fraunces font-semibold text-lg sm:text-xl tracking-tight leading-snug"
          style={{ color }}
        >
          {label}
        </span>
        <p className="text-xs text-muted leading-relaxed">
          {summaryText}
        </p>
      </div>
    </div>
  );
}
