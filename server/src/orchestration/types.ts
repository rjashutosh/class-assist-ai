import type { Account, Student, Class } from "@prisma/client";

/** Account with students included. Loaded once by orchestrator and passed to classService. */
export type AccountWithStudents = Account & { students: Student[] };

/** Class with student relation (from include: { student: true }). */
export type ClassWithStudent = Class & { student: Student };

/** Context passed to classService. Orchestrator loads account once and provides it here. */
export interface ExecuteContext {
  userId: string;
  accountId: string;
  account: AccountWithStudents;
}

/** Request body for execute command. Matches Zod executeSchema shape. */
export interface ExecuteCommandBody {
  intent: string;
  studentName?: string;
  subject?: string;
  date?: string;
  time?: string;
  newDate?: string;
  newTime?: string;
  message?: string;
  transcript?: string;
  email?: string;
  phone?: string;
}

/** Business errors returned by orchestrator. NO_ACCOUNT is handled by route and not included. */
export type CommandError =
  | { code: "ACCOUNT_NOT_FOUND" }
  | { code: "BASIC_LIMIT_REACHED"; limit?: number; count?: number }
  | { code: "STUDENT_NAME_REQUIRED"; confirmationIssue: true }
  | { code: "NO_MATCHING_CLASS"; confirmationIssue: true }
  | { code: "MULTIPLE_CLASSES"; confirmationIssue: true }
  | { code: "REMINDER_NOT_ALLOWED" }
  | { code: "UNSUPPORTED_INTENT" };

/** Success payloads per intent. API response shape preserved. */
export type CommandSuccessData =
  | { class: ClassWithStudent }
  | { cancelled: string }
  | { student: Student }
  | { remindersSent: number };

export type CommandResult =
  | { success: true; data: CommandSuccessData }
  | { success: false; error: CommandError };
