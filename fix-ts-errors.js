const fs = require('fs');
const path = require('path');
let count = 0;

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', '.next', '.git'].includes(e.name)) {
      processDir(full);
    } else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      const orig = content;
      // Fix: const varName = await something.json() -> const varName: any = ...
      content = content.replace(/\bconst (\w+) = await (\w+)\.json\(\)/g, function(match, varName, obj) {
        return 'const ' + varName + ': any = await ' + obj + '.json()';
      });
      if (content !== orig) {
        fs.writeFileSync(full, content, 'utf8');
        count++;
        console.log('Fixed: ' + full.replace('D:\\project_management\\', ''));
      }
    }
  }
}

processDir('src');
console.log('Total files fixed: ' + count);
