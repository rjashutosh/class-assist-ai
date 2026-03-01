import type { AIProvider } from "./AIProvider.js";
import { LocalLLMProvider } from "./LocalLLMProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

const AI_MODE = process.env.AI_MODE ?? "openai";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

export function getAIProvider(): AIProvider {
  if (AI_MODE === "local") {
    return new LocalLLMProvider();
  }
  if (OPENAI_API_KEY) {
    return new OpenAIProvider(OPENAI_API_KEY);
  }
  // Fallback to local (returns unsupported) if no key
  return new LocalLLMProvider();
}

export { type AIProvider } from "./AIProvider.js";
export { OpenAIProvider } from "./OpenAIProvider.js";
export { LocalLLMProvider } from "./LocalLLMProvider.js";
