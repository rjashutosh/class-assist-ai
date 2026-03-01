import { isSupportedIntent, UNSUPPORTED_RESPONSE, type ExtractedIntent } from "../types/intent.js";
import type { AIProvider } from "./AIProvider.js";

/**
 * Placeholder for future local LLM (Ollama, etc.).
 * For now returns unsupported so demo uses OpenAI.
 */
export class LocalLLMProvider implements AIProvider {
  async extractIntent(_text: string): Promise<ExtractedIntent> {
    // TODO: Call local LLM endpoint when integrated
    return UNSUPPORTED_RESPONSE;
  }
}
