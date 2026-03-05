/**
 * Generate human-readable meeting confirmation text for notifications and API responses.
 */

import type { ExtractedIntent } from "../types/intent.js";

/**
 * Format: "Class scheduled with {studentName} on Sunday at 5:00 PM."
 * Uses toLocaleString for locale-aware date/time.
 */
export function generateMeetingInviteText(studentName: string, date: Date): string {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `Class scheduled with ${studentName} on ${dayName} at ${time}.`;
}

/**
 * Generate a human-friendly confirmation summary from extracted intent (for confirmation modal and TTS).
 * Uses raw date/time strings from the AI when no Date is available yet.
 */
export function generateConfirmationSummary(intent: ExtractedIntent): string {
  const subject = intent.subject ?? "class";
  const student = intent.studentName ?? "the student";
  const date = intent.date ?? "";
  const time = intent.time ?? "";
  const dateTime = [date, time].filter(Boolean).join(" ") || "the scheduled time";
  const newDateTime = [intent.newDate, intent.newTime].filter(Boolean).join(" ") || "";

  switch (intent.intent) {
    case "schedule_class":
      return `Schedule a ${subject} class with ${student} on ${dateTime}.`;
    case "cancel_class":
      return `Cancel the class with ${student}${date ? ` on ${date}` : ""}.`;
    case "reschedule_class":
      return newDateTime
        ? `Reschedule ${student}'s class to ${newDateTime}.`
        : `Reschedule the class for ${student}.`;
    case "send_reminder":
      return `Send a reminder to ${student}${date ? ` for ${date}` : ""}.`;
    case "add_student":
      return `Add new student ${student}.`;
    default:
      return "Confirm action.";
  }
}
