/**
 * Maps raw intent JSON from voice providers to ExecuteCommandBody for the orchestrator.
 */

import type { ExecuteCommandBody } from "../orchestration/types.js";
import { SUPPORTED_INTENTS } from "../types/intent.js";

export interface RawIntentJson {
  intent: string;
  studentName?: string;
  subject?: string;
  date?: string;
  time?: string;
  newDate?: string;
  newTime?: string;
  message?: string;
}

export function resolveToCommandBody(raw: RawIntentJson, transcript?: string): ExecuteCommandBody {
  const intent = SUPPORTED_INTENTS.includes(raw.intent as any) ? raw.intent : "unsupported";
  return {
    intent,
    studentName: raw.studentName,
    subject: raw.subject,
    date: raw.date,
    time: raw.time,
    newDate: raw.newDate,
    newTime: raw.newTime,
    message: raw.message,
    transcript,
  };
}
