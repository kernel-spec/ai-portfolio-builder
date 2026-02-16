# Changelog

All notable changes to the AI Portfolio Builder governed prompt system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-11

### Added

#### Core Governance Infrastructure
- **Manifest System**: `versions/prompt-manifest.json` with complete metadata for all 10 domains and 4 archetypes
- **Lock File**: `versions/prompt-lock.json` with SHA-256 hashes for immutable prompt verification
- **Protocol Schemas**: Four comprehensive protocol documents defining system behavior
  - `protocols/handoff.schema.md` - Agent handoff protocol
  - `protocols/response.schema.md` - Response format specification
  - `protocols/orchestration.rules.md` - Orchestration and governance rules
  - `protocols/refusal.rules.md` - Refusal patterns and boundary enforcement

#### CI/CD Enforcement
- **Schema Validation**: `.github/workflows/schema-validation.yml`
  - Validates JSON syntax and structure
  - Enforces 10 domains, 4 archetypes count
  - Verifies archetype compositions sum to 100%
  - Validates canonical domain IDs
- **Hash Enforcement**: `.github/workflows/version-hash-enforcement.yml`
  - Verifies prompt file hashes match lock file
  - Blocks PRs with hash mismatches
  - Ensures all prompts have lock entries
  - Validates lock/manifest version sync
- **Protected Files**: `.github/workflows/forbidden-file-changes.yml`
  - Monitors domain and archetype modifications
  - Ensures hash updates accompany prompt changes
  - Flags protocol modifications for review
  - Prevents unauthorized lock file changes
- **Composition Validation**: `.github/workflows/archetype-composition-validation.yml`
  - Validates archetype composition percentages
  - Verifies domain references exist
  - Checks primary domain emphasis (40-60%)
  - Enforces archetype-specific composition rules

#### Cloudflare Worker Infrastructure
- **Dispatcher Worker**: `cloudflare-worker/index.js`
  - Hash verification before prompt dispatch
  - Security enforcement for prompt integrity
  - Audit logging for all verification requests
  - CORS support for browser clients
- **Worker Configuration**: `cloudflare-worker/wrangler.toml`
  - Production and staging environments
  - Resource limits and observability
- **Dispatcher Contract**: `cloudflare-worker/dispatcher.contract.md`
  - Complete API documentation
  - Integration patterns and examples
  - Security considerations
  - Monitoring and troubleshooting guide

#### OpenAI Custom GPT Configurations
- **Domain Atom Configs**: 10 configuration files in `openai-custom-gpts/atoms/`
  - One for each canonical domain
  - Includes governance metadata and hash references
  - Read-only, immutable by design
- **Archetype Configs**: 4 configuration files in `openai-custom-gpts/archetypes/`
  - Product Thinker, Growth Operator, Learning Designer, Delivery Planner
  - Composition rules embedded
  - References to constituent domains
- **Orchestrator Config**: `openai-custom-gpts/orchestrator/orchestrator.gpt.json`
  - Master coordinator configuration
  - Complete orchestration instructions
  - Governance enforcement logic
- **GPT Documentation**: `openai-custom-gpts/README.md`
  - Complete guide for creating and managing Custom GPTs
  - Governance rules and verification checklist
  - Update procedures and troubleshooting

#### Documentation
- **Security Policy**: `SECURITY.md`
  - Hash verification requirements
  - Vulnerability reporting process
  - Security best practices
  - Incident response procedures
- **Enhanced README**: Updated main documentation
  - Governance system overview
  - Quick start guide
  - Architecture documentation
  - Contributing guidelines

### Initial State
- **10 Domain Atoms**: All domain system prompts versioned as 1.0.0
  1. Content Creation
  2. Analysis & Decision Making
  3. Project Management & Planning
  4. Marketing & Growth
  5. Product & Services
  6. Education & Learning
  7. Personal Development & Productivity
  8. Business & Strategy
  9. Technical & System Thinking
  10. Communication & Presentation

- **4 Archetypes**: All archetype system prompts versioned as 1.0.0
  1. Product Thinker (Product 50% + Analysis 30% + Technical 20%)
  2. Growth Operator (Marketing 50% + Analysis 30% + Project Management 20%)
  3. Learning Designer (Education 50% + Content 30% + Analysis 20%)
  4. Delivery Planner (Project Management 50% + Analysis 30% + Technical 20%)

### Governance Rules Established
- **Immutability by Default**: Domain definitions cannot be modified without major version change
- **Hash Verification Required**: All prompt dispatches must verify SHA-256 hash
- **Boundary Enforcement**: Domains cannot perform work outside their scope
- **Composition Rules**: Archetypes must sum to 100%, include 2-4 domains, have 40-60% primary
- **Fail Closed**: System refuses rather than approximates when unclear
- **GitHub as Source of Truth**: Repository is canonical, not UI or external systems

