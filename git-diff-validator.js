#!/usr/bin/env node
/**
 * Git Diff Validator for AI Portfolio Builder
 * 
 * Validates changes to versions/, domains/, and archetypes/ directories.
 * Ensures hash synchronization, version consistency, and composition validation.
 * 
 * Usage:
 *   node git-diff-validator.js [base] [head]
 * 
 * Arguments:
 *   base - Base commit/branch for comparison (default: HEAD)
 *   head - Head commit/branch for comparison (default: working tree)
 * 
 * Examples:
 *   # Compare working tree to HEAD
 *   node git-diff-validator.js
 * 
 *   # Compare two commits
 *   node git-diff-validator.js HEAD~1 HEAD
 * 
 *   # Compare branch to main
 *   node git-diff-validator.js main HEAD
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Use current working directory (must be repository root)
const BASE_PATH = process.cwd();

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let errors = 0;
let warnings = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

/**
 * Calculate SHA-256 hash of a file
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    throw new Error(`Failed to hash ${filePath}: ${error.message}`);
  }
}

/**
 * Get git diff between two revisions
 */
function getGitDiff(base = 'HEAD', head = '', paths = ['versions/', 'domains/', 'archetypes/']) {
  try {
    const cmd = head 
      ? `git diff --name-status ${base} ${head} -- ${paths.join(' ')}`
      : `git diff --name-status ${base} -- ${paths.join(' ')}`;
    
    const output = execSync(cmd, { cwd: BASE_PATH, encoding: 'utf8' });
    
    if (!output || !output.trim()) {
      return [];
    }
    
    return output.trim().split('\n').map(line => {
      const [status, ...fileParts] = line.split('\t');
      const file = fileParts.join('\t'); // Handle files with tabs in name
      return { status, file };
    });
  } catch (error) {
    // Git diff returns 0 even when there are no changes
    if (error.status === 0) {
      return [];
    }
    // If stdout exists but command failed, might be parsing issue
    if (error.stdout) {
      const output = error.stdout.toString().trim();
      if (output) {
        return output.split('\n').map(line => {
          const [status, ...fileParts] = line.split('\t');
          const file = fileParts.join('\t');
          return { status, file };
        });
      }
    }
    throw new Error(`Git diff failed: ${error.message}`);
  }
}

/**
 * Load prompt lock file
 */
function loadPromptLock() {
  try {
    const lockPath = path.join(BASE_PATH, 'versions/prompt-lock.json');
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to load prompt-lock.json: ${error.message}`);
  }
}

/**
 * Load prompt manifest file
 */
function loadPromptManifest() {
  try {
    const manifestPath = path.join(BASE_PATH, 'versions/prompt-manifest.json');
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to load prompt-manifest.json: ${error.message}`);
  }
}

/**
 * Extract agent ID from file path
 */
function getAgentIdFromPath(filePath) {
  const basename = path.basename(filePath, '.system.prompt.md');
  return basename;
}

/**
 * Validate domain or archetype file changes
 */
function validatePromptFileChange(change, promptLock) {
  const { status, file } = change;
  
  // Skip non-prompt files
  if (!file.endsWith('.system.prompt.md')) {
    return { valid: true };
  }
  
  const agentId = getAgentIdFromPath(file);
  const fullPath = path.join(BASE_PATH, file);
  
  // For deleted files, we can't calculate hash
  if (status === 'D') {
    log(`  ℹ File deleted: ${file}`, CYAN);
    if (promptLock.prompts[agentId]) {
      log(`  ⚠ Prompt lock still contains entry for ${agentId}`, YELLOW);
      warnings++;
      return { valid: true, warning: 'Lock file should be updated to remove deleted agent' };
    }
    return { valid: true };
  }
  
  // Calculate current hash
  let currentHash;
  try {
    currentHash = calculateFileHash(fullPath);
  } catch (error) {
    log(`  ✗ Failed to calculate hash for ${file}: ${error.message}`, RED);
    errors++;
    return { valid: false, error: error.message };
  }
  
  // Check if hash matches lock file
  const lockEntry = promptLock.prompts[agentId];
  
  if (!lockEntry) {
    log(`  ✗ ${agentId} not found in prompt-lock.json`, RED);
    errors++;
    return { valid: false, error: 'Missing lock file entry' };
  }
  
  if (lockEntry.hash === currentHash) {
    log(`  ✓ Hash matches lock file: ${agentId}`, GREEN);
    return { valid: true, hashMatches: true };
  } else {
    log(`  ✗ Hash mismatch for ${agentId}`, RED);
    log(`    Expected: ${lockEntry.hash}`, RED);
    log(`    Actual:   ${currentHash}`, RED);
    errors++;
    return { valid: false, error: 'Hash mismatch', expectedHash: lockEntry.hash, actualHash: currentHash };
  }
}

/**
 * Validate archetype composition percentages
 */
function validateArchetypeCompositions(manifest) {
  log('\nValidating archetype compositions...', BLUE);
  
  const archetypes = manifest.archetypes || {};
  let compositionErrors = 0;
  
  for (const [archetypeId, archetype] of Object.entries(archetypes)) {
    const composition = archetype.composition || {};
    const percentages = Object.values(composition);
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    
    if (sum === 100) {
      log(`  ✓ ${archetypeId}: composition sums to 100%`, GREEN);
    } else {
      log(`  ✗ ${archetypeId}: composition sums to ${sum}% (expected 100%)`, RED);
      compositionErrors++;
      errors++;
    }
  }
  
  return compositionErrors === 0;
}

