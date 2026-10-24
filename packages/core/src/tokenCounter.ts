export function trimContextToTokenLimit<T extends { content: string }>(
  items: T[],
  maxTokens: number,
): T[] {
  let currentTokens = 0;
  const result: T[] = [];

  for (const item of items) {
    const tokens = estimateTokens(item.content);
    if (currentTokens + tokens > maxTokens) break;
    result.push(item);
    currentTokens += tokens;
  }

  return result;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function calculateContextTokens(
  items: Array<{ content: string }>,
): number {
  return items.reduce((acc, item) => acc + estimateTokens(item.content), 0);
}