### Security Measures
- **Cryptographic Hashing**: SHA-256 for all prompt content
- **Audit Logging**: All handoffs, verifications, and refusals logged
- **Access Control**: CI workflows enforce governance automatically
- **Immutable Lock File**: Changes require corresponding prompt updates
- **Security Flags**: Hash mismatches trigger security alerts

## [Unreleased]

### Planned
- Runtime execution framework (out of scope for 1.0.0 - design-time only)
- Extended audit log storage and query system
- Additional archetypes based on usage patterns
- Integration with additional LLM providers
- Advanced monitoring and alerting dashboards

## [1.1.0] - 2026-02-16

### Changed

#### Production Release Stabilization
- **Hybrid Governance Model**: Implemented hybrid governance with abstracted UI layer, hard attestation in worker layer, and strict validation in CI layer
- **Worker Hard Attestation**: Cloudflare Worker now performs runtime attestation with immutability enforcement
- **iOS Custom GPT Compatibility**: Enhanced compatibility for Custom GPTs on iOS devices
- **Lockfile v2**: Updated to lockfile version 2 with enhanced integrity validation
- **Production-Ready Worker**: Updated worker to only accept `agent_id` and `request_payload` (no prompt_hash from UI)
- **OpenAPI 3.1.0 Schema**: Added comprehensive OpenAPI specification for dispatch API endpoints
- **Fail-Closed Security**: Worker fails closed if `integrity.immutable !== true`

#### API Changes
- Worker `/health` endpoint now returns minimal response: `{ version, prompts_count }`
- Worker `/dispatch` endpoint returns only `{ response }` for successful dispatches
- All error responses now return JSON with proper error codes (400, 403, 500)
- Removed prompt_hash from UI dispatch interface (worker performs attestation internally)

#### Governance Updates
- Added `total_prompts: 14` to manifest taxonomy section
- Synchronized `cloudflare-worker/prompt-lock.json` to be byte-identical with `versions/prompt-lock.json`
- Enhanced security with attestation_required_for_production_dispatch flag

### Security
- Worker now validates lockfile integrity before processing any requests
- Enhanced fail-closed behavior for unknown agents (403 responses)
- Runtime attestation enforced at worker layer

## [Unreleased]

### Planned
- Runtime execution framework (out of scope for 1.0.0 - design-time only)
- Extended audit log storage and query system
- Additional archetypes based on usage patterns
- Integration with additional LLM providers
- Advanced monitoring and alerting dashboards

## Version Policy

### Major Version (X.0.0)
Increment when:
- Domain scope boundaries change
- Governance rules change
- Breaking changes to protocols or schemas
- Composition rules change
- Security model changes

### Minor Version (x.X.0)
Increment when:
- New archetypes added
- Non-breaking protocol enhancements
- New governance features added
- Quality standards refined
- Documentation improvements

### Patch Version (x.x.X)
Increment when:
- Bug fixes in CI workflows
- Typo corrections in prompts
- Documentation clarifications
- Minor schema refinements
- Non-functional improvements

## Migration Guide

### From Pre-1.0 (If Applicable)
This is the initial release. No migration needed.

### Future Migrations
When upgrading versions:
1. Review CHANGELOG for breaking changes
2. Update all prompt hashes in lock file
3. Re-verify all Custom GPT configurations
4. Update Cloudflare Worker with new lock file
5. Run all CI workflows to verify compliance
6. Update any custom integrations

## Deprecation Policy

### What Can Be Deprecated
- Specific archetypes (if usage is low)
- Optional protocol features
- Non-critical governance rules
- Auxiliary tooling

### What Cannot Be Deprecated
- Domain atoms (canonical 10 domains are permanent)
- Core governance rules (immutability, hash verification, boundaries)
- Core protocols (handoff, response schemas)
- Security mechanisms

### Deprecation Process
1. Announce deprecation in CHANGELOG (1 minor version ahead)
2. Mark as deprecated in documentation
3. Provide migration path to replacement
4. Remove in next major version
5. Update all references

## Support

### Version Support
- **Latest Major**: Full support, active development
- **Previous Major**: Security fixes only (6 months)
- **Older Versions**: Unsupported, upgrade recommended

### Getting Help
- Issues: GitHub Issues in repository
- Security: See SECURITY.md for reporting
- Documentation: README.md and protocol files
- Community: GitHub Discussions

## Attribution

This taxonomy and governance system is designed and maintained by the AI Portfolio Builder project.

Contributions follow the governance rules defined in this release.

---

**Note**: This changelog documents the governed prompt system. The system is design-time focused and does not include runtime execution logic, model fine-tuning, or UI components.
