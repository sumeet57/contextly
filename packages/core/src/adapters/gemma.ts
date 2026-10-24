import { ProcessedQuery } from "../queryProcessor.js";
import { ContextItem } from "../index.js";

export interface GeminiAdapterConfig {
  apiKey: string;
  model?: string;
}

interface GoogleAiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export function createGeminiHandler(config: GeminiAdapterConfig) {
  const modelName = config.model ?? "gemini-2.5-flash";
  const apiKey = config.apiKey;

  return async ({
    query,
    context,
  }: {
    query: ProcessedQuery;
    context: ContextItem[];
  }): Promise<string> => {
    const formattedContext = context
      .map((item) => `[${item.role.toUpperCase()}]: ${item.content}`)
      .join("\n");

    const prompt = `You are a context-aware AI assistant.
User Intent: ${query.intent}

RELEVANT CONTEXT HISTORY:
${formattedContext}

USER QUERY:
${query.originalQuery}

Provide a precise answer based ONLY on the context provided above.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = (await response.json()) as GoogleAiResponse;

    if (!response.ok || data.error) {
      throw new Error(
        `Google AI Studio Error (${response.status}): ${data.error?.message ?? "Unknown error"}`,
      );
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  };
}
