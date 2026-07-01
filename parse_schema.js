import fs from 'fs';
const data = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
const defs = data.definitions || data.components?.schemas;
if (defs) {
  console.log("Tables:", Object.keys(defs));
  if (defs.dishes) {
    console.log("Columns:", Object.keys(defs.dishes.properties));
  }
}
