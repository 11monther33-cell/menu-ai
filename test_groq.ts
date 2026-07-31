import * as cheerio from 'cheerio';

async function testGroq() {
  const url = 'https://hungerpost.com/restaurants/oman/1909/irani-house-restaurant-oman/';
  const urlResp = await fetch(url);
  const html = await urlResp.text();
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, img, svg').remove();
  $('br, p, div, h1, h2, h3, h4, h5, h6, li, tr, td, th, ul, ol, section, article').append('\n');
  const visibleText = $('body').text().replace(/\n+/g, '\n').replace(/[ \t]+/g, ' ').trim();
  
  const extractionPrompt = `You are a restaurant menu parser. Extract ALL dishes/items from this menu.

For each dish, extract:
- name_ar: Arabic name. If only English is present, you MUST translate it to Arabic.
- name_en: English name. If only Arabic is present, you MUST translate it to English.
- price: numeric price (number only, no currency symbols). If no price is visible, set null.
- category_ar: the Arabic section heading. If only English is present, MUST translate to Arabic.
- category_en: the English section heading. If only Arabic is present, MUST translate to English.
- description_ar: Arabic description. If only English is present, translate to Arabic.
- description_en: English description. If only Arabic is present, translate to English.
- flag: set to a short note if you are uncertain about any field, else null.

IMPORTANT RULES:
- TRANSLATION IS MANDATORY: You must ensure every dish has both Arabic and English names, descriptions (if any exist), and categories. Translate accurately if one language is missing.
- OMANI CURRENCY PRICING: Prices in Oman use 3 decimal places (e.g., 3.800 means 3.8 OMR, NOT 3800). 1.500 means 1.5. Do NOT treat the decimal point as a thousands separator. Extract the exact correct float value (e.g. 3.8).
- Do NOT attempt to extract, reference, or describe images — text fields only.
- EXTRACT EVERY SINGLE DISH YOU CAN FIND, DO NOT STOP UNTIL THE ENTIRE MENU IS EXTRACTED.
- Return ONLY valid JSON, no markdown code fences, no explanation.

{ "dishes": [{ "name_ar": "Dish 1", "name_en": "Dish 1", "price": 12.5, "category_ar": "المقبلات", "category_en": "Appetizers", "description_ar": "", "description_en": "", "flag": null }, { "name_ar": "Dish 2", "name_en": "Dish 2", "price": 5.0, "category_ar": "الأطباق الرئيسية", "category_en": "Main Courses", "description_ar": "", "description_en": "", "flag": null }, "... extract ALL other dishes in the same format ..."] }`;

  const groqKey = process.env.GROQ_API_KEY;
  if(!groqKey) {
      console.log("NO GROQ KEY");
      return;
  }
  const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: `Here is the full text content of a restaurant menu document:\n\n---\n${visibleText}\n---\n\n${extractionPrompt}` }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  const data = await groqResp.json();
  console.log(data.choices[0].message.content);
}

testGroq();
