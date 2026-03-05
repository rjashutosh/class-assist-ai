/**
 * Subscription enforcement layer for ClassAssist Pro.
 * Plans: BASIC (2 classes/mo), PRO (50), ENTERPRISE (unlimited).
 */

import { prisma } from "../lib/prisma.js";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export type Plan = "BASIC" | "PRO" | "ENTERPRISE";

const PLAN_LIMITS: Record<Plan, { classesPerMonth: number; reminders: boolean; analytics: boolean; integrations: boolean }> = {
  BASIC: { classesPerMonth: 2, reminders: false, analytics: false, integrations: false },
  PRO: { classesPerMonth: 50, reminders: true, analytics: true, integrations: false },
  ENTERPRISE: { classesPerMonth: -1, reminders: true, analytics: true, integrations: true },
};

export async function getEffectivePlan(accountId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({
    where: { accountId },
  });
  if (sub && sub.status === "ACTIVE") return sub.plan as Plan;
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { subscriptionTier: true },
  });
  if (account?.subscriptionTier === "PRO" || account?.subscriptionTier === "ENTERPRISE")
    return account.subscriptionTier as Plan;
  return "BASIC";
}

export async function getClassesCountThisMonth(accountId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.class.count({
    where: {
      accountId,
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
  });
}

export async function canCreateClass(accountId: string): Promise<{ allowed: boolean; limit?: number; count?: number; plan: Plan }> {
  if (DEMO_MODE) return { allowed: true, plan: "ENTERPRISE" };
  const plan = await getEffectivePlan(accountId);
  const limits = PLAN_LIMITS[plan];
  if (limits.classesPerMonth < 0) return { allowed: true, plan };
  const count = await getClassesCountThisMonth(accountId);
  return {
    allowed: count < limits.classesPerMonth,
    limit: limits.classesPerMonth,
    count,
    plan,
  };
}

export async function canSendReminder(accountId: string): Promise<boolean> {
  if (DEMO_MODE) return true;
  const plan = await getEffectivePlan(accountId);
  return PLAN_LIMITS[plan].reminders;
}

export async function canAccessAnalytics(accountId: string): Promise<boolean> {
  const plan = await getEffectivePlan(accountId);
  return PLAN_LIMITS[plan].analytics;
}

export async function canUseIntegrations(accountId: string): Promise<boolean> {
  const plan = await getEffectivePlan(accountId);
  return PLAN_LIMITS[plan].integrations;
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan];
}
