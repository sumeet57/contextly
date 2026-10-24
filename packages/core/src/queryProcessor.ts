export interface QuerySignals {
  asksReason: boolean;
  asksDecision: boolean;
  asksIdentity: boolean;
  asksComparison: boolean;
  mentionsIncident: boolean;
  hasTemporalReference: boolean;
  isNegated: boolean;
  hasPronounReference: boolean;
}

export type QueryIntent =
  | "retrieve_incident_and_reason"
  | "retrieve_decision_and_reason"
  | "retrieve_decision_and_comparison"
  | "retrieve_reason"
  | "retrieve_decision"
  | "retrieve_identity"
  | "retrieve_comparison"
  | "retrieve_incident"
  | "general_retrieval";

export interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  keywords: string[];
  intent: QueryIntent;
  signals: QuerySignals;
  requiresPreviousContext: boolean;
}

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "i",
  "me",
  "my",
  "mine",
  "we",
  "us",
  "our",
  "ours",
  "you",
  "your",
  "yours",
  "he",
  "him",
  "his",
  "she",
  "her",
  "hers",
  "they",
  "them",
  "their",
  "theirs",
  "it",
  "its",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "where",
  "when",
  "how",
  "do",
  "does",
  "did",
  "doing",
  "is",
  "am",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "can",
  "could",
  "would",
  "should",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "tell",
  "please",
  "hey",
  "hi",
  "hello",
  "there",
  "about",
  "to",
  "from",
  "of",
  "for",
  "in",
  "on",
  "at",
  "by",
  "with",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "as",
  "into",
  "onto",
  "up",
  "down",
  "out",
  "become",
  "go",
  "went",
  "gone",
  "u",
  "know",
  "this",
  "that",
  "these",
  "those",
  "right",
  "now",
]);

const INTENT_PATTERNS = {
  reason:
    /\b(?:why|reason|reasons|because|cause|causes|caused|root cause|explain why)\b/i,
  decision:
    /\b(?:decid(?:e|ed|es|ing)|choos(?:e|es|ing)|chose|chosen|select(?:s|ed|ing)?|pick(?:s|ed|ing)?|settled on|went with|opted for|final(?:ly)?)\b/i,
  identity:
    /\b(?:who is|who was|who are|who owns|who leads|who manages|who handles|assigned to|lead developer|owner of|name of)\b/i,
  comparison:
    /\b(?:versus|vs\.?|compared with|compared to|difference between|rather than|instead of|over)\b/i,
  incident:
    /\b(?:outage|went down|system down|service down|crash(?:ed)?|fail(?:ed|ure|s)?|failure|incident|unavailable|downtime|error)\b/i,
  temporal:
    /\b(?:today|yesterday|tomorrow|currently|recently|earlier|previously|before|after|last week|last month|last year|right now|at present)\b/i,
  followUp: /\b(?:it|this|that|these|those|one|ones|same|another|such)\b/i,
};

const SIGNAL_TERMS = new Set([
  "why",
  "reason",
  "reasons",
  "because",
  "cause",
  "causes",
  "caused",
  "root",
  "explain",
  "decide",
  "decided",
  "decides",
  "deciding",
  "choose",
  "chooses",
  "choosing",
  "chose",
  "chosen",
  "select",
  "selects",
  "selected",
  "selecting",
  "pick",
  "picks",
  "picked",
  "picking",
  "settled",
  "opted",
  "final",
  "finally",
  "over",
  "versus",
  "vs",
  "difference",
  "outage",
  "crash",
  "crashed",
  "failed",
  "failure",
  "fail",
  "incident",
  "unavailable",
  "downtime",
  "error",
  "today",
  "yesterday",
  "tomorrow",
  "currently",
  "recently",
  "earlier",
  "previously",
  "last",
]);

export function normalizeQuery(query: string): string {
  return query.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function tokenize(query: string): string[] {
  return query.toLowerCase().match(/[\p{L}\p{N}_-]+/gu) ?? [];
}

export function extractKeywords(query: string): string[] {
  return [
    ...new Set(
      tokenize(query).filter(
        (word) => !STOPWORDS.has(word) && !SIGNAL_TERMS.has(word),
      ),
    ),
  ];
}

export function detectSignals(query: string): QuerySignals {
  const q = query.toLowerCase();

  return {
    asksReason: INTENT_PATTERNS.reason.test(q),
    asksDecision: INTENT_PATTERNS.decision.test(q),
    asksIdentity: INTENT_PATTERNS.identity.test(q),
    asksComparison: INTENT_PATTERNS.comparison.test(q),
    mentionsIncident: INTENT_PATTERNS.incident.test(q),
    hasTemporalReference: INTENT_PATTERNS.temporal.test(q),
    isNegated:
      /\b(?:not|never|neither|without|didn't|doesn't|don't|won't|can't|couldn't|wouldn't|shouldn't|isn't|aren't|wasn't|weren't|no longer)\b/i.test(
        q,
      ),
    hasPronounReference: INTENT_PATTERNS.followUp.test(q),
  };
}

export function detectIntent(
  query: string,
  signals: QuerySignals,
): QueryIntent {
  const {
    asksReason,
    asksDecision,
    asksIdentity,
    asksComparison,
    mentionsIncident,
  } = signals;

  if (asksReason && mentionsIncident) return "retrieve_incident_and_reason";
  if (asksReason && asksDecision) return "retrieve_decision_and_reason";
  if (asksDecision && asksComparison) return "retrieve_decision_and_comparison";
  if (asksReason) return "retrieve_reason";
  if (asksDecision) return "retrieve_decision";
  if (asksIdentity) return "retrieve_identity";
  if (asksComparison) return "retrieve_comparison";
  if (mentionsIncident) return "retrieve_incident";

  return "general_retrieval";
}

export function processQuery(query: string): ProcessedQuery {
  if (typeof query !== "string" || !query.trim()) {
    throw new TypeError("query must be a non-empty string");
  }

  const normalizedQuery = normalizeQuery(query);
  const signals = detectSignals(normalizedQuery);
  const keywords = extractKeywords(normalizedQuery);

  const hasExplicitContextWords = /\b(?:previously|earlier|remember)\b/i.test(
    normalizedQuery,
  );
  const requiresPreviousContext =
    hasExplicitContextWords ||
    signals.hasPronounReference ||
    (keywords.length === 0 && (signals.asksReason || signals.asksDecision));

  return {
    originalQuery: query,
    normalizedQuery,
    keywords,
    intent: detectIntent(normalizedQuery, signals),
    signals,
    requiresPreviousContext,
  };
}
