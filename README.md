# AI Portfolio Builder

## 10-Domain Canonical Taxonomy for AI System Prompts

This repository contains a **governed set of domain atoms and archetypes** for building AI assistant capabilities with strict domain boundaries, cryptographic hash verification, and production-grade governance enforcement.

**Version**: 1.1.0  
**Status**: Enterprise-Grade, Hybrid Governance, Production-Ready

---

## Overview

The taxonomy consists of:

- **10 Domain Atoms** — Fundamental, single-responsibility canonical domains  
- **4 Archetypes** — Explicit multi-domain compositions  
- **Hybrid Governance System** — CI validation + runtime attestation  
- **Cloudflare Worker Runtime** — Production dispatch integrity enforcement  
- **OpenAI Integration** — Custom GPT configurations for all agents  

This system is designed to be:

- Atomic  
- Composable  
- Immutable-by-default  
- Cryptographically verifiable  
- Fail-closed secure  

---

# Hybrid Governance Model (v1.1.0)

Version 1.1.0 introduces **production-ready hybrid governance**.

## Attestation Model

### Before (v1.0.0)
Client provided:

agent_id + prompt_hash + request_payload

### After (v1.1.0)
Client provides:

agent_id + request_payload

Worker performs **internal hash resolution and attestation** using `prompt-lock.json`.

---

## Fail-Closed Security Behavior

- Unknown agent → **403**
- Integrity failure → **500**
- Invalid JSON → **400**
- Success response:

```json
{ "response": "..." }

(No metadata leakage)

⸻

Enforcement Layers

1️⃣ CI Layer — Strict Validation
	•	JSON schema validation
	•	Domain count must equal 10
	•	Archetype count must equal 4
	•	Composition must sum to 100%
	•	Manifest ↔ lockfile version consistency
	•	Hash enforcement on PR

2️⃣ Lockfile Integrity Layer
	•	SHA-256 hash registry
	•	Immutable integrity flag
	•	Byte-identical synchronization with worker copy
	•	No direct lock manipulation without prompt change

3️⃣ Runtime Attestation Layer
	•	Worker resolves canonical hash internally
	•	No client-supplied hash allowed
	•	Fail-closed dispatch model
	•	GitHub repository remains source of truth

⸻

Repository Structure

/domains/                     # Domain atom system prompts (10)
/archetypes/                  # Archetype system prompts (4)
/versions/
  prompt-manifest.json        # Canonical metadata registry
  prompt-lock.json            # SHA-256 hash registry
/protocols/                   # Governance and orchestration rules
/cloudflare-worker/
  index.js                    # Runtime attestation dispatcher
  prompt-lock.json            # Byte-identical lockfile copy
  wrangler.toml               # Worker configuration
/.github/workflows/           # CI governance enforcement
/CHANGELOG.md
/SECURITY.md


⸻

Canonical Domains (Immutable)
	1.	Content Creation
	2.	Analysis & Decision Making
	3.	Project Management & Planning
	4.	Marketing & Growth
	5.	Product & Services
	6.	Education & Learning
	7.	Personal Development & Productivity
	8.	Business & Strategy
	9.	Technical & System Thinking
	10.	Communication & Presentation

Each domain:
	•	Has strict IN / OUT scope
	•	Cannot overlap responsibilities
	•	Cannot expand without governance review
	•	Requires hash update on any change

⸻

Archetypes

Product Thinker

Product (05) + Analysis (02) + Technical (09)

Growth Operator

Marketing (04) + Analysis (02) + Project Management (03)

Learning Designer

Education (06) + Content (01) + Analysis (02)

Delivery Planner

Project Management (03) + Analysis (02) + Technical (09)

All archetypes:
	•	Combine 2–4 domains
	•	Must sum composition to exactly 100%
	•	Cannot bypass domain boundaries

⸻

Governance System

Core Rules
	1.	Hash verification is mandatory
	2.	Domain boundaries are non-negotiable
	3.	Archetype composition must equal 100%
	4.	Manifest and lockfile versions must match
	5.	Fail-closed behavior required
	6.	GitHub is canonical source of truth

⸻

Immutability Model
	•	Domains require major version change for structural modification
	•	Archetypes require composition validation
	•	Lockfile is immutable unless hash changes
	•	Worker must remain byte-identical with canonical lockfile

⸻

Architecture (Hybrid Production Model)

This repository governs:
	•	Design-time system prompts
	•	Manifest and lockfile integrity
	•	Runtime verification logic
	•	CI enforcement rules

It does not contain:
	•	Business workflows
	•	Application UI
	•	Model fine-tuning
	•	Non-governed prompt logic

⸻

Usage

Using a Domain
	1.	Select domain atom
	2.	Verify hash in prompt-lock.json
	3.	Dispatch via worker
	4.	Monitor for integrity validation

Using an Archetype
	1.	Confirm composition in manifest
	2.	Verify lockfile entry
	3.	Use worker dispatch endpoint
	4.	Review audit logs

⸻

Contributing

For any prompt change:
	1.	Modify prompt file
	2.	Recalculate SHA-256
	3.	Update prompt-lock.json
	4.	Ensure manifest consistency
	5.	Update CHANGELOG
	6.	Pass all CI checks
	7.	Submit PR with justification

⸻

Security

See SECURITY.md for:
	•	Vulnerability reporting
	•	Incident handling
	•	Hash verification policy
	•	Runtime enforcement model

⸻

Version History

1.1.0 — Hybrid Governance Production Release
	•	Introduced internal worker attestation
	•	Removed client-supplied hash model
	•	Enforced strict CI validation
	•	Manifest-lockfile synchronization
	•	Fail-closed runtime security
	•	Production-ready governance hardening

Current version: 1.1.0

⸻

Design Philosophy

This system is built on:
	•	Atomic domains
	•	Explicit composition
	•	Cryptographic verification
	•	Immutable governance
	•	Runtime attestation
	•	CI enforcement
	•	Fail-closed security

Security and clarity over convenience.

⸻

Support
	•	Issues → GitHub Issues
	•	Security → SECURITY.md
	•	Governance → protocols/
	•	CI rules → .github/workflows/