const fs = require('fs');
const path = require('path');
const sharedPath = path.join(__dirname, 'packages/shared/src/index.ts');
let content = fs.readFileSync(sharedPath, 'utf8');

// Replace all date properties with string | Date
content = content.replace(/:\s*string;\s*(\/\/\s*date.*|)$/gm, (match) => {
  if (match.toLowerCase().includes('date') || match.toLowerCase().includes('at:')) {
    return ': string | Date;';
  }
  return match;
});

const dateProps = [
  'createdAt', 'updatedAt', 'lastRunAt', 'expirationDate', 'testDate', 'runDate', 'seenAt', 'resolvedAt'
];

dateProps.forEach(prop => {
  const regex = new RegExp(`${prop}\\??:\\s*string(\\s*\\|\\s*null)?\\s*;`, 'g');
  content = content.replace(regex, (m) => {
    return m.replace('string', 'string | Date');
  });
});

fs.writeFileSync(sharedPath, content, 'utf8');
