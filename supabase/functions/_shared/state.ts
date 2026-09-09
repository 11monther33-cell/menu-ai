import { z } from 'npm:zod@3.22.4';
import { CatalogItem } from './catalog.ts';

// Zod is available via npm:zod or unpkg in Deno. Let's assume npm:zod works via deno.json or we can fetch it.

export const FactSchema = {
  type: "OBJECT",
  properties: {
    key: { type: "STRING" },
    value: { type: "STRING" },
    certainty: { type: "STRING", enum: ["explicit", "uncertain", "inferred"] }
  },
  required: ["key", "value", "certainty"]
};

export const ExtractedFactsSchema = {
  type: "OBJECT",
  properties: {
    facts: {
      type: "ARRAY",
      items: FactSchema
    }
  },
  required: ["facts"]
};

export interface Fact {
  key: string;
  value: string;
  certainty: "explicit" | "uncertain" | "inferred";
}

export type ConversationState = Record<string, Fact>;

/**
 * Merge new facts into the existing state.
 * Rule: Explicit beats inferred. Corrections are first class.
 */
export function mergeFacts(current: ConversationState, extracted: Fact[]): ConversationState {
  const next = { ...current };

  for (const fact of extracted) {
    const previous = next[fact.key];
    const visitorCorrectedIt = fact.certainty === "explicit" && previous && previous.value !== fact.value;

    if (!previous || visitorCorrectedIt || (previous.certainty === "inferred" && fact.certainty !== "inferred")) {
      next[fact.key] = fact;
    }
  }

  return next;
}
