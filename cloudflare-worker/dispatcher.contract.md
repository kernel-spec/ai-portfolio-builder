# Cloudflare Worker Dispatcher Contract

## Overview

The Cloudflare Worker acts as a **governance enforcement point** for prompt dispatch in the AI Portfolio Builder system. It verifies prompt integrity through hash validation before allowing any agent to be dispatched.

## Version
**Contract Version:** 1.0.0  
**Last Updated:** 2026-02-11

## Purpose

The dispatcher ensures:
1. **Integrity**: Only verified, unmodified prompts are executed
2. **Traceability**: All dispatch requests are logged for audit
3. **Security**: Hash mismatches are flagged as security issues
4. **Governance**: Canonical agent definitions are enforced

## Endpoint

### POST /

**Purpose:** Verify prompt integrity and authorize dispatch

#### Request Format

```json
{
  "agent_id": "string (canonical ID from manifest)",
  "prompt_hash": "string (SHA-256 hash, 64 hex characters)",
  "request_id": "string (optional UUID for tracking)"
}
```

**Required Fields:**
- `agent_id`: Must match an entry in `prompt-lock.json`
- `prompt_hash`: Must be valid SHA-256 hash (64 hex characters)

**Optional Fields:**
- `request_id`: UUID for request tracking (auto-generated if not provided)

#### Success Response (200)

```json
{
  "success": true,
  "verified": true,
  "agent": {
    "agent_id": "domain-01-content",
    "type": "domain",
    "version": "1.0.0",
    "hash": "5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413"
  },
  "dispatch_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-11T00:45:02Z",
  "message": "Prompt integrity verified. Ready for dispatch."
}
```

**Meaning:** The prompt hash matches the lock file. Agent can be dispatched safely.

#### Error Responses

##### 400 Bad Request - Invalid Request Structure

```json
{
  "error": "Invalid request",
  "details": [
    "Missing required field: agent_id",
    "Invalid prompt_hash format. Must be SHA-256 hex string (64 characters)."
  ]
}
```

**Cause:** Request is malformed or missing required fields.

**Resolution:** Fix request structure and retry.

##### 403 Forbidden - Hash Verification Failed

```json
{
  "error": "Hash verification failed",
  "details": "Hash mismatch for agent 'domain-01-content'. Expected: 5b469f1..., Received: abc123...",
  "security_flag": true
}
```

**Cause:** Prompt hash doesn't match lock file entry. This indicates:
- Prompt content has been modified
- Outdated prompt version
- Potential tampering

**Resolution:** 
- DO NOT proceed with dispatch
- Investigate hash mismatch
- Update to correct prompt version
- Re-verify integrity

**Security Implication:** This is treated as a security incident and logged.

##### 404 Not Found - Agent Not in Lock File

```json
{
  "error": "Hash verification failed",
  "details": "Agent ID 'invalid-agent' not found in prompt lock file."
}
```

**Cause:** Agent ID doesn't exist in `prompt-lock.json`.

**Resolution:**
- Verify agent ID is correct (check `prompt-manifest.json`)
- Ensure agent is in canonical taxonomy
- Add agent to manifest/lock if it's a new agent

##### 405 Method Not Allowed

```json
{
  "error": "Method not allowed. Use POST."
}
```

**Cause:** Request used non-POST method.

**Resolution:** Use POST method for all dispatch requests.

##### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

**Cause:** Unexpected server error.

**Resolution:** Retry request. If persistent, check worker logs.

## Contract Guarantees

### 1. Hash Verification is Mandatory
The worker **always** verifies the prompt hash against `prompt-lock.json`:
- No verification bypass
- No "development mode" exception
- Hash mismatch = hard rejection

### 2. Lock File is Source of Truth
The embedded `prompt-lock.json` is authoritative:
- Updated only through deployment
- Synchronized with repository version
- Immutable at runtime

### 3. All Requests are Logged
Every dispatch request is logged with:
- Timestamp
- Agent ID
- Prompt hash (received)
- Verification result
- Request ID

### 4. Security Flags are Set
Hash verification failures trigger:
- `security_flag: true` in response
- Security log entry
- Alert to monitoring (if configured)

## Deployment Contract

### Lock File Synchronization
When deploying the worker:
1. Copy latest `versions/prompt-lock.json` to `cloudflare-worker/prompt-lock.json`
2. Deploy worker with updated lock file
3. Verify deployment includes correct lock file version
4. Test with sample requests

**Critical:** The worker's lock file MUST match the canonical repository version.

### Rollback Safety
If a deployment introduces issues:
1. Rollback deploys previous worker version
2. Previous lock file is restored
3. Old prompts with old hashes continue to work
4. New prompts are rejected until re-deployed

### Zero-Downtime Updates
Lock file updates should be:
1. Backward compatible when possible
2. Deployed with version increment
3. Coordinated with client updates
4. Monitored for hash failures

