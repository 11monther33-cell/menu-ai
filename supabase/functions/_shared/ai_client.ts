const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

export async function generateWithFallback(systemPrompt: string, userMessage: string, schema: any): Promise<string> {
  let groqError;
  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Using Llama 3 8B as requested
        messages: [
          { role: "system", content: systemPrompt + "\n\nYOU MUST RETURN ONLY JSON MATCHING THIS SCHEMA:\n" + JSON.stringify(schema, null, 2) },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const text = data.choices[0].message.content;
      return text;
    } else {
      const err = await groqResponse.text();
      throw new Error(`Groq Error: ${err}`);
    }
  } catch (e) {
    console.error("Groq Failed, falling back to Gemini:", e);
    groqError = e;
  }
  
  // Gemini Fallback
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { 
      temperature: 0.1, 
      responseMimeType: "application/json", 
      responseSchema: schema 
    }
  };

  const response = await fetch(geminiUrl, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload) 
  });
  
  if (!response.ok) {
    const data = await response.text();
    throw new Error(`Gemini Fallback Error: ${data} (Original Groq error: ${groqError})`);
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini AI");
  
  return text;
}
