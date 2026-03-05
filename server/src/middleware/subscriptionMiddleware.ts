import type { Request, Response, NextFunction } from "express";
import { canCreateClass, canAccessAnalytics } from "../services/subscriptionService.js";

const DEMO_MODE = process.env.DEMO_MODE === "true";

/**
 * Ensures the tenant can create more classes this month (unless DEMO_MODE).
 * Attaches subscription check to req; route/handler should call next or respond 403.
 */
export async function requireCanCreateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as Request & { user: { accountId?: string } }).user;
  if (!user?.accountId) {
    res.status(403).json({ error: "No account" });
    return;
  }
  if (DEMO_MODE) {
    next();
    return;
  }
  const check = await canCreateClass(user.accountId);
  if (!check.allowed) {
    res.status(403).json({
      error: "BASIC_LIMIT_REACHED",
      message: "Monthly class limit reached. Upgrade to PRO or ENTERPRISE.",
      limit: check.limit,
      count: check.count,
    });
    return;
  }
  next();
}

/**
 * Ensures the tenant can access analytics (PRO/ENTERPRISE). Used for GET /api/admin/analytics per-tenant or analytics routes.
 */
export async function requireCanAccessAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as Request & { user: { accountId?: string; role: string } }).user;
  if (user?.role === "ADMIN") {
    next();
    return;
  }
  if (!user?.accountId) {
    res.status(403).json({ error: "No account" });
    return;
  }
  if (DEMO_MODE) {
    next();
    return;
  }
  const allowed = await canAccessAnalytics(user.accountId);
  if (!allowed) {
    res.status(403).json({ error: "Analytics not available on your plan" });
    return;
  }
  next();
}
