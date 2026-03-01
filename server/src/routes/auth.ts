import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createToken } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "TEACHER", "MANAGER"]),
  accountId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    if (body.role === "TEACHER" || body.role === "MANAGER") {
      if (!body.accountId) {
        res.status(400).json({ error: "accountId required for Teacher/Manager" });
        return;
      }
      const account = await prisma.account.findUnique({ where: { id: body.accountId } });
      if (!account) {
        res.status(400).json({ error: "Account not found" });
        return;
      }
    }
    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
        name: body.name,
        role: body.role as "ADMIN" | "TEACHER" | "MANAGER",
        accountId: body.accountId,
      },
      select: { id: true, email: true, name: true, role: true, accountId: true },
    });
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      accountId: user.accountId ?? undefined,
    });
    res.json({ user, token });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { account: true },
    });
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      accountId: user.accountId ?? undefined,
    });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
        account: user.account,
      },
      token,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
