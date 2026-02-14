# Testing & Validation Tools

This directory contains comprehensive testing and validation tools for the AI Portfolio Builder Cloudflare Worker deployment.

## Quick Start

### System Validation (Quick Check)
```bash
node validate-system.js
```
Fast validation script that checks:
- Required files exist
- JSON files are valid
- Prompt locks are synchronized
- Workflow configuration is correct
- Worker code has security measures

**Exit Codes:**
- `0` - All checks passed
- `1` - Errors detected, fix required

---

## Test Suites

### 1. Comprehensive Failure Simulation

**Location:** `/tmp/failure-simulation-test.js`

Full 8-step failure scenario simulation covering:
- GitHub Actions workflow validation
- Repository structure verification
- Prompt lock integrity checking
- Worker runtime HTTP scenarios
- Security vulnerability analysis
- Deployment edge case testing
- Fail-closed enforcement validation
- Comprehensive report generation

**Run:**
```bash
node /tmp/failure-simulation-test.js
```

**Output:** 
- Console report with color-coded results
- JSON report saved to `/tmp/failure-simulation-report.json`

### 2. Worker Runtime Tests

**Location:** `/tmp/worker-runtime-test.js`

Focused testing of Cloudflare Worker behavior:
- HTTP scenario validation (GET, POST, OPTIONS)
- Code pattern analysis
- Security audit
- Fail-closed enforcement checks

**Run:**
```bash
node /tmp/worker-runtime-test.js
```

### 3. System Validator

**Location:** `validate-system.js`

Quick pre-deployment validation:
- File existence checks
- JSON syntax validation
- Configuration synchronization
- Security pattern detection

**Run:**
```bash
node validate-system.js
```

---

## Reports

### FAILURE_SIMULATION_REPORT.md

Complete detailed report including:
- Test methodology
- All test results by category
- Risk assessment matrix
- HTTP scenario validation
- Security audit findings
- Deployment checklist
- Recommendations

### FAILURE_SIMULATION_SUMMARY.md

Executive summary with:
- Quick status overview
- Test coverage statistics
- Key validation results
- Risk summary
- Deployment approval status

---

## Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Workflow Validation | 8 | ✅ |
| Repository Structure | 7 | ✅ |
| Prompt Lock Integrity | 5 | ✅ |
| Worker Runtime | 12 | ✅ |
| Security Analysis | 5 | ✅ |
| Deployment Config | 5 | ✅ |
| Fail-Closed Enforcement | 5 | ✅ |
| **TOTAL** | **47** | **✅** |

---

## Continuous Integration

### Pre-Deployment Checklist

Before any production deployment:

1. ✅ Run `node validate-system.js`
2. ✅ Check that all 47 tests pass
3. ✅ Review FAILURE_SIMULATION_REPORT.md
4. ✅ Verify no critical or high-risk issues
5. ✅ Confirm prompt-lock.json synchronization
6. ✅ Validate wrangler.toml configuration
7. ✅ Test GitHub Actions workflow

### Automated Checks

The following checks run automatically in CI:

- `forbidden-file-changes.yml` - Prevents unauthorized modifications
- `version-hash-enforcement.yml` - Validates prompt hash integrity
- `schema-validation.yml` - Ensures JSON schema compliance
- `archetype-composition-validation.yml` - Validates agent composition

---

## Validation Scenarios Tested

### ✅ GitHub Actions CI
- Workflow configuration
- Account ID synchronization
- Secret references
- Wrangler action version
- Branch triggers

### ✅ Cloudflare Worker
- POST-only enforcement
- JSON parsing with error handling
- Agent ID validation
- Hash format verification (SHA-256)
- Hash verification logic
- CORS headers
- Content-Type headers
- Error responses (400, 403, 405)

### ✅ Security
- Static imports only
- No dynamic code execution
- No external fetches
- Protected JSON parsing
- No stack trace exposure
- No hardcoded secrets

### ✅ Deployment
- wrangler.toml configuration
- Account ID matching
- Compatibility settings
- nodejs_compat flag
- Main entry point

### ✅ Prompt Integrity
- Version synchronization
- Hash synchronization
- SHA-256 format validation
- Metadata completeness
- File existence

---

## HTTP Scenario Matrix

