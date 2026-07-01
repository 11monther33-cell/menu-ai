import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (fullPath.endsWith('.js') && stat.size < 1000000) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.match(/(\b(window|self|global)\s*\.fetch\s*=|globalThis\.fetch\s*=)/)) {
        console.log('Found in:', fullPath);
      }
    }
  }
}

searchDir('node_modules');
