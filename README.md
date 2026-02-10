# AI Portfolio Builder

## 10-Domain Canonical Taxonomy for AI System Prompts

This repository contains a governed set of domain atoms and archetypes for building AI assistant capabilities with strict domain boundaries and clear composition rules.

## Overview

The taxonomy consists of:
- **10 Domain Atoms**: Fundamental capabilities, each representing one canonical domain
- **Archetypes**: Composed assistants that combine multiple domain atoms for specific use cases

## Repository Structure

```
/domains/                     # Domain atom system prompts
  domain-01-content.system.prompt.md
  domain-02-analysis.system.prompt.md
  domain-03-project-management.system.prompt.md
  domain-04-marketing.system.prompt.md
  domain-05-product.system.prompt.md
  domain-06-education.system.prompt.md
  domain-07-personal.system.prompt.md
  domain-08-business.system.prompt.md
  domain-09-technical.system.prompt.md
  domain-10-communication.system.prompt.md

/archetypes/                  # Archetype composition system prompts
  product-thinker.system.prompt.md
  growth-operator.system.prompt.md
  learning-designer.system.prompt.md
  delivery-planner.system.prompt.md
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

## Contributing

When extending this taxonomy:

1. **Respect Domain Boundaries**: Do not modify canonical domain definitions
2. **Create Archetypes, Not Hybrids**: Compose existing domains rather than creating overlapping domains
3. **Follow Formats**: Use the canonical system prompt structures
4. **Document Integration**: Clearly specify how domains interact in archetypes
5. **Provide Examples**: Include scenario examples for archetypes

## Design Philosophy

This taxonomy is built on the principle of **composition over complexity**:

- **Atomic**: Each domain is a focused, single-responsibility unit
- **Composable**: Domains combine to create more complex capabilities
- **Governed**: Strict boundaries prevent overlap and confusion
- **Scalable**: New archetypes can be created without modifying domains
- **Clear**: Explicit scopes and constraints eliminate ambiguity

## License

This taxonomy is designed for AI system prompt development and is provided as-is for use in AI assistant configuration.