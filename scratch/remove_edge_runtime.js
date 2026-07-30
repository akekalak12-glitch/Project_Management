const fs = require('fs');
const path = require('path');
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      processDir(full);
    } else if (f.endsWith('.ts') || f.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes("export const runtime = 'edge'")) {
        console.log('Removing edge runtime from:', full);
        content = content.replace("export const runtime = 'edge';\r\n", "")
                         .replace("export const runtime = 'edge';\n", "")
                         .replace("export const runtime = 'edge';", "");
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}
processDir(apiDir);
console.log('Done stripping edge runtime flags.');
