import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/auth.js";
import { getAIProvider } from "../ai/index.js";
import { isSupportedIntent } from "../types/intent.js";

const router = Router();
const bodySchema = z.object({ transcript: z.string() });

router.post(
  "/extract",
  authMiddleware,
  requireRoles("TEACHER", "MANAGER"),
  async (req, res) => {
    try {
      const { transcript } = bodySchema.parse(req.body);
      const provider = getAIProvider();
      const result = await provider.extractIntent(transcript);
      if (!isSupportedIntent(result.intent as string)) {
        res.json({ intent: "unsupported" });
        return;
      }
      res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: e.errors });
        return;
      }
      res.status(500).json({ error: "Intent extraction failed" });
    }
  }
);

export default router;
