"use client";

import { motion } from "framer-motion";
import { AnalyzeResponse } from "@/lib/types";
import SummaryCard       from "./SummaryCard";
import TruthScoreGauge   from "./TruthScoreGauge";
import ScoreBreakdown    from "./ScoreBreakdown";
import VerdictCard       from "./VerdictCard";
import FactCheckCard     from "./FactCheckCard";
import CredibilityMatrix from "./CredibilityMatrix";

interface ResultsSectionProps {
  results: AnalyzeResponse;
}

const slideUp = (delay: number) => ({
  initial:    { opacity: 0, y: 20, scale: 0.97 },
  animate:    { opacity: 1, y: 0,  scale: 1    },
  transition: { type: "spring" as const, stiffness: 280, damping: 26, delay },
});

export default function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <div className="flex flex-col gap-3 mt-6" aria-label="Analysis results">

      {/* 1. Article summary — shown first so users immediately know the topic */}
      {results.article_summary && (
        <motion.div {...slideUp(0)}>
          <SummaryCard summary={results.article_summary} />
        </motion.div>
      )}

      {/* 2 & 3. Composite Truth Score Gauge + Score Breakdown (coupled unified card) */}
      {results.truth_score && (
        <motion.div {...slideUp(0.06)}>
          <div className="bg-card border border-hairline rounded-2xl p-6">
            <TruthScoreGauge truthScore={results.truth_score} />
            <ScoreBreakdown breakdown={results.truth_score.breakdown} />
          </div>
        </motion.div>
      )}

      {/* 4. Verdict stamp card (with confidence and "Why we say this" explanation) */}
      <motion.div {...slideUp(0.12)}>
        <VerdictCard
          verdict={results.language_verdict}
          factCheck={results.fact_check}
          credibility={results.source_credibility}
        />
      </motion.div>

      {/* 5. Fact check card */}
      <motion.div {...slideUp(0.18)}>
        <FactCheckCard result={results.fact_check} />
      </motion.div>

      {/* 6. Source Credibility Matrix — combines primary source & related coverage */}
      <motion.div {...slideUp(0.24)}>
        <CredibilityMatrix
          credibility={results.source_credibility}
          relatedArticles={results.related_articles}
        />
      </motion.div>

    </div>
  );
}
