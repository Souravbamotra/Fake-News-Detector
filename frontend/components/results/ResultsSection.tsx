"use client";

import { motion } from "framer-motion";
import { AnalyzeResponse } from "@/lib/types";
import VerdictCard from "./VerdictCard";
import FactCheckCard from "./FactCheckCard";
import CredibilityCard from "./CredibilityCard";

interface ResultsSectionProps {
  results: AnalyzeResponse;
}

const cardVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

export default function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <motion.div
      className="flex flex-col gap-3 mt-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label="Analysis results"
    >
      <motion.div variants={cardVariants}>
        <VerdictCard verdict={results.language_verdict} />
      </motion.div>
      <motion.div variants={cardVariants}>
        <FactCheckCard result={results.fact_check} />
      </motion.div>
      <motion.div variants={cardVariants}>
        <CredibilityCard result={results.source_credibility} />
      </motion.div>
    </motion.div>
  );
}
