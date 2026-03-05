/**
 * Natural language date/time parsing for voice commands using chrono-node.
 * Handles "Sunday 5 pm", "tomorrow evening", "next monday 6 pm", etc.
 */

import * as chrono from "chrono-node";

/** Map time-of-day words to a time string chrono can parse. */
const TIME_OF_DAY: Record<string, string> = {
  morning: "9 am",
  afternoon: "2 pm",
  evening: "6 pm",
  night: "8 pm",
};

/**
 * Normalize time-of-day phrases so chrono can parse them.
 * e.g. "tomorrow evening" → "tomorrow 6 pm", "today morning" → "today 9 am"
 */
function normalizeTimeOfDay(text: string): string {
  let out = text.trim();
  const lower = out.toLowerCase();
  for (const [word, time] of Object.entries(TIME_OF_DAY)) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    if (re.test(lower)) {
      out = out.replace(re, time);
    }
  }
  return out;
}

/**
 * Extract the first date/time from natural language text.
 * Uses "now" as reference so relative phrases resolve to the next occurrence.
 * Handles: "tomorrow", "next monday 6 pm", "sunday 5 pm", "today 4 pm", "tomorrow evening" (→ 6 PM).
 * @param text - e.g. "schedule class with Ashutosh sunday 5 pm", "tomorrow evening"
 * @returns Date for the parsed time, or null if none detected
 */
export function extractClassDate(text: string): Date | null {
  if (!text || !text.trim()) return null;
  const normalized = normalizeTimeOfDay(text);
  const ref = new Date();
  const parsed = chrono.parseDate(normalized, ref);
  return parsed ?? null;
}
