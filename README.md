# AI Portfolio Builder

## 10-Domain Canonical Taxonomy for AI System Prompts

This repository contains a **governed set of domain atoms and archetypes** for building AI assistant capabilities with strict domain boundaries, cryptographic hash verification, and comprehensive governance enforcement.

**Version**: 1.0.0  
**Status**: Enterprise-Grade, Immutable-by-Default, Auditable

## Overview

The taxonomy consists of:
- **10 Domain Atoms**: Fundamental capabilities, each representing one canonical domain
- **4 Archetypes**: Composed assistants that combine multiple domain atoms for specific use cases
- **Governance System**: Hash verification, CI enforcement, and audit logging
- **Runtime Verification**: Cloudflare Worker for dispatch integrity
- **OpenAI Integration**: Custom GPT configurations for all agents

## Quick Start

### For Users
1. **Browse Domains**: See canonical domain definitions below
2. **Choose Agent**: Select domain atom or archetype for your need
3. **Verify Hash**: Check `versions/prompt-lock.json` for current hash
4. **Deploy**: Use prompt with hash verification enabled

### For Developers
1. **Clone Repository**: `git clone https://github.com/kernel-spec/ai-portfolio-builder.git`
2. **Install Dependencies**: `npm install` (optional, for npm scripts)
3. **Review Governance**: Read `protocols/orchestration.rules.md`
4. **Check Manifest**: See `versions/prompt-manifest.json` for all agents
5. **Validate System**: Run `npm run validate:all` to check integrity
6. **Make Changes**: Follow governance rules (see Contributing)

### Validation Tools

The repository includes several validation tools to ensure governance compliance:

- **`git-diff-validator.js`**: Validates changes to versions/, domains/, and archetypes/
  - Usage: `npm run validate:diff` or `node git-diff-validator.js`
  - See [VALIDATOR_GUIDE.md](VALIDATOR_GUIDE.md) for details

- **`validate-system.js`**: System-wide integrity check
  - Usage: `npm run validate:system` or `node validate-system.js`
  - Validates file existence, JSON syntax, and lock file synchronization

- **`meta-validation.js`**: Meta-validator for test suite quality
  - Usage: `npm run validate:meta` or `node meta-validation.js`
  - Assesses validation coverage and test quality

Run all validations: `npm run validate:all`

## Repository Structure

```
/domains/                     # Domain atom system prompts (10 files)
/archetypes/                  # Archetype composition system prompts (4 files)
/versions/                    # Governance and version control
  prompt-manifest.json        # Complete agent metadata
  prompt-lock.json           # SHA-256 hash registry (immutable)
/protocols/                   # Governance protocols
  handoff.schema.md          # Agent handoff protocol
  response.schema.md         # Response format specification
  orchestration.rules.md     # Orchestration and governance rules
  refusal.rules.md           # Refusal patterns and boundaries
/cloudflare-worker/          # Runtime verification worker
  index.js                   # Hash verification dispatcher
  prompt-lock.json          # Lock file copy for worker
  wrangler.toml             # Worker configuration
  dispatcher.contract.md    # API documentation
/openai-custom-gpts/         # OpenAI Custom GPT configurations
  atoms/                     # Domain configs (10 files)
  archetypes/                # Archetype configs (4 files)
  orchestrator/              # Orchestrator config
  README.md                  # GPT setup guide
/.github/workflows/          # CI enforcement
  schema-validation.yml      # JSON schema validation
  version-hash-enforcement.yml   # Hash verification
  forbidden-file-changes.yml     # Protected file monitoring
  archetype-composition-validation.yml   # Composition rules
/CHANGELOG.md               # Version history
/SECURITY.md                # Security policy and vulnerability reporting
```

## Canonical Domains (Non-Negotiable)

### 1. Content Creation
**Focus**: Ideation, creation, editing, and production of content across all formats  
**Key Activities**: Writing, editing, content structure, multimedia content development

