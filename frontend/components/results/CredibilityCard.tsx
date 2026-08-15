"use client";

import { motion } from "framer-motion";
import { SourceCredibility, isCredibilityOk, isSignalError } from "@/lib/types";

interface CredibilityCardProps {
  result: SourceCredibility;
}

const TIER_STYLES: Record<string, { label: string; className: string }> = {
  high:               { label: "High credibility",            className: "bg-real/10 text-real border border-real/25" },
  medium:             { label: "Medium credibility",          className: "bg-amber/10 text-amber border border-amber/25" },
  low:                { label: "Low credibility",             className: "bg-fake/10 text-fake border border-fake/25" },
  unrated:            { label: "Unrated",                     className: "bg-muted/10 text-muted border border-muted/25" },
  youtube:            { label: "YouTube – channel unverified", className: "bg-muted/10 text-muted border border-muted/25" },
  youtube_unverified: { label: "Channel unverified",          className: "bg-muted/10 text-muted border border-muted/25" },
  not_available:      { label: "N/A",                         className: "bg-hairline text-muted border border-hairline" },
};

export default function CredibilityCard({ result }: CredibilityCardProps) {
  const isError = isSignalError(result);
  const isOk    = isCredibilityOk(result);

  // For YouTube results the backend returns a channel name; use it as the
  // primary display label instead of the raw domain "youtube.com".
  const displayName = isOk
    ? (result as any).channel || result.domain
    : null;

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-4">
        Source credibility
      </p>

      {isError ? (
        <p className="text-muted text-sm">Credibility check unavailable right now.</p>
      ) : isOk ? (
        result.tier === "not_available" ? (
          <p className="text-muted text-sm">
            Source credibility isn&apos;t available for this input type.
          </p>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {displayName && (
              <motion.span
                className="font-mono text-xs text-ink tracking-wide"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {displayName}
              </motion.span>
            )}
            <motion.span
              className={`font-mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full ${
                TIER_STYLES[result.tier]?.className ?? TIER_STYLES.unrated.className
              }`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.1 }}
            >
              {TIER_STYLES[result.tier]?.label ?? result.tier}
            </motion.span>
          </div>
        )
      ) : null}
    </div>
  );
}
