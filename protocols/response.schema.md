# Response Schema

## Purpose
This schema defines the canonical structure for responses from AI agents in the governed prompt system. All agent responses must follow this structure to ensure consistency, traceability, and governance compliance.

## Schema Version
**Version:** 1.0.0  
**Last Updated:** 2026-02-11

## Response Structure

### Required Fields

#### 1. Response Metadata
```json
{
  "response_id": "string (UUID v4)",
  "timestamp": "ISO 8601 timestamp",
  "protocol_version": "1.0.0"
}
```

#### 2. Agent Identity
```json
{
  "agent_type": "domain | archetype | orchestrator",
  "agent_id": "canonical-id from manifest",
  "agent_version": "semver string",
  "prompt_hash": "SHA-256 hash from lock file"
}
```

#### 3. Response Content
```json
{
  "status": "success | partial | error | refused",
  "content": {
    "type": "text | structured | mixed",
    "data": "string | object",
    "format": "markdown | json | plain"
  },
  "confidence": "high | medium | low | not_applicable"
}
```

#### 4. Request Context
```json
{
  "request_id": "UUID v4 (if from handoff)",
  "request_type": "query | task | analysis | decision",
  "request_summary": "string"
}
```

#### 5. Governance Attestation
```json
{
  "within_scope": true,
  "boundaries_respected": true,
  "quality_standards_met": true,
  "constraints_followed": true
}
```

#### 6. Next Actions (Optional)
```json
{
  "suggested_handoffs": [
    {
      "target_agent": "canonical-id",
      "reason": "string",
      "required": true
    }
  ],
  "followup_questions": ["array of strings"],
  "additional_context_needed": ["array of strings"]
}
```

## Complete Response Example

```json
{
  "response_id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2026-02-11T00:45:15Z",
  "protocol_version": "1.0.0",
  "agent": {
    "agent_type": "domain",
    "agent_id": "domain-02-analysis",
    "agent_version": "1.0.0",
    "prompt_hash": "e7b34ef33d23d41e67ba23c640b26cbc4179840cc2be1278703e89fd74aefd9c"
  },
  "response": {
    "status": "success",
    "content": {
      "type": "structured",
      "data": {
        "analysis_summary": "User research validates hypothesis with 85% confidence",
        "key_findings": [
          "78% of interviewed users expressed need for feature X",
          "Analytics show 3x engagement when similar features present",
          "Competitive analysis shows feature X as differentiator"
        ],
        "recommendation": "Proceed with feature X development",
        "confidence_interval": "80-90%",
        "risk_factors": ["Sample size limited to 100 users", "Regional bias in data"]
      },
      "format": "json"
    },
    "confidence": "high"
  },
  "request_context": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "request_type": "analysis",
    "request_summary": "Validate product hypothesis with user research data"
  },
  "governance": {
    "within_scope": true,
    "boundaries_respected": true,
    "quality_standards_met": true,
    "constraints_followed": true
  },
  "next_actions": {
    "suggested_handoffs": [
      {
        "target_agent": "domain-05-product",
        "reason": "Ready for feature specification based on validated hypothesis",
        "required": false
      }
    ],
    "followup_questions": [
      "Should we expand user research to additional regions?",
      "What is the target timeline for feature X?"
    ],
    "additional_context_needed": []
  }
}
```

## Response Status Types

### 1. Success
- Request was completed within agent's scope
- Quality standards were met
- Output is complete and actionable

### 2. Partial
- Request was partially completed
- Some aspects fell outside scope
- Handoff required for completion
- Partial output is still valuable

### 3. Error
- Technical error occurred during processing
- Agent could not complete request
- Error details provided
- Retry may be appropriate

### 4. Refused
- Request violated domain boundaries
- Request was out of scope
- Quality standards could not be met
- Governance rules prevented response
- See refusal.rules.md for details

## Content Types

### Text Response
Simple text-based response in specified format (markdown, plain text).

```json
{
  "type": "text",
  "data": "This is a text response in markdown format...",
  "format": "markdown"
}
```

### Structured Response
Structured data response with typed fields.

