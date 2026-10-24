import { processQuery, ProcessedQuery } from "./queryProcessor.js";
import { estimateTokens, calculateContextTokens } from "./tokenCounter.js";

export * from "./queryProcessor.js";
export * from "./adapters/gemma.js";
export * from "./tokenCounter.js";

export interface ContextItem {
  role: "system" | "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MemovableConfig {
  tokensPerOptimizationCall?: number;
  maxContextTokens?: number;
  modelHandler?: (payload: {
    query: ProcessedQuery;
    context: ContextItem[];
  }) => Promise<string>;
}

export interface TokenStats {
  originalTokens: number;
  optimizedTokens: number;
  savedTokens: number;
  reductionPercentage: string;
}

export interface OptimiseResult {
  response: string;
  context: ContextItem[];
  query: ProcessedQuery;
  tokens: TokenStats;
}

export class MemovableEngine {
  private config: MemovableConfig;

  constructor(config: MemovableConfig = {}) {
    this.config = config;
  }

  public async optimise(
    userQuery: string,
    existingContext: ContextItem[] = [],
  ): Promise<OptimiseResult> {
    const processed = processQuery(userQuery);
    const filteredContext = this.filterContext(processed, existingContext);

    const originalTokens = calculateContextTokens(existingContext);
    const optimizedTokens = calculateContextTokens(filteredContext);
    const savedTokens = Math.max(0, originalTokens - optimizedTokens);
    const reductionPercentage =
      originalTokens > 0
        ? `${((savedTokens / originalTokens) * 100).toFixed(1)}%`
        : "0%";

    let responseText = "";
    if (this.config.modelHandler) {
      responseText = await this.config.modelHandler({
        query: processed,
        context: filteredContext,
      });
    }

    return {
      response: responseText,
      context: filteredContext,
      query: processed,
      tokens: {
        originalTokens,
        optimizedTokens,
        savedTokens,
        reductionPercentage,
      },
    };
  }

  private filterContext(
    processed: ProcessedQuery,
    context: ContextItem[],
  ): ContextItem[] {
    if (processed.requiresPreviousContext || processed.keywords.length === 0) {
      return context;
    }

    const keepIndices = new Set<number>();

    context.forEach((item, index) => {
      const text = item.content.toLowerCase();
      const isMatch = processed.keywords.some((kw) =>
        text.includes(kw.toLowerCase()),
      );

      if (isMatch) {
        keepIndices.add(index);
        if (item.role === "user" && index + 1 < context.length) {
          keepIndices.add(index + 1);
        }
        if (item.role === "assistant" && index > 0) {
          keepIndices.add(index - 1);
        }
      }
    });

    if (keepIndices.size > 0) {
      return context.filter((_, index) => keepIndices.has(index));
    }

    return context;
  }
}

export function Memovable(config: MemovableConfig = {}): MemovableEngine {
  return new MemovableEngine(config);
}
