// Mock Deno for Node.js test environment
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: (key: string) => key.startsWith('SUPABASE') ? 'http://dummy.com' : '' } };
}

const realMenuData = [
  { id: '1', name: 'برجر دجاج', summary: '', price: 2.50, capabilities: [] },
  { id: '2', name: 'بطاطس مقلية', summary: '', price: 1.00, capabilities: [] },
];

async function runEvals() {
  const { validateDishClaims } = await import('../supabase/functions/_shared/agent.ts');
  const { AssistantResponseSchema } = await import('../supabase/functions/_shared/schema.ts');

  let passed = 0;
  let failed = 0;

  function assertThrows(fn: () => void, testName: string) {
    try {
      fn();
      console.error(`❌ FAILED: ${testName} (Expected error, but passed)`);
      failed++;
    } catch (e) {
      console.log(`✅ PASSED: ${testName}`);
      passed++;
    }
  }

  function assertPasses(fn: () => void, testName: string) {
    try {
      fn();
      console.log(`✅ PASSED: ${testName}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAILED: ${testName} (Unexpected error: ${e})`);
      failed++;
    }
  }

  console.log("Running Menu Assistant Evals...\n");

  // Eval 1: Valid recommendation
  assertPasses(() => {
    const response = AssistantResponseSchema.parse({
      type: 'recommendation',
      message: 'إليك ألذ برجر دجاج.',
      dishes: [{ id: '1', name: 'برجر دجاج', price: 2.50 }],
      suggestions: ['طلب']
    });
    validateDishClaims(response, realMenuData);
  }, "Real dish with correct price passes validation");

  // Eval 2: Price mismatch (Hallucination)
  assertThrows(() => {
    const response = AssistantResponseSchema.parse({
      type: 'recommendation',
      message: 'برجر دجاج مخفض لك!',
      dishes: [{ id: '1', name: 'برجر دجاج', price: 1.50 }], // Fake price
      suggestions: []
    });
    validateDishClaims(response, realMenuData);
  }, "Price mismatch throws error");

  // Eval 3: Invented dish (Hallucination)
  assertThrows(() => {
    const response = AssistantResponseSchema.parse({
      type: 'recommendation',
      message: 'جرب البيتزا الخاصة بنا',
      dishes: [{ id: '999', name: 'بيتزا دجاج', price: 3.00 }],
      suggestions: []
    });
    validateDishClaims(response, realMenuData);
  }, "Invented dish ID throws error");

  // Eval 4: Valid no_match
  assertPasses(() => {
    const response = AssistantResponseSchema.parse({
      type: 'no_match',
      message: 'عذراً، لا نبيع البيتزا.',
      dishes: [],
      suggestions: ['المنيو']
    });
    validateDishClaims(response, realMenuData);
  }, "no_match response with no dishes passes");

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runEvals();