### 2. Analysis & Decision Making
**Focus**: Data analysis, critical thinking, problem-solving, and decision support  
**Key Activities**: Data interpretation, option evaluation, risk assessment, decision frameworks

### 3. Project Management & Planning
**Focus**: Planning, organizing, scheduling, tracking, and coordinating projects  
**Key Activities**: Timeline development, resource allocation, progress tracking, methodology application

### 4. Marketing & Growth
**Focus**: Market positioning, customer acquisition, brand development, growth tactics  
**Key Activities**: Marketing strategy, campaign planning, growth experiments, positioning

### 5. Product & Services
**Focus**: Product vision, feature definition, UX design, product strategy  
**Key Activities**: Product roadmaps, requirements, user research, feature prioritization

### 6. Education & Learning
**Focus**: Curriculum design, instructional methods, learning experiences  
**Key Activities**: Course design, learning objectives, pedagogy, assessment design

### 7. Personal Development & Productivity
**Focus**: Individual growth, habit formation, time management, goal-setting  
**Key Activities**: Personal goals, productivity systems, habits, self-improvement

### 8. Business & Strategy
**Focus**: Business models, competitive strategy, organizational planning  
**Key Activities**: Business model design, strategic planning, competitive positioning

### 9. Technical & System Thinking
**Focus**: Technical architecture, system design, engineering practices  
**Key Activities**: Architecture design, technology evaluation, system modeling

### 10. Communication & Presentation
**Focus**: Effective communication, presentation design, public speaking, message delivery  
**Key Activities**: Presentation structure, public speaking, message framing, facilitation

## Archetypes

### Product Thinker
**Composition**: Domain 05 (Product) + Domain 02 (Analysis) + Domain 09 (Technical)  
**Purpose**: Data-informed, technically-feasible product strategy and design  
**Use Cases**: Product strategy, feature definition, product roadmaps, UX design with technical constraints

### Growth Operator
**Composition**: Domain 04 (Marketing) + Domain 02 (Analysis) + Domain 03 (Project Management)  
**Purpose**: Data-driven growth strategy with effective execution  
**Use Cases**: Growth experiments, campaign planning, funnel optimization, scaling tactics

### Learning Designer
**Composition**: Domain 06 (Education) + Domain 01 (Content) + Domain 02 (Analysis)  
**Purpose**: Effective, engaging, and measurable educational experiences  
**Use Cases**: Curriculum design, course development, learning optimization, educational content

### Delivery Planner
**Composition**: Domain 03 (Project Management) + Domain 02 (Analysis) + Domain 09 (Technical)  
**Purpose**: Data-informed, technically-sound project delivery  
**Use Cases**: Technical project planning, delivery coordination, risk management, execution tracking

## Design Principles

### 1. Strict Domain Boundaries
- Each domain atom maps 1:1 to exactly one canonical domain
- Domains do not overlap in scope or responsibilities
- Clear IN SCOPE and OUT OF SCOPE definitions for each domain

### 2. Explicit Composition
- Archetypes explicitly declare which domains they combine
- Composition percentages define relative emphasis (e.g., 50% + 30% + 20%)
- Integration guidelines specify how domains interact

### 3. Collaboration Not Overlap
- Domains collaborate through defined boundaries
- "With Domain X" patterns specify inter-domain interactions
- Domains request capabilities from other domains rather than duplicating them

### 4. Governed System Prompts
- Canonical format for all domain atoms and archetypes
- Consistent structure: Identity, Purpose, Scope, Capabilities, Guidelines, Standards, Constraints
- Clear constraints prevent scope creep

### 5. Design-Time Only
- All prompts are English-only
- Focus on system prompt generation, not runtime behavior
- Repository-ready format for AI assistant configuration

## Usage Guidelines

### Using Domain Atoms
1. Select the single domain that best matches your need
2. Refer to the domain's system prompt file for specific capabilities
3. Stay within the domain's defined boundaries
4. Collaborate with other domains as needed (see "Collaboration Boundaries")

