// LocalLLMProvider.ts
import type { AIProvider } from "./AIProvider.js";
import type { ExtractedIntent } from "../types/intent.js";
import { UNSUPPORTED_RESPONSE, isSupportedIntent } from "../types/intent.js";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

/** Extract a JSON object from LLM output that may contain prose (e.g. "Here is the JSON: {...}"). */
function extractJsonFromText(raw: string): unknown {
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = firstBrace; i < trimmed.length; i++) {
    if (trimmed[i] === "{") depth++;
    else if (trimmed[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(trimmed.slice(firstBrace, end + 1));
  } catch {
    return null;
  }
}

export class LocalLLMProvider implements AIProvider {
  async extractIntent(text: string): Promise<ExtractedIntent> {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Respond with ONLY a single JSON object, no other text. Extract the user intent from: "${text}". Return JSON with key "intent" (one of: schedule_class, cancel_class, reschedule_class, add_student, send_reminder, unsupported) and optional keys: studentName, subject, date, time, newDate, newTime, message. No explanation, only the JSON.`,
        stream: false,
      }),
    });

    const data = await response.json();
    const raw = data.response ?? "";

    const parsed = extractJsonFromText(raw);
    if (!parsed || typeof parsed !== "object" || !("intent" in parsed)) {
      return UNSUPPORTED_RESPONSE;
    }

    const obj = parsed as Record<string, unknown>;
    const intent = String(obj.intent ?? "unsupported");
    const result: ExtractedIntent = {
      intent: isSupportedIntent(intent) ? intent : "unsupported",
      studentName: obj.studentName != null ? String(obj.studentName) : undefined,
      subject: obj.subject != null ? String(obj.subject) : undefined,
      date: obj.date != null ? String(obj.date) : undefined,
      time: obj.time != null ? String(obj.time) : undefined,
      newDate: obj.newDate != null ? String(obj.newDate) : undefined,
      newTime: obj.newTime != null ? String(obj.newTime) : undefined,
      message: obj.message != null ? String(obj.message) : undefined,
    };
    return result;
  }
}
