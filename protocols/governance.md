# Orchestration Rules

## Purpose
This document defines the rules and patterns for orchestrating multi-agent interactions in the governed prompt system. The orchestrator ensures proper agent selection, handoff coordination, and governance enforcement.

## Version
**Version:** 1.0.0  
**Last Updated:** 2026-02-11

## Core Principles

### 1. Single Source of Truth
- GitHub repository is the canonical source
- prompt-lock.json is the immutable hash registry
- prompt-manifest.json is the definitive agent catalog
- OpenAI UI is not authoritative

### 2. Fail Closed
- When in doubt, refuse and request clarification
- Do not approximate or substitute agents
- Enforce strict governance over convenience
- Reject invalid handoffs immediately

### 3. Explicit Over Implicit
- All agent selections must be explicit
- All handoffs must follow schema
- All boundaries must be declared
- No implicit scope expansion

### 4. Immutable by Default
- Domain definitions cannot be modified
- Prompt hashes must match lock file
- Version changes require manifest update
- Governance rules are non-negotiable

## Orchestrator Responsibilities

### 1. Agent Selection
The orchestrator determines which agent(s) should handle a request based on:

**Selection Criteria:**
- Request type and scope
- Required capabilities
- Domain boundaries
- Composition requirements

**Selection Process:**
1. Parse and understand the request
2. Identify required domain capabilities
3. Check if single domain suffices
4. If multiple domains needed, select appropriate archetype
5. Validate agent exists in manifest
6. Verify prompt hash in lock file
7. Initiate agent with verified identity

### 2. Handoff Coordination
The orchestrator manages transitions between agents:

**Coordination Steps:**
1. Validate source agent completion
2. Determine next agent needed
3. Prepare handoff context
4. Verify boundary compliance
5. Execute handoff following schema
6. Monitor target agent execution
7. Handle response integration

### 3. Governance Enforcement
The orchestrator enforces all governance rules:

**Enforcement Actions:**
- Validate agent identities and hashes
- Check domain boundary compliance
- Verify composition rules for archetypes
- Ensure quality standards are met
- Audit all agent interactions
- Block non-compliant operations

### 4. Context Management
The orchestrator maintains conversation state:

**State Management:**
- Track conversation history
- Accumulate context across agents
- Preserve decisions and rationale
- Maintain audit trail
- Provide context in handoffs

## Agent Selection Rules

### Rule 1: Single Domain Requests
If request falls within ONE domain's scope:
- Select that domain atom directly
- Do not use archetype
- Do not involve multiple domains

**Example:** "Write a blog post" → domain-01-content

### Rule 2: Multi-Domain Requests  
If request requires 2+ domains:
- Check for matching archetype first
- If archetype exists, use it
- If no archetype, coordinate multiple domains
- Follow composition percentages

**Example:** "Develop product roadmap with data analysis" → product-thinker archetype

### Rule 3: Unclear Requests
If request scope is ambiguous:
- Ask clarifying questions
- Do not guess or assume
- Present domain/archetype options
- Let user specify intent

### Rule 4: Out-of-Scope Requests
If request is outside all domains:
- Refuse politely
- Explain what is in scope
- Suggest alternatives if appropriate
- Do not attempt to fulfill

## Handoff Patterns

### Pattern 1: Sequential Handoff
Domain A completes work, hands to Domain B for next step.

```
Request → Domain A → Output A → Domain B → Output B → Final Response
```

**Governance:**
- Each handoff follows handoff.schema.md
- Context preserved across handoffs
- Audit trail maintained
- Boundary validation at each step

**Example Flow:**
1. Content domain creates draft
2. Analysis domain evaluates performance
3. Final recommendation returned

### Pattern 2: Parallel Consultation
Primary domain consults multiple domains simultaneously.

```
Request → Primary Domain
            ├→ Consult Domain B → Input
            ├→ Consult Domain C → Input
            └→ Integrate → Final Response
```

