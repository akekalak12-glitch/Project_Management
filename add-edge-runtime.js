const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes("export const runtime = 'edge'")) {
        console.log(`Injecting edge runtime to: ${fullPath}`);
        content = `export const runtime = 'edge';\n` + content;
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

if (fs.existsSync(apiDir)) {
  processDirectory(apiDir);
  console.log('Successfully injected edge runtime flag for Cloudflare build.');
}
