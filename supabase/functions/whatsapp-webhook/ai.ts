import { fetchRestaurantCatalog } from '../_shared/catalog.ts';
import { generateAgentResponse } from '../_shared/agent.ts';

export async function getGeminiResponse(userMessage: string) {
  try {
    // In a real app we'd get the restaurantId from the webhook payload or environment
    // For now we just fetch all available items as the catalog
    const catalog = await fetchRestaurantCatalog("default");
    
    const structuredResponse = await generateAgentResponse(userMessage, catalog);
    
    // Convert the structured response back to a string for WhatsApp
    let responseText = structuredResponse.message;
    
    if (structuredResponse.products && structuredResponse.products.length > 0) {
      responseText += '\n\n🍽️ المنتجات المقترحة:\n';
      structuredResponse.products.forEach(p => {
        responseText += `- ${p.name}\n`;
      });
    }

    if (structuredResponse.suggestions && structuredResponse.suggestions.length > 0) {
      responseText += '\n\n💡 يمكنك السؤال عن:\n';
      structuredResponse.suggestions.forEach(s => {
        responseText += `- ${s}\n`;
      });
    }

    return responseText;
  } catch (error) {
    console.error("Agent error:", error);
    return "عذراً، أواجه مشكلة تقنية حالياً. الرجاء المحاولة لاحقاً.";
  }
}
