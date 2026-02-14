#!/usr/bin/env node
/**
 * META-VALIDATION SCRIPT
 * 
 * Independent verification of the failure simulation test suite.
 * Assesses whether tests are comprehensive or superficial.
 * 
 * Validates:
 * - Test coverage depth
 * - False positive detection
 * - Assertion quality
 * - Edge case coverage
 * - Runtime vs static analysis
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = process.cwd();

// Colors
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';

class MetaValidator {
  constructor() {
    this.findings = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  log(message, color = RESET) {
    console.log(`${color}${message}${RESET}`);
  }

  addFinding(category, depth, missing, falsePositiveRisk, riskLevel, details) {
    const finding = {
      category,
      depth,
      missing,
      falsePositiveRisk,
      riskLevel,
      details
    };
    
    this.findings.push(finding);
    
    if (riskLevel === 'CRITICAL') {
      this.criticalIssues.push(finding);
    } else if (riskLevel === 'HIGH') {
      this.warnings.push(finding);
    }
    
    return finding;
  }

  // ====================================================
  // STEP 1: TEST COVERAGE VERIFICATION
  // ====================================================
  async verifyTestCoverage() {
    this.log('\n' + '='.repeat(70), CYAN);
    this.log('STEP 1 — TEST COVERAGE VERIFICATION', CYAN);
    this.log('='.repeat(70), CYAN);

    const testFiles = [
      { name: 'validate-system.js', location: 'repository', required: true },
      { name: 'failure-simulation-test.js', location: '/tmp', required: false },
      { name: 'worker-runtime-test.js', location: '/tmp', required: false }
    ];

    let existingTests = [];
    let missingTests = [];

    testFiles.forEach(test => {
      const filePath = test.location === 'repository' 
        ? path.join(BASE_PATH, test.name)
        : path.join(test.location, test.name);
      
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        this.log(`  ✓ ${test.name} found in ${test.location}`, GREEN);
        existingTests.push({ ...test, path: filePath });
      } else {
        const severity = test.required ? RED : YELLOW;
        const symbol = test.required ? '✗' : '⚠';
        this.log(`  ${symbol} ${test.name} NOT found in ${test.location}`, severity);
        if (test.required) {
          missingTests.push(test.name);
        }
      }
    });

    // Analyze validate-system.js in depth
    if (existingTests.find(t => t.name === 'validate-system.js')) {
      this.log('\n  Analyzing validate-system.js...', BLUE);
      await this.analyzeValidateSystem();
    }

    // Check if /tmp tests are documented but missing
    const hasTmpTestsDocs = this.checkDocumentationClaims();
    
    if (hasTmpTestsDocs && existingTests.length === 1) {
      this.log('\n  ⚠ WARNING: Documentation claims test files exist in /tmp', YELLOW);
      this.log('    but these are ephemeral and no longer available', YELLOW);
      this.log('    This suggests tests were TEMPORARY and not part of CI', YELLOW);
    }

    this.addFinding(
      'Test Coverage Verification',
      existingTests.length === 1 ? 'PARTIAL' : existingTests.length === 3 ? 'FULL' : 'SUPERFICIAL',
      missingTests.length > 0 ? missingTests : ['None'],
      existingTests.length === 1 ? 'HIGH' : 'MEDIUM',
      existingTests.length === 1 ? 'HIGH' : 'MEDIUM',
      {
        committed_tests: existingTests.length,
        ephemeral_tests: hasTmpTestsDocs ? 2 : 0,
        missing_tests: missingTests.length
      }
    );
  }

  analyzeValidateSystem() {
    const filePath = path.join(BASE_PATH, 'validate-system.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if it has real assertions or just checks
    const hasAssertions = content.includes('throw') || 
                          content.includes('process.exit(1)') ||
                          content.includes('errors++');
    
    const hasRealTests = content.includes('try') && content.includes('catch');
    
    const testTypes = {
      fileExistence: content.includes('existsSync'),
      jsonParsing: content.includes('JSON.parse'),
      versionComparison: content.includes('version'),
      hashComparison: content.includes('hash'),
      configChecks: content.includes('workflow') || content.includes('wrangler')
    };

    this.log(`    File existence checks: ${testTypes.fileExistence ? '✓' : '✗'}`, 
      testTypes.fileExistence ? GREEN : RED);
    this.log(`    JSON parsing validation: ${testTypes.jsonParsing ? '✓' : '✗'}`, 
      testTypes.jsonParsing ? GREEN : RED);
    this.log(`    Version comparison: ${testTypes.versionComparison ? '✓' : '✗'}`, 
      testTypes.versionComparison ? GREEN : RED);
    this.log(`    Hash synchronization: ${testTypes.hashComparison ? '✓' : '✗'}`, 
      testTypes.hashComparison ? GREEN : RED);

    // CRITICAL: Check if it's static analysis or runtime testing
    const isStaticAnalysis = !content.includes('fetch(') && 
                             !content.includes('Request(') &&
                             !content.includes('Response(');
    
    if (isStaticAnalysis) {
      this.log(`    ⚠ FINDING: This is STATIC ANALYSIS, not runtime testing`, YELLOW);
      this.log(`      Does NOT actually execute worker code`, YELLOW);
      this.log(`      Does NOT simulate HTTP requests`, YELLOW);
      this.log(`      Does NOT test actual fail-closed behavior`, YELLOW);
    }

    return {
      hasAssertions,
      hasRealTests,
      isStaticAnalysis,
      testTypes
    };
  }

  checkDocumentationClaims() {
    const docs = [
      'FAILURE_SIMULATION_REPORT.md',
      'FAILURE_SIMULATION_SUMMARY.md',
      'TESTING_GUIDE.md',
      'TASK_COMPLETE.md'
    ];

    let claimsTmpTests = false;

    docs.forEach(doc => {
      const docPath = path.join(BASE_PATH, doc);
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        if (content.includes('/tmp/failure-simulation-test.js') ||
            content.includes('/tmp/worker-runtime-test.js')) {
          claimsTmpTests = true;
        }
      }
    });

    return claimsTmpTests;
  }

  // ====================================================
  // STEP 2: FALSE POSITIVE DETECTION
  // ====================================================
  async detectFalsePositives() {
    this.log('\n' + '='.repeat(70), CYAN);
    this.log('STEP 2 — FALSE POSITIVE DETECTION', CYAN);
    this.log('='.repeat(70), CYAN);

    const filePath = path.join(BASE_PATH, 'validate-system.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const patterns = {
      alwaysTrue: /return true/gi,
      swallowedErrors: /catch\s*\([^)]*\)\s*\{[^}]*\}/g,
      noAssertions: !/assert|expect|should|throw/i.test(content),
      superficialChecks: (content.match(/includes\(/g) || []).length,
      stringChecks: (content.match(/\.test\(|\.match\(/g) || []).length
    };

    this.log(`\n  Checking for test quality issues...`, BLUE);
    
    const alwaysTrueCount = (content.match(patterns.alwaysTrue) || []).length;
    this.log(`    "return true" statements: ${alwaysTrueCount}`, 
      alwaysTrueCount > 10 ? YELLOW : GREEN);

    const catchBlocks = (content.match(patterns.swallowedErrors) || []).length;
    this.log(`    Catch blocks: ${catchBlocks}`, 
      catchBlocks > 5 ? YELLOW : GREEN);

    this.log(`    Uses assertions: ${!patterns.noAssertions ? '✓' : '✗'}`, 
      !patterns.noAssertions ? GREEN : RED);

    this.log(`    String includes() checks: ${patterns.superficialChecks}`, 
      patterns.superficialChecks > 20 ? YELLOW : GREEN);

    // CRITICAL CHECK: Are tests actually failing for bad inputs?
    this.log(`\n  Testing if validation actually fails for bad inputs...`, BLUE);
    
    const testResult = await this.testActualFailure();
    
    if (testResult.canDetectFailures) {
      this.log(`    ✓ Validator correctly fails for missing files`, GREEN);
    } else {
      this.log(`    ✗ CRITICAL: Validator may not detect real failures`, RED);
    }

    const falsePositiveRisk = patterns.noAssertions || alwaysTrueCount > 15 
      ? 'HIGH' : patterns.superficialChecks > 30 ? 'MEDIUM' : 'LOW';

    this.addFinding(
      'False Positive Detection',
      falsePositiveRisk === 'LOW' ? 'FULL' : 'PARTIAL',
      [
        patterns.noAssertions ? 'No assertion framework used' : null,
        alwaysTrueCount > 15 ? 'Many auto-passing checks' : null
      ].filter(Boolean),
      falsePositiveRisk,
      falsePositiveRisk === 'HIGH' ? 'HIGH' : 'MEDIUM',
      {
        alwaysTrue: alwaysTrueCount,
        catchBlocks,
        noAssertions: patterns.noAssertions,
        superficialChecks: patterns.superficialChecks
      }
    );
  }

  async testActualFailure() {
    // Test if validator actually detects problems
    // by temporarily creating a scenario with missing files
    const testDir = '/tmp/meta-validation-test';
    try {
      fs.mkdirSync(testDir, { recursive: true });
      
      // Save original dir
      const originalDir = process.cwd();
      
      // Try to run validation in empty directory
      process.chdir(testDir);
      
      // This should fail
      const { execSync } = require('child_process');
      try {
        execSync(`node ${path.join(BASE_PATH, 'validate-system.js')}`, { 
          stdio: 'pipe',
          cwd: testDir 
        });
        // If it didn't exit with error, it's a problem
        process.chdir(originalDir);
        return { canDetectFailures: false };
      } catch (error) {
        // Good - it detected the missing files
        process.chdir(originalDir);
        return { canDetectFailures: true };
      }
    } catch (error) {
      return { canDetectFailures: false, error: error.message };
    } finally {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  // ====================================================
  // STEP 3: WORKER VALIDATION DEPTH CHECK
  // ====================================================
  async checkWorkerValidationDepth() {
    this.log('\n' + '='.repeat(70), CYAN);
    this.log('STEP 3 — WORKER VALIDATION DEPTH CHECK', CYAN);
    this.log('='.repeat(70), CYAN);

    const indexPath = path.join(BASE_PATH, 'cloudflare-worker/index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    this.log(`\n  Checking if worker code is actually tested...`, BLUE);

    // Check if there are actual runtime tests
    const hasRuntimeTests = fs.existsSync(path.join(BASE_PATH, 'cloudflare-worker/index.test.js')) ||
                           fs.existsSync(path.join(BASE_PATH, 'cloudflare-worker/__tests__')) ||
                           fs.existsSync(path.join(BASE_PATH, 'test')) ||
                           fs.existsSync(path.join(BASE_PATH, 'tests'));

    if (!hasRuntimeTests) {
      this.log(`    ✗ No worker runtime tests found`, RED);
      this.log(`    ✗ No index.test.js`, RED);
      this.log(`    ✗ No __tests__ directory`, RED);
    }

    // Check if validate-system.js actually tests the worker
    const validatePath = path.join(BASE_PATH, 'validate-system.js');
    const validateContent = fs.readFileSync(validatePath, 'utf8');

    const hasHttpSimulation = validateContent.includes('fetch(') ||
                              validateContent.includes('new Request(') ||
                              validateContent.includes('new Response(');

    const hasWorkerImport = validateContent.includes('import') && 
                           validateContent.includes('index.js');

    this.log(`\n  HTTP Simulation Depth:`, BLUE);
    this.log(`    Actual fetch simulation: ${hasHttpSimulation ? '✓' : '✗'}`, 
      hasHttpSimulation ? GREEN : RED);
    this.log(`    Worker code import: ${hasWorkerImport ? '✓' : '✗'}`, 
      hasWorkerImport ? GREEN : RED);

    if (!hasHttpSimulation && !hasWorkerImport) {
      this.log(`\n    ⚠ CRITICAL FINDING:`, MAGENTA);
      this.log(`      Tests DO NOT actually execute worker code`, MAGENTA);
      this.log(`      Tests DO NOT simulate HTTP requests`, MAGENTA);
      this.log(`      Tests only perform STATIC CODE ANALYSIS`, MAGENTA);
      this.log(`      Cannot verify runtime behavior`, MAGENTA);
    }

    // Check what the tests actually verify
    const scenarios = {
      'POST without body': validateContent.includes('POST') && validateContent.includes('body'),
      'POST invalid JSON': validateContent.includes('JSON') && validateContent.includes('invalid'),
      'POST wrong hash': validateContent.includes('hash') && validateContent.includes('wrong'),
      'POST unknown agent': validateContent.includes('agent') && validateContent.includes('unknown'),
      'Correct success case': validateContent.includes('success') || validateContent.includes('200')
    };

    this.log(`\n  Scenario Coverage:`, BLUE);
    Object.entries(scenarios).forEach(([scenario, covered]) => {
      this.log(`    ${scenario}: ${covered ? '✓' : '✗'}`, covered ? GREEN : RED);
    });

    const depth = hasHttpSimulation && hasWorkerImport ? 'FULL' :
                  !hasHttpSimulation && !hasWorkerImport ? 'SUPERFICIAL' :
                  'PARTIAL';

    const riskLevel = depth === 'SUPERFICIAL' ? 'CRITICAL' : 
                     depth === 'PARTIAL' ? 'HIGH' : 'LOW';

    this.addFinding(
      'Worker Validation Depth',
      depth,
      [
        !hasHttpSimulation ? 'No actual HTTP simulation' : null,
        !hasWorkerImport ? 'Worker code not imported/executed' : null,
        !hasRuntimeTests ? 'No runtime test suite' : null
      ].filter(Boolean),
      riskLevel,
      riskLevel,
      {
        hasHttpSimulation,
        hasWorkerImport,
        hasRuntimeTests,
        scenarios
      }
    );
  }

  // ====================================================
  // STEP 4: CI/WORKFLOW TEST VALIDATION
  // ====================================================
  async checkWorkflowTestDepth() {
    this.log('\n' + '='.repeat(70), CYAN);
    this.log('STEP 4 — CI/WORKFLOW TEST VALIDATION', CYAN);
    this.log('='.repeat(70), CYAN);

    const validatePath = path.join(BASE_PATH, 'validate-system.js');
    const validateContent = fs.readFileSync(validatePath, 'utf8');

    this.log(`\n  Checking workflow validation depth...`, BLUE);

    const capabilities = {
      'Parses YAML': validateContent.includes('yaml') || validateContent.includes('yml'),
      'Validates working-directory': validateContent.includes('workingDirectory') || 
                                     validateContent.includes('working-directory'),
      'Validates secrets usage': validateContent.includes('secret') || validateContent.includes('CLOUDFLARE'),
      'Validates wrangler config': validateContent.includes('wrangler') || validateContent.includes('toml')
    };

    Object.entries(capabilities).forEach(([capability, present]) => {
      this.log(`    ${capability}: ${present ? '✓' : '✗'}`, present ? GREEN : RED);
    });

    // Check if it's just file existence checks
    const fileExistenceOnly = validateContent.includes('existsSync') &&
                              !validateContent.includes('readFileSync');

    if (fileExistenceOnly) {
      this.log(`\n    ⚠ WARNING: Tests only check file existence`, YELLOW);
      this.log(`      Does not parse or validate content`, YELLOW);
    }

    const depth = Object.values(capabilities).filter(Boolean).length >= 3 ? 'FULL' :
                  Object.values(capabilities).filter(Boolean).length >= 2 ? 'PARTIAL' :
                  'SUPERFICIAL';

    this.addFinding(
      'CI/Workflow Test Validation',
      depth,
      Object.entries(capabilities).filter(([_, v]) => !v).map(([k, _]) => k),
      depth === 'SUPERFICIAL' ? 'MEDIUM' : 'LOW',
      depth === 'SUPERFICIAL' ? 'MEDIUM' : 'LOW',
      capabilities
    );
  }

  // ====================================================
  // STEP 5: SECURITY DEPTH ANALYSIS
  // ====================================================
  async checkSecurityTestDepth() {
    this.log('\n' + '='.repeat(70), CYAN);
    this.log('STEP 5 — SECURITY DEPTH ANALYSIS', CYAN);
    this.log('='.repeat(70), CYAN);

    const validatePath = path.join(BASE_PATH, 'validate-system.js');
    const validateContent = fs.readFileSync(validatePath, 'utf8');

    this.log(`\n  Checking security test coverage...`, BLUE);

    const securityChecks = {
      'eval usage detection': validateContent.includes('eval'),
      'dynamic imports check': validateContent.includes('import') || validateContent.includes('require'),
      'external file loading': validateContent.includes('fetch') || validateContent.includes('http'),
      'hash validation check': validateContent.includes('hash'),
      'bypass path detection': validateContent.includes('bypass') || validateContent.includes('fallback')
    };

    Object.entries(securityChecks).forEach(([check, present]) => {
      this.log(`    ${check}: ${present ? '✓' : '✗'}`, present ? GREEN : RED);
    });

    // CRITICAL: Check if tests actually execute malicious code to verify detection
    const hasNegativeTests = validateContent.includes('should fail') ||
                            validateContent.includes('expect') ||
                            validateContent.includes('throw');

    if (!hasNegativeTests) {
      this.log(`\n    ⚠ WARNING: No negative test cases found`, YELLOW);
      this.log(`      Cannot verify that unsafe code would be detected`, YELLOW);
    }

    const depth = Object.values(securityChecks).filter(Boolean).length >= 4 ? 'FULL' :
                  Object.values(securityChecks).filter(Boolean).length >= 2 ? 'PARTIAL' :
                  'SUPERFICIAL';

    const riskLevel = depth === 'SUPERFICIAL' ? 'HIGH' :
                     depth === 'PARTIAL' ? 'MEDIUM' : 'LOW';

    this.addFinding(
      'Security Depth Analysis',
      depth,
      Object.entries(securityChecks).filter(([_, v]) => !v).map(([k, _]) => k),
      riskLevel,
      riskLevel,
      {
        ...securityChecks,
        hasNegativeTests
      }
    );
  }

  // ====================================================
  // STEP 6: GOVERNANCE ENFORCEMENT VALIDATION
  // ====================================================
  async checkGovernanceValidation() {
    this.log('\n' + '='.repeat(70), CYAN);
    this.log('STEP 6 — GOVERNANCE ENFORCEMENT VALIDATION', CYAN);
    this.log('='.repeat(70), CYAN);

    const validatePath = path.join(BASE_PATH, 'validate-system.js');
    const validateContent = fs.readFileSync(validatePath, 'utf8');

    this.log(`\n  Checking governance enforcement tests...`, BLUE);

    const governanceChecks = {
      'Lockfile version sync': validateContent.includes('version') && 
                               validateContent.includes('match'),
      'Hash mismatch rejection': validateContent.includes('hash') && 
                                 validateContent.includes('mismatch'),
      'Fail-closed enforcement': validateContent.includes('fail') || 
                                validateContent.includes('403') ||
                                validateContent.includes('error')
    };

    Object.entries(governanceChecks).forEach(([check, present]) => {
      this.log(`    ${check}: ${present ? '✓' : '✗'}`, present ? GREEN : RED);
    });

    // Check if it actually tests failure cases
    const testsFailureCases = validateContent.includes('!==') ||
                              validateContent.includes('error') ||
                              validateContent.includes('throw');

    this.log(`\n    Tests failure cases: ${testsFailureCases ? '✓' : '✗'}`, 
      testsFailureCases ? GREEN : RED);

    const depth = Object.values(governanceChecks).filter(Boolean).length === 3 ? 'FULL' :
                  Object.values(governanceChecks).filter(Boolean).length >= 2 ? 'PARTIAL' :
                  'SUPERFICIAL';

    this.addFinding(
      'Governance Enforcement Validation',
      depth,
      Object.entries(governanceChecks).filter(([_, v]) => !v).map(([k, _]) => k),
      depth === 'SUPERFICIAL' ? 'MEDIUM' : 'LOW',
      depth === 'SUPERFICIAL' ? 'MEDIUM' : 'LOW',
      {
        ...governanceChecks,
        testsFailureCases
      }
    );
  }

  // ====================================================
  // GENERATE META-VALIDATION REPORT
  // ====================================================
  generateReport() {
    this.log('\n' + '='.repeat(70), MAGENTA);
    this.log('META-VALIDATION REPORT', MAGENTA);
    this.log('='.repeat(70), MAGENTA);

    this.log('\n' + '─'.repeat(70), BLUE);
    this.log('FINDINGS SUMMARY', BLUE);
    this.log('─'.repeat(70), BLUE);

    this.findings.forEach((finding, idx) => {
      this.log(`\n${idx + 1}. ${finding.category}`, CYAN);
      this.log(`   Coverage Depth:       ${finding.depth}`, this.getColorForDepth(finding.depth));
      this.log(`   False Positive Risk:  ${finding.falsePositiveRisk}`, 
        this.getColorForRisk(finding.falsePositiveRisk));
      this.log(`   Risk Level:           ${finding.riskLevel}`, 
        this.getColorForRisk(finding.riskLevel));
      
      if (finding.missing && finding.missing[0] !== 'None') {
        this.log(`   Missing Scenarios:`, YELLOW);
        finding.missing.forEach(m => this.log(`     • ${m}`, YELLOW));
      }
    });

    // Critical findings
    if (this.criticalIssues.length > 0) {
      this.log('\n' + '─'.repeat(70), RED);
      this.log('CRITICAL ISSUES', RED);
      this.log('─'.repeat(70), RED);
      
      this.criticalIssues.forEach((issue, idx) => {
        this.log(`\n${idx + 1}. ${issue.category}`, RED);
        this.log(`   ${issue.missing.join(', ')}`, YELLOW);
      });
    }

    // Final verdict
    this.log('\n' + '='.repeat(70), MAGENTA);
    this.log('FINAL VERDICT', MAGENTA);
    this.log('='.repeat(70), MAGENTA);

    const verdict = this.determineVerdict();
    const verdictColor = {
      'VALIDATED_AND_TRUSTED': GREEN,
      'PARTIALLY_VALIDATED': YELLOW,
      'SUPERFICIAL_TEST_SUITE': YELLOW,
      'CRITICAL_FALSE_CONFIDENCE': RED
    }[verdict];

    this.log(`\n  ${verdict}`, verdictColor);
    this.log('', RESET);

    if (verdict === 'CRITICAL_FALSE_CONFIDENCE') {
      this.log('  ⚠ The test suite provides FALSE CONFIDENCE', RED);
      this.log('  ⚠ Tests are primarily STATIC ANALYSIS, not runtime validation', RED);
      this.log('  ⚠ Cannot verify actual worker behavior', RED);
      this.log('  ⚠ Missing comprehensive HTTP scenario testing', RED);
    } else if (verdict === 'SUPERFICIAL_TEST_SUITE') {
      this.log('  ⚠ Test suite lacks depth in critical areas', YELLOW);
      this.log('  ⚠ Primarily checks code patterns, not behavior', YELLOW);
      this.log('  ⚠ Limited runtime validation', YELLOW);
    } else if (verdict === 'PARTIALLY_VALIDATED') {
      this.log('  ✓ Test suite provides useful validation', GREEN);
      this.log('  ⚠ Some areas need deeper testing', YELLOW);
      this.log('  ⚠ Consider adding runtime tests', YELLOW);
    } else {
      this.log('  ✓ Test suite is comprehensive and reliable', GREEN);
    }

    this.log('\n' + '='.repeat(70), RESET);

    return verdict;
  }

  determineVerdict() {
    const criticalCount = this.criticalIssues.length;
    const highRiskCount = this.findings.filter(f => f.riskLevel === 'HIGH').length;
    const superficialCount = this.findings.filter(f => f.depth === 'SUPERFICIAL').length;

    if (criticalCount >= 2 || highRiskCount >= 3) {
      return 'CRITICAL_FALSE_CONFIDENCE';
    } else if (criticalCount === 1 || superficialCount >= 3) {
      return 'SUPERFICIAL_TEST_SUITE';
    } else if (highRiskCount >= 1 || superficialCount >= 1) {
      return 'PARTIALLY_VALIDATED';
    } else {
      return 'VALIDATED_AND_TRUSTED';
    }
  }

  getColorForDepth(depth) {
    return {
      'FULL': GREEN,
      'PARTIAL': YELLOW,
      'SUPERFICIAL': RED
    }[depth] || RESET;
  }

  getColorForRisk(risk) {
    return {
      'LOW': GREEN,
      'MEDIUM': YELLOW,
      'HIGH': RED,
      'CRITICAL': MAGENTA
    }[risk] || RESET;
  }

  async run() {
    this.log('\n' + '█'.repeat(70), CYAN);
    this.log('█' + ' '.repeat(68) + '█', CYAN);
    this.log('█  META-VALIDATION: Independent Test Suite Assessment'.padEnd(69) + '█', CYAN);
    this.log('█' + ' '.repeat(68) + '█', CYAN);
    this.log('█'.repeat(70), CYAN);

    await this.verifyTestCoverage();
    await this.detectFalsePositives();
    await this.checkWorkerValidationDepth();
    await this.checkWorkflowTestDepth();
    await this.checkSecurityTestDepth();
    await this.checkGovernanceValidation();

    const verdict = this.generateReport();

    // Save report
    const reportPath = path.join(BASE_PATH, 'META_VALIDATION_REPORT.md');
    this.saveMarkdownReport(reportPath);
    this.log(`\n📄 Detailed report saved to: META_VALIDATION_REPORT.md\n`, BLUE);

    // Exit with appropriate code
    process.exit(verdict === 'VALIDATED_AND_TRUSTED' ? 0 : 1);
  }

  saveMarkdownReport(filepath) {
    let md = '# META-VALIDATION REPORT\n\n';
    md += '**Assessment Date:** ' + new Date().toISOString() + '\n';
    md += '**Purpose:** Independent verification of failure simulation test suite\n\n';
    md += '---\n\n';

    md += '## Executive Summary\n\n';
    const verdict = this.determineVerdict();
    md += `**Final Verdict:** ${verdict}\n\n`;

    md += '## Findings by Category\n\n';
    
    this.findings.forEach((finding, idx) => {
      md += `### ${idx + 1}. ${finding.category}\n\n`;
      md += `- **Coverage Depth:** ${finding.depth}\n`;
      md += `- **False Positive Risk:** ${finding.falsePositiveRisk}\n`;
      md += `- **Risk Level:** ${finding.riskLevel}\n`;
      
      if (finding.missing && finding.missing[0] !== 'None') {
        md += `- **Missing Scenarios:**\n`;
        finding.missing.forEach(m => md += `  - ${m}\n`);
      }
      
      md += '\n';
    });

    if (this.criticalIssues.length > 0) {
      md += '## Critical Issues\n\n';
      this.criticalIssues.forEach((issue, idx) => {
        md += `### ${idx + 1}. ${issue.category}\n\n`;
        issue.missing.forEach(m => md += `- ${m}\n`);
        md += '\n';
      });
    }

    md += '## Recommendations\n\n';
    md += this.generateRecommendations();

    fs.writeFileSync(filepath, md);
  }

  generateRecommendations() {
    let rec = '';
    
    if (this.criticalIssues.length > 0) {
      rec += '### Critical\n\n';
      rec += '1. **Add Runtime Tests** - Implement actual HTTP simulation tests for the Cloudflare Worker\n';
      rec += '2. **Worker Execution** - Import and execute worker code in tests, not just analyze patterns\n';
      rec += '3. **Negative Test Cases** - Add tests that verify failures are detected\n\n';
    }

    if (this.warnings.length > 0) {
      rec += '### High Priority\n\n';
      rec += '1. **Enhance Test Depth** - Move beyond file existence checks to content validation\n';
      rec += '2. **Add Assertion Framework** - Use proper test assertions instead of custom checks\n';
      rec += '3. **CI Integration** - Commit test files to repository for CI/CD pipeline\n\n';
    }

    rec += '### General\n\n';
    rec += '1. Use a testing framework (Jest, Vitest, or Mocha)\n';
    rec += '2. Add Miniflare for local Cloudflare Worker testing\n';
    rec += '3. Implement negative test cases for all security checks\n';
    rec += '4. Add integration tests that actually call the worker\n';
    rec += '5. Move tests from /tmp to a committed test directory\n\n';

    return rec;
  }
}

// Main execution
async function main() {
  const validator = new MetaValidator();
  await validator.run();
}

main().catch(error => {
  console.error('Fatal error during meta-validation:', error);
  process.exit(1);
});
