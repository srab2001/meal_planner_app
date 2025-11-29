const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SECRET_PATTERNS = [
  /GOCSPX-[A-Za-z0-9_\-]+/g,
  /sk-proj-[A-Za-z0-9_\-]+/g
];

function shouldSkipDir(dirName) {
  return dirName === 'node_modules' || dirName === '.git';
}

function processFile(filePath) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  SECRET_PATTERNS.forEach(regex => {
    content = content.replace(regex, 'REDACTED');
  });

  if (content !== original) {
    console.log('Scrubbed:', filePath);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      walk(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

console.log('Starting secret scrub from:', ROOT);
walk(ROOT);
console.log('Done.');
