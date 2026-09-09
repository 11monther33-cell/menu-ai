import { AssistantResponse, GeminiAssistantResponseSchema, AssistantResponseSchema } from './schema.ts';
import { CatalogItem, retrieveProducts } from './catalog.ts';
import { ConversationState, Fact, ExtractedFactsSchema, mergeFacts } from './state.ts';

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

export function validateDishClaims(response: AssistantResponse, realMenuData: CatalogItem[]): AssistantResponse {
  const allowed = new Map(realMenuData.map(d => [d.id, d]));
  
  for (const dish of response.dishes) {
    const source = allowed.get(dish.id);
    if (!source) {
      throw new Error(`Assistant referenced unknown dish id: ${dish.id}`);
    }
    if (Math.abs(source.price - dish.price) > 0.001) {
      throw new Error(`Price mismatch for ${dish.name}: assistant said ${dish.price}, real price is ${source.price}`);
    }
  }

  return response;
}

function deterministicFallback(): AssistantResponse {
  return {
    type: 'no_match',
    message: 'عذراً، مساعدنا الذكي غير متاح حالياً. تواصل معنا مباشرة أو راجع القائمة يدوياً.',
    dishes: [],
    suggestions: [],
  };
}

const SYSTEM_PROMPT = `
[الرؤية والشخصية - Persona]
أنت مساعد مبيعات وخدمة عملاء ذكي واحترافي جداً لمطعم "Visiono". 
دورك مساعدة الزبائن بلباقة في استكشاف قائمة الطعام بناءً على المنيو المعتمد فقط. تتحدث بأسلوب راقٍ، ودود، ومختصر.

[قواعد صارمة لا يمكن تجاوزها - Strict Guardrails]
1. الترحيب الاحترافي: في بداية المحادثة، قدم ترحيباً راقياً (مثل: "مرحباً بك في مطعم Visiono، كيف يمكنني إثراء تجربتك اليوم؟").
2. لا تختلق: يُمنع تماماً اختراع منتجات، أسعار، أو مكونات غير موجودة في الكتالوج الممرر لك.
3. الرد المهيكل: أرجع الرد دائماً بصيغة JSON متوافقة بدقة مع المخطط.

[دليل التعامل مع السيناريوهات الحرجة - Scenario Playbook]
- (عدم توفر الطلب): إذا لم يتطابق الكتالوج مع طلب العميل، يجب إرجاع نوع الرسالة "no_match" برسالة صادقة توضح عدم التوفر، لا تقم باختراع أطباق.
- (الحساسية والقيود الغذائية): إذا سأل العميل عن مكون يسبب الحساسية ولم يكن واضحاً، يُمنع التخمين. اعتذر بلباقة واطلب التأكد من طاقم المطعم.
- (الشكاوى والمشاكل): لا تجادل ولا تقدم تعويضات. قل: "نعتذر جداً. يرجى التواصل مع الإدارة المباشرة عبر الرقم 0000000000 وسنقوم بحل المشكلة فوراً."
- (الطلبات الخارجة عن السياق): ارفض بلباقة وحوّل الموضوع للمطعم.
- (تضييق الخيارات): إذا كان الطلب مبهماً استخدم "clarifying_question" واسأل سؤالاً ذكياً لتضييق الخيارات.
`;

import { generateWithFallback } from './ai_client.ts';

export async function extractFacts(userMessage: string, currentState: ConversationState): Promise<Fact[]> {
  const prompt = `استخرج الحقائق والشروط (Facts) من رسالة الزبون التالية بناءً على سياق المنيو وتفضيلاته.
حالة المحادثة السابقة: ${JSON.stringify(currentState)}
رسالة العميل: "${userMessage}"`;

  try {
    const text = await generateWithFallback(prompt, userMessage, ExtractedFactsSchema);
    const parsed = JSON.parse(text);
    return parsed.facts || [];
  } catch (e) {
    console.error("Fact extraction failed:", e);
    return [];
  }
}

export async function processAgentTurn(userMessage: string, catalog: CatalogItem[], currentState: ConversationState): Promise<{response: AssistantResponse, state: ConversationState}> {
  const newFacts = await extractFacts(userMessage, currentState);
  const updatedState = mergeFacts(currentState, newFacts);
  const validCandidates = retrieveProducts(catalog, updatedState);
  
  let structuredResponse: AssistantResponse;
  try {
    structuredResponse = await generateAgentResponse(userMessage, validCandidates, updatedState);
  } catch (e) {
    console.error("AI Generation or Validation Error:", e);
    structuredResponse = deterministicFallback();
  }
  
  return {
    response: structuredResponse,
    state: updatedState
  };
}

async function generateAgentResponse(userMessage: string, catalog: CatalogItem[], state: ConversationState): Promise<AssistantResponse> {
  const catalogContext = `
الكتالوج المتاح حالياً بناءً على فلترة شروط العميل الحتمية:
${JSON.stringify(catalog, null, 2)}

شروط العميل الحالية (State):
${JSON.stringify(state, null, 2)}
`;

  const fullPrompt = SYSTEM_PROMPT + catalogContext;
  
  const text = await generateWithFallback(fullPrompt, userMessage, GeminiAssistantResponseSchema);
  
  const parsed = JSON.parse(text);
  
  // Zod validation (if it fails, throws error -> fallback)
  const validated = AssistantResponseSchema.parse(parsed);

  return validateDishClaims(validated, catalog);
}
