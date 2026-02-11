# Agent Handoff Schema

## Purpose
This schema defines the canonical structure for handoff between AI agents in the governed prompt system. All handoffs must follow this structure to ensure proper context transfer and governance enforcement.

## Schema Version
**Version:** 1.0.0  
**Last Updated:** 2026-02-11

## Handoff Structure

### Required Fields

#### 1. Handoff Metadata
```json
{
  "handoff_id": "string (UUID v4)",
  "timestamp": "ISO 8601 timestamp",
  "protocol_version": "1.0.0"
}
```

#### 2. Source Agent
```json
{
  "agent_type": "domain | archetype | orchestrator",
  "agent_id": "canonical-id from manifest",
  "agent_version": "semver string",
  "prompt_hash": "SHA-256 hash from lock file"
}
```

#### 3. Target Agent
```json
{
  "agent_type": "domain | archetype | orchestrator",
  "agent_id": "canonical-id from manifest",
  "agent_version": "semver string",
  "prompt_hash": "SHA-256 hash from lock file"
}
```

#### 4. Context Transfer
```json
{
  "request": {
    "type": "query | task | analysis | decision",
    "description": "string",
    "input_data": "object | string",
    "constraints": ["array of constraint strings"],
    "expected_output": "string description"
  },
  "state": {
    "conversation_history": ["array of message objects"],
    "accumulated_context": "object",
    "decisions_made": ["array of decision objects"]
  }
}
```

#### 5. Governance Attestation
```json
{
  "source_agent_verified": true,
  "target_agent_verified": true,
  "composition_valid": true,
  "boundaries_respected": true,
  "audit_trail": "string (audit log reference)"
}
```

## Complete Handoff Example

```json
{
  "handoff_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-11T00:45:02Z",
  "protocol_version": "1.0.0",
  "source_agent": {
    "agent_type": "domain",
    "agent_id": "domain-05-product",
    "agent_version": "1.0.0",
    "prompt_hash": "4ec20c4a9367d26e7ab56ba0d2f56751048cee954433d82725546a5e872a7375"
  },
  "target_agent": {
    "agent_type": "domain",
    "agent_id": "domain-02-analysis",
    "agent_version": "1.0.0",
    "prompt_hash": "e7b34ef33d23d41e67ba23c640b26cbc4179840cc2be1278703e89fd74aefd9c"
  },
  "context": {
    "request": {
      "type": "analysis",
      "description": "Analyze user research data to validate product hypothesis",
      "input_data": {
        "hypothesis": "Users want feature X",
        "data_sources": ["user_interviews.json", "analytics_data.csv"]
      },
      "constraints": [
        "Focus on quantitative validation",
        "Provide confidence intervals"
      ],
      "expected_output": "Statistical analysis with recommendation"
    },
    "state": {
      "conversation_history": [],
      "accumulated_context": {
        "product_context": "Mobile app, B2C, 10k MAU"
      },
      "decisions_made": []
    }
  },
  "governance": {
    "source_agent_verified": true,
    "target_agent_verified": true,
    "composition_valid": true,
    "boundaries_respected": true,
    "audit_trail": "handoff-log-2026-02-11-001.json"
  }
}
```

## Validation Rules

### 1. Agent Verification
- **Source and target agent IDs** must exist in `prompt-manifest.json`
- **Prompt hashes** must match entries in `prompt-lock.json`
- **Agent versions** must be valid semver

### 2. Composition Validation (Archetypes Only)
- If source or target is an archetype, verify composition is valid
- Check that all domain references exist
- Validate composition percentages sum to 100%

### 3. Boundary Enforcement
- Source agent must be handing off within allowed collaboration boundaries
- Target agent must be within scope of request
- Cross-domain requests must follow "Collaboration Boundaries" rules

### 4. Context Integrity
- Request type must be valid: `query`, `task`, `analysis`, `decision`
- All required fields must be present
- Timestamps must be valid ISO 8601

## Handoff Patterns

### Pattern 1: Domain-to-Domain Handoff
Domain atoms can hand off to other domains when:
- The request falls outside the source domain's scope
- The request explicitly requires another domain's capabilities
- The handoff follows defined "Collaboration Boundaries"

**Example:** Content domain hands to Analysis domain for content performance analysis.

### Pattern 2: Archetype-to-Domain Handoff
Archetypes can hand off to constituent domains for:
- Focused domain-specific work
- Delegation of domain-scoped tasks
- Deep-dive analysis within one domain

**Example:** Product Thinker hands to Technical domain for architecture review.

### Pattern 3: Domain-to-Archetype Handoff
Domains can hand off to archetypes when:
- The request requires multi-domain integration
- Cross-domain analysis is needed
- Composite capabilities are required

**Example:** Analysis domain hands to Product Thinker for product strategy synthesis.

### Pattern 4: Orchestrator-Mediated Handoff
The orchestrator facilitates handoffs when:
- Multiple sequential handoffs are needed
- Complex multi-domain workflows are required
- Governance enforcement is critical

## Error Handling

### Invalid Handoff
If any validation fails:
1. Reject the handoff
2. Return error response with specific failure reason
3. Log rejection to audit trail
4. Do not execute target agent

### Hash Mismatch
If prompt hash doesn't match lock file:
1. Immediately reject handoff
2. Flag as potential security issue
3. Require manual verification
4. Block until hashes are reconciled

### Boundary Violation
If handoff violates domain boundaries:
1. Reject with boundary violation error
2. Suggest correct target agent
3. Log violation to audit trail
4. Provide remediation guidance

## Audit Requirements

All handoffs must:
1. Be logged with full context
2. Include governance attestation
3. Record timestamp and handoff ID
4. Store audit trail reference
5. Enable full traceability

## Security Considerations

- **Hash verification is mandatory** - no exceptions
- **Agent IDs must be canonical** - no aliases or shortcuts
- **Timestamps must be authentic** - prevent replay attacks
- **Context data should be validated** - prevent injection
- **Audit trails must be immutable** - append-only logs
