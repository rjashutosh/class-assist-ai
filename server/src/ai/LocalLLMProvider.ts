import type { AIProvider } from "./AIProvider.js";
import type { ExtractedIntent } from "../types/intent.js";
import { UNSUPPORTED_RESPONSE, isSupportedIntent } from "../types/intent.js";
import { generateConfirmationSummary } from "../utils/meetingMessage.js";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

const INTENT_PROMPT = `You are an intent extraction engine for a class scheduling assistant. Understand natural commands.

Supported intents ONLY: schedule_class, cancel_class, reschedule_class, add_student, send_reminder, unsupported.

Examples: "Schedule a class with Ashutosh on Sunday 5 pm" -> schedule_class; "Cancel my class with Ashutosh" -> cancel_class; "Move Sunday class to Monday 6 pm" -> reschedule_class; "Send reminder to Ashutosh" -> send_reminder; "Add student Rahul" -> add_student.

Return ONLY a JSON object. Keys: intent (required), studentName, subject, date, time, newDate, newTime, message, confidence (0-1 number), requiresStudentName (true if schedule_class but no student name). Use natural date/time (e.g. "Sunday", "tomorrow", "5 pm"). If unclear, return intent "unsupported" and message "Sorry, I could not understand the request."`;

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
        prompt: `${INTENT_PROMPT}\n\nUser message: "${text}"\n\nJSON only:`,
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
    const confidence = typeof obj.confidence === "number" ? obj.confidence : 1;

    if (confidence < 0.5) {
      return {
        intent: "unsupported",
        message: (obj.message as string) ?? "Sorry, I could not understand the request.",
      };
    }

    if (!isSupportedIntent(intent)) {
      return {
        intent: "unsupported",
        message: (obj.message as string) ?? "Sorry, I could not understand the request.",
      };
    }

    const result: ExtractedIntent = {
      intent: intent as ExtractedIntent["intent"],
      studentName: obj.studentName != null ? String(obj.studentName) : undefined,
      subject: obj.subject != null ? String(obj.subject) : undefined,
      date: obj.date != null ? String(obj.date) : undefined,
      time: obj.time != null ? String(obj.time) : undefined,
      newDate: obj.newDate != null ? String(obj.newDate) : undefined,
      newTime: obj.newTime != null ? String(obj.newTime) : undefined,
      message: obj.message != null ? String(obj.message) : undefined,
      confidence,
      requiresStudentName: obj.requiresStudentName === true,
    };
    result.confirmationSummary = generateConfirmationSummary(result);
    return result;
  }
}
