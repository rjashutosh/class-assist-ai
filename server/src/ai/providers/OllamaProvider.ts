/**
 * Ollama provider for existing /api/intent/extract. Implements AIProvider.
 * Set AI_MODE=ollama to use. Calls http://localhost:11434/api/generate with llama3.
 */

import type { AIProvider } from "../AIProvider.js";
import type { ExtractedIntent } from "../../types/intent.js";
import { isSupportedIntent, UNSUPPORTED_RESPONSE } from "../../types/intent.js";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

const SYSTEM_PROMPT = `You are an intent extraction engine. Return ONLY valid JSON, no other text.
Supported intents: schedule_class, cancel_class, reschedule_class, add_student, send_reminder.
If the message does not match any intent, return: {"intent":"unsupported"}
Otherwise return JSON with: intent, and when relevant: studentName, subject, date, time, newDate, newTime, message.
Use date format YYYY-MM-DD and time as HH:MM.`;

export class OllamaProvider implements AIProvider {
  private model: string;

  constructor(model: string = "llama3") {
    this.model = model;
  }

  async extractIntent(text: string): Promise<ExtractedIntent> {
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${text.trim() || "No input"}\n\nJSON:`;
    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: { temperature: 0.1 },
        }),
      });
      if (!res.ok) return UNSUPPORTED_RESPONSE;
      const data = (await res.json()) as { response?: string };
      const raw = data.response?.trim() ?? "";
      const json = this.parseJson(raw);
      if (!json || typeof json.intent !== "string") return UNSUPPORTED_RESPONSE;
      if (!isSupportedIntent(json.intent)) return UNSUPPORTED_RESPONSE;
      return {
        intent: json.intent,
        studentName: json.studentName,
        subject: json.subject,
        date: json.date,
        time: json.time,
        newDate: json.newDate,
        newTime: json.newTime,
        message: json.message,
      } as ExtractedIntent;
    } catch {
      return UNSUPPORTED_RESPONSE;
    }
  }

  private parseJson(raw: string): Record<string, unknown> | null {
    const cleaned = raw.replace(/```json?\s*/gi, "").replace(/```\s*$/g, "").trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
