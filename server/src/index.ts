import "dotenv/config";
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import intentRoutes from "./routes/intent.js";
import executeRoutes from "./routes/execute.js";
import studentsRoutes from "./routes/students.js";
import classesRoutes from "./routes/classes.js";
import adminRoutes from "./routes/admin.js";
import notificationsRoutes from "./routes/notifications.js";
import subscriptionRoutes from "./routes/subscription.js";
import voiceRoutes from "./voice/VoiceController.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/intent", intentRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/voice", voiceRoutes);

app.get("/api/me", authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountId: user.accountId,
    account: user.account,
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`ClassAssist AI server at http://localhost:${PORT}`);
});
