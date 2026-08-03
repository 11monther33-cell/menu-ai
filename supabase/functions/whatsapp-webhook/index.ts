import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getGeminiResponse } from "./ai.ts";
import { sendWhatsAppMessage } from "./whatsapp.ts";
import { fetchRestaurantCatalog, supabase } from "../_shared/catalog.ts";
import { processAgentTurn } from "../_shared/agent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "visiono_secret_token_123";

serve(async (req) => {
  const url = new URL(req.url);

  // 0. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Webhook Verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully!");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    } else {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
  }

  // 2. Receiving Messages (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      
      // A. Web Chat Request
      if (body.source === "website") {
        const catalog = await fetchRestaurantCatalog("default");
        const currentState = body.state || {};
        
        const turnResult = await processAgentTurn(body.message, catalog, currentState);
        
        return new Response(JSON.stringify(turnResult), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      // B. WhatsApp Webhook Request
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              const message = change.value.messages[0];
              const fromNumber = message.from; // Sender's phone number
              
                let messageText = "";
                if (message.type === "text") {
                  messageText = message.text.body;
                  console.log(`Received message from ${fromNumber}: ${messageText}`);
                  
                  // 1. Fetch current state from DB
                  const { data: session } = await supabase
                    .from('pos_whatsapp_sessions')
                    .select('facts')
                    .eq('phone_number', fromNumber)
                    .single();
                  
                  const currentState = session ? session.facts : {};
                  
                  // 2. Process AI Turn (extract facts -> retrieve -> generate)
                  const catalog = await fetchRestaurantCatalog("default");
                  const turnResult = await processAgentTurn(messageText, catalog, currentState);
                  
                  // 3. Save new state to DB
                  await supabase
                    .from('pos_whatsapp_sessions')
                    .upsert({ 
                      phone_number: fromNumber, 
                      facts: turnResult.state,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'phone_number' });

                  // 4. Format string response for WhatsApp
                  let responseText = turnResult.response.message;
                  if (turnResult.response.products && turnResult.response.products.length > 0) {
                    responseText += '\n\n🍽️ المنتجات المقترحة:\n';
                    turnResult.response.products.forEach(p => {
                      responseText += `- ${p.name}\n`;
                    });
                  }
                  if (turnResult.response.suggestions && turnResult.response.suggestions.length > 0) {
                    responseText += '\n\n💡 يمكنك السؤال عن:\n';
                    turnResult.response.suggestions.forEach(s => {
                      responseText += `- ${s}\n`;
                    });
                  }
                  
                  // 5. Send response back via WhatsApp
                  await sendWhatsAppMessage(fromNumber, responseText);
                }
            }
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("Error processing request:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});

