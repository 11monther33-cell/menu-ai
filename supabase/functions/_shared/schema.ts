export const DiscoveryResponseSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["question", "recommendation", "comparison", "no_match", "error"]
    },
    message: { type: "string" },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          summary: { type: "string" }
        },
        required: ["id", "name"]
      }
    },
    matchReasons: {
      type: "array",
      items: { type: "string" }
    },
    suggestions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["type", "message", "products", "matchReasons", "suggestions"]
};

export interface DiscoveryResponse {
  type: "question" | "recommendation" | "comparison" | "no_match" | "error";
  message: string;
  products: { id: string; name: string; summary?: string }[];
  matchReasons: string[];
  suggestions: string[];
}
