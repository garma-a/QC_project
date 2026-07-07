const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const replacements = [
  { from: /qc_tests/g, to: 'quality_control_tests' },
  { from: /qc_runs/g, to: 'quality_control_runs' },
  { from: /qc_results/g, to: 'quality_control_results' },
  { from: /qcTests/g, to: 'qualityControlTests' },
  { from: /qcRuns/g, to: 'qualityControlRuns' },
  { from: /qcResults/g, to: 'qualityControlResults' },
  { from: /qcTest/g, to: 'qualityControlTest' },
  { from: /qcRun/g, to: 'qualityControlRun' },
  { from: /qcResult/g, to: 'qualityControlResult' },
  { from: /QcTest/g, to: 'QualityControlTest' },
  { from: /QcRun/g, to: 'QualityControlRun' },
  { from: /QcResult/g, to: 'QualityControlResult' },
  { from: /hosp_code/g, to: 'hospital_code' },
  { from: /hospCode/g, to: 'hospitalCode' },
  // File paths and imports:
  { from: /qc-test/g, to: 'quality-control-test' },
  { from: /qc-run/g, to: 'quality-control-run' },
  { from: /qc-result/g, to: 'quality-control-result' },
  { from: /qc-bff/g, to: 'quality-control-bff' },
];

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json') || fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated content: ${fullPath}`);
      }
    }
  }
}

function renameFilesInDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      renameFilesInDirectory(fullPath);
    } else {
      let newFile = file;
      if (file.includes('qc-test') || file.includes('qc-run') || file.includes('qc-result') || file.includes('qc-bff')) {
        newFile = file
          .replace('qc-test', 'quality-control-test')
          .replace('qc-run', 'quality-control-run')
          .replace('qc-result', 'quality-control-result')
          .replace('qc-bff', 'quality-control-bff');
        const newPath = path.join(directory, newFile);
        execSync(`mv ${fullPath} ${newPath}`);
        console.log(`Renamed file ${fullPath} to ${newPath}`);
      }
    }
  }
}

// 1. Rename files in shared package
renameFilesInDirectory('packages/shared/src');
processDirectory('packages/shared/src');

// 2. Fix the leftovers in backend
renameFilesInDirectory('apps/backend/src');
if (fs.existsSync('apps/backend/test')) renameFilesInDirectory('apps/backend/test');

processDirectory('apps/backend/src');
if (fs.existsSync('apps/backend/test')) processDirectory('apps/backend/test');
if (fs.existsSync('apps/backend/drizzle')) processDirectory('apps/backend/drizzle');

