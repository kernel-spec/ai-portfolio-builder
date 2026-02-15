#!/usr/bin/env node
/**
 * Test Suite for git-diff-validator.js
 * 
 * Tests the git diff validator functionality with various scenarios.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_PATH = process.cwd();

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function runTest(name, testFn) {
  try {
    testFn();
    log(`✓ ${name}`, GREEN);
    passed++;
  } catch (error) {
    log(`✗ ${name}`, RED);
    log(`  Error: ${error.message}`, RED);
    failed++;
  }
}

// Test: Module can be loaded
runTest('Module loads successfully', () => {
  const validator = require('./git-diff-validator.js');
  if (!validator || typeof validator !== 'object') {
    throw new Error('Module did not export an object');
  }
});

// Test: calculateFileHash function
runTest('calculateFileHash calculates correct SHA-256', () => {
  const validator = require('./git-diff-validator.js');
  const testFile = 'domains/domain-01-content.system.prompt.md';
  const hash = validator.calculateFileHash(path.join(BASE_PATH, testFile));
  
  if (!hash || hash.length !== 64) {
    throw new Error('Hash is not 64 characters (SHA-256)');
  }
  
  // Verify it matches the lock file
  const promptLock = validator.loadPromptLock();
  const expectedHash = promptLock.prompts['domain-01-content'].hash;
  
  if (hash !== expectedHash) {
    throw new Error(`Hash mismatch: got ${hash}, expected ${expectedHash}`);
  }
});

// Test: loadPromptLock loads valid JSON
runTest('loadPromptLock returns valid data structure', () => {
  const validator = require('./git-diff-validator.js');
  const lockData = validator.loadPromptLock();
  
  if (!lockData.version) {
    throw new Error('Missing version field');
  }
  
  if (!lockData.prompts || typeof lockData.prompts !== 'object') {
    throw new Error('Missing or invalid prompts field');
  }
  
  if (Object.keys(lockData.prompts).length === 0) {
    throw new Error('No prompts in lock file');
  }
});

// Test: loadPromptManifest loads valid JSON
runTest('loadPromptManifest returns valid data structure', () => {
  const validator = require('./git-diff-validator.js');
  const manifest = validator.loadPromptManifest();
  
  if (!manifest.version) {
    throw new Error('Missing version field');
  }
  
  if (!manifest.domains || typeof manifest.domains !== 'object') {
    throw new Error('Missing or invalid domains field');
  }
  
  if (!manifest.archetypes || typeof manifest.archetypes !== 'object') {
    throw new Error('Missing or invalid archetypes field');
  }
});

// Test: validateManifestConsistency checks counts
runTest('validateManifestConsistency validates counts', () => {
  const validator = require('./git-diff-validator.js');
  const manifest = validator.loadPromptManifest();
  const lockData = validator.loadPromptLock();
  
  const manifestDomainCount = Object.keys(manifest.domains).length;
  const lockDomainCount = Object.values(lockData.prompts)
    .filter(p => p.type === 'domain').length;
  
  if (manifestDomainCount !== lockDomainCount) {
    throw new Error(`Domain count mismatch: manifest=${manifestDomainCount}, lock=${lockDomainCount}`);
  }
  
  const manifestArchetypeCount = Object.keys(manifest.archetypes).length;
  const lockArchetypeCount = Object.values(lockData.prompts)
    .filter(p => p.type === 'archetype').length;
  
  if (manifestArchetypeCount !== lockArchetypeCount) {
    throw new Error(`Archetype count mismatch: manifest=${manifestArchetypeCount}, lock=${lockArchetypeCount}`);
  }
});

// Test: validateArchetypeCompositions checks 100% sum
runTest('validateArchetypeCompositions ensures 100% sum', () => {
  const validator = require('./git-diff-validator.js');
  const manifest = validator.loadPromptManifest();
  
  for (const [archetypeId, archetype] of Object.entries(manifest.archetypes)) {
    const composition = archetype.composition || {};
    const percentages = Object.values(composition);
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    
    if (sum !== 100) {
      throw new Error(`${archetypeId} composition sums to ${sum}% (expected 100%)`);
    }
  }
});

// Test: All domain files have matching hashes
runTest('All domain files have correct hashes in lock file', () => {
  const validator = require('./git-diff-validator.js');
  const manifest = validator.loadPromptManifest();
  const lockData = validator.loadPromptLock();
  
  for (const [domainId, domain] of Object.entries(manifest.domains)) {
    const filePath = path.join(BASE_PATH, domain.file);
    const actualHash = validator.calculateFileHash(filePath);
    const expectedHash = lockData.prompts[domainId].hash;
    
    if (actualHash !== expectedHash) {
      throw new Error(`${domainId}: hash mismatch`);
    }
  }
});

// Test: All archetype files have matching hashes
runTest('All archetype files have correct hashes in lock file', () => {
  const validator = require('./git-diff-validator.js');
  const manifest = validator.loadPromptManifest();
  const lockData = validator.loadPromptLock();
  
  for (const [archetypeId, archetype] of Object.entries(manifest.archetypes)) {
    const filePath = path.join(BASE_PATH, archetype.file);
    const actualHash = validator.calculateFileHash(filePath);
    const expectedHash = lockData.prompts[archetypeId].hash;
    
    if (actualHash !== expectedHash) {
      throw new Error(`${archetypeId}: hash mismatch`);
    }
  }
});

// Test: getGitDiff with no changes returns empty array
runTest('getGitDiff returns empty array when no changes', () => {
  const validator = require('./git-diff-validator.js');
  const changes = validator.getGitDiff('HEAD');
  
  if (!Array.isArray(changes)) {
    throw new Error('getGitDiff should return an array');
  }
  
  // This test assumes working tree is clean
  if (changes.length > 0) {
    // Only fail if changes are in governed directories
    const governedChanges = changes.filter(c => 
      c.file.startsWith('versions/') || 
      c.file.startsWith('domains/') || 
      c.file.startsWith('archetypes/')
    );
    if (governedChanges.length > 0) {
      throw new Error('Unexpected changes detected in governed directories');
    }
  }
});

// Test: Script can be executed directly
runTest('Script can be executed as standalone', () => {
  try {
    // Run with no arguments (should compare HEAD to working tree)
    const output = execSync('node git-diff-validator.js', { 
      cwd: BASE_PATH,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (!output.includes('GIT DIFF VALIDATOR')) {
      throw new Error('Output does not include expected header');
    }
  } catch (error) {
    // Exit code 0 is success, exit code 1 is validation failure (still a successful execution)
    if (error.status !== 0 && error.status !== 1) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
    // Validation failures are OK for this test, we just want to confirm it runs
  }
});

// Test: Script exports required functions
runTest('Module exports all required functions', () => {
  const validator = require('./git-diff-validator.js');
  const requiredFunctions = [
    'calculateFileHash',
    'getGitDiff',
    'loadPromptLock',
    'loadPromptManifest',
    'validatePromptFileChange',
    'validateArchetypeCompositions',
    'validateManifestConsistency'
  ];
  
  for (const funcName of requiredFunctions) {
    if (typeof validator[funcName] !== 'function') {
      throw new Error(`Missing or invalid function: ${funcName}`);
    }
  }
});

// Summary
console.log('\n' + '='.repeat(70));
log('TEST SUMMARY', BLUE);
console.log('='.repeat(70));

if (failed === 0) {
  log(`\n✓ All ${passed} tests passed\n`, GREEN);
  process.exit(0);
} else {
  log(`\n${passed} passed, ${failed} failed\n`, RED);
  process.exit(1);
}
