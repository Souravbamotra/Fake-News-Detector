"use client";

import { useState, useCallback } from "react";
import { InputTab, AnalyzeResponse } from "@/lib/types";
import { analyzeText, analyzeArticle, analyzeScreenshot, analyzeYoutube } from "@/lib/api";
import InputCard from "@/components/InputCard";
import LoadingState from "@/components/LoadingState";
import ErrorMessage from "@/components/ErrorMessage";
import ResultsSection from "@/components/results/ResultsSection";

const ERROR_MESSAGES: Record<InputTab, string> = {
  text:       "Couldn't process that text — please try again.",
  article:    "Couldn't process that — try pasting the article text directly.",
  screenshot: "That doesn't look like readable text — try a clearer screenshot.",
  youtube:    "This video has no captions available — try a different video or paste the transcript as text.",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<InputTab>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);

  const handleSubmit = useCallback(
    async (tab: InputTab, data: { text?: string; url?: string; file?: File }) => {
      setLoading(true);
      setError(null);
      setResults(null);

      try {
        let response: AnalyzeResponse;
        switch (tab) {
          case "text":
            response = await analyzeText(data.text!);
            break;
          case "article":
            response = await analyzeArticle(data.url!);
            break;
          case "screenshot":
            response = await analyzeScreenshot(data.file!);
            break;
          case "youtube":
            response = await analyzeYoutube(data.url!);
            break;
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

  return (
    <main className="min-h-screen bg-paper py-16 px-4">
      <div className="mx-auto w-full max-w-[640px] flex flex-col gap-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col items-center gap-3 text-center">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
            aria-label="Section: AI Verification"
          >
            AI Verification
          </p>
          <h1
            className="font-fraunces font-semibold text-ink leading-tight"
            style={{ fontSize: "clamp(28px, 4.5vw, 42px)" }}
          >
            Is this news real?
          </h1>
          <p className="text-muted text-sm max-w-md leading-relaxed">
            This tool checks language patterns, fact-check databases, and source
            credibility together — giving you three independent signals at once.
          </p>
        </header>

        {/* ── Input card ──────────────────────────────────────────────── */}
        <section aria-label="Input">
          <InputCard
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
          {error && <ErrorMessage message={error} />}
        </section>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading && <LoadingState inputTab={activeTab} />}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {results && !loading && (
          <section aria-label="Results">
            <ResultsSection results={results} />
          </section>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="text-center mt-4">
          <p className="text-tertiary text-xs leading-relaxed">
            AI predictions can be wrong — always verify with trusted sources.
          </p>
        </footer>

      </div>
    </main>
  );
}
