# 🔐 2️⃣ SECURITY.md

Copy-paste:

```markdown
# Security Policy

## Version
1.1.0

---

## Core Principles

### 1. Cryptographic Integrity
- SHA-256 for every prompt file
- Hash registry stored in versions/prompt-lock.json
- Verification required before dispatch

### 2. Immutability by Default
- Domain definitions require version increment
- Lockfile is append-only
- Major version required for breaking change

### 3. Fail Closed
- Unknown agent → 403
- Integrity failure → 500
- Invalid JSON → 400
- No fallback execution

### 4. Audit Everything
- All dispatches logged
- All hash changes visible in git
- CI prevents tampering

---

## Supported Versions

| Version | Supported | Security Updates |
|---------|----------|------------------|
| 1.1.x   | Yes      | Active           |
| <1.1    | No       | Upgrade Required |