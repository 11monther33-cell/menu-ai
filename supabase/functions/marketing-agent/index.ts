import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { AssistantResponse, GeminiAssistantResponseSchema, AssistantResponseSchema } from '../_shared/schema.ts';
import { VisionoPlan, visionoCatalog } from '../_shared/visiono-plans.ts';
import { ConversationState, Fact, ExtractedFactsSchema, mergeFacts } from '../_shared/state.ts';

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Safety Layers ---
function validatePlanClaims(response: AssistantResponse, catalog: VisionoPlan[]): AssistantResponse {
  const allowed = new Map(catalog.map(d => [d.id, d]));
  
  for (const dish of response.dishes) {
    const source = allowed.get(dish.id);
    if (!source) {
      throw new Error(`Assistant referenced unknown plan id: ${dish.id}`);
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
    message: 'عذراً، أواجه مشكلة في معالجة طلبك حالياً. يرجى مراجعة صفحة الأسعار.',
    dishes: [],
    suggestions: ['الأسعار', 'المميزات'],
  };
}

const SYSTEM_PROMPT = `
[الرؤية والشخصية - Persona]
أنت مساعد مبيعات ذكي واحترافي لمنصة "Visiono". 
دورك مساعدة أصحاب المطاعم في فهم ميزات المنصة واختيار خطة الاشتراك الأنسب لهم. تتحدث بأسلوب راقٍ، ودود، ومقنع.

[قواعد صارمة لا يمكن تجاوزها - Strict Guardrails]
1. الترحيب الاحترافي: في بداية المحادثة، قدم ترحيباً (مثل: "مرحباً بك في Visiono، كيف يمكنني مساعدتك في تطوير مطعمك؟").
2. لا تختلق: يُمنع تماماً اختراع ميزات، خطط، أو أسعار غير موجودة في الكتالوج الممرر لك.
3. الرد المهيكل: أرجع الرد دائماً بصيغة JSON متوافقة بدقة مع المخطط.
4. مصفوفة الأطباق (dishes): ستستخدم هذه المصفوفة لإرجاع الخطط المقترحة (id, name, price).

[دليل التعامل مع السيناريوهات الحرجة - Scenario Playbook]
- (عدم توفر الطلب): إذا طلب ميزة غير متوفرة (مثل: هل لديكم توصيل؟)، أجب بصراحة واعتذر، وارجع "no_match".
- (الشكاوى): حوّلها للدعم الفني بلباقة.
- (تضييق الخيارات): إذا لم تكن متأكداً من حجم المطعم، اسأل: "كم فرعاً تدير حالياً؟" باستخدام "clarifying_question".
`;

import { generateWithFallback } from '../_shared/ai_client.ts';

export async function extractFacts(userMessage: string, currentState: ConversationState): Promise<Fact[]> {
  const prompt = `استخرج الحقائق والشروط (Facts) من رسالة صاحب المطعم التالية بناءً على سياق خطط Visiono (مثل: عدد الفروع، الميزات المطلوبة، إلخ).
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

async function generateAgentResponse(userMessage: string, catalog: VisionoPlan[], state: ConversationState): Promise<AssistantResponse> {
  const catalogContext = `\nالخطط المتاحة:\n${JSON.stringify(catalog, null, 2)}\n\nشروط العميل الحالية (State):\n${JSON.stringify(state, null, 2)}\n`;
  const fullPrompt = SYSTEM_PROMPT + catalogContext;
  
  const text = await generateWithFallback(fullPrompt, userMessage, GeminiAssistantResponseSchema);
  
  const parsed = JSON.parse(text);
  const validated = AssistantResponseSchema.parse(parsed);
  return validatePlanClaims(validated, catalog);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const { message, state = {} } = await req.json();
    
    // 1. Extract facts
    const newFacts = await extractFacts(message, state);
    const updatedState = mergeFacts(state, newFacts);
    
    // 2. Filter (simple filter or all plans for now)
    const validCandidates = visionoCatalog;
    
    // 3. Generate structured response
    let structuredResponse: AssistantResponse;
    try {
      structuredResponse = await generateAgentResponse(message, validCandidates, updatedState);
    } catch (e) {
      console.error("AI Generation/Validation Error:", e);
      structuredResponse = deterministicFallback();
    }

    return new Response(JSON.stringify({ response: structuredResponse, state: updatedState }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