## Integration Patterns

### Pattern 1: Pre-Dispatch Verification

```javascript
// Client-side integration
async function dispatchAgent(agentId, promptHash, systemPrompt) {
  // 1. Verify with Cloudflare Worker
  const verification = await fetch('https://prompts.yourdomain.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, prompt_hash: promptHash })
  });
  
  if (!verification.ok) {
    throw new Error('Prompt verification failed');
  }
  
  const result = await verification.json();
  
  if (!result.verified) {
    throw new Error('Prompt integrity check failed');
  }
  
  // 2. Dispatch is authorized, proceed with agent
  return await dispatchToOpenAI(systemPrompt, result.dispatch_id);
}
```

### Pattern 2: Batch Verification

```javascript
// Verify multiple prompts before workflow
async function verifyWorkflow(agents) {
  const verifications = await Promise.all(
    agents.map(agent => 
      fetch('https://prompts.yourdomain.com/', {
        method: 'POST',
        body: JSON.stringify({ 
          agent_id: agent.id, 
          prompt_hash: agent.hash 
        })
      })
    )
  );
  
  const allVerified = verifications.every(v => v.ok);
  
  if (!allVerified) {
    throw new Error('Workflow verification failed');
  }
  
  return true;
}
```

### Pattern 3: Continuous Verification

```javascript
// Re-verify before each agent handoff
async function handoffToAgent(targetAgentId, targetHash, context) {
  // Always verify before handoff
  const verified = await verifyPrompt(targetAgentId, targetHash);
  
  if (!verified) {
    throw new Error('Cannot hand off to unverified agent');
  }
  
  return executeHandoff(targetAgentId, context);
}
```

## Monitoring and Observability

### Metrics to Track
- **Verification success rate**: Should be >99%
- **Hash mismatch rate**: Should be ~0% (failures indicate issues)
- **Request latency**: Should be <50ms p95
- **Error rate by type**: Track 400/403/500 separately

### Alerts to Configure
- **Hash mismatch spike**: Alert if >5 failures/hour
- **Unknown agent ID spike**: Alert if >10 failures/hour
- **High error rate**: Alert if >1% errors
- **Worker unavailable**: Critical alert

### Logs to Retain
- All verification failures (indefinitely)
- Hash mismatches with full context (indefinitely)
- Successful verifications (30 days minimum)
- Performance metrics (90 days minimum)

## Security Considerations

### Threat Model
The worker protects against:
1. **Prompt tampering**: Modified prompts are rejected
2. **Outdated prompts**: Old hashes are rejected after updates
3. **Unauthorized prompts**: Unknown agents are rejected
4. **Replay attacks**: Each request generates unique dispatch ID

### Security Best Practices
1. **HTTPS Only**: Worker must be accessed over HTTPS
2. **Lock File Integrity**: Verify lock file hash before deployment
3. **Audit All Failures**: Log and review all verification failures
4. **Regular Updates**: Keep lock file synchronized with repository
5. **Access Control**: Limit who can deploy worker updates

### Incident Response
If hash verification failures occur:
1. **Immediate**: Stop using the affected agent
2. **Investigation**: Determine cause of hash mismatch
3. **Remediation**: Update to correct version or roll back
4. **Audit**: Review all recent uses of the agent
5. **Documentation**: Record incident and resolution

## Testing

### Unit Tests
Test the worker with:
- Valid agent ID + correct hash → 200 success
- Valid agent ID + incorrect hash → 403 failure
- Invalid agent ID → 404 failure  
- Malformed request → 400 failure
- Missing fields → 400 failure

### Integration Tests
Test the full flow:
- Repository update → CI → Lock file update → Worker deployment
- Client request → Worker verification → Agent dispatch
- Hash mismatch → Rejection → Error handling

### Load Tests
Verify performance:
- Sustained 100 req/s → <50ms p95
- Burst 1000 req/s → No errors
- Cold start latency → <100ms

## Versioning

### Contract Versioning
This contract uses semantic versioning:
- **Major**: Breaking changes to API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Lock File Versioning
Lock file version is independent:
- Updated when prompts change
- Must match manifest version
- Incremented per semver rules

## Support and Maintenance

### Deployment
Use Wrangler CLI:
```bash
cd cloudflare-worker
wrangler deploy
```

### Configuration
Update `wrangler.toml` with:
- Account ID
- Route patterns
- Environment variables

### Monitoring
Access logs and metrics:
```bash
wrangler tail
```

### Troubleshooting
Common issues:
- **Hash mismatches**: Update lock file
- **Unknown agents**: Add to manifest/lock
- **Worker errors**: Check logs with `wrangler tail`
- **CORS issues**: Verify CORS headers in response

## Changelog

### 1.0.0 (2026-02-11)
- Initial contract definition
- Hash verification implementation
- Audit logging support
- CORS support for browser clients
- Comprehensive error handling
