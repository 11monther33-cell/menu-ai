import fs from 'fs';

const geminiKey = process.env.GEMINI_API_KEY;

const extractionPrompt = `You are a restaurant menu parser. Extract ALL dishes/items from this menu.

For each dish, extract:
- name_ar: Arabic name (if present, else null)
- name_en: English name (if present, else null)
- price: numeric price (number only, no currency symbols). If no price is visible, set null
- category: the section/heading this dish appears under
- description_ar: Arabic description (if present, else null)
- description_en: English description (if present, else null)
- flag: set to a short note if you are uncertain about any field, else null

IMPORTANT RULES:
- Do NOT attempt to extract, reference, or describe images — text fields only
- If only Arabic is present, leave name_en and description_en as null — do NOT translate
- If only English is present, leave name_ar and description_ar as null — do NOT translate
- Extract EVERY dish you can find, do not skip any
- Price must be a number (e.g. 12.5 not "12.5 OMR")
- Category should be the section heading the dish appears under
- Return ONLY valid JSON, no markdown code fences, no explanation

{ "dishes": [{ "name_ar": "", "name_en": "", "price": 0.0, "category": "", "description_ar": "", "description_en": "", "flag": null }] }`;

const sampleText = `Appetizers:
1. Hummus - 2.5 OMR
   Fresh hummus with olive oil.
   حمص طازج مع زيت الزيتون
2. Mutabal - 3.0 OMR
   Smoky eggplant dip.
   متبل باذنجان`;

const reqBody = {
  contents: [{
    parts: [
      { text: `Here is the full text content of a restaurant menu document:\n\n---\n${sampleText}\n---\n\n${extractionPrompt}` }
    ]
  }],
  generationConfig: { 
    responseMimeType: 'application/json',
    temperature: 0.1, 
    maxOutputTokens: 8192 
  }
};

async function run() {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    }
  );
  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  console.log("=== RAW TEXT ===");
  console.log(rawText);
}

run();