| Method | Path | Body | Expected Response | Status |
|--------|------|------|-------------------|--------|
| GET | / | - | 405 Method Not Allowed | ✅ |
| GET | /health | - | 200 OK | ✅ |
| POST | / | No JSON | 400 Bad Request | ✅ |
| POST | / | Invalid JSON | 400 Bad Request | ✅ |
| POST | / | Missing agent_id | 400 Bad Request | ✅ |
| POST | / | Missing hash | 400 Bad Request | ✅ |
| POST | / | Invalid hash format | 400 Bad Request | ✅ |
| POST | / | Wrong hash | 403 Forbidden | ✅ |
| POST | / | Unknown agent | 403 Forbidden | ✅ |
| POST | / | Valid request | 200 OK | ✅ |
| OPTIONS | / | - | 200 OK + CORS | ✅ |

---

## Security Audit Results

**Vulnerabilities:** 0

Checks performed:
- ✅ SQL injection vectors
- ✅ Command injection patterns
- ✅ Path traversal risks
- ✅ Hardcoded secrets
- ✅ Unsafe deserialization
- ✅ Dynamic code execution
- ✅ External file fetching
- ✅ Stack trace exposure

---

## Fail-Closed Enforcement

The system guarantees:

1. ✅ Never returns 200 on invalid input
2. ✅ Never dispatches unverified agent
3. ✅ Never ignores hash mismatch
4. ✅ Never continues after validation failure
5. ✅ Sequential validation (no bypasses)
6. ✅ Explicit error responses
7. ✅ Security flags on failures
8. ✅ Audit logging on success

---

## Troubleshooting

### Test Failures

If validation fails:

1. **Check file existence**
   ```bash
   ls -la cloudflare-worker/
   ls -la versions/
   ```

2. **Validate JSON syntax**
   ```bash
   cat cloudflare-worker/prompt-lock.json | jq '.'
   cat versions/prompt-lock.json | jq '.'
   ```

3. **Compare prompt locks**
   ```bash
   diff cloudflare-worker/prompt-lock.json versions/prompt-lock.json
   ```

4. **Check workflow config**
   ```bash
   cat .github/workflows/cloudflare-deploy.yml
   ```

### Common Issues

**Issue:** Prompt lock version mismatch  
**Fix:** Sync versions in both files to same value

**Issue:** Hash mismatch  
**Fix:** Regenerate hashes or sync from source of truth

**Issue:** Account ID mismatch  
**Fix:** Update workflow or wrangler.toml to match

**Issue:** Missing workingDirectory  
**Fix:** Add `workingDirectory: ./cloudflare-worker` to workflow

---

## Best Practices

1. **Always validate before deploying**
   ```bash
   node validate-system.js && git push
   ```

2. **Run full test suite on major changes**
   ```bash
   node /tmp/failure-simulation-test.js
   ```

3. **Review reports after testing**
   - Check FAILURE_SIMULATION_SUMMARY.md
   - Review any warnings or errors
   - Confirm zero critical issues

4. **Keep prompt locks synchronized**
   - Update both files together
   - Verify hashes after changes
   - Commit as atomic change

5. **Monitor deployment logs**
   - Watch for 403 responses (security events)
   - Track validation failures
   - Alert on repeated failures

---

## Maintenance

### Regular Tasks

**Weekly:**
- Run `node validate-system.js`
- Review Cloudflare Worker logs
- Check for repeated failures

**Monthly:**
- Run full failure simulation
- Review security audit results
- Update wrangler if needed
- Rotate CLOUDFLARE_API_TOKEN

**On Changes:**
- Validate prompt-lock.json immediately
- Run system validation
- Test in staging first
- Review CI logs

### Version Updates

When updating prompts:

1. Update prompt file
2. Regenerate hash (SHA-256)
3. Update both prompt-lock.json files
4. Increment version if needed
5. Run validation suite
6. Commit and deploy

---

## Support

For issues or questions:
- Check FAILURE_SIMULATION_REPORT.md
- Review GOVERNANCE_AUDIT_REPORT.md
- See cloudflare-worker/dispatcher.contract.md
- Check SECURITY.md for security concerns

---

**Last Updated:** 2026-02-14  
**Test Suite Version:** 1.0.0  
**Status:** All Tests Passing ✅
