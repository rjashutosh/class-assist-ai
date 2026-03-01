import { prisma } from "../lib/prisma.js";
const BASIC_MONTHLY_LIMIT = 5;

export async function getClassesCountThisMonth(accountId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const count = await prisma.class.count({
    where: {
      accountId,
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
  });
  return count;
}

export async function canCreateClass(accountId: string): Promise<{ allowed: boolean; limit?: number; count?: number }> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { subscriptionTier: true },
  });
  if (!account) return { allowed: false };
  if (account.subscriptionTier === "PRO") return { allowed: true };
  const count = await getClassesCountThisMonth(accountId);
  return {
    allowed: count < BASIC_MONTHLY_LIMIT,
    limit: BASIC_MONTHLY_LIMIT,
    count,
  };
}

export function canSendReminder(tier: string): boolean {
  return tier === "PRO";
}
