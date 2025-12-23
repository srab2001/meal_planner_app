#!/usr/bin/env node

/**
 * Interactive OpenAI API Key Update Tool
 * 
 * This Node.js script provides an interactive way to update your OpenAI API key.
 * It can be run from anywhere and handles all file updates automatically.
 * 
 * USAGE:
 *   node update-openai-key.js
 *   or
 *   npm run update-key
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function validateApiKey(key) {
  if (!key || key.trim() === '') {
    return { valid: false, reason: 'API key cannot be empty' };
  }

  if (!key.startsWith('sk-')) {
    return { valid: false, reason: 'API key should start with "sk-"' };
  }

  if (key.length < 20) {
    return { valid: false, reason: 'API key seems too short' };
  }

  return { valid: true };
}

async function backupFile(filePath) {
  try {
    const timestamp = Date.now();
    const backupPath = `${filePath}.backup.${timestamp}`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup ${filePath}: ${error.message}`);
  }
}

function updateEnvFile(filePath, apiKey) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if OPENAI_API_KEY exists
    if (!content.includes('OPENAI_API_KEY')) {
      logWarning(`OPENAI_API_KEY not found in ${path.basename(filePath)}`);
      // Add it to the file
      content += `\nOPENAI_API_KEY=${apiKey}\n`;
    } else {
      // Replace existing value
      content = content.replace(
        /OPENAI_API_KEY=.*$/m,
        `OPENAI_API_KEY=${apiKey}`
      );
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to update ${filePath}: ${error.message}`);
  }
}

function updateYamlFile(filePath, apiKey) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if OPENAI_API_KEY exists
    if (!content.includes('OPENAI_API_KEY')) {
      logWarning(`OPENAI_API_KEY not found in ${path.basename(filePath)}`);
      return false;
    }
    
    // Replace existing value (YAML format)
    content = content.replace(
      /OPENAI_API_KEY: .*$/m,
      `OPENAI_API_KEY: ${apiKey}`
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to update ${filePath}: ${error.message}`);
  }
}

async function main() {
  console.clear();
  
  log('blue', '╔════════════════════════════════════════════════════════╗');
  log('blue', '║                                                        ║');
  log('blue', '║        🔑 OpenAI API Key Update Tool                  ║');
  log('blue', '║                                                        ║');
  log('blue', '╚════════════════════════════════════════════════════════╝');
  console.log();

  // Get the project root directory
  const projectRoot = path.join(__dirname);

  // List of files to update
  const filesToUpdate = [
    {
      path: path.join(projectRoot, '.env'),
      type: 'env',
      name: 'Main environment file (.env)',
      optional: false,
    },
    {
      path: path.join(projectRoot, 'fitness', '.env'),
      type: 'env',
      name: 'Fitness backend environment file',
      optional: true,
    },
    {
      path: path.join(projectRoot, 'render.yaml'),
      type: 'yaml',
      name: 'Render deployment config',
      optional: true,
    },
  ];

  // Get API key from user
  log('cyan', 'Step 1: Enter your OpenAI API key');
  console.log('(Get it from: https://platform.openai.com/api-keys)\n');
  
  let apiKey = await prompt('Enter your API key: ');
  apiKey = apiKey.trim();

  const validation = validateApiKey(apiKey);
  if (!validation.valid) {
    logError(`Invalid API key: ${validation.reason}`);
    process.exit(1);
  }

  logSuccess('API key format looks good!');
  console.log();

  // Create .env from template if it doesn't exist
  if (!fs.existsSync(filesToUpdate[0].path)) {
    const templatePath = path.join(projectRoot, 'env-template.txt');
    if (fs.existsSync(templatePath)) {
      logInfo('Creating .env file from template...');
      fs.copyFileSync(templatePath, filesToUpdate[0].path);
      logSuccess('.env file created from template');
    }
  }

  // Update each file
  log('cyan', '\nStep 2: Updating files...\n');

  let updatedCount = 0;
  const backups = [];

  for (const file of filesToUpdate) {
    if (!fs.existsSync(file.path)) {
      if (file.optional) {
        logInfo(`SKIPPED: ${file.name} (file not found)`);
      } else {
        logWarning(`WARNING: ${file.name} not found`);
      }
      continue;
    }

    try {
      // Backup the file
      const backupPath = await backupFile(file.path);
      backups.push({ original: file.path, backup: backupPath });

      // Update based on file type
      let updated = false;
      if (file.type === 'env') {
        updated = updateEnvFile(file.path, apiKey);
      } else if (file.type === 'yaml') {
        updated = updateYamlFile(file.path, apiKey);
      }

      if (updated) {
        logSuccess(`Updated: ${file.name}`);
        console.log(`  └─ Backup: ${path.basename(backupPath)}`);
        updatedCount++;
      }
    } catch (error) {
      logError(error.message);
    }
  }

  console.log();
  log('cyan', '╔════════════════════════════════════════════════════════╗');
  log('cyan', '║                    ✨ Update Complete! ✨              ║');
  log('cyan', '╚════════════════════════════════════════════════════════╝');
  console.log();

  logSuccess(`${updatedCount} file(s) updated successfully!`);
  console.log();

  // Show backups
  if (backups.length > 0) {
    log('blue', 'Backups created:');
    backups.forEach((backup) => {
      console.log(`  └─ ${path.basename(backup.backup)}`);
    });
    console.log();
    log('yellow', 'To restore from backup, run:');
    backups.forEach((backup) => {
      console.log(`  mv ${path.basename(backup.backup)} ${path.basename(backup.original)}`);
    });
    console.log();
  }

  // Next steps
  log('green', 'Next steps:');
  console.log('  1. Restart your server: npm start');
  console.log('  2. Test the API: curl http://localhost:5000/api/health');
  console.log('  3. Check logs for any errors');
  console.log();

  // Helpful links
  log('cyan', 'Helpful resources:');
  console.log('  • View your API keys: https://platform.openai.com/api-keys');
  console.log('  • API documentation: https://platform.openai.com/docs');
  console.log('  • Check API status: https://status.openai.com');
  console.log('  • Billing & usage: https://platform.openai.com/account/billing/overview');
  console.log();
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
