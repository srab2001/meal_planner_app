const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2] || path.join(process.cwd(), 'server.js');

if (!fs.existsSync(targetPath)) {
  console.error('server.js not found at', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// 1) Remove mysql import line
content = content.replace(
  /const\s+mysql\s*=\s*require\(['"]mysql2\/promise['"]\);\s*\n/,
  ''
);

// 2) Remove DB_* from env destructuring
content = content.replace(
  /const\s*\{\s*([^}]*)\}\s*=\s*process\.env;\s*/m,
  (match, vars) => {
    const cleaned = vars
      .split(',')
      .map(v => v.trim())
      .filter(
        v =>
          v !== 'DB_HOST' &&
          v !== 'DB_USER' &&
          v !== 'DB_PASSWORD' &&
          v !== 'DB_NAME' &&
          v !== ''
      );
    return `const {\n  ${cleaned.join(',\n  ')}\n} = process.env;\n`;
  }
);

// 3) Remove DB env check block
content = content.replace(
  /if\s*\(\s*!DB_HOST[\s\S]*?process\.exit\(1\);\s*\}\s*\n\n/m,
  ''
);

// 4) Remove mysql pool creation block
content = content.replace(
  /\/\/ db pool[\s\S]*?database:\s*DB_NAME[\s\S]*?\}\);\s*\n\n/m,
  ''
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Removed DB env and pool from', targetPath);
