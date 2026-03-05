import type { Request, Response, NextFunction } from "express";
import { hasPermission, type Permission } from "./permissions.js";

/**
 * Requires that the authenticated user has at least one of the given permissions.
 * Must be used after authMiddleware (so req.user is set).
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user: { role: string } }).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const allowed = permissions.some((p) => hasPermission(user.role, p));
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", required: permissions });
      return;
    }
    next();
  };
}