/**
 * Validate version manifest consistency
 */
function validateManifestConsistency(manifest, promptLock) {
  log('\nValidating manifest consistency...', BLUE);
  
  // Check domain count
  const manifestDomainCount = Object.keys(manifest.domains || {}).length;
  const lockDomainCount = Object.values(promptLock.prompts || {})
    .filter(p => p.type === 'domain').length;
  
  if (manifestDomainCount === lockDomainCount) {
    log(`  ✓ Domain count matches: ${manifestDomainCount}`, GREEN);
  } else {
    log(`  ✗ Domain count mismatch: manifest=${manifestDomainCount}, lock=${lockDomainCount}`, RED);
    errors++;
  }
  
  // Check archetype count
  const manifestArchetypeCount = Object.keys(manifest.archetypes || {}).length;
  const lockArchetypeCount = Object.values(promptLock.prompts || {})
    .filter(p => p.type === 'archetype').length;
  
  if (manifestArchetypeCount === lockArchetypeCount) {
    log(`  ✓ Archetype count matches: ${manifestArchetypeCount}`, GREEN);
  } else {
    log(`  ✗ Archetype count mismatch: manifest=${manifestArchetypeCount}, lock=${lockArchetypeCount}`, RED);
    errors++;
  }
  
  // Check version consistency
  if (manifest.version === promptLock.version) {
    log(`  ✓ Version numbers match: ${manifest.version}`, GREEN);
  } else {
    log(`  ✗ Version mismatch: manifest=${manifest.version}, lock=${promptLock.version}`, RED);
    errors++;
  }
}

/**
 * Generate change report
 */
function generateChangeReport(changes) {
  if (changes.length === 0) {
    log('\nNo changes detected in versions/, domains/, or archetypes/', GREEN);
    return;
  }
  
  log('\n' + '='.repeat(70), BLUE);
  log('CHANGE REPORT', BLUE);
  log('='.repeat(70), BLUE);
  
  const domainChanges = changes.filter(c => c.file.startsWith('domains/'));
  const archetypeChanges = changes.filter(c => c.file.startsWith('archetypes/'));
  const versionChanges = changes.filter(c => c.file.startsWith('versions/'));
  
  if (domainChanges.length > 0) {
    log('\nDomain Changes:', CYAN);
    domainChanges.forEach(c => log(`  ${c.status}\t${c.file}`));
  }
  
  if (archetypeChanges.length > 0) {
    log('\nArchetype Changes:', CYAN);
    archetypeChanges.forEach(c => log(`  ${c.status}\t${c.file}`));
  }
  
  if (versionChanges.length > 0) {
    log('\nVersion File Changes:', CYAN);
    versionChanges.forEach(c => log(`  ${c.status}\t${c.file}`));
  }
}

/**
 * Main validation function
 */
function main() {
  const args = process.argv.slice(2);
  const base = args[0] || 'HEAD';
  const head = args[1] || '';
  
  console.log('\n' + '='.repeat(70));
  log('GIT DIFF VALIDATOR', BLUE);
  console.log('='.repeat(70));
  log(`\nComparing: ${base}${head ? ' → ' + head : ' → working tree'}`, CYAN);
  
  try {
    // Get git diff
    const changes = getGitDiff(base, head);
    
    // Generate change report
    generateChangeReport(changes);
    
    if (changes.length === 0) {
      log('\n✓ No validation needed - no changes detected\n', GREEN);
      process.exit(0);
    }
    
    // Load current state
    log('\nLoading version files...', BLUE);
    const promptLock = loadPromptLock();
    const promptManifest = loadPromptManifest();
    log('  ✓ Loaded prompt-lock.json', GREEN);
    log('  ✓ Loaded prompt-manifest.json', GREEN);
    
    // Validate each changed file
    log('\nValidating changed files...', BLUE);
    const domainAndArchetypeChanges = changes.filter(c => 
      c.file.startsWith('domains/') || c.file.startsWith('archetypes/')
    );
    
    domainAndArchetypeChanges.forEach(change => {
      log(`\nChecking: ${change.file} (${change.status})`, CYAN);
      validatePromptFileChange(change, promptLock);
    });
    
    // Validate manifest consistency
    validateManifestConsistency(promptManifest, promptLock);
    
    // Validate archetype compositions
    validateArchetypeCompositions(promptManifest);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    log('VALIDATION SUMMARY', BLUE);
    console.log('='.repeat(70));
    
    if (errors === 0 && warnings === 0) {
      log('\n✓ ALL VALIDATIONS PASSED\n', GREEN);
      process.exit(0);
    } else if (errors === 0) {
      log(`\n⚠ ${warnings} warning(s) - Review recommended\n`, YELLOW);
      process.exit(0);
    } else {
      log(`\n✗ ${errors} error(s), ${warnings} warning(s) - VALIDATION FAILED\n`, RED);
      log('To fix hash mismatches:', YELLOW);
      log('  1. Review the changed files', YELLOW);
      log('  2. Recalculate hashes: sha256sum <file>', YELLOW);
      log('  3. Update versions/prompt-lock.json', YELLOW);
      log('  4. Update versions/prompt-manifest.json if needed\n', YELLOW);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n✗ Fatal error: ${error.message}\n`, RED);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  calculateFileHash,
  getGitDiff,
  loadPromptLock,
  loadPromptManifest,
  validatePromptFileChange,
  validateArchetypeCompositions,
  validateManifestConsistency
};
