import twilio from "twilio";

export type WhatsAppNotificationResult = "sent" | "simulated" | "failed";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886";
const WHATSAPP_TEST_MODE = process.env.WHATSAPP_TEST_MODE === "true";

function hasTwilioConfig(): boolean {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
}

function buildMessage(studentName: string, meetingLink: string, dateTime: string): string {
  return `Hello ${studentName},

Your class has been scheduled.

Date & Time: ${dateTime}
Zoom Link: ${meetingLink}

Please join on time.`;
}

/**
 * Sends a class-scheduled WhatsApp message. In test mode, logs instead of sending.
 * Returns "sent" | "simulated" | "failed". Does not throw.
 */
export async function sendClassScheduledMessage(
  studentName: string,
  phoneNumber: string | null,
  meetingLink: string,
  dateTime: Date | string
): Promise<WhatsAppNotificationResult> {
  const dateTimeStr = typeof dateTime === "string" ? dateTime : new Date(dateTime).toLocaleString();
  const body = buildMessage(studentName, meetingLink, dateTimeStr);

  if (!phoneNumber?.trim()) {
    console.warn("[WHATSAPP_FAILED] No phone number for student:", studentName);
    return "failed";
  }

  const toNumber = phoneNumber.trim().startsWith("whatsapp:")
    ? phoneNumber.trim()
    : `whatsapp:${phoneNumber.trim()}`;

  if (WHATSAPP_TEST_MODE) {
    console.log("[WHATSAPP_SIMULATION] WhatsApp message simulated:");
    console.log("  To:", toNumber);
    console.log("  Message:", body);
    return "simulated";
  }

  if (!hasTwilioConfig()) {
    console.warn("[WHATSAPP_FAILED] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing — message not sent");
    return "failed";
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body,
      from: TWILIO_WHATSAPP_NUMBER,
      to: toNumber,
    });
    console.log("[WHATSAPP_SENT] Message sent to", toNumber);
    return "sent";
  } catch (err) {
    console.warn("[WHATSAPP_FAILED]", err instanceof Error ? err.message : err);
    return "failed";
  }
}
