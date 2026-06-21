const fs = require('fs');
const path = require('path');

const sharedPath = path.join(__dirname, '../../packages/shared/src/index.ts');
const sharedCode = fs.readFileSync(sharedPath, 'utf8');
const exportRegex = /export\s+(interface|type)\s+([A-Za-z0-9_]+)/g;
const sharedSet = new Set();
let match;
while ((match = exportRegex.exec(sharedCode)) !== null) {
  sharedSet.add(match[2]);
}

console.log("Shared types found:", Array.from(sharedSet).join(', '));

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      const classRegex = /export\s+class\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{/g;
      
      let newContent = content.replace(classRegex, (originalMatch, className) => {
        if (sharedSet.has(className)) {
          if (originalMatch.includes(`SharedTypes.${className}`)) {
            return originalMatch;
          }
          modified = true;
          if (originalMatch.includes('implements')) {
            return originalMatch.replace('implements', `implements SharedTypes.${className}, `);
          } else {
            return originalMatch.replace(`class ${className}`, `class ${className} implements SharedTypes.${className}`);
          }
        }
        return originalMatch;
      });

      if (modified) {
        if (!newContent.includes('@qc/shared')) {
          newContent = `import * as SharedTypes from '@qc/shared';\n` + newContent;
        }
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
