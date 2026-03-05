import { prisma } from "../lib/prisma.js";

const USAGE_TYPES = ["CLASS_CREATED", "VOICE_COMMAND", "REMINDER_SENT"] as const;

export async function incrementUsage(accountId: string, type: string): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  await prisma.usageLog.upsert({
    where: {
      accountId_type_month_year: { accountId, type, month, year },
    },
    create: { accountId, type, count: 1, month, year },
    update: { count: { increment: 1 } },
  });
}
