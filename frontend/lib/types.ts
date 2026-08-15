/**
 * TypeScript type definitions for all API responses.
 *
 * All three signal fields may contain either their normal shape
 * OR an error object — handle both in every component.
 */

// ── Individual signal shapes ──────────────────────────────────────────────────

export interface LanguageVerdictOk {
  label: "Fake" | "Real";
  confidence: number; // 0-100 integer
}

export interface FactCheckOk {
  found: true;
  rating: string;
  publisher: string;
  url: string;
}

export interface FactCheckEmpty {
  found: false;
}

export interface SourceCredibilityOk {
  domain: string | null;
  channel?: string | null;
  tier: "high" | "medium" | "low" | "unrated" | "youtube" | "youtube_unverified" | "not_available";
}

export interface SignalError {
  error: string;
}

// ── Union types used in the response ─────────────────────────────────────────

export type LanguageVerdict = LanguageVerdictOk | SignalError;
export type FactCheckResult = FactCheckOk | FactCheckEmpty | SignalError;
export type SourceCredibility = SourceCredibilityOk | SignalError;

// ── Full API response ─────────────────────────────────────────────────────────

export interface RelatedArticle {
  title:  string;
  source: string;
  url:    string;
}

export interface AnalyzeResponse {
  extracted_text:    string;
  article_summary?:  string | null;
  language_verdict:  LanguageVerdict;
  fact_check:        FactCheckResult;
  source_credibility: SourceCredibility;
  related_articles?: RelatedArticle[];
}

// ── Input tab identifiers ─────────────────────────────────────────────────────

export type InputTab = "text" | "article" | "screenshot" | "youtube";

// ── Type guards ───────────────────────────────────────────────────────────────

export function isSignalError(v: unknown): v is SignalError {
  return typeof v === "object" && v !== null && "error" in v;
}

export function isVerdictOk(v: LanguageVerdict): v is LanguageVerdictOk {
  return "label" in v;
}

export function isFactCheckOk(v: FactCheckResult): v is FactCheckOk {
  return "found" in v && (v as FactCheckOk).found === true;
}

export function isFactCheckEmpty(v: FactCheckResult): v is FactCheckEmpty {
  return "found" in v && (v as FactCheckEmpty).found === false && !("error" in v);
}

export function isCredibilityOk(v: SourceCredibility): v is SourceCredibilityOk {
  return "tier" in v;
}
