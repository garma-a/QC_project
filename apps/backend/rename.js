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
  { from: /qc-tests/g, to: 'quality-control-tests' },
  { from: /qc-runs/g, to: 'quality-control-runs' },
  { from: /qc-results/g, to: 'quality-control-results' },
  // Let's also fix the index prefixes in schema.ts
  { from: /idx_qc_tests/g, to: 'idx_quality_control_tests' },
  { from: /idx_qc_runs/g, to: 'idx_quality_control_runs' },
  { from: /idx_qc_results/g, to: 'idx_quality_control_results' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.json') || fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

// 1. Rename directories
const dirsToRename = [
  { from: 'src/qc-tests', to: 'src/quality-control-tests' },
  { from: 'src/qc-runs', to: 'src/quality-control-runs' },
  { from: 'src/qc-results', to: 'src/quality-control-results' }
];

for (const { from, to } of dirsToRename) {
  if (fs.existsSync(from)) {
    execSync(`mv ${from} ${to}`);
    console.log(`Renamed directory ${from} to ${to}`);
  }
}

// 2. Rename files recursively
function renameFilesInDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      renameFilesInDirectory(fullPath);
    } else {
      if (file.includes('qc-test') || file.includes('qc-run') || file.includes('qc-result')) {
        const newFile = file
          .replace('qc-test', 'quality-control-test')
          .replace('qc-run', 'quality-control-run')
          .replace('qc-result', 'quality-control-result');
        const newPath = path.join(directory, newFile);
        execSync(`mv ${fullPath} ${newPath}`);
        console.log(`Renamed file ${fullPath} to ${newPath}`);
      }
    }
  }
}

renameFilesInDirectory('src');
if (fs.existsSync('test')) renameFilesInDirectory('test');

// 3. Process file contents
processDirectory('src');
if (fs.existsSync('test')) processDirectory('test');
if (fs.existsSync('drizzle')) processDirectory('drizzle');
