# Branch Management Protocol
Version: 1.1.0  
Effective Date: 2026-02-17

---

## 1. Purpose

This protocol defines the branch management strategy for the AI Portfolio Builder repository, ensuring governance integrity and version control consistency.

---

## 2. Protected Branches

The following branches are protected and must be retained:

### Production Branch
- **`main`** — Production-only deployments
  - Receives changes only through approved pull requests
  - Requires CI validation to pass
  - Direct commits are prohibited
  - Always reflects deployed production state

### Release Branches
- **`release/*`** — Pattern for version-specific releases (e.g., `release/1.1.0`)
  - Used for version-specific maintenance
  - Follows semantic versioning (MAJOR.MINOR.PATCH)
  - Receives only critical fixes after branch creation

### Development Branches
- **`feature/*`** — Feature development branches
  - Used for new functionality
  - Merged to `main` via pull request
  - Deleted after successful merge

- **`hotfix/*`** — Critical production fixes
  - Used for urgent production issues
  - Fast-tracked to `main` with accelerated review
  - Deleted after successful deployment

---

## 3. Branch Lifecycle Policy

### Retention Policy
Only the following branches are retained long-term:
- `main` (permanent)
- `release/*` (version-specific, permanent)
- Active `feature/*` (temporary, during development)
- Active `hotfix/*` (temporary, during fix)

### Cleanup Policy
All other branches must be:
- **Merged** into appropriate target branch (typically `main`), or
- **Deleted** if no longer needed

Branches not following the naming convention above should be:
1. Reviewed for active work
2. Merged if containing valuable changes
3. Deleted if obsolete or abandoned

---

## 4. Branch Naming Conventions

| Type | Pattern | Example | Lifespan |
|------|---------|---------|----------|
| Production | `main` | `main` | Permanent |
| Release | `release/{version}` | `release/1.1.0` | Permanent |
| Feature | `feature/{description}` | `feature/add-domain` | Temporary |
| Hotfix | `hotfix/{description}` | `hotfix/fix-hash-validation` | Temporary |

---

## 5. Merge Requirements

Before merging any branch to `main`:
- All CI validation checks must pass
- Governance validation must succeed
- Model contract validation must succeed
- Version consistency must be maintained
- Code review approval required

---

## 6. Version Branch Alignment

When creating a new release branch:
1. Branch name must match version in:
   - `versions/prompt-manifest.json`
   - `versions/prompt-lock.json`
   - `README.md`
   - `CHANGELOG.md`

2. Release branch creation triggers:
   - Version freeze
   - Lockfile immutability
   - Production deployment preparation

---

## 7. Enforcement

This branch management protocol is enforced through:
- GitHub branch protection rules
- CI/CD validation workflows
- Manual code review process
- Team consensus on branch cleanup

---

## 8. Exceptions

Exceptions to this policy require:
- Documented justification
- Team consensus
- Governance committee approval (if applicable)
