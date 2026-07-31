import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
async function test() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Hello' }] }]
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
