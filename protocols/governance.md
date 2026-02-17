# Governance Protocol
Version: 1.1.0

---

## 1. Canonical Source of Truth

GitHub repository is the single authoritative source.
No runtime mutation is allowed.

---

## 2. Immutability Rules

- Domain files are immutable without version increment.
- Archetype compositions must sum exactly 100%.
- Lockfile is append-only.
- Breaking change requires major version bump.

---

## 3. Integrity Model

- SHA-256 computed for every archetype system prompt.
- Hash stored in versions/prompt-lock.json
- Cloudflare Worker verifies hash before execution.
- Client cannot supply hash.

---

## 4. Fail-Closed Runtime

| Condition | Behavior |
|-----------|----------|
| Unknown agent | 403 |
| Hash mismatch | 500 |
| Invalid JSON | 400 |
| Success | 200 |

No fallback execution permitted.

---

## 5. Composition Rules

- System contains exactly 10 domains.
- System contains exactly 4 archetypes.
- Archetype must combine 2–4 domains.
- Composition must equal exactly 100%.
- Domains cannot overlap responsibility.

---

## 6. Version Consistency

The following must match:

- versions/prompt-manifest.json version
- versions/prompt-lock.json version
- Cloudflare Worker LOCK_FILE_VERSION
- /health endpoint version
- README version
- SECURITY.md version

Mismatch = deployment violation.