# Changelog

All notable changes to this project will be documented in this file.

This project follows a governed, integrity-first versioning model.

---

# [1.1.0] — 2026-02-16

## 🚀 Hybrid Governance — Production Release

Version 1.1.0 introduces a production-ready hybrid governance model with internal runtime attestation and strict CI enforcement.

This release transitions the system from client-supplied hash verification to secure worker-based internal attestation.

---

## 🔐 Security Improvements

### Internal Worker Attestation
- Removed client-supplied `prompt_hash`
- Worker now resolves canonical hash internally from `prompt-lock.json`
- Enforced hash lookup by `agent_id`
- Prevented metadata leakage in response payloads

### Fail-Closed Enforcement
- Unknown agent → 403
- Integrity failure → 500
- Invalid JSON → 400
- Success responses return only:
  ```json
  { "response": "..." }

Lockfile Hardening
	•	Lockfile version standardized to lockfileVersion: 2
	•	Enforced immutable integrity flag
	•	Byte-identical synchronization between:
	•	versions/prompt-lock.json
	•	cloudflare-worker/prompt-lock.json

⸻

🧪 CI Governance Enforcement

Added and/or hardened CI validation rules:
	•	Manifest schema validation
	•	Lockfile schema validation
	•	Domain count must equal 10
	•	Archetype count must equal 4
	•	Archetype composition must sum to 100%
	•	Manifest ↔ lockfile version consistency
	•	Hash enforcement on prompt changes
	•	Forbidden direct file mutation protection
	•	Composition validation workflow

All governance checks pass under strict validation mode.

⸻

🏗 Architecture Changes

API Contract Update

Before (v1.0.0)
Client provided:

agent_id + prompt_hash + request_payload

After (v1.1.0)
Client provides:

agent_id + request_payload

Worker performs internal attestation before dispatch.

⸻

📦 Manifest Updates
	•	version set to 1.1.0
	•	Hybrid governance mode enforced
	•	CI strict validation enabled
	•	Integrity metadata aligned with lockfile

⸻

📘 Documentation Updates
	•	README updated to reflect hybrid governance model
	•	Worker Security Hardening documented
	•	API contract clarified
	•	Governance model fully specified
	•	Production enforcement described

⸻

🔒 Governance Model (Formalized)

Hybrid Model:

Layer	Responsibility
UI	Abstracted hash layer
CI	Structural + integrity validation
Worker	Runtime attestation enforcement
Lockfile	Immutable canonical hash registry
GitHub	Source of truth


⸻

⚠ Breaking Changes
	•	Client-supplied prompt_hash is no longer accepted
	•	Dispatch API contract changed
	•	Worker now fails closed on any integrity ambiguity
	•	All deployments must use updated worker version ≥ 1.1.0

⸻

[1.0.0] — Initial Release

Initial Canonical Taxonomy
	•	10 immutable domain atoms
	•	4 composable archetypes
	•	SHA-256 hash registry
	•	Lockfile-based integrity enforcement
	•	Cloudflare Worker dispatch verification
	•	OpenAI Custom GPT configuration support
	•	CI validation workflows
	•	Governance protocol documentation

⸻

Versioning Policy
	•	MAJOR → Canonical taxonomy or governance model changes
	•	MINOR → Governance enhancements or structural hardening
	•	PATCH → Non-structural improvements or documentation updates

⸻

Current version: 1.1.0