const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2] || path.join(process.cwd(), 'server.js');

if (!fs.existsSync(targetPath)) {
  console.error('Target file not found:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');
const lines = content.split('\n');

const updatedLines = lines.map(line => {
  // If line already commented or does not use pool.query, leave it
  if (line.trim().startsWith('//') || !line.includes('pool.query')) {
    return line;
  }
  // Comment out this line
  return '// ' + line;
});

fs.writeFileSync(targetPath, updatedLines.join('\n'), 'utf8');
console.log('Commented out all pool.query lines in', targetPath);
