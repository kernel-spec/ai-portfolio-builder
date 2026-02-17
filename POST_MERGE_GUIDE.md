# Post-Merge Deployment Guide

This document outlines the steps to complete the v1.1.1 production lock deployment after merging this PR.

---

## Prerequisites

- [x] PR approved and merged to main
- [ ] OPENAI_API_KEY obtained from OpenAI
- [ ] Cloudflare account access
- [ ] Wrangler CLI installed
- [ ] Git repository cloned locally

---

## Step 1: Configure OPENAI_API_KEY Secret

⚠️ **CRITICAL**: This secret must NEVER be committed to the repository.

### Option A: Cloudflare Dashboard (Recommended)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Workers & Pages** → **Your Worker** → **Settings** → **Variables**
3. Click **"Add variable"**
4. Configure:
   - Variable name: `OPENAI_API_KEY`
   - Value: `<your-openai-api-key>`
   - Type: **Secret** (check "Encrypt")
5. Click **"Save and Deploy"**

### Option B: Wrangler CLI

```bash
cd cloudflare-worker
wrangler secret put OPENAI_API_KEY
# Enter your API key when prompted
# DO NOT pass the key as a command-line argument
```

### Verification

```bash
# List secrets (won't show values)
wrangler secret list

# Expected output:
# [
#   {
#     "name": "OPENAI_API_KEY",
#     "type": "secret_text"
#   }
# ]
```

---

## Step 2: Deploy Worker

```bash
cd cloudflare-worker
wrangler deploy
```

**Expected Output:**
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded ai-portfolio-builder (X.XX sec)
Published ai-portfolio-builder (X.XX sec)
  https://ai-portfolio-builder.your-subdomain.workers.dev
```

---

## Step 3: Verify Deployment

### Test 1: Health Check

```bash
curl https://your-worker.workers.dev/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "prompt-dispatcher",
  "version": "1.1.1",
  "lock_file_version": "1.1.0",
  "prompts_count": 14,
  "immutable": true
}
```

✅ **Pass Criteria**: Returns 200, version is "1.1.1", immutable is true

---

### Test 2: Fail-Closed Validation

#### Test 2a: Empty Body

```bash
curl -X POST https://your-worker.workers.dev/dispatch \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 Bad Request

---

#### Test 2b: Unknown Agent

```bash
curl -X POST https://your-worker.workers.dev/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "unknown-agent",
    "request_payload": {"task": "test"}
  }'
```

**Expected Response:**
```json
{
  "error": "Unknown agent_id",
  "security_flag": true
}
```

✅ **Pass Criteria**: Returns 403, security_flag is true

---

### Test 3: Valid Dispatch

```bash
curl -X POST https://your-worker.workers.dev/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "domain-01-content",
    "request_payload": {
      "task": "Write a brief introduction to AI ethics"
    }
  }'
```

**Expected Response Structure:**
```json
{
  "success": true,
  "verified": true,
  "dispatch_id": "<uuid>",
  "agent": {
    "agent_id": "domain-01-content",
    "version": "1.0.0",
    "hash": "5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413",
    "type": "domain"
  },
  "ai_execution": {
    "model": "gpt-4o-mini",
    "usage": {
      "prompt_tokens": 123,
      "completion_tokens": 456,
      "total_tokens": 579
    },
    "output": "AI generated response..."
  },
  "governance": {
    "lock_version": "1.1.0",
    "immutable": true
  },
  "timestamp": "2026-02-17T..."
}
```

✅ **Pass Criteria**: 
- Returns 200
- success is true
- ai_execution contains model, usage, output
- output is not null

---

## Step 4: Tag Version v1.1.1

```bash
# From repository root
git checkout main
git pull origin main

# Create and push tag
git tag v1.1.1
git push origin v1.1.1
```

**Verification:**
```bash
git tag -l
# Should show v1.1.1

# View tag details
git show v1.1.1
```

---

## Step 5: Enable Branch Protection

1. Go to GitHub repository
2. Navigate to: **Settings** → **Branches**
3. Click **"Add rule"** or edit existing rule for `main`
4. Configure protection rules:

### Required Settings:

- ✅ **Require a pull request before merging**
  - Required approvals: 1
  - Dismiss stale pull request approvals when new commits are pushed: ✅
  
