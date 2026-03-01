import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

const createAccountSchema = z.object({
  subscriptionTier: z.enum(["BASIC", "PRO"]).default("BASIC"),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["TEACHER", "MANAGER"]),
  accountId: z.string(),
});

router.use(authMiddleware);
router.use(requireRoles("ADMIN"));

router.post("/accounts", async (req, res) => {
  try {
    const body = createAccountSchema.parse(req.body);
    const account = await prisma.account.create({
      data: { subscriptionTier: body.subscriptionTier as "BASIC" | "PRO" },
    });
    res.status(201).json(account);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const body = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const account = await prisma.account.findUnique({ where: { id: body.accountId } });
    if (!account) {
      res.status(400).json({ error: "Account not found" });
      return;
    }
    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
        name: body.name,
        role: body.role as "TEACHER" | "MANAGER",
        accountId: body.accountId,
      },
      select: { id: true, email: true, name: true, role: true, accountId: true },
    });
    res.status(201).json(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/accounts", async (_req, res) => {
  const accounts = await prisma.account.findMany({
    include: {
      users: { select: { id: true, email: true, name: true, role: true } },
      _count: { select: { classes: true, students: true } },
    },
  });
  res.json(accounts);
});

router.get("/usage", async (_req, res) => {
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      subscriptionTier: true,
      _count: { select: { classes: true, students: true } },
    },
  });
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const classesThisMonth = await prisma.class.groupBy({
    by: ["accountId"],
    where: { createdAt: { gte: start } },
    _count: true,
  });
  const byAccount = Object.fromEntries(classesThisMonth.map((c) => [c.accountId, c._count]));
  res.json(
    accounts.map((a) => ({
      ...a,
      classesThisMonth: byAccount[a.id] ?? 0,
    }))
  );
});

export default router;
