"use client";

import { motion } from "framer-motion";
import { SourceCredibility, RelatedArticle, isCredibilityOk, isSignalError } from "@/lib/types";
import { getScoreColor } from "./TruthScoreGauge";

interface CredibilityMatrixProps {
  credibility: SourceCredibility;
  relatedArticles?: RelatedArticle[];
}

interface MatrixRow {
  name: string;
  url?: string;
  score: number;
  tier: string;
  stance: string;
  type: string;
  isPrimary: boolean;
}

const KNOWN_HIGH = [
  "reuters", "associated press", "ap news", "bbc", "washington post",
  "wall street journal", "wsj", "new york times", "the guardian",
  "bloomberg", "npr", "nature", "science", "afp", "pbs", "cbs news", "nbc news", "abc news"
];

const KNOWN_MEDIUM = [
  "wired", "time", "forbes", "the atlantic", "politico", "the economist",
  "economist", "vox", "axios", "techcrunch", "propublica", "the verge"
];

const KNOWN_LOW = [
  "infowars", "breitbart", "daily mail", "the sun", "natural news",
  "before its news", "the gateway pundit", "world net daily"
];

function estimateSourceTier(sourceName: string): { tier: string; score: number } {
  const s = sourceName.toLowerCase();
  for (const h of KNOWN_HIGH) {
    if (s.includes(h)) return { tier: "high", score: 90 };
  }
  for (const m of KNOWN_MEDIUM) {
    if (s.includes(m)) return { tier: "medium", score: 65 };
  }
  for (const l of KNOWN_LOW) {
    if (s.includes(l)) return { tier: "low", score: 20 };
  }
  return { tier: "unrated", score: 50 };
}

function getPrimaryTierScore(tier: string): number {
  switch (tier) {
    case "high":               return 90;
    case "medium":             return 65;
    case "low":                return 20;
    case "unrated":            return 50;
    case "youtube":            return 50;
    case "youtube_unverified": return 50;
    default:                   return 50;
  }
}

export default function CredibilityMatrix({ credibility, relatedArticles = [] }: CredibilityMatrixProps) {
  const isOk = isCredibilityOk(credibility);
  const isError = isSignalError(credibility);

  // Build matrix rows
  const rows: MatrixRow[] = [];

  // 1. Primary Source row
  if (isOk) {
    const primaryName = (credibility as any).channel || credibility.domain || "Original Source";
    const primaryScore = getPrimaryTierScore(credibility.tier);
    const primaryType = (credibility as any).channel ? "YouTube" : "News";

    rows.push({
      name: primaryName,
      score: primaryScore,
      tier: credibility.tier,
      stance: "Original",
      type: primaryType,
      isPrimary: true,
    });
  } else if (!isError) {
    rows.push({
      name: "Direct Input",
      score: 50,
      tier: "not_available",
      stance: "Original",
      type: "Text / Upload",
      isPrimary: true,
    });
  }

  // 2. Related Articles rows (up to 5)
  const cappedArticles = relatedArticles.slice(0, 5);
  for (const article of cappedArticles) {
    const sourceName = article.source || "News Outlet";
    const { tier, score } = estimateSourceTier(sourceName);
    rows.push({
      name: sourceName,
      url: article.url,
      score,
      tier,
      stance: "Also reported this story",
      type: "Related Coverage",
      isPrimary: false,
    });
  }

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5 overflow-hidden" aria-label="Source Credibility Matrix">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          Source Credibility Matrix
        </p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted/60">
          {rows.length} {rows.length === 1 ? "source" : "sources"}
        </span>
      </div>

      {isError && rows.length === 0 ? (
        <p className="text-muted text-sm">Credibility check unavailable right now.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-hairline text-[9px] font-mono uppercase tracking-[0.14em] text-muted">
                <th className="py-2.5 pr-3 font-normal">Source</th>
                <th className="py-2.5 px-3 font-normal w-36">Trust Score</th>
                <th className="py-2.5 px-3 font-normal">Stance</th>
                <th className="py-2.5 pl-3 font-normal text-right">Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const color = getScoreColor(row.score);
                const initial = (row.name.replace(/^(https?:\/\/)?(www\.)?/, "")[0] || "S").toUpperCase();

                return (
                  <motion.tr
                    key={`${row.name}-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.05, duration: 0.25 }}
                    className={`border-b border-hairline/60 last:border-0 hover:bg-paper/50 transition-colors ${
                      row.isPrimary ? "bg-paper/30 font-medium" : ""
                    }`}
                  >
                    {/* Source column */}
                    <td className="py-3 pr-3 text-xs text-ink">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold shrink-0"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {initial}
                        </div>
                        {row.url ? (
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-muted transition-colors inline-flex items-center gap-1 group truncate max-w-[170px] sm:max-w-[220px]"
                            title={row.name}
                          >
                            <span className="truncate">{row.name}</span>
                            <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <span className="truncate max-w-[170px] sm:max-w-[220px]" title={row.name}>
                            {row.name}
                            {row.isPrimary && (
                              <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wider text-muted font-normal">
                                (Original)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Trust Score column */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-medium w-6 text-right shrink-0" style={{ color }}>
                          {row.score}
                        </span>
                        <div className="h-1.5 flex-1 min-w-[50px] rounded-full bg-hairline overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${row.score}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Stance column */}
                    <td className="py-3 px-3 text-xs text-muted">
                      <span className="text-[11px] leading-tight block">
                        {row.stance}
                      </span>
                    </td>

                    {/* Type column */}
                    <td className="py-3 pl-3 text-right">
                      <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-hairline/80 text-muted inline-block">
                        {row.type}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Zero related coverage note */}
      {cappedArticles.length === 0 && (
        <p className="mt-3.5 pt-3 border-t border-hairline/60 text-xs text-tertiary font-mono text-center">
          No other coverage found for this story yet.
        </p>
      )}
    </div>
  );
}
