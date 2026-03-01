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
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const where: any = { accountId: user.accountId };
  if (from) where.dateTime = { ...where.dateTime, gte: new Date(from) };
  if (to) where.dateTime = { ...where.dateTime, lte: new Date(to) };
  const classes = await prisma.class.findMany({
    where,
    include: { student: true },
    orderBy: { dateTime: "asc" },
  });
  res.json(classes);
});

router.get("/:id", authMiddleware, requireRoles("TEACHER", "MANAGER"), async (req, res) => {
  const user = (req as any).user;
  const cls = await prisma.class.findFirst({
    where: { id: req.params.id, accountId: user.accountId! },
    include: { student: true },
  });
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  res.json(cls);
});

export default router;
