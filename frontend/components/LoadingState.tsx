"use client";

import { InputTab } from "@/lib/types";
import { motion } from "framer-motion";

const LOADING_LABELS: Record<InputTab, string> = {
  text: "Analysing language patterns",
  article: "Reading the article",
  screenshot: "Extracting and analysing text",
  youtube: "Reading video transcript",
};

interface LoadingStateProps {
  inputTab: InputTab;
}

export default function LoadingState({ inputTab }: LoadingStateProps) {
  return (
    <div className="flex justify-center py-10" role="status" aria-live="polite">
      <motion.p
        className="font-mono text-xs uppercase tracking-widest text-muted"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        aria-label={LOADING_LABELS[inputTab]}
      >
        {LOADING_LABELS[inputTab]}
      </motion.p>
    </div>
  );
}
