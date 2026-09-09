import { z } from 'zod';

export const AssistantResponseSchema = z.object({
  type: z.enum(['answer', 'recommendation', 'order_summary', 'no_match', 'clarifying_question']),
  message: z.string().min(1).max(1000),
  dishes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
  })).max(5),
  suggestions: z.array(z.string()).max(3),
});

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

// Gemini API equivalent schema for structrued generation if needed
export const GeminiAssistantResponseSchema = {
  type: "OBJECT",
  properties: {
    type: {
      type: "STRING",
      enum: ["answer", "recommendation", "order_summary", "no_match", "clarifying_question"]
    },
    message: { type: "STRING" },
    dishes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          name: { type: "STRING" },
          price: { type: "NUMBER" }
        },
        required: ["id", "name", "price"]
      }
    },
    suggestions: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ["type", "message", "dishes", "suggestions"]
};
