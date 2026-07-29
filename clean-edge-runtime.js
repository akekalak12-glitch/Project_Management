const fs = require('fs');
const path = require('path');

function removeEdgeRuntime(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      removeEdgeRuntime(full);
    } else if (f === 'route.ts' || f === 'route.js') {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes("export const runtime = 'edge'")) {
        console.log('Removing edge runtime from:', full);
        content = content.replace(/export const runtime = 'edge';?\r?\n*/g, '');
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}

removeEdgeRuntime('src/app/api');
console.log('Done removing export const runtime = edge from source files.');