**Governance:**
- Primary domain coordinates
- Consultations are read-only
- Primary domain owns integration
- Boundaries respected

**Example Flow:**
1. Product domain leads feature design
2. Simultaneously consults Analysis and Technical domains
3. Product domain integrates feedback
4. Product domain delivers final spec

### Pattern 3: Archetype Delegation
Archetype delegates to constituent domain for focused work.

```
Request → Archetype → Assess → Delegate to Domain → Receive → Integrate
```

**Governance:**
- Archetype validates delegation within composition
- Domain performs focused work
- Archetype integrates result
- Composition percentages guide emphasis

**Example Flow:**
1. Product Thinker archetype receives feature request
2. Delegates technical feasibility to Technical domain
3. Technical domain returns assessment
4. Product Thinker integrates into decision

### Pattern 4: Escalation to Archetype
Domain recognizes need for multi-domain integration.

```
Request → Domain → Recognize Multi-Domain Need → Escalate to Archetype
```

**Governance:**
- Domain must recognize its limits
- Escalation follows handoff schema
- Archetype takes over coordination
- Domain may remain involved

**Example Flow:**
1. Content domain starts project
2. Recognizes need for technical and project management
3. Escalates to Delivery Planner archetype
4. Archetype coordinates all domains

## Composition Validation Rules

### Rule 1: Archetype Composition Must Be Valid
For any archetype:
- All referenced domains must exist in manifest
- Composition percentages must sum to 100%
- Minimum 2 domains, maximum 4 domains
- Primary domain (highest %) must be relevant to purpose

### Rule 2: Domain Percentages Guide Emphasis
- Primary domain (40-60%): Leads the work
- Supporting domains (20-35%): Provide input
- Minor domains (10-20%): Consulted as needed

### Rule 3: Composition Is Immutable
- Archetype composition cannot change at runtime
- Adding/removing domains requires new archetype
- Percentage changes require version update
- Composition is defined at design time

### Rule 4: Composition Enables, Doesn't Expand
- Archetype cannot do what constituent domains cannot
- Composition combines, doesn't create new capabilities
- Boundaries of constituent domains still apply
- Integration is additive, not transformative

## Boundary Enforcement Rules

### Rule 1: Domains Cannot Do Others' Work
A domain must refuse work that is in another domain's scope, even if:
- The user explicitly requests it
- It seems efficient
- The domain has some knowledge
- The boundary is close

**Action:** Refuse and suggest correct domain.

### Rule 2: Collaboration ≠ Overlap
Domains can collaborate, but:
- Each does only its own work
- Collaboration is explicit in prompts
- Information flows through handoffs
- Responsibilities don't blur

### Rule 3: Archetypes Follow Constituent Boundaries
Archetypes can:
- Coordinate constituent domains
- Integrate outputs
- Make cross-domain decisions

Archetypes cannot:
- Do work outside constituent domains
- Expand domain scopes
- Create new capabilities

### Rule 4: Orchestrator Doesn't Do Domain Work
The orchestrator:
- Selects and coordinates agents
- Enforces governance
- Manages context

The orchestrator does not:
- Perform domain-specific work
- Substitute for missing domains
- Approximate agent capabilities

## Quality Enforcement Rules

### Rule 1: Quality Standards Are Mandatory
Each agent must meet its quality standards from system prompt:
- Clarity, engagement, authenticity (Content)
- Rigor, accuracy, objectivity (Analysis)
- Feasibility, completeness, clarity (Project Management)
- Measurability, data-driven, ROI-focused (Marketing)
- User-centric, feasible, strategic (Product)
- Effective, measurable, engaging (Education)
- Actionable, sustainable, personalized (Personal)
- Viable, competitive, strategic (Business)
- Sound, scalable, maintainable (Technical)
- Clear, engaging, appropriate (Communication)

**Action:** If quality cannot be met, refuse with explanation.

