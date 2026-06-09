const fs = require('fs');
const path = require('path');

const repoDir = 'apps/backend/src';

const getFiles = (dir, ext) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(getFiles(file, ext));
    } else if (file.endsWith(ext)) {
      results.push(file);
    }
  });
  return results;
};

// Fix Repositories
const repoFiles = getFiles(repoDir, '.repository.ts');
repoFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const safeLimit = Math\.min\(limit \|\| \d+, \d+\);/g, 'const safeLimit = Math.max(1, Math.min(limit ?? 50, 100));');
  content = content.replace(/const safeOffset = offset \|\| 0;/g, 'const safeOffset = Math.max(0, offset ?? 0);');
  fs.writeFileSync(file, content);
});

// Fix Controllers
const ctrlFiles = getFiles(repoDir, '.controller.ts');
ctrlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  let changed = false;
  if (!content.includes('ParseIntPipe')) {
    content = content.replace(/import\s*\{([^}]+)\}\s*from\s*'@nestjs\/common';/, (match, p1) => {
      return `import { ParseIntPipe, ${p1.trim()} } from '@nestjs/common';`;
    });
    changed = true;
  }

  const oldContent = content;
  content = content.replace(/@Query\('limit'\) limit\?: string/g, "@Query('limit', new ParseIntPipe({ optional: true })) limit?: number");
  content = content.replace(/@Query\('offset'\) offset\?: string/g, "@Query('offset', new ParseIntPipe({ optional: true })) offset?: number");
  
  content = content.replace(/[ \t]*const parsedLimit = limit \? parseInt\(limit, 10\) : (?:undefined|50);\r?\n/g, "");
  content = content.replace(/[ \t]*const parsedOffset = offset \? parseInt\(offset, 10\) : (?:undefined|0);\r?\n/g, "");
  
  content = content.replace(/parsedLimit/g, "limit");
  content = content.replace(/parsedOffset/g, "offset");

  if (oldContent !== content || changed) {
    fs.writeFileSync(file, content);
  }
});

console.log("Done");
