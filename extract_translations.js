const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const extracted = {};

walkDir('frontend/src', (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  // Match t.category?.key || 'Fallback' and t.category?.key || "Fallback"
  const regex = /t\.([a-zA-Z_]+)\?\.([a-zA-Z_]+)\s*\|\|\s*(?:'([^']+)'|"([^"]+)")/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const category = match[1];
    const key = match[2];
    const fallback = match[3] || match[4];
    if (!extracted[category]) extracted[category] = {};
    extracted[category][key] = fallback;
  }
});

console.log(JSON.stringify(extracted, null, 2));