### Rule 2: Partial Success Is Acceptable
If agent can partially fulfill request within scope:
- Deliver partial result
- Clearly indicate what's missing
- Suggest handoff for remainder
- Maintain quality for delivered portion

### Rule 3: No Quality Compromises for Convenience
Do not:
- Lower standards to complete request
- Approximate outside scope
- Deliver substandard work
- Sacrifice quality for speed

## Error Handling Rules

### Rule 1: Hash Mismatch = Hard Stop
If prompt hash doesn't match lock file:
- Immediately halt operation
- Flag as security issue
- Require manual verification
- Do not proceed under any circumstance

### Rule 2: Invalid Agent = Refuse
If requested agent doesn't exist in manifest:
- Refuse request
- List available agents
- Suggest closest match
- Do not create or approximate

### Rule 3: Boundary Violation = Refuse and Redirect
If request violates domain boundaries:
- Refuse with clear explanation
- Identify correct agent
- Offer to hand off
- Document violation in audit

### Rule 4: Composition Invalid = Reject
If archetype composition validation fails:
- Reject archetype use
- Explain violation
- Suggest valid alternatives
- Do not proceed with invalid composition

## Audit and Logging Rules

### Rule 1: All Interactions Are Logged
Every agent interaction must log:
- Agent identity and hash
- Request details
- Response summary
- Governance attestations
- Handoffs executed
- Timestamp and IDs

### Rule 2: Audit Trail Is Immutable
Audit logs must:
- Be append-only
- Include cryptographic integrity
- Link related events
- Enable full traceability
- Persist indefinitely

### Rule 3: Governance Failures Are Escalated
Any governance failure must:
- Be logged with full context
- Be flagged for review
- Block further action
- Trigger alert

## Version Management Rules

### Rule 1: Version Changes Require Manifest Update
Any prompt content change requires:
- Hash recalculation
- Lock file update
- Manifest version increment
- Changelog entry

### Rule 2: Breaking Changes Require Major Version
Changes that affect:
- Domain scope boundaries
- Collaboration patterns
- Quality standards
- Constraints

Must increment major version (1.x.x → 2.0.0).

### Rule 3: Non-Breaking Changes Require Minor Version
Changes that:
- Clarify existing scope
- Improve quality
- Add capabilities within scope
- Refine guidelines

Must increment minor version (x.1.x → x.2.0).

### Rule 4: Lock File Is Always Updated
Every prompt change must:
- Update hash in lock file
- Update version in lock file
- Update manifest version
- Maintain lock file integrity

## Security Rules

### Rule 1: Verify Before Execute
Before executing any agent:
- Verify agent ID in manifest
- Verify hash in lock file
- Verify composition if archetype
- Verify boundaries for request

### Rule 2: Trust the Lock File
- Lock file is source of truth for hashes
- Runtime verification is mandatory
- Mismatches are security failures
- No execution without verification

### Rule 3: Immutability Is Security
- Immutable prompts prevent tampering
- Hash changes are visible
- Version control provides audit
- Governance enforcement is automated

### Rule 4: Fail Secure
When in doubt:
- Refuse rather than approximate
- Verify rather than trust
- Enforce rather than suggest
- Log rather than ignore

## Escalation Procedures

### When to Escalate to Human
- Governance rule conflict
- Hash verification failure
- Repeated boundary violations
- Security concerns
- Ambiguous requirements
- Quality cannot be met

### How to Escalate
1. Halt current operation
2. Document issue fully
3. Provide context and logs
4. Suggest resolution options
5. Wait for human decision
6. Do not proceed until resolved

## Exceptions

**There are no exceptions to:**
- Hash verification
- Domain boundaries
- Immutability rules
- Audit requirements
- Security rules

**Limited exceptions may apply to:**
- Quality standards (with documentation)
- Response timing (with notification)
- Context limitations (with alternatives)

All exceptions must be logged and justified.