- ✅ **Require status checks to pass before merging**
  - Required checks:
    - `validate-governance` (from governance-validation.yml)
  
- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**

- ✅ **Restrict who can push to matching branches**
  - Repository administrators: No exceptions

- ✅ **Block force pushes**

- ✅ **Do not allow deletions**

5. Click **"Create"** or **"Save changes"**

---

## Step 6: Verify CI Hash Enforcement

To verify that CI blocks mutations:

1. Create a test branch:
   ```bash
   git checkout -b test/hash-enforcement
   ```

2. Modify a prompt file slightly:
   ```bash
   echo "" >> domains/domain-01-content.system.prompt.md
   ```

3. Commit and push:
   ```bash
   git add domains/domain-01-content.system.prompt.md
   git commit -m "test: trigger hash enforcement"
   git push origin test/hash-enforcement
   ```

4. Open a PR to main

5. **Expected Behavior**: CI should fail with:
   ```
   ❌ Hash mismatch for domains/domain-01-content.system.prompt.md
   ```

6. Close the PR and delete the test branch:
   ```bash
   git checkout main
   git branch -D test/hash-enforcement
   git push origin --delete test/hash-enforcement
   ```

✅ **Pass Criteria**: CI fails on hash mismatch

---

## Post-Deployment Checklist

| Task | Status |
|------|--------|
| OPENAI_API_KEY configured | ☐ |
| Worker deployed | ☐ |
| Health check returns 1.1.1 | ☐ |
| Fail-closed validation works | ☐ |
| Valid dispatch returns AI response | ☐ |
| Version v1.1.1 tagged | ☐ |
| Branch protection enabled | ☐ |
| CI hash enforcement verified | ☐ |

---

## Troubleshooting

### Issue: Worker returns 500 on dispatch

**Possible Causes:**
1. OPENAI_API_KEY not configured or invalid
2. OpenAI API quota exceeded
3. Prompt file not found

**Solution:**
1. Check worker logs: `wrangler tail`
2. Verify OPENAI_API_KEY is set: `wrangler secret list`
3. Test OpenAI API key directly with curl

---

### Issue: Health check returns old version

**Possible Causes:**
1. Deployment failed
2. Using wrong worker URL
3. Cloudflare cache

**Solution:**
1. Redeploy: `wrangler deploy`
2. Check deployment status in Cloudflare Dashboard
3. Clear cache or wait a few seconds

---

### Issue: CI passes even with modified prompts

**Possible Causes:**
1. Hash enforcement step not running
2. Wrong lock file being checked

**Solution:**
1. Check workflow file: `.github/workflows/governance-validation.yml`
2. Verify "Recompute Prompt Hashes" step exists
3. Re-run failed jobs in GitHub Actions

---

## Rollback Procedure

If critical issues arise after deployment:

1. **Rollback Worker:**
   ```bash
   # Deploy previous version
   git checkout <previous-commit>
   cd cloudflare-worker
   wrangler deploy
   ```

2. **Rollback Git:**
   ```bash
   # Create revert commit (don't force push)
   git revert <commit-hash>
   git push origin main
   ```

3. **Notify Team:**
   - Create incident issue in GitHub
   - Document problem and solution
   - Update runbooks if needed

---

## Monitoring

After deployment, monitor:

1. **Worker Health:**
   - Set up periodic health checks
   - Alert on non-200 responses

2. **Error Rates:**
   - Monitor 403 (unknown agents)
   - Monitor 500 (OpenAI failures)
   - Alert on spikes

3. **CI Status:**
   - Monitor governance-validation workflow
   - Alert on hash mismatches
   - Review security flags

4. **OpenAI Usage:**
   - Track usage in OpenAI dashboard
   - Monitor costs
   - Set usage limits if needed

---

## Support

- **Deployment Issues**: See `cloudflare-worker/DEPLOYMENT.md`
- **Verification**: See `PRODUCTION_VERIFICATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Security**: See `SECURITY.md`
- **GitHub Issues**: [Create issue](https://github.com/kernel-spec/ai-portfolio-builder/issues)

---

## Success Criteria

✅ All post-deployment checklist items completed
✅ All verification tests passing
✅ Zero security vulnerabilities
✅ CI enforcing hash integrity
✅ Worker returning structured AI responses

**Status**: Ready for production use

---

*Last Updated: 2026-02-17*
*Version: 1.1.1*
