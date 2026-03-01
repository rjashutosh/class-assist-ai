import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", authMiddleware, requireRoles("TEACHER", "MANAGER"), async (req, res) => {
  const user = (req as any).user;
  if (!user.accountId) {
    res.status(403).json({ error: "No account" });
    return;
  }
  const notifications = await prisma.notification.findMany({
    where: { accountId: user.accountId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
});

export default router;
