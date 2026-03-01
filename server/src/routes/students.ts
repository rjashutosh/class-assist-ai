import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();
const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

router.get("/", authMiddleware, requireRoles("TEACHER", "MANAGER"), async (req, res) => {
  const user = (req as any).user;
  if (!user.accountId) {
    res.status(403).json({ error: "No account" });
    return;
  }
  const students = await prisma.student.findMany({
    where: { accountId: user.accountId },
    orderBy: { name: "asc" },
  });
  res.json(students);
});

router.post("/", authMiddleware, requireRoles("TEACHER", "MANAGER"), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user.accountId) {
      res.status(403).json({ error: "No account" });
      return;
    }
    const body = createSchema.parse(req.body);
    const student = await prisma.student.create({
      data: {
        accountId: user.accountId,
        name: body.name,
        email: body.email || undefined,
        phone: body.phone,
      },
    });
    res.status(201).json(student);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    res.status(500).json({ error: "Failed to add student" });
  }
});

export default router;
