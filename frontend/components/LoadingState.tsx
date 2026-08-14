"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InputTab } from "@/lib/types";

const LABELS: Record<InputTab, string[]> = {
  text:       ["Analysing language patterns", "Scanning for misinformation signals", "Running AI classifier"],
  article:    ["Fetching the article", "Extracting article text", "Running analysis"],
  screenshot: ["Processing image", "Extracting text via OCR", "Analysing content"],
  youtube:    ["Fetching transcript", "Reading video captions", "Analysing content"],
};

interface LoadingStateProps {
  inputTab: InputTab;
}

export default function LoadingState({ inputTab }: LoadingStateProps) {
  const labels = LABELS[inputTab];
  const [labelIdx, setLabelIdx] = useState(0);

  // Cycle through labels every 2s
  useEffect(() => {
    setLabelIdx(0);
    const id = setInterval(() => {
      setLabelIdx((i) => (i + 1) % labels.length);
    }, 2000);
    return () => clearInterval(id);
  }, [inputTab, labels.length]);

  return (
    <div className="flex flex-col items-center gap-5 py-10" role="status" aria-live="polite">
      {/* Animated dots */}
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-muted"
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Cycling label */}
      <div className="h-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={labelIdx}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            aria-label={labels[labelIdx]}
          >
            {labels[labelIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
