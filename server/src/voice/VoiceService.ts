/**
 * Voice AI orchestration: transcript → provider (Ollama/OpenAI) → IntentResolver → executeCommand.
 */

import type { ClassWithStudent } from "../orchestration/types.js";
import { executeCommand } from "../orchestration/commandOrchestrator.js";
import { log as auditLog, AUDIT_ACTIONS } from "../services/auditService.js";
import { incrementUsage } from "../services/usageLogService.js";
import { extractClassDate } from "../utils/dateParser.js";
import { generateMeetingInviteText } from "../utils/meetingMessage.js";
import { resolveToCommandBody } from "./IntentResolver.js";
import { OllamaProvider } from "./providers/OllamaProvider.js";
import { VoiceOpenAIProvider } from "./providers/OpenAIProvider.js";

const VOICE_AI_MODE = process.env.VOICE_AI_MODE ?? process.env.AI_MODE ?? "openai";
const DEMO_MODE = process.env.DEMO_MODE === "true";

export interface VoiceProcessInput {
  userId: string;
  accountId: string;
  transcript: string;
}

export interface VoiceProcessResult {
  success: boolean;
  intent?: string;
  data?: unknown;
  error?: string;
  /** When true, frontend should ask user to specify student name */
  requiresStudentName?: boolean;
}

export class VoiceService {
  private ollama = new OllamaProvider("llama3");
  private openAI = new VoiceOpenAIProvider();

  async process(input: VoiceProcessInput): Promise<VoiceProcessResult> {
    const { userId, accountId, transcript } = input;
    if (DEMO_MODE && !transcript.trim()) {
      return { success: true, intent: "schedule_class", data: { class: { id: "demo" } } };
    }
    const raw = VOICE_AI_MODE === "ollama"
      ? await this.ollama.extractIntent(transcript)
      : await this.openAI.extractIntent(transcript);

    const confidence = (raw as { confidence?: number }).confidence;
    if (confidence != null && confidence < 0.5) {
      return {
        success: false,
        intent: "unsupported",
        error: (raw as { message?: string }).message ?? "Sorry, I could not understand the request.",
      };
    }

    const body = resolveToCommandBody(raw, transcript);
    if (body.intent === "unsupported") {
      return {
        success: false,
        intent: "unsupported",
        error: (raw as { message?: string }).message ?? "Intent not recognized",
      };
    }

    const requiresStudentName = (raw as { requiresStudentName?: boolean }).requiresStudentName;
    const hasStudentName = body.studentName != null && String(body.studentName).trim().length > 0;
    if (body.intent === "schedule_class" && requiresStudentName && !hasStudentName) {
      return {
        success: false,
        intent: "schedule_class",
        error: "Please specify who the class is for (e.g. say the student name).",
        requiresStudentName: true as const,
      };
    }

    // For schedule_class, parse natural language date from transcript (e.g. "Sunday 5 pm", "tomorrow evening")
    if (body.intent === "schedule_class") {
      const classDate = extractClassDate(transcript);
      if (!classDate) {
        return {
          success: false,
          intent: "schedule_class",
          error: "Could not detect class time from voice command.",
        };
      }
      body.date = classDate.toISOString().slice(0, 10);
      body.time = `${classDate.getHours()}:${String(classDate.getMinutes()).padStart(2, "0")}`;
    }

    // For reschedule_class, parse new date/time from transcript (e.g. "Monday 6 pm")
    if (body.intent === "reschedule_class" && (body.newDate || body.newTime)) {
      const newDateTimeStr = [body.newDate, body.newTime].filter(Boolean).join(" ");
      const newDate = newDateTimeStr ? extractClassDate(newDateTimeStr) : null;
      if (newDate) {
        body.newDate = newDate.toISOString().slice(0, 10);
        body.newTime = `${newDate.getHours()}:${String(newDate.getMinutes()).padStart(2, "0")}`;
      }
    }
    const result = await executeCommand({ userId, accountId }, body);
    if (result.success) {
      await incrementUsage(accountId, "VOICE_COMMAND");
      await auditLog({ accountId, actorId: userId, action: AUDIT_ACTIONS.VOICE_COMMAND, metadata: { intent: body.intent } });
      let data: VoiceProcessResult["data"] = result.data;
      if (body.intent === "schedule_class" && data && typeof data === "object" && "class" in data && data.class) {
        const cls = data.class as ClassWithStudent;
        const dateTime = typeof cls.dateTime === "string" ? new Date(cls.dateTime) : cls.dateTime;
        data = {
          ...data,
          student: cls.student.name,
          scheduledAt: dateTime.toISOString(),
          message: generateMeetingInviteText(cls.student.name, dateTime),
        };
      }
      return { success: true, intent: body.intent, data };
    }
    const err = result.error as { code: string; message?: string };
    return {
      success: false,
      intent: body.intent,
      error: err.message ?? err.code,
    };
  }
}
