const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") || "";
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID") || "";

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error("Missing WhatsApp credentials. Cannot send message.");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: message }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Error sending WhatsApp message:", data);
    } else {
      console.log("Message sent successfully:", data);
    }
    
    return data;
  } catch (error) {
    console.error("Network error sending WhatsApp message:", error);
    throw error;
  }
}
