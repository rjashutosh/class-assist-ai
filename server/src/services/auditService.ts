/**
 * Audit logging for ClassAssist Pro. All important actions write to AuditLog.
 */

import { prisma } from "../lib/prisma.js";

export const AUDIT_ACTIONS = {
  CLASS_CREATED: "CLASS_CREATED",
  CLASS_CANCELLED: "CLASS_CANCELLED",
  CLASS_RESCHEDULED: "CLASS_RESCHEDULED",
  STUDENT_ADDED: "STUDENT_ADDED",
  REMINDER_SENT: "REMINDER_SENT",
  SUBSCRIPTION_UPDATED: "SUBSCRIPTION_UPDATED",
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  USER_CREATED: "USER_CREATED",
  VOICE_COMMAND: "VOICE_COMMAND",
} as const;

export interface AuditPayload {
  accountId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export async function log(payload: AuditPayload): Promise<void> {
  await prisma.auditLog.create({
    data: {
      accountId: payload.accountId,
      actorId: payload.actorId,
      action: payload.action,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    },
  });
}
