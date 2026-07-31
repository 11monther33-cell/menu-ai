import fs from 'fs';
import path from 'path';

// Create a dummy PDF file (we'll just use a text file masquerading as PDF for text extraction)
const dummyMenuText = `
Menu
SALADS
Caesar Salad 5.00
Greek Salad 4.50

MAIN COURSES
Beef Steak 15.00
Grilled Chicken 12.00
`;

fs.writeFileSync('dummy_menu.txt', dummyMenuText);

async function testApi() {
  const formData = new FormData();
  // Using a File object with dummy content
  const fileBlob = new Blob([dummyMenuText], { type: 'text/plain' });
  formData.append('file', fileBlob, 'menu.txt');

  try {
    const res = await fetch('https://visiono.vercel.app/api/import-menu', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      console.log('Error HTTP status:', res.status);
      console.log('Error text:', await res.text());
      return;
    }
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testApi();
