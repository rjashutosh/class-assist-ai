// Supported intents only. If not in this list, return unsupported.
export const SUPPORTED_INTENTS = [
  "schedule_class",
  "cancel_class",
  "reschedule_class",
  "add_student",
  "send_reminder",
] as const;

export type SupportedIntent = (typeof SUPPORTED_INTENTS)[number];

export function isSupportedIntent(intent: string): intent is SupportedIntent {
  return SUPPORTED_INTENTS.includes(intent as SupportedIntent);
}

export interface ExtractedIntent {
  intent: SupportedIntent | "unsupported";
  studentName?: string;
  subject?: string;
  date?: string;
  time?: string;
  className?: string;
  newDate?: string;
  newTime?: string;
  message?: string;
  /** 0–1; if < 0.5 treat as unsupported */
  confidence?: number;
  /** True when schedule_class intent but no student name detected; frontend should ask for clarification */
  requiresStudentName?: boolean;
  /** Human-friendly confirmation summary for modal and TTS (e.g. "Schedule a Math class with Ashutosh on Sunday at 5 PM.") */
  confirmationSummary?: string;
  [key: string]: string | number | boolean | undefined;
}

export const UNSUPPORTED_RESPONSE: ExtractedIntent = {
  intent: "unsupported",
  message: "Sorry, I could not understand the request.",
};
