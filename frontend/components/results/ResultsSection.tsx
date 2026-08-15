"use client";

import { motion } from "framer-motion";
import { AnalyzeResponse } from "@/lib/types";
import SummaryCard         from "./SummaryCard";
import VerdictCard         from "./VerdictCard";
import FactCheckCard       from "./FactCheckCard";
import CredibilityCard     from "./CredibilityCard";
import RelatedArticlesCard from "./RelatedArticlesCard";

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

      {/* 1. What this is about — shown first so users immediately know the topic */}
      {results.article_summary && (
        <motion.div {...slideUp(0)}>
          <SummaryCard summary={results.article_summary} />
        </motion.div>
      )}

      {/* 2. Verdict — includes "Why we say this" using all three signals */}
      <motion.div {...slideUp(0.08)}>
        <VerdictCard
          verdict={results.language_verdict}
          factCheck={results.fact_check}
          credibility={results.source_credibility}
        />
      </motion.div>

      {/* 3. Fact check */}
      <motion.div {...slideUp(0.16)}>
        <FactCheckCard result={results.fact_check} />
      </motion.div>

      {/* 4. Source credibility */}
      <motion.div {...slideUp(0.22)}>
        <CredibilityCard result={results.source_credibility} />
      </motion.div>

      {/* 5. Also covered by — other outlets reporting the same story */}
      {results.related_articles && results.related_articles.length > 0 && (
        <motion.div {...slideUp(0.28)}>
          <RelatedArticlesCard articles={results.related_articles} />
        </motion.div>
      )}

    </div>
  );
}
