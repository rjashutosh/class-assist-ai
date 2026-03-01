import type { ExtractedIntent } from "../types/intent.js";

export interface AIProvider {
  extractIntent(text: string): Promise<ExtractedIntent>;
}
