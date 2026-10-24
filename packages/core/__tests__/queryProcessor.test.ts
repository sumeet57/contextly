import {
  processQuery,
  normalizeQuery,
  extractKeywords,
  detectSignals,
  detectIntent,
} from "../src/queryProcessor";
import { describe, test, expect, it } from "vitest";
describe("Query Processor Suite", () => {
  describe("Unit Tests: Individual Helper Functions", () => {
    test("normalizeQuery should strip redundant whitespace and normalize unicode", () => {
      expect(normalizeQuery("   WHY    did   we   choose   Docker???   ")).toBe(
        "WHY did we choose Docker???",
      );
    });

    test("extractKeywords should remove stopwords, signal words, and duplicates", () => {
      const keywords = extractKeywords(
        "Why did we choose Redis over Memcached for caching Redis?",
      );
      expect(keywords).toEqual(["redis", "memcached", "caching"]);
    });

    test("detectSignals should flag correct boolean signals", () => {
      const signals = detectSignals("Why did the service crash yesterday?");
      expect(signals).toEqual({
        asksReason: true,
        asksDecision: false,
        asksIdentity: false,
        asksComparison: false,
        mentionsIncident: true,
        hasTemporalReference: true,
        isNegated: false,
        hasPronounReference: false,
      });
    });
  });

  describe("Integration Tests: processQuery Intent & Keyword Extraction", () => {
    test("General Retrieval Query", () => {
      const result = processQuery(
        "Hey there! Can you tell me what the capital of France is?",
      );
      expect(result.intent).toBe("general_retrieval");
      expect(result.keywords).toEqual(["capital", "france"]);
      expect(result.requiresPreviousContext).toBe(false);
    });

    test("Identity Retrieval Query", () => {
      const result = processQuery("hi, who is the CEO of Apple right now?");
      expect(result.intent).toBe("retrieve_identity");
      expect(result.keywords).toEqual(["ceo", "apple"]);
      expect(result.signals.hasTemporalReference).toBe(true);
      expect(result.requiresPreviousContext).toBe(false);
    });

    test("Decision and Reason Query", () => {
      const result = processQuery(
        "Why did we finally choose Redis over Memcached for caching?",
      );
      expect(result.intent).toBe("retrieve_decision_and_reason");
      expect(result.keywords).toEqual(["redis", "memcached", "caching"]);
      expect(result.signals.asksComparison).toBe(true);
      expect(result.requiresPreviousContext).toBe(false);
    });

    test("Incident and Reason Query", () => {
      const result = processQuery(
        "What was the main reason the system went down yesterday?",
      );
      expect(result.intent).toBe("retrieve_incident_and_reason");
      expect(result.keywords).toEqual(["system"]);
      expect(result.signals.mentionsIncident).toBe(true);
      expect(result.signals.hasTemporalReference).toBe(true);
    });

    test("Decision Query", () => {
      const result = processQuery(
        "Which database engine did the team select for the new analytics pipeline?",
      );
      expect(result.intent).toBe("retrieve_decision");
      expect(result.keywords).toEqual([
        "database",
        "engine",
        "team",
        "analytics",
        "pipeline",
      ]);
    });

    test("Decision and Comparison Query", () => {
      const result = processQuery("Did we select PostgreSQL over MySQL?");
      expect(result.intent).toBe("retrieve_decision_and_comparison");
      expect(result.keywords).toEqual(["postgresql", "mysql"]);
    });
  });

  describe("Edge Cases & Context Dependencies", () => {
    test("Query requiring previous context via pronoun reference", () => {
      const result = processQuery("u know why I selected this option?");
      expect(result.signals.hasPronounReference).toBe(true);
      expect(result.requiresPreviousContext).toBe(true);
      expect(result.keywords).toEqual(["option"]);
    });

    test("Query requiring previous context via empty keywords", () => {
      const result = processQuery("what is the reason?");
      expect(result.intent).toBe("retrieve_reason");
      expect(result.keywords).toEqual([]);
      expect(result.requiresPreviousContext).toBe(true);
    });

    test("Query requiring previous context via explicit context words", () => {
      const result = processQuery("Do you remember our decision?");
      expect(result.requiresPreviousContext).toBe(true);
    });

    test("Negation signal detection", () => {
      const result = processQuery("Why is the payment gateway not working?");
      expect(result.signals.isNegated).toBe(true);
      expect(result.keywords).toEqual(["payment", "gateway", "not", "working"]);
    });

    test("Throw error for non-string or empty input", () => {
      // @ts-expect-error Testing runtime invalid input
      expect(() => processQuery(null)).toThrow(TypeError);
      // @ts-expect-error Testing runtime invalid input
      expect(() => processQuery(123)).toThrow(TypeError);
      expect(() => processQuery("   ")).toThrow(TypeError);
    });
  });
});

describe("processQuery", () => {
  it("should classify incident and reason intent accurately", () => {
    const result = processQuery("Why did server-01 fail yesterday?");
    expect(result.intent).toBe("retrieve_incident_and_reason");
    expect(result.signals.asksReason).toBe(true);
    expect(result.signals.mentionsIncident).toBe(true);
  });

  it("should throw error for empty queries", () => {
    expect(() => processQuery("")).toThrow(TypeError);
  });
});
