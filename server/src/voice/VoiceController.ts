/**
 * Express routes for voice pipeline. Extends existing intent/execute flow.
 */

import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/auth.js";
import { VoiceService } from "./VoiceService.js";

const router = Router();
const voiceService = new VoiceService();

const processSchema = z.object({
  transcript: z.string(),
});

router.post(
  "/process",
  authMiddleware,
  requireRoles("TEACHER", "MANAGER"),
  async (req, res) => {
    try {
      const user = (req as unknown as { user: { id: string; accountId?: string } }).user;
      if (!user.accountId) {
        res.status(403).json({ error: "No account" });
        return;
      }
      const body = processSchema.parse(req.body);
      const result = await voiceService.process({
        userId: user.id,
        accountId: user.accountId,
        transcript: body.transcript,
      });
      if (result.success) {
        res.json({ success: true, intent: result.intent, data: result.data });
      } else {
        res.status(400).json({ success: false, intent: result.intent, error: result.error });
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: e.errors });
        return;
      }
      console.error(e);
      res.status(500).json({ error: "Voice processing failed" });
    }
  }
);

export default router;
