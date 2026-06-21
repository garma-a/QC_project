const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.dto.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix dates
      content = content.replace(/:\s*Date\s*;/g, ': Date | string;');
      content = content.replace(/:\s*Date\s*\|\s*null\s*;/g, ': Date | string | null;');
      
      // Fix enums
      content = content.replace(/role:\s*string\s*;/g, 'role: SharedTypes.Role;');
      content = content.replace(/currentStatus:\s*string\s*;/g, 'currentStatus: SharedTypes.MachineStatus;');
      content = content.replace(/specialization:\s*string\s*\|\s*null\s*;/g, 'specialization: SharedTypes.Specialization | null;');
      content = content.replace(/status:\s*string\s*;/g, 'status: SharedTypes.QcResultStatus | SharedTypes.UserAlertStatus;');
      
      // The status replacement above might be ambiguous if UserAlertStatus and QcResultStatus are in the same file,
      // but let's just make it specific. In QcResultResponseDto, it's QcResultStatus.
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDirectory(path.join(__dirname, 'src'));

// Specific fixes:
// src/control-lots/dto/create-control-lot.dto.ts
const createControlLotFile = path.join(__dirname, 'src/control-lots/dto/create-control-lot.dto.ts');
if (fs.existsSync(createControlLotFile)) {
  let content = fs.readFileSync(createControlLotFile, 'utf8');
  content = content.replace(/level\?:\s*number;/, 'level: number;');
  fs.writeFileSync(createControlLotFile, content, 'utf8');
}

// src/control-lots/dto/control-lot-response.dto.ts
const controlLotRespFile = path.join(__dirname, 'src/control-lots/dto/control-lot-response.dto.ts');
if (fs.existsSync(controlLotRespFile)) {
  let content = fs.readFileSync(controlLotRespFile, 'utf8');
  if (!content.includes('level: number;')) {
    // Add level: number; after testId
    content = content.replace(/(testId:\s*number;)/, '$1\n  @ApiProperty({ example: 1 })\n  level: number;');
    fs.writeFileSync(controlLotRespFile, content, 'utf8');
  }
}
