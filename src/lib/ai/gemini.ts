import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Flash rather than Pro: brochure extraction is a long-document read that
 * has to finish inside a single request, and Flash handles document
 * understanding at a fraction of the latency. Override per-deployment if a
 * particular brochure set needs more reasoning headroom.
 *
 * Pinned to 3.5 because gemini-2.5-flash now returns 404 for new API keys
 * ("no longer available to new users").
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured — brochure auto-fill is unavailable.",
    );
  }
  return new GoogleGenAI({ apiKey });
}
