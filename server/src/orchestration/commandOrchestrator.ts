import { prisma } from "../lib/prisma.js";
import * as classService from "../services/classService.js";
import { isCommandError } from "../services/classService.js";
import type { CommandResult, CommandError, ExecuteCommandBody, ExecuteContext } from "./types.js";
import type { SupportedIntent } from "../types/intent.js";

/**
 * Loads account once and passes it to classService. classService does NOT load account again.
 */
export async function executeCommand(
  context: { userId: string; accountId: string },
  body: ExecuteCommandBody
): Promise<CommandResult> {
  const account = await prisma.account.findUnique({
    where: { id: context.accountId },
    include: { students: true },
  });
  if (!account) {
    return { success: false, error: { code: "ACCOUNT_NOT_FOUND" } };
  }
  const ctx: ExecuteContext = {
    userId: context.userId,
    accountId: context.accountId,
    account,
  };

  const intent = body.intent as SupportedIntent;
  const supported: SupportedIntent[] = ["schedule_class", "cancel_class", "reschedule_class", "add_student", "send_reminder"];
  if (!supported.includes(intent)) {
    return { success: false, error: { code: "UNSUPPORTED_INTENT" } };
  }

  try {
    switch (intent) {
      case "schedule_class": {
        const data = await classService.scheduleClass(ctx, body);
        return { success: true, data };
      }
      case "cancel_class": {
        const data = await classService.cancelClass(ctx, body);
        return { success: true, data };
      }
      case "reschedule_class": {
        const data = await classService.rescheduleClass(ctx, body);
        return { success: true, data };
      }
      case "add_student": {
        const data = await classService.addStudent(ctx, body);
        return { success: true, data };
      }
      case "send_reminder": {
        const data = await classService.sendReminders(ctx, body);
        return { success: true, data };
      }
    }
  } catch (e) {
    if (isCommandError(e)) {
      return { success: false, error: e };
    }
    // Prisma P2021 = referenced record does not exist (e.g. student/account)
    const prismaCode = (e as { code?: string })?.code;
    if (prismaCode === "P2021") {
      return {
        success: false,
        error: { code: "CREATE_FAILED", message: "Student or account not found. Try adding the student first." },
      };
    }
    throw e;
  }
}

export interface MapResult {
  status: number;
  json: object;
}

/**
 * Maps CommandResult to HTTP status and JSON body. Exhaustive switch on error.code.
 * Preserves all current API response shapes and status codes.
 */
export function mapCommandResultToHttp(result: CommandResult): MapResult {
  if (result.success) {
    return { status: 200, json: { success: true, ...result.data } };
  }

  const error = result.error;
  switch (error.code) {
    case "ACCOUNT_NOT_FOUND":
      return { status: 404, json: { error: "Account not found" } };
    case "BASIC_LIMIT_REACHED":
      return {
        status: 403,
        json: {
          error: "BASIC_LIMIT_REACHED",
          message: "Monthly class limit reached. Upgrade to PRO.",
          limit: error.limit,
          count: error.count,
        },
      };
    case "STUDENT_NAME_REQUIRED":
      return {
        status: 400,
        json: { error: "Student name required", confirmationIssue: true },
      };
    case "NO_MATCHING_CLASS":
      return {
        status: 404,
        json: { error: "No matching class found", confirmationIssue: true },
      };
    case "MULTIPLE_CLASSES":
      return {
        status: 400,
        json: {
          error: "MULTIPLE_CLASSES",
          message: "Multiple classes found. Please specify date.",
          confirmationIssue: true,
        },
      };
    case "REMINDER_NOT_ALLOWED":
      return {
        status: 403,
        json: {
          error: "REMINDER_NOT_ALLOWED",
          message: "Reminders are available on PRO only.",
        },
      };
    case "UNSUPPORTED_INTENT":
      return { status: 400, json: { error: "Unsupported intent" } };
    case "CREATE_FAILED":
      return {
        status: 400,
        json: {
          error: "CREATE_FAILED",
          message: (error as { message?: string }).message ?? "Could not create class. Try adding the student first.",
        },
      };
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}
