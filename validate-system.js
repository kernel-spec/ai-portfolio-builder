#!/usr/bin/env node
/**
 * On-Demand Validation Script
 * 
 * Quick health check for the AI Portfolio Builder deployment.
 * Run this before any production deployment to verify system integrity.
 * 
 * Usage: node validate-system.js
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/home/runner/work/ai-portfolio-builder/ai-portfolio-builder';

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let errors = 0;
let warnings = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkFile(relativePath, required = true) {
  const fullPath = path.join(BASE_PATH, relativePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✓ ${relativePath}`, GREEN);
    return true;
  } else {
    if (required) {
      log(`✗ ${relativePath} - MISSING`, RED);
      errors++;
    } else {
      log(`⚠ ${relativePath} - Not found (optional)`, YELLOW);
      warnings++;
    }
    return false;
  }
}

function validateJSON(relativePath) {
  try {
    const fullPath = path.join(BASE_PATH, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    JSON.parse(content);
    log(`✓ ${relativePath} - Valid JSON`, GREEN);
    return true;
  } catch (error) {
    log(`✗ ${relativePath} - Invalid JSON: ${error.message}`, RED);
    errors++;
    return false;
  }
}

function comparePromptLocks() {
  try {
    const worker = JSON.parse(fs.readFileSync(
      path.join(BASE_PATH, 'cloudflare-worker/prompt-lock.json'),
      'utf8'
    ));
    const versions = JSON.parse(fs.readFileSync(
      path.join(BASE_PATH, 'versions/prompt-lock.json'),
      'utf8'
    ));

    if (worker.version === versions.version) {
      log(`✓ Prompt lock versions match (${worker.version})`, GREEN);
    } else {
      log(`✗ Version mismatch: worker=${worker.version}, versions=${versions.version}`, RED);
      errors++;
    }

    const workerCount = Object.keys(worker.prompts || {}).length;
    const versionsCount = Object.keys(versions.prompts || {}).length;
    
    if (workerCount === versionsCount) {
      log(`✓ Prompt counts match (${workerCount} prompts)`, GREEN);
    } else {
      log(`✗ Prompt count mismatch: worker=${workerCount}, versions=${versionsCount}`, RED);
      errors++;
    }

    // Check hash synchronization
    let hashMismatches = 0;
    for (const [agentId, workerData] of Object.entries(worker.prompts || {})) {
      const versionsData = versions.prompts?.[agentId];
      if (versionsData && workerData.hash !== versionsData.hash) {
        log(`✗ Hash mismatch for ${agentId}`, RED);
        hashMismatches++;
      }
    }

    if (hashMismatches === 0) {
      log(`✓ All prompt hashes synchronized`, GREEN);
    } else {
      log(`✗ ${hashMismatches} hash mismatch(es) found`, RED);
      errors += hashMismatches;
    }

  } catch (error) {
    log(`✗ Error comparing prompt locks: ${error.message}`, RED);
    errors++;
  }
}

function checkWorkflowConfig() {
  try {
    const workflow = fs.readFileSync(
      path.join(BASE_PATH, '.github/workflows/cloudflare-deploy.yml'),
      'utf8'
    );
    const wrangler = fs.readFileSync(
      path.join(BASE_PATH, 'cloudflare-worker/wrangler.toml'),
      'utf8'
    );

    const workflowAccount = workflow.match(/accountId:\s*([a-f0-9]+)/);
    const wranglerAccount = wrangler.match(/account_id\s*=\s*"([a-f0-9]+)"/);

    if (workflowAccount && wranglerAccount) {
      if (workflowAccount[1] === wranglerAccount[1]) {
        log(`✓ Account IDs synchronized (${workflowAccount[1]})`, GREEN);
      } else {
        log(`✗ Account ID mismatch between workflow and wrangler.toml`, RED);
        errors++;
      }
    } else {
      log(`✗ Could not extract account IDs`, RED);
      errors++;
    }

    if (workflow.includes('workingDirectory:')) {
      log(`✓ workingDirectory configured in workflow`, GREEN);
    } else {
      log(`✗ workingDirectory missing in workflow`, RED);
      errors++;
    }

    if (workflow.includes('wrangler-action@v3')) {
      log(`✓ Using wrangler-action@v3`, GREEN);
    } else {
      log(`⚠ Not using wrangler-action@v3`, YELLOW);
      warnings++;
    }

  } catch (error) {
    log(`✗ Error checking workflow config: ${error.message}`, RED);
    errors++;
  }
}

function checkWorkerCode() {
  try {
    const code = fs.readFileSync(
      path.join(BASE_PATH, 'cloudflare-worker/index.js'),
      'utf8'
    );

    const checks = [
      { pattern: /import promptLock from/, name: 'Static prompt-lock import' },
      { pattern: /method !== 'POST'/, name: 'POST enforcement' },
      { pattern: /request\.json\(\)/, name: 'JSON parsing' },
      { pattern: /agent_id/, name: 'Agent ID validation' },
      { pattern: /\[a-f0-9\]\{64\}/, name: 'SHA-256 validation' },
      { pattern: /verifyPromptHash/, name: 'Hash verification function' },
      { pattern: /403/, name: 'Security error responses' },
    ];

    checks.forEach(check => {
      if (check.pattern.test(code)) {
        log(`✓ ${check.name}`, GREEN);
      } else {
        log(`✗ ${check.name} - NOT FOUND`, RED);
        errors++;
      }
    });

    // Check for unsafe patterns
    const unsafePatterns = [
      { pattern: /eval\(/, name: 'eval() usage' },
      { pattern: /new Function/, name: 'Function constructor' },
    ];

    unsafePatterns.forEach(check => {
      if (check.pattern.test(code)) {
        log(`✗ SECURITY: ${check.name} detected`, RED);
        errors++;
      }
    });

  } catch (error) {
    log(`✗ Error checking worker code: ${error.message}`, RED);
    errors++;
  }
}

// Main validation
console.log('\n' + '='.repeat(70));
log('SYSTEM VALIDATION CHECK', BLUE);
console.log('='.repeat(70) + '\n');

console.log('Checking required files...');
checkFile('cloudflare-worker/index.js');
checkFile('cloudflare-worker/wrangler.toml');
checkFile('cloudflare-worker/package.json');
checkFile('cloudflare-worker/prompt-lock.json');
checkFile('versions/prompt-lock.json');
checkFile('.github/workflows/cloudflare-deploy.yml');

console.log('\nValidating JSON files...');
validateJSON('cloudflare-worker/prompt-lock.json');
validateJSON('versions/prompt-lock.json');

console.log('\nComparing prompt lock files...');
comparePromptLocks();

console.log('\nChecking workflow configuration...');
checkWorkflowConfig();

console.log('\nAnalyzing worker code...');
checkWorkerCode();

// Summary
console.log('\n' + '='.repeat(70));
log('VALIDATION SUMMARY', BLUE);
console.log('='.repeat(70));

if (errors === 0 && warnings === 0) {
  log('\n✓ ALL CHECKS PASSED - SYSTEM READY FOR DEPLOYMENT\n', GREEN);
  process.exit(0);
} else if (errors === 0) {
  log(`\n⚠ ${warnings} warning(s) - Review recommended\n`, YELLOW);
  process.exit(0);
} else {
  log(`\n✗ ${errors} error(s), ${warnings} warning(s) - FIX REQUIRED\n`, RED);
  process.exit(1);
}