### Using Archetypes
1. Choose an archetype when your need spans multiple domains
2. Understand the archetype's primary and supporting domains
3. Leverage the archetype's integrated capabilities
4. Note the archetype's specific use cases and scenarios

### Creating New Archetypes
1. Identify 2-4 domains needed for the use case
2. Define clear composition percentages (total = 100%)
3. Specify integration patterns between domains
4. Document example scenarios showing domain interaction
5. Follow the canonical archetype system prompt format

## File Format

### Domain Atom System Prompt Structure
```markdown
# Domain XX — [Domain Name]

## Domain Identity
- Canonical Domain
- Atom ID
- Boundary

## Core Purpose
[Description of domain's primary function]

## Scope
### IN SCOPE
[Specific capabilities and activities]

### OUT OF SCOPE
[Explicit exclusions with references to other domains]

## Capabilities
[Numbered list of key capabilities]

## Interaction Guidelines
- When to Engage This Atom
- Collaboration Boundaries
- Response Patterns

## Quality Standards
[Key quality criteria for the domain]

## Constraints
[Hard boundaries and limitations]
```

### Archetype System Prompt Structure
```markdown
# Archetype: [Name]

## Archetype Identity
- Archetype Name
- Archetype ID
- Core Composition

## Purpose
[Description of archetype's integrated function]

## Domain Integration
[For each domain: Role, percentage, specific responsibilities]

## Capabilities
[Integrated capabilities leveraging multiple domains]

## Interaction Patterns
- When to Engage This Archetype
- Collaboration with Other Domains
- Integration Guidelines

## Quality Standards
[Quality criteria across integrated domains]

## Example Scenarios
[Detailed scenarios showing domain interaction]

## Constraints
[Limitations and boundaries]
```

## Governance System

### Immutability and Verification

This system enforces governance through:

1. **Cryptographic Hashing**: SHA-256 hashes for all prompts
2. **Lock File Registry**: Immutable hash registry in `versions/prompt-lock.json`
3. **CI Enforcement**: Automated validation on every PR
4. **Runtime Verification**: Cloudflare Worker verifies before dispatch
5. **Audit Logging**: Complete traceability of all changes

### Core Governance Rules

1. **Hash Verification is Mandatory**: No prompt can be dispatched without verified hash
2. **Domain Boundaries are Strict**: Domains cannot perform other domains' work
3. **Composition Must Sum to 100%**: Archetype percentages must total exactly 100%
4. **Immutability by Default**: Domain definitions require major version to change
5. **Fail Closed**: System refuses rather than approximates when unclear
6. **GitHub is Source of Truth**: Repository is canonical, not UI

### Security

See [SECURITY.md](SECURITY.md) for:
- Vulnerability reporting process
- Security best practices
- Incident response procedures
- Hash verification requirements

## Using This System

### 1. Select Agent

**For Single-Domain Tasks**:
- Use domain atom directly (e.g., `domain-01-content` for writing)

**For Multi-Domain Tasks**:
- Check archetypes first (e.g., `product-thinker` for product strategy)
- Use orchestrator for complex coordination

### 2. Verify Hash

Before using any prompt:
1. Find agent in `versions/prompt-manifest.json`
2. Get hash from `versions/prompt-lock.json`
3. Verify prompt content matches hash
4. Use Cloudflare Worker for runtime verification

### 3. Deploy with Governance

**OpenAI Custom GPTs**:
- Use configs from `openai-custom-gpts/` directory
- Follow setup guide in `openai-custom-gpts/README.md`
- Never modify instructions manually

**Custom Integration**:
- Integrate Cloudflare Worker for hash verification
- Follow protocols in `protocols/` directory
- Implement handoff schema for agent coordination

### 4. Monitor and Audit

