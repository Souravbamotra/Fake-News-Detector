"use client";

import { FactCheckResult, isFactCheckOk, isFactCheckEmpty, isSignalError } from "@/lib/types";

interface FactCheckCardProps {
  result: FactCheckResult;
}

export default function FactCheckCard({ result }: FactCheckCardProps) {
  const isError = isSignalError(result);
  const isOk = isFactCheckOk(result);
  const isEmpty = isFactCheckEmpty(result);

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-4">
        Fact-check
      </p>

      {isError ? (
        <p className="text-muted text-sm">Fact-check service unavailable right now.</p>
      ) : isEmpty ? (
        <p className="text-muted text-sm">No matching fact-check found for this claim.</p>
      ) : isOk ? (
        <div className="flex flex-col gap-3">
          {/* Rating row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-tertiary block mb-0.5">
                Rating
              </span>
              <span className="text-ink font-medium text-sm">{result.rating}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-tertiary block mb-0.5">
                Publisher
              </span>
              <span className="text-ink text-sm">{result.publisher}</span>
            </div>
          </div>
          {/* Link */}
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted underline hover:text-ink transition-colors break-all"
              aria-label={`View full fact-check by ${result.publisher}`}
            >
              View full fact-check →
            </a>
          )}
        </div>
      ) : null}
    </div>
  );
}
