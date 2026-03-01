import OpenAI from "openai";
import {
  isSupportedIntent,
  SUPPORTED_INTENTS,
  UNSUPPORTED_RESPONSE,
  type ExtractedIntent,
} from "../types/intent.js";
import type { AIProvider } from "./AIProvider.js";

const SYSTEM_PROMPT = `You are an intent extraction engine.
Supported intents ONLY:
- schedule_class
- cancel_class
- reschedule_class
- add_student
- send_reminder

Rules:
1. Return ONLY valid JSON. No explanation text.
2. If the user's message does not match any supported intent, return: {"intent":"unsupported"}
3. For schedule_class: extract studentName, subject, date, time (all strings).
4. For cancel_class: extract studentName or subject, date (to identify the class).
5. For reschedule_class: extract studentName or subject, date, time (current), newDate, newTime.
6. For add_student: extract studentName, and optionally email, phone.
7. For send_reminder: extract studentName or subject, date, message (optional).
8. Use ISO date format (YYYY-MM-DD) for date fields when possible. Time as HH:MM or "10am" style.
9. intent MUST be exactly one of: schedule_class, cancel_class, reschedule_class, add_student, send_reminder, or unsupported.`;

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async extractIntent(text: string): Promise<ExtractedIntent> {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.trim() || "No input" },
        ],
        temperature: 0.1,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      if (!raw) return UNSUPPORTED_RESPONSE;

      const json = this.parseJson(raw);
      if (!json || typeof json !== "object") return UNSUPPORTED_RESPONSE;

      const intent = (json.intent ?? "unsupported") as string;
      if (!isSupportedIntent(intent)) return UNSUPPORTED_RESPONSE;

      return {
        intent,
        studentName: json.studentName,
        subject: json.subject,
        date: json.date,
        time: json.time,
        newDate: json.newDate,
        newTime: json.newTime,
        message: json.message,
        email: json.email,
        phone: json.phone,
      } as ExtractedIntent;
    } catch {
      return UNSUPPORTED_RESPONSE;
    }
  }

  private parseJson(raw: string): Record<string, unknown> | null {
    const cleaned = raw.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
