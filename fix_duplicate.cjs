const fs = require('fs');
let content = fs.readFileSync('src/pages/restaurant/Dashboard.tsx', 'utf-8');

// Find all lines containing 'app-connection' in the navItems array
const lines = content.split('\n');
let modified = [];
let appConnectionFound = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes("id: 'app-connection'")) {
    if (!appConnectionFound) {
      // Keep the first one (which should be the one right under qr-codes now)
      appConnectionFound = true;
      modified.push(line);
    }
    // Skip duplicates
  } else {
    modified.push(line);
  }
}

fs.writeFileSync('src/pages/restaurant/Dashboard.tsx', modified.join('\n'));
