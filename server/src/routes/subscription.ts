import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { canCreateClass, getEffectivePlan } from "../services/subscriptionService.js";

const router = Router();

router.get("/limits", authMiddleware, requireRoles("TEACHER", "MANAGER"), async (req, res) => {
  const user = (req as any).user;
  if (!user.accountId) {
    res.status(403).json({ error: "No account" });
    return;
  }
  const check = await canCreateClass(user.accountId);
  const plan = await getEffectivePlan(user.accountId);
  res.json({
    canCreateClass: check.allowed,
    limit: check.limit,
    count: check.count,
    tier: plan,
  });
});

export default router;
