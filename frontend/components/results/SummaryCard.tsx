"use client";

import { motion } from "framer-motion";

interface SummaryCardProps {
  summary: string;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  if (!summary) return null;

  return (
    <motion.div
      className="bg-card border border-hairline rounded-2xl p-5"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0 }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-3">
        What this is about
      </p>
      <p className="text-sm text-ink leading-relaxed">
        {summary}
      </p>
    </motion.div>
  );
}
