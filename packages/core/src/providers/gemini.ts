import { ProcessedQuery } from "../queryProcessor.js";

export interface ContextItem {
  role: "system" | "user" | "assistant";
  content: string;
}

export function createGeminiPrompt(
  query: ProcessedQuery,
  context: ContextItem[],
): string {
  return `You are a context-aware assistant.
User Intent: ${query.intent}
Original Query: ${query.originalQuery}

Relevant Context History:
${context.map((c) => `[${c.role.toUpperCase()}]:${c.content}`).join("\n")}

Respond accurately to the user query based on the context above.`;
}
