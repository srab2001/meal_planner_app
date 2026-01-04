#!/usr/bin/env node
/**
 * Meal Planner App - Deployment CLI (Node.js)
 *
 * Usage: node scripts/deploy.js [command]
 * Or via npm: npm run deploy [command]
 */

require('dotenv').config();
const { execSync, spawn } = require('child_process');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const PROJECT_DIR = path.dirname(__dirname);

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  header: (msg) => {
    console.log(`\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}  ${msg}${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
  }
};

// Helper to run shell commands
function run(cmd, options = {}) {
  try {
    return execSync(cmd, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.ignoreError) throw error;
    return null;
  }
}

// Commands
const commands = {
  help: () => {
    console.log(`
Meal Planner App - Deployment CLI

Usage: node scripts/deploy.js [command] [options]

Commands:
  git-status          Show git status and recent commits
  git-push [message]  Add, commit, and push changes

  db-status           Check database connection
  db-migrate          Run database migrations
  db-seed             Seed fitness interview questions

  env-check           Verify environment variables
  urls                Show deployment URLs
  health              Check endpoint health

  deploy              Full deployment (git + db)

Options:
  --help, -h          Show this help

Examples:
  node scripts/deploy.js git-push "fix: update questions"
  node scripts/deploy.js db-migrate
  node scripts/deploy.js deploy
`);
  },

  'git-status': () => {
    log.header('Git Status');

    console.log('Branch:');
    run('git branch -v');

    console.log('\nStatus:');
    run('git status -s');

    console.log('\nRecent Commits:');
    run('git log --oneline -5');
  },

  'git-push': async (message) => {
    log.header('Git Push');

    const commitMessage = message || `Auto-commit: ${new Date().toISOString()}`;

    // Check for changes
    const status = run('git status --porcelain', { silent: true });
    if (!status || status.trim() === '') {
      log.warning('No changes to commit');
      return;
    }

    console.log('Changes:');
    run('git status -s');

    log.info(`Committing: "${commitMessage}"`);
    run('git add -A');
    run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

    const branch = run('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
    run(`git push -u origin ${branch}`);

    log.success(`Pushed to origin/${branch}`);
  },

  'db-status': async () => {
    log.header('Database Status');

    if (!process.env.DATABASE_URL) {
      log.error('DATABASE_URL not set');
      return;
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      const result = await pool.query(`
        SELECT 'users' as table_name, COUNT(*)::int as count FROM users
        UNION ALL SELECT 'fitness_interview_questions', COUNT(*)::int FROM fitness_interview_questions
        UNION ALL SELECT 'fitness_interview_options', COUNT(*)::int FROM fitness_interview_options
        UNION ALL SELECT 'fitness_interview_responses', COUNT(*)::int FROM fitness_interview_responses
        UNION ALL SELECT 'workout_plans', COUNT(*)::int FROM workout_plans
      `);

      log.success('Database connected');
      console.log('\nTable Counts:');
      result.rows.forEach(row => {
        console.log(`  ${row.table_name}: ${row.count}`);
      });
    } catch (error) {
      log.error(`Database error: ${error.message}`);
    } finally {
      await pool.end();
    }
  },

  'db-migrate': async () => {
    log.header('Database Migrations');

    if (!process.env.DATABASE_URL) {
      log.error('DATABASE_URL not set');
      return;
    }

    const migrationsDir = path.join(PROJECT_DIR, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      process.stdout.write(`  Running ${file}... `);
      try {
        await pool.query(sql);
        console.log(`${colors.green}OK${colors.reset}`);
      } catch (error) {
        console.log(`${colors.yellow}SKIP${colors.reset}`);
      }
    }

    await pool.end();
    log.success('Migrations complete');
  },

  'db-seed': async () => {
    log.header('Seed Interview Questions');

    if (!process.env.DATABASE_URL) {
      log.error('DATABASE_URL not set');
      return;
    }

    log.info('Running seed script...');
    run('node scripts/seed-fitness-interview.js');
    log.success('Seeding complete');
  },

  'env-check': () => {
    log.header('Environment Check');

    const required = ['DATABASE_URL', 'OPENAI_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'JWT_SECRET'];
    const optional = ['FRONTEND_BASE', 'FITNESS_FRONTEND_URL', 'NODE_ENV', 'PORT'];

    console.log('Required:');
    required.forEach(key => {
      if (process.env[key]) {
        log.success(`${key} is set`);
      } else {
        log.error(`${key} is NOT set`);
      }
    });

    console.log('\nOptional:');
    optional.forEach(key => {
      const val = process.env[key];
      if (val) {
        log.success(`${key} = ${val.substring(0, 30)}...`);
      } else {
        log.warning(`${key} is not set`);
      }
    });
  },

  'urls': () => {
    log.header('Deployment URLs');

    console.log('Main App:');
    console.log('  Frontend: https://meal-planner-gold-one.vercel.app');
    console.log('  Backend:  https://meal-planner-app-mve2.onrender.com');

    console.log('\nFitness App:');
    console.log('  Frontend: https://frontend-hbmyufqu1-stus-projects-458dd35a.vercel.app');
    console.log('  API:      /api/fitness-interview');

    console.log('\nAdmin API:');
    console.log('  Questions: /api/admin/fitness-interview/questions');
  },

  'health': async () => {
    log.header('Health Check');

    const endpoints = [
      'https://meal-planner-app-mve2.onrender.com/health',
      'https://meal-planner-gold-one.vercel.app'
    ];

    for (const url of endpoints) {
      process.stdout.write(`  ${url}... `);
      try {
        const response = await fetch(url);
        if (response.ok || response.status === 301 || response.status === 302) {
          console.log(`${colors.green}OK${colors.reset}`);
        } else {
          console.log(`${colors.red}${response.status}${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}FAIL${colors.reset}`);
      }
    }
  },

  'deploy': async (message) => {
    log.header('Full Deployment');

    log.info('Step 1: Git Push');
    await commands['git-push'](message || `deploy: ${new Date().toISOString().split('T')[0]}`);

    log.info('Step 2: Migrations');
    await commands['db-migrate']();

    log.info('Step 3: Seed');
    await commands['db-seed']();

    log.success('Deployment complete!');
    commands['urls']();
  }
};

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const params = args.slice(1).join(' ');

  if (command === '-h' || command === '--help') {
    commands.help();
    return;
  }

  if (!commands[command]) {
    log.error(`Unknown command: ${command}`);
    console.log("Run 'node scripts/deploy.js --help' for usage");
    process.exit(1);
  }

  try {
    await commands[command](params);
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}

main();
