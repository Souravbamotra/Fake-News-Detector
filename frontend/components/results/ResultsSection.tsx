"use client";

import { motion } from "framer-motion";
import { AnalyzeResponse } from "@/lib/types";
import VerdictCard     from "./VerdictCard";
import FactCheckCard   from "./FactCheckCard";
import CredibilityCard from "./CredibilityCard";

interface ResultsSectionProps {
  results: AnalyzeResponse;
}

export default function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <div className="flex flex-col gap-3 mt-6" aria-label="Analysis results">
      {/* Verdict — receives all three signals so it can build "Why we say this" */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0 }}
      >
        <VerdictCard
          verdict={results.language_verdict}
          factCheck={results.fact_check}
          credibility={results.source_credibility}
        />
      </motion.div>

      {/* Fact check */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 }}
      >
        <FactCheckCard result={results.fact_check} />
      </motion.div>

      {/* Source credibility */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.2 }}
      >
        <CredibilityCard result={results.source_credibility} />
      </motion.div>
    </div>
  );
}
