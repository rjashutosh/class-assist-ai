import OpenAI from "openai";
import {
  isSupportedIntent,
  SUPPORTED_INTENTS,
  UNSUPPORTED_RESPONSE,
  type ExtractedIntent,
} from "../types/intent.js";
import type { AIProvider } from "./AIProvider.js";
import { generateConfirmationSummary } from "../utils/meetingMessage.js";

const SYSTEM_PROMPT = `You are a natural-language intent extraction engine for a class scheduling assistant.
Understand flexible, conversational commands like a real assistant.

Supported intents ONLY:
- schedule_class (book/create/set up/add a class)
- cancel_class (cancel/remove/delete a class)
- reschedule_class (move/reschedule/change/push a class to a new time)
- send_reminder (send reminder/notify student about a class)
- add_student (add/create/register a new student)

Examples of commands you must understand:

Scheduling: "Schedule a class with Ashutosh on Sunday at 5 pm", "Book a physics class for grade 8 tomorrow evening", "Create a math class with Rahul next Monday 6 pm", "Add a class with Priya at 4 pm today", "Set up a chemistry class tomorrow morning"

Rescheduling: "Move my Sunday class to Monday 6 pm", "Reschedule Ashutosh's class to tomorrow at 4", "Change my 5 pm class to 7 pm", "Push the class to next Friday"

Cancellation: "Cancel my class with Ashutosh", "Remove the Sunday class", "Delete the class tomorrow"

Reminders: "Send reminder to Ashutosh", "Notify student about tomorrow's class", "Send reminder for today's class"

Student: "Add new student Rahul", "Create student Ashutosh", "Register a student named Priya"

Output rules:
1. Return ONLY valid JSON. No markdown, no explanation.
2. intent: exactly one of schedule_class, cancel_class, reschedule_class, send_reminder, add_student, or unsupported.
3. For schedule_class: extract studentName, subject (e.g. Math, physics), date (e.g. Sunday, tomorrow), time (e.g. 5 pm, evening). If no student name is given, set requiresStudentName: true.
4. For cancel_class: extract studentName and/or date/subject to identify the class.
5. For reschedule_class: extract studentName or context, date/time (current if mentioned), newDate, newTime.
6. For send_reminder: extract studentName, optionally date.
7. For add_student: extract studentName (required), optionally email, phone.
8. Use natural language for date/time (e.g. "Sunday", "tomorrow", "5 pm", "evening") — do not convert to ISO.
9. Add confidence: a number 0–1 indicating how confident you are this is the correct intent (e.g. 0.92).
10. If the message does not match any intent, return: {"intent":"unsupported","message":"Sorry, I could not understand the request.","confidence":0}`;

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
      const confidence = typeof json.confidence === "number" ? json.confidence : 1;

      if (confidence < 0.5) {
        return {
          intent: "unsupported",
          message: (json.message as string) ?? "Sorry, I could not understand the request.",
        };
      }

      if (!isSupportedIntent(intent)) {
        return {
          intent: "unsupported",
          message: (json.message as string) ?? "Sorry, I could not understand the request.",
        };
      }

      const extracted: ExtractedIntent = {
        intent,
        studentName: json.studentName as string | undefined,
        subject: json.subject as string | undefined,
        date: json.date as string | undefined,
        time: json.time as string | undefined,
        newDate: json.newDate as string | undefined,
        newTime: json.newTime as string | undefined,
        message: json.message as string | undefined,
        email: json.email as string | undefined,
        phone: json.phone as string | undefined,
        confidence,
        requiresStudentName: json.requiresStudentName === true,
      };
      extracted.confirmationSummary = generateConfirmationSummary(extracted);
      return extracted;
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
