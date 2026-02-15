#!/usr/bin/env node

/**
 * Hash Integrity Verification Script
 * Verifies SHA-256 hashes of all governed prompts against versions/prompt-lock.json
 */

import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

/**
 * Calculate SHA-256 hash for a file
 */
function calculateSHA256(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Main verification function
 */
function verifyHashes() {
  console.log('🔍 Starting hash integrity verification...\n');

  // Load prompt-lock.json
  const lockFilePath = join(REPO_ROOT, 'versions', 'prompt-lock.json');
  let promptLock;
  
  try {
    const lockFileContent = readFileSync(lockFilePath, 'utf8');
    promptLock = JSON.parse(lockFileContent);
  } catch (error) {
    console.error('❌ Failed to load prompt-lock.json:', error.message);
    process.exit(1);
  }

  console.log(`📋 Loaded prompt-lock.json v${promptLock.version}`);
  console.log(`📝 Algorithm: ${promptLock.algorithm}`);
  console.log(`📊 Total prompts to verify: ${promptLock.integrity.total_prompts}\n`);

  let passed = 0;
  let failed = 0;
  const errors = [];

  // Verify each prompt entry
  for (const [promptId, promptData] of Object.entries(promptLock.prompts)) {
    const filePath = join(REPO_ROOT, promptData.file);
    const expectedHash = promptData.hash;
    
    try {
      const actualHash = calculateSHA256(filePath);
      
      if (actualHash === expectedHash) {
        passed++;
        console.log(`✅ ${promptId}: Hash verified`);
      } else {
        failed++;
        const error = {
          promptId,
          file: promptData.file,
          expectedHash,
          actualHash,
          type: promptData.type,
          version: promptData.version,
        };
        errors.push(error);
        console.error(`❌ ${promptId}: Hash mismatch!`);
        console.error(`   File: ${promptData.file}`);
        console.error(`   Expected: ${expectedHash}`);
        console.error(`   Actual:   ${actualHash}`);
      }
    } catch (error) {
      failed++;
      const errorInfo = {
        promptId,
        file: promptData.file,
        error: error.message,
      };
      errors.push(errorInfo);
      console.error(`❌ ${promptId}: Failed to read file`);
      console.error(`   File: ${promptData.file}`);
      console.error(`   Error: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  if (failed > 0) {
    console.error('\n🚨 HASH INTEGRITY CHECK FAILED!');
    console.error('One or more prompts have hash mismatches.');
    console.error('This indicates unauthorized modifications to governed prompts.');
    console.error('\nFailed prompts:');
    errors.forEach(err => {
      console.error(`  - ${err.promptId} (${err.file})`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ ALL HASH CHECKS PASSED!');
    console.log('All governed prompts maintain cryptographic integrity.');
    process.exit(0);
  }
}

// Run verification
verifyHashes();
