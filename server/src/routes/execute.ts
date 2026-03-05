import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { executeCommand, mapCommandResultToHttp } from "../orchestration/commandOrchestrator.js";
import type { ExecuteCommandBody } from "../orchestration/types.js";
import { generateMeetingInviteText } from "../utils/meetingMessage.js";

const router = Router();

const executeSchema = z.object({
  intent: z.string(),
  studentName: z.string().optional(),
  subject: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  newDate: z.string().optional(),
  newTime: z.string().optional(),
  message: z.string().optional(),
  transcript: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

router.post(
  "/",
  authMiddleware,
  requireRoles("TEACHER", "MANAGER"),
  async (req, res) => {
    try {
      const body = executeSchema.parse(req.body) as ExecuteCommandBody;
      const user = (req as unknown as { user: { id: string; accountId?: string } }).user;
      if (!user.accountId) {
        res.status(403).json({ error: "No account" });
        return;
      }
      const result = await executeCommand(
        { userId: user.id, accountId: user.accountId },
        body
      );
      const { status, json } = mapCommandResultToHttp(result);
      if (status === 200 && json && typeof json === "object" && "class" in json && json.class) {
        const cls = json.class as { dateTime: string; student: { name: string } };
        (json as Record<string, unknown>).student = cls.student.name;
        (json as Record<string, unknown>).scheduledAt = cls.dateTime;
        (json as Record<string, unknown>).message = generateMeetingInviteText(
          cls.student.name,
          new Date(cls.dateTime)
        );
      }
      res.status(status).json(json);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: e.errors });
        return;
      }
      console.error(e);
      res.status(500).json({ error: "Execution failed" });
    }
  }
);

export default router;
