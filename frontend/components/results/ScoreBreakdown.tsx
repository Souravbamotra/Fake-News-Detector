"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TruthScoreBreakdown } from "@/lib/types";
import { getScoreColor } from "./TruthScoreGauge";

interface ScoreBreakdownProps {
  breakdown: TruthScoreBreakdown;
}

interface BreakdownRowConfig {
  id: keyof TruthScoreBreakdown;
  label: string;
  icon: React.ReactNode;
}

const ROWS: BreakdownRowConfig[] = [
  {
    id: "source_reliability",
    label: "Source Reliability",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    id: "language_confidence",
    label: "Language Pattern",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="9" y1="14" x2="13" y2="14" />
      </svg>
    ),
  },
  {
    id: "fact_check_match",
    label: "Fact-Check Match",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
];

export default function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="w-full mt-5 pt-4 border-t border-hairline/80">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-3.5">
        Score Breakdown
      </p>

      <div className="flex flex-col gap-3">
        {ROWS.map((row, idx) => {
          const score = breakdown[row.id];
          const isUnavailable = score === null || score === undefined;
          const color = isUnavailable ? "#8A8578" : getScoreColor(score);
          const percent = isUnavailable ? 0 : Math.max(0, Math.min(100, score));

          return (
            <div
              key={row.id}
              className={`flex flex-col gap-1.5 ${isUnavailable ? "opacity-45" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-ink">
                  <span className="text-muted shrink-0">{row.icon}</span>
                  <span className="font-medium text-xs text-ink/90">{row.label}</span>
                </div>

                <span
                  className="font-mono text-[11px] shrink-0"
                  style={{ color: isUnavailable ? "#8A8578" : color }}
                >
                  {isUnavailable ? (
                    <span className="italic text-muted font-normal text-[10px]">unavailable</span>
                  ) : (
                    <span>
                      <strong className="font-semibold">{score}</strong>
                      <span className="text-muted/70 font-normal">/100</span>
                    </span>
                  )}
                </span>
              </div>

              {/* Progress bar track */}
              <div className="h-1.5 w-full rounded-full bg-hairline overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${percent}%` }}
                  transition={{
                    duration: shouldReduce ? 0 : 0.8,
                    ease: "easeOut",
                    delay: shouldReduce ? 0 : 0.15 + idx * 0.08,
                  }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
