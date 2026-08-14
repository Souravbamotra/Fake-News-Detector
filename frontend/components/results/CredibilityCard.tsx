"use client";

import { SourceCredibility, isCredibilityOk, isSignalError } from "@/lib/types";

interface CredibilityCardProps {
  result: SourceCredibility;
}

const TIER_STYLES: Record<string, { label: string; className: string }> = {
  high:          { label: "High credibility",   className: "bg-real/10 text-real border border-real/25" },
  medium:        { label: "Medium credibility",  className: "bg-amber/10 text-amber border border-amber/25" },
  low:           { label: "Low credibility",    className: "bg-fake/10 text-fake border border-fake/25" },
  unrated:       { label: "Unrated",            className: "bg-muted/10 text-muted border border-muted/25" },
  not_available: { label: "N/A",                className: "bg-hairline text-muted border border-hairline" },
};

export default function CredibilityCard({ result }: CredibilityCardProps) {
  const isError = isSignalError(result);
  const isOk = isCredibilityOk(result);

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
            {result.domain && (
              <span className="font-mono text-xs text-ink tracking-wide">
                {result.domain}
              </span>
            )}
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full ${
                TIER_STYLES[result.tier]?.className ?? TIER_STYLES.unrated.className
              }`}
            >
              {TIER_STYLES[result.tier]?.label ?? result.tier}
            </span>
          </div>
        )
      ) : null}
    </div>
  );
}
