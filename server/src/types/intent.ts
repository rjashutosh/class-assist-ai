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
  [key: string]: string | undefined;
}

export const UNSUPPORTED_RESPONSE: ExtractedIntent = { intent: "unsupported" };
