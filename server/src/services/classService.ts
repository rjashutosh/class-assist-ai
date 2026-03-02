import { prisma } from "../lib/prisma.js";
import { canCreateClass, canSendReminder } from "./subscription.js";
import { createMockNotification } from "./notificationService.js";
import type { CommandError, CommandSuccessData, ExecuteContext } from "../orchestration/types.js";
import type { ExecuteCommandBody } from "../orchestration/types.js";
import type { ClassWithStudent } from "../orchestration/types.js";
export function parseDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?/);
    const h = match ? parseInt(match[1], 10) : 9;
    const m = match && match[2] ? parseInt(match[2], 10) : 0;
    d.setHours(h, m, 0, 0);
  }
  return d;
}

function buildDateFilter(dateStr?: string): Record<string, unknown> {
  if (!dateStr) return {};
  const gte = new Date(dateStr);
  const lt = new Date(gte);
  lt.setDate(lt.getDate() + 1);
  return {
    dateTime: { gte, lt },
  };
}

export async function scheduleClass(
  ctx: ExecuteContext,
  body: ExecuteCommandBody
): Promise<{ class: ClassWithStudent }> {
  const check = await canCreateClass(ctx.accountId);
  if (!check.allowed) {
    throw { code: "BASIC_LIMIT_REACHED" as const, limit: check.limit, count: check.count };
  }
  let student = ctx.account.students.find(
    (s) => s.name.toLowerCase() === (body.studentName ?? "").toLowerCase()
  );
  if (!student && body.studentName) {
    student = await prisma.student.create({
      data: { accountId: ctx.accountId, name: body.studentName.trim() },
    });
  }
  if (!student) {
    throw { code: "STUDENT_NAME_REQUIRED" as const, confirmationIssue: true as const };
  }
  const dateTime = parseDateTime(body.date, body.time) ?? new Date();
  const meetingLink = `https://meet.demo/class-${Date.now()}`;
  const cls = await prisma.class.create({
    data: {
      accountId: ctx.accountId,
      studentId: student.id,
      subject: body.subject ?? "General",
      dateTime,
      status: "UPCOMING",
      meetingLink,
      transcript: body.transcript ?? null,
      createdBy: ctx.userId,
    },
    include: { student: true },
  });
  await createMockNotification(
    ctx.accountId,
    "MEETING_INVITE",
    student.email ?? student.phone ?? student.name,
    `Class scheduled: ${body.subject} on ${dateTime.toISOString()}. Link: ${meetingLink}`
  );
  return { class: cls };
}

export async function cancelClass(
  ctx: ExecuteContext,
  body: ExecuteCommandBody
): Promise<{ cancelled: string }> {
  const dateFilter = buildDateFilter(body.date);
  const classes = await prisma.class.findMany({
    where: {
      accountId: ctx.accountId,
      status: "UPCOMING",
      ...(body.studentName && { student: { name: { contains: body.studentName } } }),
      ...(body.subject && { subject: { contains: body.subject } }),
      ...dateFilter,
    },
    include: { student: true },
  });
  if (classes.length === 0) {
    throw { code: "NO_MATCHING_CLASS" as const, confirmationIssue: true as const };
  }
  if (classes.length > 1) {
    throw { code: "MULTIPLE_CLASSES" as const, confirmationIssue: true as const };
  }
  const toCancel = classes[0];
  await prisma.class.update({
    where: { id: toCancel.id },
    data: { status: "CANCELLED" },
  });
  await createMockNotification(
    ctx.accountId,
    "WHATSAPP",
    toCancel.student.email ?? toCancel.student.phone ?? toCancel.student.name,
    `Class cancelled: ${toCancel.subject} on ${toCancel.dateTime.toISOString()}`
  );
  return { cancelled: toCancel.id };
}

export async function rescheduleClass(
  ctx: ExecuteContext,
  body: ExecuteCommandBody
): Promise<{ class: ClassWithStudent }> {
  const dateFilter = buildDateFilter(body.date);
  const classes = await prisma.class.findMany({
    where: {
      accountId: ctx.accountId,
      status: "UPCOMING",
      ...(body.studentName && { student: { name: { contains: body.studentName } } }),
      ...(body.subject && { subject: { contains: body.subject } }),
      ...dateFilter,
    },
    include: { student: true },
  });
  if (classes.length === 0) {
    throw { code: "NO_MATCHING_CLASS" as const, confirmationIssue: true as const };
  }
  if (classes.length > 1) {
    throw { code: "MULTIPLE_CLASSES" as const, confirmationIssue: true as const };
  }
  const newDateTime =
    parseDateTime(body.newDate ?? body.date, body.newTime ?? body.time) ?? classes[0].dateTime;
  const updated = await prisma.class.update({
    where: { id: classes[0].id },
    data: { dateTime: newDateTime },
    include: { student: true },
  });
  await createMockNotification(
    ctx.accountId,
    "MEETING_INVITE",
    updated.student.email ?? updated.student.phone ?? updated.student.name,
    `Class rescheduled to ${newDateTime.toISOString()}. Link: ${updated.meetingLink}`
  );
  return { class: updated };
}

export async function addStudent(
  ctx: ExecuteContext,
  body: ExecuteCommandBody
): Promise<{ student: Awaited<ReturnType<typeof prisma.student.create>> }> {
  if (!body.studentName?.trim()) {
    throw { code: "STUDENT_NAME_REQUIRED" as const, confirmationIssue: true as const };
  }
  const student = await prisma.student.create({
    data: {
      accountId: ctx.accountId,
      name: body.studentName.trim(),
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
    },
  });
  return { student };
}

export async function sendReminders(
  ctx: ExecuteContext,
  body: ExecuteCommandBody
): Promise<{ remindersSent: number }> {
  if (!canSendReminder(ctx.account.subscriptionTier)) {
    throw { code: "REMINDER_NOT_ALLOWED" as const };
  }
  const dateFilter = buildDateFilter(body.date);
  const classes = await prisma.class.findMany({
    where: {
      accountId: ctx.accountId,
      status: "UPCOMING",
      ...(body.studentName && { student: { name: { contains: body.studentName } } }),
      ...(body.subject && { subject: { contains: body.subject } }),
      ...dateFilter,
    },
    include: { student: true },
  });
  if (classes.length === 0) {
    throw { code: "NO_MATCHING_CLASS" as const, confirmationIssue: true as const };
  }
  for (const c of classes) {
    await createMockNotification(
      ctx.accountId,
      "REMINDER",
      c.student.email ?? c.student.phone ?? c.student.name,
      body.message ?? `Reminder: ${c.subject} on ${c.dateTime.toISOString()}`
    );
  }
  return { remindersSent: classes.length };
}

export function isCommandError(e: unknown): e is CommandError {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as CommandError).code === "string";
}