- Set up alerts for hash verification failures
- Review audit logs regularly
- Investigate all security flags immediately
- Keep Custom GPTs synchronized with repository

## Contributing

### For Prompt Changes

1. **Modify Prompt File**: Update domain or archetype prompt
2. **Validate Changes**: `npm run validate:diff` to check for hash mismatches
3. **Recalculate Hash**: `sha256sum <file>` (or `shasum -a 256 <file>` on macOS)
4. **Update Lock File**: Update hash in `versions/prompt-lock.json`
5. **Update Manifest**: Increment version if needed
6. **Document Change**: Add entry to `CHANGELOG.md`
7. **Validate Again**: Run `npm run validate:diff` to confirm fixes
8. **Test**: Ensure all CI workflows pass
9. **Submit PR**: Include justification for change

See [VALIDATOR_GUIDE.md](VALIDATOR_GUIDE.md) for detailed validation instructions.

### For New Archetypes

1. **Design Composition**: Select 2-4 domains, sum to 100%
2. **Create Prompt File**: Follow archetype template
3. **Update Manifest**: Add to `versions/prompt-manifest.json`
4. **Calculate Hash**: Add to `versions/prompt-lock.json`
5. **Validate**: Run `npm run validate:diff` to verify composition and hashes
6. **Create GPT Config**: Add to `openai-custom-gpts/archetypes/`
7. **Document**: Update README and CHANGELOG
8. **Validate All**: Ensure all composition and hash validation passes

### Rules for Contributors

1. **Respect Domain Boundaries**: Do not modify canonical domain definitions
2. **Follow Governance**: All changes require hash updates
3. **Maintain Quality**: Meet domain quality standards
4. **Document Everything**: Changes, rationale, and impact
5. **Test Thoroughly**: All CI checks must pass

### What Cannot Be Modified

- Canonical 10-domain taxonomy (immutable)
- Core governance rules (require major version)
- Hash verification requirement (non-negotiable)
- Domain boundary definitions (permanent)

## Architecture

### Design-Time Focus

This repository is **design-time only**:
- ✅ System prompt definitions
- ✅ Governance rules and protocols
- ✅ Hash verification infrastructure
- ✅ CI enforcement
- ❌ Runtime execution logic
- ❌ Model fine-tuning
- ❌ UI or frontend
- ❌ Business workflows

### Integration Points

1. **Prompt Manifest** (`versions/prompt-manifest.json`)
   - Complete metadata for all agents
   - Canonical IDs and versions
   - Archetype compositions

2. **Prompt Lock File** (`versions/prompt-lock.json`)
   - SHA-256 hashes for all prompts
   - Immutable integrity registry
   - Version synchronization

3. **Cloudflare Worker** (`cloudflare-worker/`)
   - Runtime hash verification
   - Dispatch authorization
   - Audit logging

4. **CI Workflows** (`.github/workflows/`)
   - Automated governance enforcement
   - Hash verification on PR
   - Composition validation

5. **Protocols** (`protocols/`)
   - Handoff schema
   - Response format
   - Orchestration rules
   - Refusal patterns

## Design Philosophy

This taxonomy is built on the principle of **composition over complexity**:

- **Atomic**: Each domain is a focused, single-responsibility unit
- **Composable**: Domains combine to create more complex capabilities
- **Governed**: Strict boundaries prevent overlap and confusion
- **Immutable**: Changes are controlled and auditable
- **Secure**: Cryptographic verification ensures integrity
- **Scalable**: New archetypes can be created without modifying domains
- **Clear**: Explicit scopes and constraints eliminate ambiguity
- **Traceable**: Full audit trail for all changes

## Version History

Current version: **1.0.0**

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.

## License

This taxonomy is designed for AI system prompt development and is provided as-is for use in AI assistant configuration.

## Support

- **Issues**: GitHub Issues for bugs and feature requests
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting
- **Documentation**: This README and protocol files
- **Discussions**: GitHub Discussions for questions