```json
{
  "type": "structured",
  "data": {
    "field1": "value1",
    "field2": ["array", "of", "values"],
    "nested": {"key": "value"}
  },
  "format": "json"
}
```

### Mixed Response
Combination of text and structured data.

```json
{
  "type": "mixed",
  "data": {
    "narrative": "Text explanation...",
    "data": {"structured": "data"},
    "visualization": "chart_url or data"
  },
  "format": "json"
}
```

## Confidence Levels

### High Confidence
- Agent has complete information
- Request is squarely within domain expertise
- Quality standards easily met
- Output is reliable and actionable

### Medium Confidence
- Some information gaps exist
- Request is at edge of domain scope
- Additional validation recommended
- Output is directional but not definitive

### Low Confidence
- Significant information gaps
- Request may be outside optimal scope
- High uncertainty in output
- Additional expert review required

### Not Applicable
- Confidence rating doesn't apply to request type
- Example: procedural tasks, simple queries

## Governance Attestation Details

### within_scope
- Response content is within agent's defined domain
- No scope creep occurred
- Agent stayed within boundaries

### boundaries_respected
- Agent did not perform activities from other domains
- Collaboration patterns were followed
- Cross-domain coordination was proper

### quality_standards_met
- Response meets agent's quality criteria
- Standards from system prompt were applied
- Output is production-grade

### constraints_followed
- Agent adhered to all constraints
- No prohibited actions taken
- Hard boundaries respected

## Validation Rules

### Response Integrity
1. All required fields must be present
2. Agent ID must exist in manifest
3. Prompt hash must match lock file
4. Timestamps must be valid ISO 8601
5. Status must be valid enum value

### Content Validation
1. Content type must match data structure
2. Format must be appropriate for type
3. Data must be non-empty for success status
4. Structured data must be valid JSON

### Governance Validation
1. All governance flags must be boolean
2. If any governance flag is false, explanation required
3. Audit trail must be referenced

## Error Response Format

```json
{
  "response_id": "UUID",
  "timestamp": "ISO 8601",
  "protocol_version": "1.0.0",
  "agent": { "..." },
  "response": {
    "status": "error",
    "content": {
      "type": "structured",
      "data": {
        "error_code": "ERR_CODE",
        "error_message": "Human readable error",
        "error_details": "Technical details",
        "recovery_suggestion": "What to do next"
      },
      "format": "json"
    },
    "confidence": "not_applicable"
  },
  "request_context": { "..." },
  "governance": {
    "within_scope": true,
    "boundaries_respected": true,
    "quality_standards_met": false,
    "constraints_followed": true
  }
}
```

## Refusal Response Format

```json
{
  "response_id": "UUID",
  "timestamp": "ISO 8601",
  "protocol_version": "1.0.0",
  "agent": { "..." },
  "response": {
    "status": "refused",
    "content": {
      "type": "structured",
      "data": {
        "refusal_reason": "OUT_OF_SCOPE | BOUNDARY_VIOLATION | QUALITY_CANNOT_BE_MET",
        "explanation": "Detailed explanation",
        "suggested_agent": "canonical-id of correct agent",
        "governance_rule": "Reference to specific rule"
      },
      "format": "json"
    },
    "confidence": "high"
  },
  "request_context": { "..." },
  "governance": {
    "within_scope": false,
    "boundaries_respected": true,
    "quality_standards_met": false,
    "constraints_followed": true
  },
  "next_actions": {
    "suggested_handoffs": [
      {
        "target_agent": "correct-agent-id",
        "reason": "This request requires domain X capabilities",
        "required": true
      }
    ]
  }
}
```

## Audit Requirements

All responses must:
1. Be logged with full content
2. Include governance attestation
3. Record agent identity and hash
4. Store request-response linkage
5. Enable full audit trail

## Security Considerations

- **Hash verification is mandatory** for all responses
- **Agent IDs must be canonical** and verified
- **Timestamps must be authentic** and monotonic
- **Content should be sanitized** to prevent injection
- **Audit logs must be immutable** and append-only
- **Governance attestations must be truthful** and verifiable
