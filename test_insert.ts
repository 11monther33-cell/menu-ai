import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY;

fetch(url)
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
    const dishes = data.definitions ? data.definitions.dishes : data.components?.schemas?.dishes;
    if (dishes) {
      console.log("Dishes columns:", Object.keys(dishes.properties));
    } else {
      console.log("Dishes definition not found");
    }
  });
