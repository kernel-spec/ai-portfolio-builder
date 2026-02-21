# AI Portfolio Builder

## Version
1.1.0

## Status
Enterprise-Grade · Hybrid Governance · Production Ready

---

## Overview

AI Portfolio Builder is a governed prompt orchestration system implementing:

- 10 Canonical Domain Atoms
- 4 Archetypes (composable multi-domain agents)
- Cryptographic SHA-256 integrity verification
- CI enforcement
- Runtime hash attestation (Cloudflare Worker)
- Fail-closed dispatch model

---

## Architecture

### Layers

1. Lockfile Integrity Layer
2. Runtime Attestation Layer
3. CI Validation Layer
4. Governance Protocol Layer

---

## Governance Protocols

- [Governance Protocol](protocols/governance.md) — Core governance rules
- [Branch Management Protocol](protocols/branch-management.md) — Branch protection and lifecycle

---

## Dispatch Model (v1.1.0)

Client provides:

agent_id + request_payload

Worker performs:

- Internal canonical hash resolution
- SHA-256 verification
- Fail-closed validation
- Governed dispatch

No client-supplied hash allowed.

---

## Health Endpoint

GET /health

Returns:

```json
{
  "status": "healthy",
  "service": "prompt-dispatcher",
  "version": "1.1.0",
  "lock_file_version": "1.1.0",
  "prompts_count": 14,
  "timestamp": "ISO-8601"
}


⸻

Core Security Guarantees
	•	Immutable prompt registry
	•	Deterministic execution
	•	No metadata leakage
	•	GitHub as canonical source of truth
	•	Hash mismatch → hard stop