"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InputTab, AnalyzeResponse } from "@/lib/types";
import { analyzeText, analyzeArticle, analyzeScreenshot, analyzeYoutube } from "@/lib/api";
import Wordmark      from "@/components/Wordmark";
import InputCard     from "@/components/InputCard";
import ExampleChips  from "@/components/ExampleChips";
import HowItWorks    from "@/components/HowItWorks";
import LoadingState  from "@/components/LoadingState";
import ErrorMessage  from "@/components/ErrorMessage";
import ResultsSection from "@/components/results/ResultsSection";

const ERROR_MESSAGES: Record<InputTab, string> = {
  text:       "Couldn't process that text — please try again.",
  article:    "Couldn't process that — try pasting the article text directly.",
  screenshot: "That doesn't look like readable text — try a clearer screenshot.",
  youtube:    "This video has no captions available — try a different video or paste the transcript as text.",
};

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 28 } },
};

export default function HomePage() {
  const [activeTab,    setActiveTab]    = useState<InputTab>("text");
  const [exampleText,  setExampleText]  = useState<string | undefined>(undefined);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [results,      setResults]      = useState<AnalyzeResponse | null>(null);

  const handleSubmit = useCallback(
    async (tab: InputTab, data: { text?: string; url?: string; file?: File }) => {
      setLoading(true);
      setError(null);
      setResults(null);
      try {
        let response: AnalyzeResponse;
        switch (tab) {
          case "text":       response = await analyzeText(data.text!); break;
          case "article":    response = await analyzeArticle(data.url!); break;
          case "screenshot": response = await analyzeScreenshot(data.file!); break;
          case "youtube":    response = await analyzeYoutube(data.url!); break;
        }
        setResults(response);
      } catch (err) {
        const msg =
          err instanceof Error && err.message.includes("Can't reach")
            ? err.message
            : (err instanceof Error && err.message) || ERROR_MESSAGES[tab];
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleTabChange = useCallback((tab: InputTab) => {
    setActiveTab(tab);
    setError(null);
    setResults(null);
  }, []);

  // Clicking an example chip → switch to text tab + pre-fill
  const handleExample = useCallback((text: string) => {
    setActiveTab("text");
    setExampleText(text);
    setError(null);
    setResults(null);
    // Reset the injected value after one render cycle so InputCard can re-receive it
    setTimeout(() => setExampleText(undefined), 50);
  }, []);

  return (
    <main className="relative min-h-screen bg-paper py-16 px-4 overflow-hidden">

      {/* ── Fixed wordmark ───────────────────────────────────────────── */}
      <Wordmark />

      {/* ── Animated background blobs ────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="blob-1 absolute -top-40 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(47,107,79,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="blob-2 absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(161,61,61,0.05) 0%, transparent 70%)" }}
        />
        <div
          className="blob-3 absolute -bottom-32 left-1/4 w-[380px] h-[380px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,134,47,0.05) 0%, transparent 70%)" }}
        />

      </div>

      <div className="relative mx-auto w-full max-w-[640px] flex flex-col gap-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <motion.header
          className="flex flex-col items-center gap-3 text-center pt-6"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={itemVariants} className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            AI Verification
          </motion.p>
          <motion.h1
            variants={itemVariants}
            className="font-fraunces font-semibold text-ink leading-tight"
            style={{ fontSize: "clamp(28px, 4.5vw, 42px)" }}
          >
            Is this news real?
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted text-sm max-w-md leading-relaxed">
            This tool checks language patterns, fact-check databases, and source
            credibility together — giving you three independent signals at once.
          </motion.p>
        </motion.header>

        {/* ── Input card ───────────────────────────────────────────────── */}
        <motion.section
          aria-label="Input"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.45 }}
        >
          {/* Card with elevated shadow — task 5 */}
          <div className="rounded-2xl" style={{ boxShadow: "0 4px 24px rgba(28,27,25,0.08), 0 1px 4px rgba(28,27,25,0.04)" }}>
            <InputCard
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onSubmit={handleSubmit}
              loading={loading}
              injectedText={exampleText}
            />
          </div>

          {/* Try an example chips — task 4 */}
          <ExampleChips onSelect={handleExample} />

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ErrorMessage message={error} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Loading ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <LoadingState inputTab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {results && !loading && (
            <motion.section key="results" aria-label="Results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ResultsSection results={results} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <HowItWorks />
        </motion.div>

        {/* ── Footer — expanded with tech stack line ───────────────────── */}
        <motion.footer
          className="text-center flex flex-col gap-1.5 mt-2 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <p className="text-tertiary text-xs leading-relaxed">
            AI predictions can be wrong — always verify with trusted sources.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-tertiary/60">
            Powered by DistilRoBERTa · Google Fact Check Tools · curated source list
          </p>
        </motion.footer>

      </div>
    </main>
  );
}
