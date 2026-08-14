/**
 * API client — all calls to the FastAPI backend.
 *
 * Base URL is configured via NEXT_PUBLIC_API_URL env var.
 * Defaults to http://localhost:8000 for local development.
 */

import { AnalyzeResponse } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// ── Shared fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error(
      "Can't reach the backend — make sure it's running on port 8000."
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

// ── Public API functions ──────────────────────────────────────────────────────

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_type: "text", text }),
  });
}

export async function analyzeArticle(url: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_type: "article_url", url }),
  });
}

export async function analyzeScreenshot(file: File): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<AnalyzeResponse>("/analyze/screenshot", {
    method: "POST",
    body: form,
    // Do NOT set Content-Type — browser sets it automatically with boundary
  });
}

export async function analyzeYoutube(youtubeUrl: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_type: "youtube_url", youtube_url: youtubeUrl }),
  });
}
