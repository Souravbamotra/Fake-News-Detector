"use client";

import { motion } from "framer-motion";
import { AnalyzeResponse } from "@/lib/types";
import VerdictCard    from "./VerdictCard";
import FactCheckCard  from "./FactCheckCard";
import CredibilityCard from "./CredibilityCard";

interface ResultsSectionProps {
  results: AnalyzeResponse;
}

const cards = [
  { key: "verdict",     Component: VerdictCard,     propKey: "verdict" },
  { key: "factcheck",   Component: FactCheckCard,   propKey: "result"  },
  { key: "credibility", Component: CredibilityCard, propKey: "result"  },
] as const;

export default function ResultsSection({ results }: ResultsSectionProps) {
  const props = {
    verdict: results.language_verdict,
    result:  [results.fact_check, results.source_credibility],
  };

  return (
    <div className="flex flex-col gap-3 mt-6" aria-label="Analysis results">
      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0 }}
      >
        <VerdictCard verdict={results.language_verdict} />
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
