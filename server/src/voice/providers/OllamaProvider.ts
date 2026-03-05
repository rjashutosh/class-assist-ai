/**
 * Ollama local LLM provider. Calls http://localhost:11434/api/generate.
 * Returns strict JSON intent for voice pipeline.
 */

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

const SYSTEM_PROMPT = `You are an intent extraction engine. Return ONLY valid JSON, no other text.
Supported intents: schedule_class, cancel_class, reschedule_class, add_student, send_reminder.
If the message does not match any intent, return: {"intent":"unsupported"}
Otherwise return JSON with: intent, and when relevant: studentName, subject, date, time, newDate, newTime, message.
Use date format YYYY-MM-DD and time as HH:MM.`;

export interface OllamaIntentResult {
  intent: string;
  studentName?: string;
  subject?: string;
  date?: string;
  time?: string;
  newDate?: string;
  newTime?: string;
  message?: string;
}

export class OllamaProvider {
  private model: string;

  constructor(model: string = "llama3") {
    this.model = model;
  }

  async extractIntent(text: string): Promise<OllamaIntentResult> {
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
      if (!res.ok) {
        return { intent: "unsupported" };
      }
      const data = (await res.json()) as { response?: string };
      const raw = data.response?.trim() ?? "";
      const json = this.parseJson(raw);
      if (!json || typeof json.intent !== "string") return { intent: "unsupported" };
      return {
        intent: json.intent,
        studentName: json.studentName,
        subject: json.subject,
        date: json.date,
        time: json.time,
        newDate: json.newDate,
        newTime: json.newTime,
        message: json.message,
      };
    } catch {
      return { intent: "unsupported" };
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
