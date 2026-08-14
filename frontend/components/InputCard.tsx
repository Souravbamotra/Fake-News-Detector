"use client";

import { useCallback, useState, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InputTab } from "@/lib/types";
import TextTab from "./tabs/TextTab";
import ArticleTab, { isValidArticleUrl } from "./tabs/ArticleTab";
import ScreenshotTab from "./tabs/ScreenshotTab";
import YoutubeTab, { isYoutubeUrl } from "./tabs/YoutubeTab";

// ── Tab config ────────────────────────────────────────────────────────────────

interface TabConfig {
  id: InputTab;
  label: string;
  icon: React.ReactNode;
  submitLabel: string;
}

const TABS: TabConfig[] = [
  {
    id: "text",
    label: "Paste text",
    submitLabel: "Check text",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: "article",
    label: "Article link",
    submitLabel: "Check article",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    id: "screenshot",
    label: "Screenshot",
    submitLabel: "Check screenshot",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube link",
    submitLabel: "Check video",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
      </svg>
    ),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSubmittable(
  tab: InputTab,
  text: string,
  articleUrl: string,
  screenshotFile: File | null,
  youtubeUrl: string
): boolean {
  switch (tab) {
    case "text":       return text.trim().length >= 10;
    case "article":    return isValidArticleUrl(articleUrl);
    case "screenshot": return screenshotFile !== null;
    case "youtube":    return isYoutubeUrl(youtubeUrl);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface InputCardProps {
  activeTab: InputTab;
  onTabChange: (tab: InputTab) => void;
  onSubmit: (tab: InputTab, data: { text?: string; url?: string; file?: File }) => void;
  loading: boolean;
}

export default function InputCard({ activeTab, onTabChange, onSubmit, loading }: InputCardProps) {
  const [text,           setText]           = useState("");
  const [articleUrl,     setArticleUrl]     = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [youtubeUrl,     setYoutubeUrl]     = useState("");

  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const canSubmit =
    !loading &&
    isSubmittable(activeTab, text, articleUrl, screenshotFile, youtubeUrl);

  const activeConfig = TABS.find((t) => t.id === activeTab)!;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    switch (activeTab) {
      case "text":       onSubmit("text",       { text });                         break;
      case "article":    onSubmit("article",    { url: articleUrl });               break;
      case "screenshot": onSubmit("screenshot", { file: screenshotFile! });         break;
      case "youtube":    onSubmit("youtube",    { url: youtubeUrl });               break;
    }
  }, [activeTab, canSubmit, onSubmit, text, articleUrl, screenshotFile, youtubeUrl]);

  const handleTabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (idx + 1) % TABS.length;
        tabsRef.current[next]?.focus();
        onTabChange(TABS[next].id);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (idx - 1 + TABS.length) % TABS.length;
        tabsRef.current[prev]?.focus();
        onTabChange(TABS[prev].id);
      }
    },
    [onTabChange]
  );

  return (
    <div className="bg-card border border-hairline rounded-2xl overflow-hidden shadow-sm">

      {/* ── Tab bar with sliding indicator ────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Input type"
        className="grid grid-cols-4 max-[480px]:grid-cols-2 border-b border-hairline"
      >
        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              ref={(el) => { tabsRef.current[idx] = el; }}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              tabIndex={isActive ? 0 : -1}
              className="relative flex items-center justify-center gap-1.5 px-2 py-3.5 text-xs font-mono uppercase tracking-wider transition-colors focus-visible:z-10 border-r border-hairline last:border-r-0 max-[480px]:even:border-r-0 overflow-hidden"
            >
              {/* Sliding background indicator — animates via layoutId */}
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-ink"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              {/* Icon + label sit above the indicator */}
              <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${isActive ? "text-paper" : "text-muted hover:text-ink"}`}>
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content with slide + fade ─────────────────────────────── */}
      <div className="p-5 pb-4 min-h-[140px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeTab === "text"       && <TextTab       value={text}       onChange={setText}           />}
            {activeTab === "article"    && <ArticleTab    value={articleUrl} onChange={setArticleUrl}     />}
            {activeTab === "screenshot" && <ScreenshotTab file={screenshotFile} onFile={setScreenshotFile} />}
            {activeTab === "youtube"    && <YoutubeTab    value={youtubeUrl} onChange={setYoutubeUrl}     />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Submit row ────────────────────────────────────────────────── */}
      <div className="px-5 pb-5 flex justify-end">
        <motion.button
          id="submit-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.04 } : {}}
          whileTap={canSubmit ? { scale: 0.96 } : {}}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          aria-label={activeConfig.submitLabel}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-shadow ${
            canSubmit
              ? "btn-shimmer text-paper cursor-pointer shadow-md hover:shadow-lg"
              : "bg-hairline text-tertiary cursor-not-allowed"
          }`}
        >
          {loading ? "Analysing…" : activeConfig.submitLabel}
        </motion.button>
      </div>
    </div>
  );
}
