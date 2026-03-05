/**
 * Voice AI orchestration: transcript → provider (Ollama/OpenAI) → IntentResolver → executeCommand.
 */

import { executeCommand } from "../orchestration/commandOrchestrator.js";
import { log as auditLog, AUDIT_ACTIONS } from "../services/auditService.js";
import { incrementUsage } from "../services/usageLogService.js";
import { IntentResolver, resolveToCommandBody } from "./IntentResolver.js";
import { OllamaProvider } from "./providers/OllamaProvider.js";
import { VoiceOpenAIProvider } from "./providers/OpenAIProvider.js";

const VOICE_AI_MODE = process.env.VOICE_AI_MODE ?? process.env.AI_MODE ?? "openai";
const DEMO_MODE = process.env.DEMO_MODE === "true";

export interface VoiceProcessInput {
  userId: string;
  accountId: string;
  transcript: string;
}

export interface VoiceProcessResult {
  success: boolean;
  intent?: string;
  data?: unknown;
  error?: string;
}

export class VoiceService {
  private ollama = new OllamaProvider("llama3");
  private openAI = new VoiceOpenAIProvider();

  async process(input: VoiceProcessInput): Promise<VoiceProcessResult> {
    const { userId, accountId, transcript } = input;
    if (DEMO_MODE && !transcript.trim()) {
      return { success: true, intent: "schedule_class", data: { class: { id: "demo" } } };
    }
    const raw = VOICE_AI_MODE === "ollama"
      ? await this.ollama.extractIntent(transcript)
      : await this.openAI.extractIntent(transcript);
    const body = resolveToCommandBody(raw, transcript);
    if (body.intent === "unsupported") {
      return { success: false, intent: "unsupported", error: "Intent not recognized" };
    }
    const result = await executeCommand({ userId, accountId }, body);
    if (result.success) {
      await incrementUsage(accountId, "VOICE_COMMAND");
      await auditLog({ accountId, actorId: userId, action: AUDIT_ACTIONS.VOICE_COMMAND, metadata: { intent: body.intent } });
      return { success: true, intent: body.intent, data: result.data };
    }
    return {
      success: false,
      intent: body.intent,
      error: result.error.code,
    };
  }
}
