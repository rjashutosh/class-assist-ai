// LocalLLMProvider.ts
import type { AIProvider } from "./AIProvider.js";
import type { ExtractedIntent } from "../types/intent.js";

export class LocalLLMProvider implements AIProvider {
  async extractIntent(text: string): Promise<ExtractedIntent> {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Extract intent from this message and return JSON only:\n\n${text}`,
        stream: false
      })
    });

    const data = await response.json();

    return JSON.parse(data.response);
  }
}