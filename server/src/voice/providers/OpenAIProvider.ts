/**
 * Voice pipeline OpenAI provider. Wraps existing AI extractIntent for consistency.
 */

import { getAIProvider } from "../../ai/index.js";
import type { ExtractedIntent } from "../../types/intent.js";

export interface VoiceIntentResult {
  intent: string;
  studentName?: string;
  subject?: string;
  date?: string;
  time?: string;
  newDate?: string;
  newTime?: string;
  message?: string;
}

export class VoiceOpenAIProvider {
  async extractIntent(text: string): Promise<VoiceIntentResult> {
    const provider = getAIProvider();
    const result = (await provider.extractIntent(text)) as ExtractedIntent;
    return {
      intent: result.intent,
      studentName: result.studentName,
      subject: result.subject,
      date: result.date,
      time: result.time,
      newDate: result.newDate,
      newTime: result.newTime,
      message: result.message,
    };
  }
}
